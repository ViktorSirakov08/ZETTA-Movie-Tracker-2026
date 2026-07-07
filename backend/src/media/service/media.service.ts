import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Media, MediaType } from '../entity/media.entity';
import { Genre } from '../entity/genre.entity';
import { Episode } from '../entity/episode.entity';
import { Season } from '../entity/season.entity';
import { Interest } from '../../interests/entities/interest.entity';
import {
  MediaWatchStatus,
  WatchStatus,
} from '../entity/media-watch-status.entity';
import { EpisodeWatchStatus } from '../entity/episode-watch-status.entity';
import { SeasonWatchStatus } from '../entity/season-watch-status.entity';
import { CreateMediaDto } from '../dto/create-media.dto';
import { UpdateMediaDto } from '../dto/update-media.dto';
import { CreateEpisodeDto } from '../dto/create-episode.dto';
import { MediaSearchService } from '../../search/media-search.service';
import { InterestsService } from '../../interests/interests.service';
import { calculateAge, minimumAgeFor } from '../../common/age';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(Genre) private genreRepo: Repository<Genre>,
    @InjectRepository(Interest) private interestRepo: Repository<Interest>,
    private readonly interestsService: InterestsService,
    @InjectRepository(Media)
    private mediaRepo: Repository<Media>,
    @InjectRepository(Episode)
    private episodeRepo: Repository<Episode>,
    @InjectRepository(Season)
    private seasonRepo: Repository<Season>,
    @InjectRepository(MediaWatchStatus)
    private watchStatusRepo: Repository<MediaWatchStatus>,
    @InjectRepository(EpisodeWatchStatus)
    private episodeWatchStatusRepo: Repository<EpisodeWatchStatus>,
    @InjectRepository(SeasonWatchStatus)
    private seasonWatchStatusRepo: Repository<SeasonWatchStatus>,
    private readonly mediaSearchService: MediaSearchService,
  ) {}

  // Postgres is the source of truth — if Elasticsearch is briefly down,
  // the write to Postgres should still succeed. Search just goes stale
  // until the next successful sync, rather than blocking the request.
  private async syncToSearchIndex(media: Media): Promise<void> {
    try {
      await this.mediaSearchService.indexMedia(media);
    } catch (error) {
      this.logger.warn(
        `Failed to index media ${media.id} in Elasticsearch: ${(error as Error).message}`,
      );
    }
  }

  private async removeFromSearchIndex(id: string): Promise<void> {
    try {
      await this.mediaSearchService.removeMedia(id);
    } catch (error) {
      this.logger.warn(
        `Failed to remove media ${id} from Elasticsearch: ${(error as Error).message}`,
      );
    }
  }

  findAll(): Promise<Media[]> {
    return this.mediaRepo.find();
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.mediaRepo.findOne({
      where: { id },
      relations: {
        episodes: true,
      },
    });
    if (!media) {
      throw new NotFoundException(`Media with id ${id} not found`);
    }
    return media;
  }

  async create(dto: CreateMediaDto): Promise<Media> {
    const { genreIds, interestIds, interestNames, ...rest } = dto;

    const genres = await this.genreRepo.findBy({ id: In(genreIds) });
    let interests: Interest[] = [];
    if (interestIds?.length) {
      interests = await this.interestRepo.findBy({ id: In(interestIds) });
    } else if (interestNames?.length) {
      interests = await this.interestsService.findOrCreateByNames(interestNames);
    }

    const media = this.mediaRepo.create({
      ...rest,
      genres,
      interests,
      rating: null, // always starts as "No Rating"
    });
    const saved = await this.mediaRepo.save(media);
    await this.syncToSearchIndex(saved);
    return saved;
  }

  async update(id: string, dto: UpdateMediaDto): Promise<Media> {
    const media = await this.findOne(id);
    const { genreIds, interestIds, ...rest } = dto;

    Object.assign(media, rest);

    if (genreIds !== undefined) {
      media.genres = await this.genreRepo.findBy({ id: In(genreIds) });
    }
    if (interestIds !== undefined) {
      media.interests = interestIds.length
        ? await this.interestRepo.findBy({ id: In(interestIds) })
        : [];
    }

    const saved = await this.mediaRepo.save(media);
    await this.syncToSearchIndex(saved);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const result = await this.mediaRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Media with id ${id} not found`);
    }
    await this.removeFromSearchIndex(id);
  }

  async addSeason(mediaId: string, firstEpisodeTitle: string): Promise<Season> {
    const media = await this.findOne(mediaId);
    if (media.type !== MediaType.SERIES) {
      throw new BadRequestException('Only series can have seasons.');
    }

    // No season number is ever accepted from the caller — always append the
    // next one, which makes skipping a season impossible by construction.
    const seasons = await this.seasonRepo.find({ where: { mediaId } });
    const nextSeasonNum =
      seasons.reduce((max, s) => Math.max(max, s.seasonNum), 0) + 1;

    const season = this.seasonRepo.create({ mediaId, seasonNum: nextSeasonNum });
    const saved = await this.seasonRepo.save(season);

    // A season is never empty — it always starts with one episode.
    const episode = this.episodeRepo.create({
      mediaId,
      seasonNum: nextSeasonNum,
      episodeNum: 1,
      title: firstEpisodeTitle.trim(),
    });
    await this.episodeRepo.save(episode);

    // A new season means anyone who'd finished the whole series before now
    // has fresh unwatched content — revert their series status accordingly.
    const watchedEntries = await this.watchStatusRepo.find({
      where: { mediaId, status: WatchStatus.WATCHED },
    });
    for (const { userId } of watchedEntries) {
      await this.recomputeMediaWatchStatusFromSeasons(userId, mediaId);
    }

    return saved;
  }

  findSeasons(mediaId: string): Promise<Season[]> {
    return this.seasonRepo.find({ where: { mediaId }, order: { seasonNum: 'ASC' } });
  }

  async addEpisode(mediaId: string, dto: CreateEpisodeDto): Promise<Episode> {
    // Confirms the media exists (and throws 404 if not) before attaching an episode.
    await this.findOne(mediaId);

    const season = await this.seasonRepo.findOne({
      where: { mediaId, seasonNum: dto.seasonNum },
    });
    if (!season) {
      throw new BadRequestException(
        `Season ${dto.seasonNum} doesn't exist yet — add it before adding episodes to it.`,
      );
    }

    const episodesInSeason = await this.episodeRepo.find({
      where: { mediaId, seasonNum: dto.seasonNum },
    });

    const normalizedTitle = dto.title.trim().toLowerCase();
    const isDuplicateTitle = episodesInSeason.some(
      (e) => e.title.trim().toLowerCase() === normalizedTitle,
    );
    if (isDuplicateTitle) {
      throw new BadRequestException(
        `Season ${dto.seasonNum} already has an episode named "${dto.title.trim()}".`,
      );
    }

    // Same "always append next" rule as seasons — episodeNum is never
    // accepted from the caller, so a season can't end up with a gap.
    const nextEpisodeNum =
      episodesInSeason.reduce((max, e) => Math.max(max, e.episodeNum), 0) + 1;

    const episode = this.episodeRepo.create({
      mediaId,
      seasonNum: dto.seasonNum,
      episodeNum: nextEpisodeNum,
      title: dto.title.trim(),
    });
    const saved = await this.episodeRepo.save(episode);

    // A brand-new episode is unwatched by everyone — anyone who'd previously
    // finished this season (and, in turn, the whole series) needs that
    // recomputed rather than left showing a stale "fully watched" state.
    await this.invalidateWatchStatusForNewEpisode(season.id, mediaId, dto.seasonNum);

    return saved;
  }

  private async invalidateWatchStatusForNewEpisode(
    seasonId: string,
    mediaId: string,
    seasonNum: number,
  ): Promise<void> {
    const affectedUsers = await this.seasonWatchStatusRepo.find({
      where: { seasonId, watched: true },
    });
    for (const { userId } of affectedUsers) {
      await this.recomputeSeasonWatchStatus(userId, mediaId, seasonNum);
      await this.recomputeMediaWatchStatusFromSeasons(userId, mediaId);
    }
  }

  async getEpisodeWatchStatuses(
    userId: string,
    mediaId: string,
  ): Promise<{ episodeId: string; watched: boolean }[]> {
    const episodes = await this.episodeRepo.find({ where: { mediaId } });
    if (episodes.length === 0) return [];

    const rows = await this.episodeWatchStatusRepo.find({
      where: { userId, episodeId: In(episodes.map((e) => e.id)) },
    });
    const watchedIds = new Set(rows.filter((r) => r.watched).map((r) => r.episodeId));

    return episodes.map((e) => ({ episodeId: e.id, watched: watchedIds.has(e.id) }));
  }

  async getSeasonWatchStatuses(
    userId: string,
    mediaId: string,
  ): Promise<{ seasonId: string; seasonNum: number; watched: boolean }[]> {
    const seasons = await this.seasonRepo.find({
      where: { mediaId },
      order: { seasonNum: 'ASC' },
    });
    if (seasons.length === 0) return [];

    const rows = await this.seasonWatchStatusRepo.find({
      where: { userId, seasonId: In(seasons.map((s) => s.id)) },
    });
    const watchedIds = new Set(rows.filter((r) => r.watched).map((r) => r.seasonId));

    return seasons.map((s) => ({
      seasonId: s.id,
      seasonNum: s.seasonNum,
      watched: watchedIds.has(s.id),
    }));
  }

  async setEpisodeWatchStatus(
    userId: string,
    episodeId: string,
    watched: boolean,
  ): Promise<void> {
    const episode = await this.episodeRepo.findOne({ where: { id: episodeId } });
    if (!episode) {
      throw new NotFoundException(`Episode with id ${episodeId} not found`);
    }

    const entry =
      (await this.episodeWatchStatusRepo.findOne({ where: { userId, episodeId } })) ??
      this.episodeWatchStatusRepo.create({ userId, episodeId });
    entry.watched = watched;
    await this.episodeWatchStatusRepo.save(entry);

    await this.recomputeSeasonWatchStatus(userId, episode.mediaId, episode.seasonNum);
    await this.recomputeMediaWatchStatusFromSeasons(userId, episode.mediaId);
  }

  // A season is "watched" only once every one of its episodes is — recomputed
  // from scratch on every episode toggle rather than incrementally tracked,
  // since the episode count per season is small enough that this is cheap.
  private async recomputeSeasonWatchStatus(
    userId: string,
    mediaId: string,
    seasonNum: number,
  ): Promise<void> {
    const season = await this.seasonRepo.findOne({ where: { mediaId, seasonNum } });
    if (!season) return;

    const episodes = await this.episodeRepo.find({ where: { mediaId, seasonNum } });
    if (episodes.length === 0) return;

    const watchedRows = await this.episodeWatchStatusRepo.find({
      where: { userId, episodeId: In(episodes.map((e) => e.id)), watched: true },
    });
    const allWatched = watchedRows.length === episodes.length;

    const seasonStatus =
      (await this.seasonWatchStatusRepo.findOne({
        where: { userId, seasonId: season.id },
      })) ?? this.seasonWatchStatusRepo.create({ userId, seasonId: season.id });
    seasonStatus.watched = allWatched;
    await this.seasonWatchStatusRepo.save(seasonStatus);
  }

  // The series itself is "watched" only once every one of its seasons is.
  // Mirrors recomputeSeasonWatchStatus one level up, and can also revert an
  // already-WATCHED series back to WATCHING if new content invalidates it.
  private async recomputeMediaWatchStatusFromSeasons(
    userId: string,
    mediaId: string,
  ): Promise<void> {
    const seasons = await this.seasonRepo.find({ where: { mediaId } });
    if (seasons.length === 0) return;

    const seasonStatusRows = await this.seasonWatchStatusRepo.find({
      where: { userId, seasonId: In(seasons.map((s) => s.id)), watched: true },
    });
    const watchedSeasonIds = new Set(seasonStatusRows.map((s) => s.seasonId));
    const allSeasonsWatched = seasons.every((s) => watchedSeasonIds.has(s.id));

    const entry =
      (await this.watchStatusRepo.findOne({ where: { userId, mediaId } })) ??
      this.watchStatusRepo.create({ userId, mediaId, status: WatchStatus.NOT_WATCHED });

    if (allSeasonsWatched) {
      entry.status = WatchStatus.WATCHED;
    } else if (entry.status === WatchStatus.WATCHED) {
      entry.status = WatchStatus.WATCHING;
    }
    await this.watchStatusRepo.save(entry);
  }

  private async findByStatusForUser(
    userId: string,
    status: WatchStatus,
  ): Promise<Media[]> {
    const entries = await this.watchStatusRepo.find({
      where: { userId, status },
      relations: { media: true },
    });
    return entries.map((entry) => entry.media);
  }

  findWatchedByUser(userId: string): Promise<Media[]> {
    return this.findByStatusForUser(userId, WatchStatus.WATCHED);
  }

  findWatchlistForUser(userId: string): Promise<Media[]> {
    return this.findByStatusForUser(userId, WatchStatus.PLANNED_TO_WATCH);
  }

  findCurrentlyWatchingForUser(userId: string): Promise<Media[]> {
    return this.findByStatusForUser(userId, WatchStatus.WATCHING);
  }

  async getWatchStatusForUser(
    userId: string,
    mediaId: string,
  ): Promise<{ status: WatchStatus }> {
    // Returned wrapped in an object rather than as a bare string — Nest/Express
    // sends primitive return values as plain text (not JSON-quoted), which
    // silently broke `res.json()` parsing on the frontend.
    const entry = await this.watchStatusRepo.findOne({
      where: { userId, mediaId },
    });
    return { status: entry?.status ?? WatchStatus.NOT_WATCHED };
  }

  async setWatchStatusForUser(
    userId: string,
    mediaId: string,
    status: WatchStatus,
    userDateOfBirth: string,
  ): Promise<void> {
    const media = await this.findOne(mediaId);

    // Playing (WATCHING) is the only action gated by age — a user can still
    // add a restricted title to their watchlist or mark it watched manually.
    if (status === WatchStatus.WATCHING) {
      const requiredAge = minimumAgeFor(media.ageRestriction);
      if (calculateAge(userDateOfBirth) < requiredAge) {
        throw new ForbiddenException(
          `This title requires viewers to be at least ${requiredAge} years old.`,
        );
      }
    }

    const entry =
      (await this.watchStatusRepo.findOne({ where: { userId, mediaId } })) ??
      this.watchStatusRepo.create({ userId, mediaId, status });
    entry.status = status;

    await this.watchStatusRepo.save(entry);
  }

  async search(params: {
    query?: string;
    genre?: string;
    interests?: string[];
  }): Promise<Media[]> {
    const hasFilters = Boolean(params.genre) || Boolean(params.interests?.length);
    if (!params.query?.trim() && !hasFilters) {
      return this.findAll();
    }

    const ids = await this.mediaSearchService.searchIds(params);
    if (ids.length === 0) {
      return [];
    }

    const results = await this.mediaRepo.findBy({ id: In(ids) });
    const byId = new Map(results.map((media) => [media.id, media]));

    // Preserve Elasticsearch's relevance ranking — `IN (...)` doesn't
    // guarantee row order, so re-sort to match the order `ids` came back in.
    return ids
      .map((id) => byId.get(id))
      .filter((media): media is Media => Boolean(media));
  }

  async reindexAll(): Promise<{ indexed: number }> {
    const allMedia = await this.mediaRepo.find();
    const indexed = await this.mediaSearchService.reindexAll(allMedia);
    return { indexed };
  }
}


import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Media } from '../entity/media.entity';
import { Genre } from '../entity/genre.entity';
import { Episode } from '../entity/episode.entity';
import { Interest } from '../../interests/entities/interest.entity';
import {
  MediaWatchStatus,
  WatchStatus,
} from '../entity/media-watch-status.entity';
import { CreateMediaDto } from '../dto/create-media.dto';
import { UpdateMediaDto } from '../dto/update-media.dto';
import { CreateEpisodeDto } from '../dto/create-episode.dto';
import { MediaSearchService } from '../../search/media-search.service';
import { InterestsService } from '../../interests/interests.service';

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
    @InjectRepository(MediaWatchStatus)
    private watchStatusRepo: Repository<MediaWatchStatus>,
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

  async addEpisode(mediaId: string, dto: CreateEpisodeDto): Promise<Episode> {
    // Confirms the media exists (and throws 404 if not) before attaching an episode.
    await this.findOne(mediaId);
    const episode = this.episodeRepo.create({ ...dto, mediaId });
    return this.episodeRepo.save(episode);
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
  ): Promise<WatchStatus> {
    const entry = await this.watchStatusRepo.findOne({
      where: { userId, mediaId },
    });
    return entry?.status ?? WatchStatus.NOT_WATCHED;
  }

  async setWatchStatusForUser(
    userId: string,
    mediaId: string,
    status: WatchStatus,
  ): Promise<void> {
    await this.findOne(mediaId);

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


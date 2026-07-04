import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Genre) private genreRepo: Repository<Genre>,
    @InjectRepository(Interest) private interestRepo: Repository<Interest>,
    @InjectRepository(Media)
    private mediaRepo: Repository<Media>,
    @InjectRepository(Episode)
    private episodeRepo: Repository<Episode>,
    @InjectRepository(MediaWatchStatus)
    private watchStatusRepo: Repository<MediaWatchStatus>,
  ) {}

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
    const { genreIds, interestIds, ...rest } = dto;

    const genres = await this.genreRepo.findBy({ id: In(genreIds) });
    const interests = interestIds?.length
      ? await this.interestRepo.findBy({ id: In(interestIds) })
      : [];

    const media = this.mediaRepo.create({
      ...rest,
      genres,
      interests,
      rating: null, // always starts as "No Rating"
    });
    return this.mediaRepo.save(media);
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

    return this.mediaRepo.save(media);
  }

  async remove(id: string): Promise<void> {
    const result = await this.mediaRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Media with id ${id} not found`);
    }
  }

  async addEpisode(mediaId: string, dto: CreateEpisodeDto): Promise<Episode> {
    // Confirms the media exists (and throws 404 if not) before attaching an episode.
    await this.findOne(mediaId);
    const episode = this.episodeRepo.create({ ...dto, mediaId });
    return this.episodeRepo.save(episode);
  }

  async findWatchedByUser(userId: string): Promise<Media[]> {
    const entries = await this.watchStatusRepo.find({
      where: { userId, status: WatchStatus.WATCHED },
      relations: { media: true },
    });
    return entries.map((entry) => entry.media);
  }
}

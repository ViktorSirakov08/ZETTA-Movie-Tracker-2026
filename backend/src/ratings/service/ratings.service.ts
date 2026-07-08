import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { Media } from '../../media/entity/media.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private ratingRepo: Repository<Rating>,
    @InjectRepository(Media)
    private mediaRepo: Repository<Media>,
  ) {}

  async rate(userId: string, mediaId: string, value: number): Promise<Rating> {
    const media = await this.mediaRepo.findOne({ where: { id: mediaId } });
    if (!media) {
      throw new NotFoundException(`Media with id ${mediaId} not found`);
    }

    let rating = await this.ratingRepo.findOne({ where: { userId, mediaId } });
    if (rating) {
      rating.value = value;
    } else {
      rating = this.ratingRepo.create({ userId, mediaId, value });
    }
    await this.ratingRepo.save(rating);

    await this.recomputeMediaRating(mediaId);
    return rating;
  }

  async getUserRating(userId: string, mediaId: string): Promise<number | null> {
    const rating = await this.ratingRepo.findOne({ where: { userId, mediaId } });
    return rating?.value ?? null;
  }

  async removeRating(userId: string, mediaId: string): Promise<void> {
    await this.ratingRepo.delete({ userId, mediaId });
    await this.recomputeMediaRating(mediaId);
  }

  private async recomputeMediaRating(mediaId: string): Promise<void> {
  const result = await this.ratingRepo
    .createQueryBuilder('r')
    .select('AVG(r.value)', 'avg')
    .where('r.mediaId = :mediaId', { mediaId })
    .getRawOne<{ avg: string | null }>();

  const avg = result?.avg ?? null;

  await this.mediaRepo.update(mediaId, {
    rating: avg !== null ? parseFloat(avg) : null,
  });
}
}
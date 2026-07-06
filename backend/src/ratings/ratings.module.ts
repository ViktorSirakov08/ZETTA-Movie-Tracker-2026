import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';
import { Media } from '../media/entity/media.entity';
import { RatingsService } from './service/ratings.service';
import { RatingsController } from './controller/ratings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Rating, Media])],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [TypeOrmModule],
})
export class RatingsModule {}
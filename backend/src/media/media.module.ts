import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entity/media.entity';
import { Episode } from './entity/episode.entity';
import { Genre } from './entity/genre.entity';
import { MediaWatchStatus } from './entity/media-watch-status.entity';
import { Interest } from '../interests/entities/interest.entity';
import { MediaService } from './service/media.service';
import { MediaController } from './controller/media.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Media,
      Episode,
      Genre,
      MediaWatchStatus,
      Interest,
    ]),
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}

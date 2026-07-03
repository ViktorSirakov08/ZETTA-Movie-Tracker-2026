import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entity/media.entity';
import { Episode } from './entity/episode.entity';
import { Genre } from './entity/genre.entity';
import { MediaService } from './service/media.service';
import { MediaController } from './controller/media.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Media, Episode, Genre])],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}

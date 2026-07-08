import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entity/media.entity';
import { Episode } from './entity/episode.entity';
import { Season } from './entity/season.entity';
import { Genre } from './entity/genre.entity';
import { MediaWatchStatus } from './entity/media-watch-status.entity';
import { EpisodeWatchStatus } from './entity/episode-watch-status.entity';
import { SeasonWatchStatus } from './entity/season-watch-status.entity';
import { Interest } from '../interests/entities/interest.entity';
import { Comment } from './entity/comments.entity';
import { SearchModule } from '../search/search.module';
import { InterestsModule } from '../interests/interests.module';
import { MediaService } from './service/media.service';
import { MediaController } from './controller/media.controller';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Media,
      Episode,
      Season,
      Genre,
      MediaWatchStatus,
      EpisodeWatchStatus,
      SeasonWatchStatus,
      Interest,
      Comment,
    ]),
    SearchModule,
    InterestsModule,
    StorageModule
  ],
  controllers: [MediaController, CommentsController],
  providers: [MediaService, CommentsService],
})
export class MediaModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entity/media.entity';
import { Episode } from './entity/episode.entity';
import { Genre } from './entity/genre.entity';
import { MediaWatchStatus } from './entity/media-watch-status.entity';
import { Interest } from '../interests/entities/interest.entity';
import { Comment } from './entity/comments.entity';
import { SearchModule } from '../search/search.module';
import { InterestsModule } from '../interests/interests.module';
import { MediaService } from './service/media.service';
import { MediaController } from './controller/media.controller';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Media,
      Episode,
      Genre,
      MediaWatchStatus,
      Interest,
      Comment,
    ]),
    SearchModule,
    InterestsModule,
  ],
  controllers: [MediaController, CommentsController],
  providers: [MediaService, CommentsService],
})
export class MediaModule {}
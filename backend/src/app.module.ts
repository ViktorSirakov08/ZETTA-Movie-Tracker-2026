import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaModule } from './media/media.module';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GenreModule } from './media/genre.module';
import { InterestsModule } from './interests/interests.module';
import { Interest } from './interests/entities/interest.entity';
import { UserInterest } from './interests/entities/user-interest.entity';
import { RatingsModule } from './ratings/ratings.module';
import { Rating } from './ratings/entities/rating.entity';
import { Media } from './media/entity/media.entity';
import { Episode } from './media/entity/episode.entity';
import { Genre } from './media/entity/genre.entity';
import { MediaWatchStatus } from './media/entity/media-watch-status.entity';
import { Comment } from './media/entity/comments.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.getOrThrow<string>('DATABASE_USERNAME'),
        password: configService.getOrThrow<string>('DATABASE_PASSWORD'),
        database: configService.getOrThrow<string>('DATABASE_NAME'),
        entities: [
          User,
          Interest,
          UserInterest,
          Rating,
          Media,
          Episode,
          Genre,
          MediaWatchStatus,
          Comment,
        ],
        synchronize:
          configService.get<string>('NODE_ENV', 'development') !== 'production',
      }),
    }),
    UsersModule,
    AuthModule,
    MediaModule,
    GenreModule,
    InterestsModule,
    RatingsModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
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
import { Season } from './media/entity/season.entity';
import { Genre } from './media/entity/genre.entity';
import { MediaWatchStatus } from './media/entity/media-watch-status.entity';
import { Comment } from './media/entity/comments.entity';
import { EpisodeWatchStatus } from './media/entity/episode-watch-status.entity';
import { SeasonWatchStatus } from './media/entity/season-watch-status.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { AuthToken } from './auth/entities/auth-token.entity';
import { MediaReleaseNotification } from './media/entity/media-release-notification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
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
          Season,
          Genre,
          MediaWatchStatus,
          Comment,
          EpisodeWatchStatus,
          SeasonWatchStatus,
          RefreshToken,
          AuthToken,
          MediaReleaseNotification,
        ],
        synchronize:
          configService.get<string>('NODE_ENV', 'development') !== 'production',
      }),
    }),
    // Generous global default — this is a floor against basic scripted abuse
    // on any endpoint, not something normal usage should ever bump into.
    // Individual routes (like /auth/login) override this with a much
    // tighter limit via @Throttle() where it actually matters.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    UsersModule,
    AuthModule,
    MediaModule,
    GenreModule,
    InterestsModule,
    RatingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}

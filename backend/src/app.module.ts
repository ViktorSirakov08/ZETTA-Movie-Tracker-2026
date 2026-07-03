import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaModule } from './media/media.module';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { InterestsModule } from './interests/interests.module';
import { Interest } from './interests/entities/interest.entity';
import { UserInterest } from './interests/entities/user-interest.entity';
import { RatingsModule } from './ratings/ratings.module';
import { Rating } from './ratings/entities/rating.entity';

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
        entities: [User, Interest, UserInterest, Rating],
        synchronize:
          configService.get<string>('NODE_ENV', 'development') !== 'production',
      }),
    }),
    UsersModule,
    AuthModule,
    MediaModule,
    InterestsModule,
    RatingsModule,
  ],
})
export class AppModule {}

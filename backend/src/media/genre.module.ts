import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Genre } from './entity/genre.entity';
import { GenreService } from './service/genre.service';
import { GenreController } from './controller/genre.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Genre])],
  controllers: [GenreController],
  providers: [GenreService],
  exports: [TypeOrmModule], // lets MediaModule inject the Genre repository too
})
export class GenreModule {}

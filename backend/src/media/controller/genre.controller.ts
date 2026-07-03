import { Controller, Get, Post, Body } from '@nestjs/common';
import { GenreService } from '../service/genre.service';
import { CreateGenreDto } from '../dto/create-genre.dto';

@Controller('genres')
export class GenreController {
  constructor(private readonly genreService: GenreService) {}

  @Get()
  findAll() {
    return this.genreService.findAll();
  }

  @Post()
  create(@Body() dto: CreateGenreDto) {
    return this.genreService.create(dto);
  }
}
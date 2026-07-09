import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Genre } from '../entity/genre.entity';
import { CreateGenreDto } from '../dto/create-genre.dto';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private genreRepo: Repository<Genre>,
  ) {}

  findAll(): Promise<Genre[]> {
    return this.genreRepo.find();
  }

  async create(dto: CreateGenreDto): Promise<Genre> {
    // Case-insensitive, otherwise "Comedy" and "comedy" both pass the DB's
    // unique constraint (case-sensitive) and end up as two indistinguishable
    // dropdown entries that silently filter against different media.
    const existing = await this.genreRepo.findOne({
      where: { name: ILike(dto.name) },
    });
    if (existing) {
      throw new ConflictException(`Genre "${dto.name}" already exists`);
    }
    const genre = this.genreRepo.create(dto);
    return this.genreRepo.save(genre);
  }
}

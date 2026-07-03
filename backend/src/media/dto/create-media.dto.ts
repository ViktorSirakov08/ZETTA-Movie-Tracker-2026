import {
  IsEnum,
  IsString,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  IsUUID,
  IsArray,
} from 'class-validator';

import { MediaType } from '../entity/media.entity';

export class CreateMediaDto {
  @IsEnum(MediaType)
  type!: MediaType;

  @IsString()
  name!: string;

  @IsDateString()
  releaseDate!: string;

  @IsString()
  description!: string;

  @IsArray()
  @IsUUID('4', { each: true })
    genreIds!: string[];

  @IsBoolean()
  ageRestricted!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  posterUrl?: string;

  // Deliberately no `rating` field here — it's set to null on creation
  // ("No Rating") and only ever changes via user ratings, never on create.
}

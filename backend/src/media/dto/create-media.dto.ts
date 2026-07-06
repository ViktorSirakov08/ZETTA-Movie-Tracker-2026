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
  IsIn,
} from 'class-validator';

import { MediaType } from '../entity/media.entity';
import { INTEREST_NAMES } from '../../common/constants/interest-names';
import { IsNotFutureDate } from '../../common/validators/is-not-future-date.validator';

export class CreateMediaDto {
  @IsEnum(MediaType)
  type!: MediaType;

  @IsString()
  name!: string;

  @IsDateString()
  @IsNotFutureDate()
  releaseDate!: string;

  @IsString()
  description!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  genreIds!: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  interestIds?: string[];

  @IsOptional()
  @IsArray()
  @IsIn(INTEREST_NAMES, { each: true })
  interestNames?: string[];

  @IsBoolean()
  ageRestricted!: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  posterUrl?: string;

  // Deliberately no `rating` field here — it's set to null on creation
  // ("No Rating") and only ever changes via user ratings, never on create.
}

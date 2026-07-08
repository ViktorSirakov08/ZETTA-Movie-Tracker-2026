import {
  IsEnum,
  IsString,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
  IsUUID,
  IsArray,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { AgeRestriction, MediaType } from '../entity/media.entity';
import { INTEREST_NAMES } from '../../common/constants/interest-names';
import { IsNotFutureDate } from '../../common/validators/is-not-future-date.validator';

export class UpdateMediaDto {
  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  @IsNotFutureDate()
  releaseDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  genreIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  interestIds?: string[];

  @IsOptional()
  @IsArray()
  @IsIn(INTEREST_NAMES, { each: true })
  interestNames?: string[];

  @IsOptional()
  @IsBoolean()
  ageRestricted?: boolean;

  @IsOptional()
  @IsBoolean()
  ageRestricted13?: boolean;

  @IsOptional()
  @IsEnum(AgeRestriction)
  ageRestriction?: AgeRestriction;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  posterUrl?: string;
}

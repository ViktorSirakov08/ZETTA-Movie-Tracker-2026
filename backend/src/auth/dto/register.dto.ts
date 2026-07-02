import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Genre } from '../../common/enums/genre.enum';
import { IsValidDateOfBirth } from '../../common/validators/is-valid-date-of-birth.decorator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'username may only contain letters, numbers, underscores, dots and hyphens',
  })
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsDateString()
  @IsValidDateOfBirth()
  dateOfBirth: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(Genre, { each: true })
  interests?: Genre[];
}

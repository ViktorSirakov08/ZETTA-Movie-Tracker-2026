import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Genre } from '../../common/enums/genre.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'username may only contain letters, numbers, underscores, dots and hyphens',
  })
  username?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(Genre, { each: true })
  interests?: Genre[];
}

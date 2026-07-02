import { ArrayUnique, IsArray, IsEnum, IsOptional } from 'class-validator';
import { Genre } from '../../common/enums/genre.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(Genre, { each: true })
  interests?: Genre[];
}

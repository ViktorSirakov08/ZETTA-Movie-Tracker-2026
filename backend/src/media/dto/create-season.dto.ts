import { IsNotEmpty, IsString } from 'class-validator';

// A season is never created empty — it always starts with one episode,
// so its title is required right along with the season itself.
export class CreateSeasonDto {
  @IsString()
  @IsNotEmpty()
  title!: string;
}
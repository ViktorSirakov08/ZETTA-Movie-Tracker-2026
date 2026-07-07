import { IsString, IsInt, Min } from 'class-validator';

export class CreateEpisodeDto {
  @IsInt()
  @Min(1)
  seasonNum!: number;

  @IsString()
  title!: string;
}

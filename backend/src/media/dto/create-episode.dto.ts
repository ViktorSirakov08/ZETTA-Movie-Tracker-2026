import { IsString, IsInt, Min } from 'class-validator';

export class CreateEpisodeDto {
  @IsInt()
  @Min(1)
  seasonNum!: number;

  @IsInt()
  @Min(1)
  episodeNum!: number;

  @IsString()
  title!: string;
}
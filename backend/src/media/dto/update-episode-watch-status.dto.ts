import { IsBoolean } from 'class-validator';

export class UpdateEpisodeWatchStatusDto {
  @IsBoolean()
  watched!: boolean;
}
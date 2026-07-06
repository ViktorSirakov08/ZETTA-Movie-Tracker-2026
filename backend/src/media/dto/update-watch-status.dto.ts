import { IsEnum } from 'class-validator';
import { WatchStatus } from '../entity/media-watch-status.entity';

export class UpdateWatchStatusDto {
  @IsEnum(WatchStatus)
  status!: WatchStatus;
}
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Media } from './media.entity';

export enum WatchStatus {
  NOT_WATCHED = 'NOT_WATCHED',
  PLANNED_TO_WATCH = 'PLANNED_TO_WATCH',
  WATCHING = 'WATCHING',
  WATCHED = 'WATCHED',
}

@Entity('media_watch_status')
@Unique(['userId', 'mediaId'])
export class MediaWatchStatus {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => Media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'media_id' })
  media!: Media;

  @Column({ name: 'media_id' })
  mediaId!: string;

  @Column({
    type: 'enum',
    enum: WatchStatus,
    default: WatchStatus.NOT_WATCHED,
  })
  status!: WatchStatus;
}

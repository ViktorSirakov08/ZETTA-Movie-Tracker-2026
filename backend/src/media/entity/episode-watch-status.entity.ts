import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Episode } from './episode.entity';

@Entity('episode_watch_status')
@Unique(['userId', 'episodeId'])
export class EpisodeWatchStatus {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => Episode, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'episode_id' })
  episode!: Episode;

  @Column({ name: 'episode_id' })
  episodeId!: string;

  @Column({ default: false })
  watched!: boolean;
}
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Season } from './season.entity';

// Kept in sync automatically: MediaService recomputes this every time an
// episode's watched status changes, rather than the user toggling it directly.
@Entity('season_watch_status')
@Unique(['userId', 'seasonId'])
export class SeasonWatchStatus {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => Season, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'season_id' })
  season!: Season;

  @Column({ name: 'season_id' })
  seasonId!: string;

  @Column({ default: false })
  watched!: boolean;
}
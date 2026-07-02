import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Episode } from './episode.entity';

export enum MediaType {
  MOVIE = 'MOVIE',
  SERIES = 'SERIES',
}

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: MediaType })
  type!: MediaType;

  @Column()
  name!: string;

  @Column({ type: 'date' })
  releaseDate!: Date;

  // Global/overall rating — an average of all user_media_progress.userRating values.
  // Nullable because a freshly added title has "No Rating" yet.
  @Column({ type: 'float', nullable: true })
  rating!: number | null;

  @Column({ type: 'text' })
  description!: string;

  // Simple string for now per your "genre - по-късно" note.
  // If you want multiple genres per title later, this becomes its own table + ManyToMany.
  @Column()
  genre!: string;

  @Column({ default: false })
  ageRestricted!: boolean;

  // Duration in minutes. For a MOVIE this is the runtime.
  // For a SERIES, leave null (see note below) or sum from episodes.
  @Column({ type: 'int', nullable: true })
  durationMinutes!: number | null;

  @Column({ nullable: true })
  posterUrl!: string;

  // Virtual field — no column, just lets you load episode.media relation.
  @OneToMany(() => Episode, (episode) => episode.media)
  episodes!: Episode[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

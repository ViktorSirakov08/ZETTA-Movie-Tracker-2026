import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Episode } from './episode.entity';
import { Genre } from './genre.entity';

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

  @Column({ type: 'float', nullable: true })
  rating!: number | null;

  @Column({ type: 'text' })
  description!: string;

  @ManyToMany(() => Genre, (genre) => genre.media, { eager: true })
  @JoinTable({
  name: 'media_genres', // the actual join table name in Postgres
  joinColumn: { name: 'media_id', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'id' },
})
genres!: Genre[];

  @Column({ default: false })
  ageRestricted!: boolean;

  @Column({ type: 'int', nullable: true })
  durationMinutes!: number | null;

  @Column({ nullable: true })
  posterUrl!: string;

  @OneToMany(() => Episode, (episode) => episode.media)
  episodes!: Episode[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
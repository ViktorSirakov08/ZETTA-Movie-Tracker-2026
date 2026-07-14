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
import { Season } from './season.entity';
import { Genre } from './genre.entity';
import { Interest } from '../../interests/entities/interest.entity';

export enum MediaType {
  MOVIE = 'MOVIE',
  SERIES = 'SERIES',
}

export enum AgeRestriction {
  NONE = 'NONE',
  PG13 = 'PG13',
  PG18 = 'PG18',
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
    name: 'media_genres',
    joinColumn: { name: 'media_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'id' },
  })
  genres!: Genre[];

  @ManyToMany(() => Interest, (interest) => interest.media, { eager: true })
  @JoinTable({
    name: 'interest_to_media',
    joinColumn: { name: 'media_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'interest_id', referencedColumnName: 'id' },
  })
  interests!: Interest[];

  @Column({ type: 'enum', enum: AgeRestriction, default: AgeRestriction.NONE })
  ageRestriction!: AgeRestriction;

  @Column({ type: 'int', nullable: true })
  durationMinutes!: number | null;

  @Column({ nullable: true })
  posterUrl!: string;

  @OneToMany(() => Episode, (episode) => episode.media)
  episodes!: Episode[];

  @OneToMany(() => Season, (season) => season.media)
  seasons!: Season[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
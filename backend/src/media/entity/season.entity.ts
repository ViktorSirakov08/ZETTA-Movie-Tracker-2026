import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Media } from './media.entity';

@Entity('seasons')
@Unique(['mediaId', 'seasonNum'])
export class Season {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Media, (media) => media.seasons, {
    onDelete: 'CASCADE', // delete a series -> its seasons go too
  })
  @JoinColumn({ name: 'media_id' })
  media!: Media;

  @Column({ name: 'media_id' })
  mediaId!: string;

  @Column()
  seasonNum!: number;
}
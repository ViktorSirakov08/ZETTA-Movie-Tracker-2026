import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Media } from './media.entity';

@Entity('episodes')
export class Episode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Media, (media) => media.episodes, {
    onDelete: 'CASCADE', // delete a series -> its episodes go too
  })
  @JoinColumn({ name: 'media_id' })
  media!: Media;

  @Column({ name: 'media_id' })
  mediaId!: string;

  @Column()
  seasonNum!: number;

  @Column()
  episodeNum!: number;

  @Column()
  title!: string;
}
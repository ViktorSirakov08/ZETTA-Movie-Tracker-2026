import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToMany 
} from 'typeorm';

import { Media } from './media.entity';

@Entity('genres')
export class Genre {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @ManyToMany(() => Media, (media) => media.genres)
  media!: Media[];
}
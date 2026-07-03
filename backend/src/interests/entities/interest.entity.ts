import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Media } from '../../media/entity/media.entity';

@Entity('interests')
export class Interest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Media, (media) => media.interests)
  media!: Media[];
}

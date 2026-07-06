import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('ratings')
@Check(`"value" >= 0 AND "value" <= 5`)
@Unique(['userId', 'mediaId'])
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'media_id', type: 'uuid' })
  mediaId!: string;

  @Column({ type: 'int' })
  value!: number;
}

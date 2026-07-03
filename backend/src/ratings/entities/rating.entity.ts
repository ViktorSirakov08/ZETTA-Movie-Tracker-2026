import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('ratings')
@Check(`"value" >= 1 AND "value" <= 5`)
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  // No FK relation to Media here on purpose — the media table isn't managed
  // on this branch. This just stores the referenced media's id as plain data.
  @Column({ name: 'media_id', type: 'uuid' })
  mediaId!: string;

  @Column({ type: 'int' })
  value!: number;
}

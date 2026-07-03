import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Interest } from './interest.entity';

@Entity('user_has_interests')
export class UserInterest {
  @ManyToOne(() => User, (user) => user.userInterests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Interest, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'interest_id' })
  interest: Interest;

  @PrimaryColumn({ name: 'interest_id' })
  interestId: string;
}

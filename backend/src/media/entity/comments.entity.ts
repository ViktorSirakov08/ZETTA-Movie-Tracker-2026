import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Media } from './media.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  content!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ name: 'media_id', type: 'uuid' })
  mediaId!: string;

  @ManyToOne(() => Media, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'media_id' })
  media!: Media;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../common/enums/role.enum';
import { UserInterest } from '../../interests/entities/user-interest.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email: string | null;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column()
  @Exclude()
  password: string;

  @Column({ type: 'date', name: 'date_of_birth' })
  dateOfBirth: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @OneToMany(() => UserInterest, (userInterest) => userInterest.user)
  userInterests: UserInterest[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

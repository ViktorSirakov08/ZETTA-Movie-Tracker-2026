import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('interests')
export class Interest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;
}

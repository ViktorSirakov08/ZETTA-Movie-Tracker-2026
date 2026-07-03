import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { Genre } from '../common/enums/genre.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(data: {
    username: string;
    password: string;
    dateOfBirth: string;
    role?: Role;
    interests?: Genre[];
  }): Promise<User> {
    const existing = await this.findByUsername(data.username);
    if (existing) {
      throw new ConflictException('Username is already taken');
    }

    const user = this.usersRepository.create({
      username: data.username,
      password: data.password,
      dateOfBirth: data.dateOfBirth,
      role: data.role ?? Role.USER,
      interests: data.interests ?? [],
    });

    return this.usersRepository.save(user);
  }

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async update(
    id: string,
    data: { username?: string; interests?: Genre[] },
  ): Promise<User> {
    if (data.username) {
      const existing = await this.findByUsername(data.username);
      if (existing && existing.id !== id) {
        throw new ConflictException('Username is already taken');
      }
    }

    const user = await this.usersRepository.preload({ id, ...data });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.usersRepository.save(user);
  }
}

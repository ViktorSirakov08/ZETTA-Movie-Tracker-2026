import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { InterestName } from '../common/constants/interest-names';
import { InterestsService } from '../interests/interests.service';
import { PublicUser } from './interfaces/public-user.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly interestsService: InterestsService,
  ) {}

  async create(data: {
    username: string;
    email?: string;
    password: string;
    dateOfBirth: string;
    role?: Role;
    interests?: InterestName[];
  }): Promise<User> {
    const existing = await this.findByUsername(data.username);
    if (existing) {
      throw new ConflictException('Username is already taken');
    }

    const normalizedEmail = data.email?.trim().toLowerCase();
    if (normalizedEmail) {
      const existingEmail = await this.findByEmail(normalizedEmail);
      if (existingEmail) {
        throw new ConflictException('Email is already taken');
      }
    }

    const user = this.usersRepository.create({
      username: data.username,
      email: normalizedEmail,
      password: data.password,
      dateOfBirth: data.dateOfBirth,
      role: data.role ?? Role.USER,
    });
    const saved = await this.usersRepository.save(user);

    await this.interestsService.setUserInterests(
      saved.id,
      data.interests ?? [],
    );

    return (await this.findByIdWithInterests(saved.id)) as User;
  }

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  findByIdWithInterests(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: { userInterests: { interest: true } },
    });
  }

  async update(
    id: string,
    data: { username?: string; interests?: InterestName[] },
  ): Promise<User> {
    if (data.username) {
      const existing = await this.findByUsername(data.username);
      if (existing && existing.id !== id) {
        throw new ConflictException('Username is already taken');
      }
    }

    const user = await this.usersRepository.preload({
      id,
      ...(data.username !== undefined ? { username: data.username } : {}),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.save(user);

    if (data.interests !== undefined) {
      await this.interestsService.setUserInterests(id, data.interests);
    }

    return (await this.findByIdWithInterests(id)) as User;
  }

  async updatePassword(id: string, password: string): Promise<void> {
    await this.usersRepository.update(id, { password });
  }

  async markEmailVerified(id: string): Promise<void> {
    await this.usersRepository.update(id, { emailVerified: true });
  }

  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      interests: (user.userInterests ?? []).map((ui) => ui.interest.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

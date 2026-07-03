import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { PublicUser } from '../users/interfaces/public-user.interface';
import { Role } from '../common/enums/role.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.usersService.create({
      username: dto.username,
      password: hashedPassword,
      dateOfBirth: dto.dateOfBirth,
      role: Role.USER,
      interests: dto.interests,
    });

    return this.usersService.toPublicUser(user);
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const fullUser = await this.usersService.findByIdWithInterests(user.id);

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: this.usersService.toPublicUser(fullUser as User),
    };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'node:crypto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { PublicUser } from '../users/interfaces/public-user.interface';
import { Role } from '../common/enums/role.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshToken } from './entities/refresh-token.entity';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 40;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly refreshTokenTtlMs: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {
    const days = this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN_DAYS', 30);
    this.refreshTokenTtlMs = days * 24 * 60 * 60 * 1000;
  }

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

  async login(dto: LoginDto): Promise<TokenPair & { user: PublicUser }> {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const fullUser = await this.usersService.findByIdWithInterests(user.id);

    const [accessToken, refreshToken] = await Promise.all([
      this.issueAccessToken(user),
      this.issueRefreshToken(user.id),
    ]);

    return {
      accessToken,
      refreshToken,
      user: this.usersService.toPublicUser(fullUser as User),
    };
  }

  // Exchanges a still-valid refresh token for a brand new access/refresh
  // pair. The old refresh token is revoked in the same step (rotation) —
  // each one is single-use, so a copy that gets reused later (e.g. stolen
  // and replayed after the legitimate client already rotated past it) is
  // rejected rather than silently accepted.
  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const entry = await this.refreshTokenRepo.findOne({ where: { tokenHash } });

    if (!entry || entry.revoked || entry.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    entry.revoked = true;
    await this.refreshTokenRepo.save(entry);

    const user = await this.usersService.findById(entry.userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.issueAccessToken(user),
      this.issueRefreshToken(entry.userId),
    ]);

    return { accessToken, refreshToken };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.refreshTokenRepo.update({ tokenHash }, { revoked: true });
  }

  private issueAccessToken(user: Pick<User, 'id' | 'username' | 'role'>): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    return this.jwtService.signAsync(payload);
  }

  private async issueRefreshToken(userId: string): Promise<string> {
    const rawToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + this.refreshTokenTtlMs);

    const entry = this.refreshTokenRepo.create({ userId, tokenHash, expiresAt });
    await this.refreshTokenRepo.save(entry);

    return rawToken;
  }

  // SHA-256, not bcrypt — the refresh token is a 320-bit random value I
  // generate myself, not a human-chosen secret, so there's nothing for a
  // slow hash to protect against here; a fast cryptographic hash is the
  // right tool and avoids adding needless CPU cost to every refresh call.
  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
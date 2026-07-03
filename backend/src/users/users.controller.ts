import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    const updated = await this.usersService.update(user.id, dto);
    return this.usersService.toPublicUser(updated);
  }
}

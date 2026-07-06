import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { RatingsService } from '../service/ratings.service';
import { CreateRatingDto } from '../dto/create-rating.dto';
import { JwtAuthGuard } from '../..//auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@Controller('media')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @UseGuards(JwtAuthGuard)
  @Patch(':id/rating')
  rate(
    @Param('id') mediaId: string,
    @Body() dto: CreateRatingDto,
    @CurrentUser() user: User,
  ) {
    return this.ratingsService.rate(user.id, mediaId, dto.value);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/rating')
  getUserRating(@Param('id') mediaId: string, @CurrentUser() user: User) {
    return this.ratingsService.getUserRating(user.id, mediaId);
  }
}
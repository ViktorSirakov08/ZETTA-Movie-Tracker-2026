import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MediaService } from '../service/media.service';
import { CreateMediaDto } from '../dto/create-media.dto';
import { UpdateMediaDto } from '../dto/update-media.dto';
import { CreateEpisodeDto } from '../dto/create-episode.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  findAll() {
    return this.mediaService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  findHistory(@CurrentUser() user: User) {
    return this.mediaService.findWatchedByUser(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('watchlist')
  findWatchlist(@CurrentUser() user: User) {
    return this.mediaService.findWatchlistForUser(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('watching')
  findCurrentlyWatching(@CurrentUser() user: User) {
    return this.mediaService.findCurrentlyWatchingForUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMediaDto) {
    return this.mediaService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMediaDto) {
    return this.mediaService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }

  @Post(':mediaId/episodes')
  addEpisode(@Param('mediaId') mediaId: string, @Body() dto: CreateEpisodeDto) {
    return this.mediaService.addEpisode(mediaId, dto);
  }
}

import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MediaService } from '../service/media.service';
import { CreateMediaDto } from '../dto/create-media.dto';
import { UpdateMediaDto } from '../dto/update-media.dto';
import { CreateEpisodeDto } from '../dto/create-episode.dto';
import { CreateSeasonDto } from '../dto/create-season.dto';
import { UpdateEpisodeWatchStatusDto } from '../dto/update-episode-watch-status.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { UpdateWatchStatusDto } from '../dto/update-watch-status.dto';
import { Role } from '../../common/enums/role.enum';
import { UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../../storage/service/storage.service';

function requireAdmin(user: User): void {
  if (user.role !== Role.ADMIN) {
    throw new ForbiddenException('Admin only.');
  }
}

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService, private readonly storageService: StorageService) {}

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

  @Get('search')
  search(
    @Query('q') query?: string,
    @Query('genre') genre?: string,
    @Query('interests') interests?: string,
  ) {
    return this.mediaService.search({
      query,
      genre,
      interests: interests ? interests.split(',').filter(Boolean) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('reindex')
  reindex() {
    return this.mediaService.reindexAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/status')
  getWatchStatus(@Param('id') id: string, @CurrentUser() user: User) {
    return this.mediaService.getWatchStatusForUser(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  setWatchStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWatchStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.mediaService.setWatchStatusForUser(
      user.id,
      id,
      dto.status,
      user.dateOfBirth,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateMediaDto, @CurrentUser() user: User) {
    requireAdmin(user);
    return this.mediaService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMediaDto,
    @CurrentUser() user: User,
  ) {
    requireAdmin(user);
    return this.mediaService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    requireAdmin(user);
    return this.mediaService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':mediaId/seasons')
  addSeason(
    @Param('mediaId') mediaId: string,
    @Body() dto: CreateSeasonDto,
    @CurrentUser() user: User,
  ) {
    requireAdmin(user);
    return this.mediaService.addSeason(mediaId, dto.title);
  }

  @Get(':mediaId/seasons')
  findSeasons(@Param('mediaId') mediaId: string) {
    return this.mediaService.findSeasons(mediaId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':mediaId/episode-status')
  getEpisodeWatchStatuses(
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: User,
  ) {
    return this.mediaService.getEpisodeWatchStatuses(user.id, mediaId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':mediaId/season-status')
  getSeasonWatchStatuses(
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: User,
  ) {
    return this.mediaService.getSeasonWatchStatuses(user.id, mediaId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':mediaId/episodes')
  addEpisode(
    @Param('mediaId') mediaId: string,
    @Body() dto: CreateEpisodeDto,
    @CurrentUser() user: User,
  ) {
    requireAdmin(user);
    return this.mediaService.addEpisode(mediaId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('episodes/:episodeId/status')
  setEpisodeWatchStatus(
    @Param('episodeId') episodeId: string,
    @Body() dto: UpdateEpisodeWatchStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.mediaService.setEpisodeWatchStatus(
      user.id,
      episodeId,
      dto.watched,
    );
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('poster-upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPoster(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image.');
    }
    const url = await this.storageService.uploadPoster(file);
    return { url };
  }
}

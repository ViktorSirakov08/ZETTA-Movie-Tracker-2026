import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('media')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':id/comments')
  async getComments(@Param('id') mediaId: string) {
    return this.commentsService.findByMedia(mediaId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async postComment(
    @Param('id') mediaId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.commentsService.create(user.id, mediaId, dto.content);
  }
}

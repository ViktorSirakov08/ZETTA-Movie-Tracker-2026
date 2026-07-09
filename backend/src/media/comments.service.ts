import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entity/comments.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepo: Repository<Comment>,
  ) {}

  async findByMedia(mediaId: string): Promise<Comment[]> {
    return this.commentsRepo.find({
      where: { mediaId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    userId: string,
    mediaId: string,
    content: string,
  ): Promise<Comment> {
    const comment = this.commentsRepo.create({ userId, mediaId, content });
    return this.commentsRepo.save(comment);
  }

  async delete(userId: string, commentId: string): Promise<void> {
    const comment = await this.commentsRepo.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments.');
    }

    await this.commentsRepo.remove(comment);
  }
}

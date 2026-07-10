import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailService } from '../../mail/mail.service';
import { RabbitmqService } from '../../queue/rabbitmq.service';
import {
  MediaWatchStatus,
  WatchStatus,
} from '../entity/media-watch-status.entity';
import {
  MediaReleaseNotification,
  ReleaseNotificationStatus,
} from '../entity/media-release-notification.entity';

interface ReleaseEmailJob {
  notificationId: string;
}

@Injectable()
export class MediaReleaseNotificationService implements OnModuleInit {
  private readonly logger = new Logger(MediaReleaseNotificationService.name);
  private readonly maxAttempts = 2;

  constructor(
    @InjectRepository(MediaWatchStatus)
    private readonly watchStatusRepo: Repository<MediaWatchStatus>,
    @InjectRepository(MediaReleaseNotification)
    private readonly notificationRepo: Repository<MediaReleaseNotification>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rabbitmqService.consume<ReleaseEmailJob>(
      this.queueName,
      async (job) => this.processReleaseEmailJob(job),
    );
  }

  @Cron('5 0 * * *', {
    timeZone: 'Europe/Sofia',
  })
  async queueDailyReleaseNotifications(): Promise<void> {
    await this.queueTodayReleaseNotifications();
  }

  async queueTodayReleaseNotifications(): Promise<number> {
    const today = this.getTodayDateString();
    const watchlistEntries = await this.watchStatusRepo
      .createQueryBuilder('watchStatus')
      .innerJoinAndSelect('watchStatus.media', 'media')
      .innerJoinAndSelect('watchStatus.user', 'user')
      .where('watchStatus.status = :status', {
        status: WatchStatus.PLANNED_TO_WATCH,
      })
      .andWhere('media.releaseDate = :today', { today })
      .andWhere('user.email IS NOT NULL')
      .andWhere('user.emailVerified = true')
      .getMany();

    let queued = 0;

    for (const entry of watchlistEntries) {
      const notification = await this.createPendingNotification(entry);
      if (!notification) continue;

      await this.publishNotification(notification.id);
      queued += 1;
    }

    if (queued > 0) {
      this.logger.log(`Queued ${queued} release notification emails.`);
    }

    return queued;
  }

  private async createPendingNotification(
    entry: MediaWatchStatus,
  ): Promise<MediaReleaseNotification | null> {
    const existing = await this.notificationRepo.findOne({
      where: {
        userId: entry.userId,
        mediaId: entry.mediaId,
      },
    });

    if (existing) {
      return existing.status === ReleaseNotificationStatus.FAILED &&
        existing.attempts < this.maxAttempts
        ? existing
        : null;
    }

    const notification = this.notificationRepo.create({
      userId: entry.userId,
      mediaId: entry.mediaId,
      status: ReleaseNotificationStatus.PENDING,
      attempts: 0,
      lastError: null,
      sentAt: null,
    });

    return this.notificationRepo.save(notification);
  }

  private async processReleaseEmailJob(job: ReleaseEmailJob): Promise<void> {
    const notification = await this.notificationRepo.findOne({
      where: { id: job.notificationId },
      relations: {
        user: true,
        media: true,
      },
    });

    if (!notification || notification.status === ReleaseNotificationStatus.SENT) {
      return;
    }

    if (!notification.user.email || !notification.user.emailVerified) {
      await this.markFailed(notification, 'User email is missing or unverified.');
      return;
    }

    try {
      await this.mailService.sendMediaReleasedEmail(
        notification.user.email,
        notification.media.name,
        this.buildMediaUrl(notification.media.id),
      );

      notification.status = ReleaseNotificationStatus.SENT;
      notification.sentAt = new Date();
      notification.lastError = null;
      await this.notificationRepo.save(notification);
    } catch (error) {
      await this.handleSendFailure(notification, error as Error);
    }
  }

  private async handleSendFailure(
    notification: MediaReleaseNotification,
    error: Error,
  ): Promise<void> {
    notification.attempts += 1;
    notification.lastError = error.message;

    if (notification.attempts >= this.maxAttempts) {
      notification.status = ReleaseNotificationStatus.FAILED;
      await this.notificationRepo.save(notification);
      return;
    }

    notification.status = ReleaseNotificationStatus.PENDING;
    const saved = await this.notificationRepo.save(notification);
    await this.publishNotification(saved.id);
  }

  private async markFailed(
    notification: MediaReleaseNotification,
    reason: string,
  ): Promise<void> {
    notification.status = ReleaseNotificationStatus.FAILED;
    notification.lastError = reason;
    await this.notificationRepo.save(notification);
  }

  private async publishNotification(notificationId: string): Promise<void> {
    await this.rabbitmqService.publish<ReleaseEmailJob>(this.queueName, {
      notificationId,
    });
  }

  private buildMediaUrl(mediaId: string): string {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );

    return new URL(`/media/${mediaId}`, frontendUrl).toString();
  }

  private getTodayDateString(): string {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Sofia',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    return `${year}-${month}-${day}`;
  }

  private get queueName(): string {
    return this.configService.get<string>(
      'RABBITMQ_RELEASE_EMAIL_QUEUE',
      'media-release-emails',
    );
  }
}

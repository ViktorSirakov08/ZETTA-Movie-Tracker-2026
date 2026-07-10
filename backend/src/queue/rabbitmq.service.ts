import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, ConsumeMessage, connect } from 'amqplib';

type QueueHandler<T> = (message: T) => Promise<void>;

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);
  private readonly maxConnectAttempts = 10;
  private readonly connectRetryDelayMs = 2_000;
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  async publish<T>(queue: string, message: T): Promise<void> {
    const channel = await this.getChannel();
    await channel.assertQueue(queue, { durable: true });

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
      contentType: 'application/json',
    });
  }

  async consume<T>(queue: string, handler: QueueHandler<T>): Promise<void> {
    const channel = await this.getChannel();
    await channel.assertQueue(queue, { durable: true });
    await channel.prefetch(5);

    await channel.consume(queue, async (rawMessage) => {
      if (!rawMessage) return;
      await this.handleMessage(rawMessage, handler);
    });
  }

  private async handleMessage<T>(
    rawMessage: ConsumeMessage,
    handler: QueueHandler<T>,
  ): Promise<void> {
    const channel = await this.getChannel();

    try {
      const parsed = JSON.parse(rawMessage.content.toString()) as T;
      await handler(parsed);
      channel.ack(rawMessage);
    } catch (error) {
      this.logger.error(
        `RabbitMQ message failed: ${(error as Error).message}`,
      );
      channel.nack(rawMessage, false, false);
    }
  }

  private async getChannel(): Promise<Channel> {
    if (!this.channel) {
      await this.connect();
    }
    return this.channel as Channel;
  }

  private async connect(): Promise<void> {
    if (this.channel) return;

    const url = this.configService.get<string>(
      'RABBITMQ_URL',
      'amqp://guest:guest@localhost:5672',
    );

    for (let attempt = 1; attempt <= this.maxConnectAttempts; attempt += 1) {
      try {
        this.connection = await connect(url);
        this.channel = await this.connection.createChannel();
        this.logger.log('Connected to RabbitMQ.');
        return;
      } catch (error) {
        if (attempt === this.maxConnectAttempts) {
          throw error;
        }

        this.logger.warn(
          `RabbitMQ connection failed, retrying (${attempt}/${this.maxConnectAttempts}): ${(error as Error).message}`,
        );
        await this.sleep(this.connectRetryDelayMs);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

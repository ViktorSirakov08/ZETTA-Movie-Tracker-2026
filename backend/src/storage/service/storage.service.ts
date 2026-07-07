import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicEndpoint: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>('MINIO_BUCKET');
    this.publicEndpoint = this.config.getOrThrow<string>('MINIO_ENDPOINT');

    this.s3 = new S3Client({
      endpoint: this.publicEndpoint,
      region: 'us-east-1', // required by the SDK, MinIO ignores the actual value
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('MINIO_ACCESS_KEY'),
        secretAccessKey: this.config.getOrThrow<string>('MINIO_SECRET_KEY'),
      },
      forcePathStyle: true, // MinIO needs path-style URLs (bucket in the path, not subdomain)
    });
  }

  async uploadPoster(file: Express.Multer.File): Promise<string> {
    const extension = file.originalname.split('.').pop();
    const key = `posters/${randomUUID()}.${extension}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `${this.publicEndpoint}/${this.bucket}/${key}`;
  }
}
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { seedGenres } from './media/genre.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await seedGenres(app.get(DataSource));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
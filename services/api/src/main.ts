import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGINS!.split(',').map((o) => o.trim()),
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

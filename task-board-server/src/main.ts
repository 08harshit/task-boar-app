import { setDefaultResultOrder } from 'node:dns';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

/** Prefer A over AAAA ordering so pg/ioredis pick IPv4 first when both exist (helps flaky IPv6 in Docker/VPN). */
setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend integration
  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();

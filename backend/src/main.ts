import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WebsocketAuthMiddleware } from './infrastructure/websockets/middlewares/auth.middleware';
import { JwtTokenService } from './infrastructure/adapters/token/jwt-token.service';
import { ConfigService } from '@nestjs/config';
import { RedisIoAdapter } from './infrastructure/websockets/services/redis-io.service-adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3001',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'],
    credentials: true,
    maxAge: 3600,
  });
  app.setGlobalPrefix('api/v1');
  const jwtService = app.get(JwtTokenService);
  const configService = app.get(ConfigService);
  const authMiddleware = new WebsocketAuthMiddleware(app, jwtService);
  const useRedis = configService.get<string>('USE_REDIS') === 'true';
  if (useRedis) {
    const redisIoAdapter = new RedisIoAdapter(app, configService);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
  } else {
    app.useWebSocketAdapter(authMiddleware);
  }
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();

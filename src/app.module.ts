import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './infrastructure/modules/users.module';
import { AuthModule } from './infrastructure/modules/auth.module';
import { WebsocketModule } from './infrastructure/modules/websocket.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtTokenService } from './infrastructure/adapters/token/jwt-token.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    WebsocketModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, JwtTokenService],
  exports: [JwtTokenService],
})
export class AppModule {}

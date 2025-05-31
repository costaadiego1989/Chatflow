import { Module } from '@nestjs/common';
import { AuthController } from '../adapters/controllers/auth/auth.controller';
import { AuthenticateUserUseCase } from '../../application/use-cases/auth/authenticate-user.use-case';
import { UsersModule } from './users.module';
import { JwtTokenService } from '../adapters/token/jwt-token.service';
import { JwtModule } from '@nestjs/jwt';
import { BcryptHashService } from '../adapters/hash/bcrypt-hash.service';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthenticateUserUseCase,
    {
      provide: 'ITokenService',
      useClass: JwtTokenService,
    },
    {
      provide: 'IHashService',
      useClass: BcryptHashService,
    },
  ],
  exports: ['ITokenService', 'IHashService'],
})
export class AuthModule {}

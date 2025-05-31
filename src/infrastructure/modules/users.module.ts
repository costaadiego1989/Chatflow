import { Module } from '@nestjs/common';
import { UsersController } from '../adapters/controllers/users/users.controller';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { FindUserByIdUseCase } from '../../application/use-cases/users/find-user-by-id.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
import { UpdateUserProfileUseCase } from '../../application/use-cases/users/update-user-profile.use-case';
import { UserRepository } from '../repositories/users/user.repository';
import { PrismaService } from '../database/prisma.service';
import { BcryptHashService } from '../adapters/hash/bcrypt-hash.service';
import { ValidateEmail } from '../../helpers/validate-email';
import { FindUserByUsernameUseCase } from '../../application/use-cases/users/find-user-by-username.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/users/delete-user.use-case';

@Module({
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    FindUserByIdUseCase,
    FindUserByUsernameUseCase,
    UpdateUserUseCase,
    UpdateUserProfileUseCase,
    DeleteUserUseCase,
    PrismaService,
    ValidateEmail,
    {
      provide: 'IHashService',
      useClass: BcryptHashService,
    },
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    BcryptHashService,
    UserRepository,
  ],
  exports: [UserRepository, 'IUserRepository'],
})
export class UsersModule {}

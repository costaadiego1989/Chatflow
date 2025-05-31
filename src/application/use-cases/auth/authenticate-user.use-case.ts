import { Injectable, Inject } from '@nestjs/common';
import { IHashService } from 'src/domain/ports/hash-service.interface';
import { ITokenService } from 'src/domain/ports/token-service.interface';
import { IUserRepository } from 'src/domain/ports/user-repository.interface';
import {
  AuthenticationResult,
  AuthenticationUseCaseInterface,
} from '../../protocols/authenticate-user.interface';
import { Result, ResultHelper } from '../../../helpers/result-helper';
import { User } from '../../../domain/entities/user.entity';

@Injectable()
export class AuthenticateUserUseCase implements AuthenticationUseCaseInterface {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,

    @Inject('IHashService')
    private readonly hashService: IHashService,

    @Inject('ITokenService')
    private readonly tokenService: ITokenService,
  ) {}

  private readonly USER_NOT_FOUND = 'User not found';
  private readonly INVALID_PASSWORD = 'Invalid password';
  private readonly AUTHENTICATION_FAILED = 'Authentication failed';

  async authenticate(
    email: string,
    password: string,
  ): Promise<AuthenticationResult> {
    const validationResult = await this._validateCredentials(email, password);
    if (!validationResult.success) {
      return ResultHelper.failure(validationResult.error);
    }
    try {
      const user = validationResult.data;
      const tokenResult = await this.tokenService.generateToken(user);
      if (!tokenResult.success) {
        return ResultHelper.failure(tokenResult.error);
      }
      return ResultHelper.success({
        token: tokenResult.data,
        user,
      });
    } catch (error) {
      return this._handleError(error);
    }
  }

  private async _findUserByEmail(email: string): Promise<Result<User>> {
    return this.userRepository.findByEmail(email);
  }

  private async _validateHashedPassword(
    password: string,
    hashedPassword: string,
  ): Promise<Result<boolean>> {
    const compareResult = await this.hashService.compare(
      password,
      hashedPassword,
    );
    if (!compareResult.success) {
      return ResultHelper.failure(compareResult.error);
    }
    return ResultHelper.success(compareResult.data);
  }

  private async _validateCredentials(
    email: string,
    password: string,
  ): Promise<Result<User>> {
    const userResult = await this._findUserByEmail(email);

    if (!userResult.success) {
      return ResultHelper.failure(userResult.error);
    }

    if (!userResult.data) {
      return ResultHelper.failure(this.USER_NOT_FOUND);
    }

    const passwordValidationResult = await this._validateHashedPassword(
      password,
      userResult.data.password,
    );

    if (!passwordValidationResult.success) {
      return ResultHelper.failure(passwordValidationResult.error);
    }

    if (!passwordValidationResult.data) {
      return ResultHelper.failure(this.INVALID_PASSWORD);
    }

    return ResultHelper.success(userResult.data);
  }

  private _handleError(error: Error): AuthenticationResult {
    return ResultHelper.failure(
      error instanceof Error ? error.message : this.AUTHENTICATION_FAILED,
    );
  }
}

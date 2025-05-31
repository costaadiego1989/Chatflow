import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/ports/user-repository.interface';
import { ResultHelper, Result } from '../../../helpers/result-helper';

@Injectable()
export class FindUserByUsernameUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  private readonly USERNAME_EMPTY = 'Username cannot be empty';
  private readonly USER_NOT_FOUND = 'User with username {0} not found';
  private readonly FAILED_TO_FETCH_USER = 'Failed to fetch user';

  async execute(username: string): Promise<Result<User>> {
    try {
      const usernameValidation = this._validateUsername(username);
      if (!usernameValidation.success) {
        return ResultHelper.failure(usernameValidation.error);
      }

      const userResult = await this._findUserByUsername(username);
      if (!userResult.success) {
        return ResultHelper.failure(userResult.error);
      }

      if (!userResult.data) {
        return ResultHelper.failure(
          this.USER_NOT_FOUND.replace('{0}', username),
        );
      }

      return ResultHelper.success(userResult.data);
    } catch (error) {
      return ResultHelper.failure(
        error instanceof Error ? error.message : this.FAILED_TO_FETCH_USER,
      );
    }
  }

  private _validateUsername(username: string): Result<string> {
    if (!username || username.trim().length === 0) {
      return ResultHelper.failure(this.USERNAME_EMPTY);
    }
    return ResultHelper.success(username);
  }

  private async _findUserByUsername(
    username: string,
  ): Promise<Result<User | null>> {
    return this.userRepository.findByUsername(username);
  }
}

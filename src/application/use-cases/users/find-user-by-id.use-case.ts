import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { ResultHelper, Result } from '../../../helpers/result-helper';
import { IUserRepository } from '../../../domain/ports/user-repository.interface';

@Injectable()
export class FindUserByIdUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  private readonly USER_NOT_FOUND = 'User not found';
  private readonly INVALID_USER_ID = 'Invalid user ID';
  private readonly FAILED_TO_FETCH_USER = 'Failed to fetch user';

  async execute(userId: string): Promise<Result<User>> {
    try {
      const userIdValidation = this._validateUserId(userId);
      if (!userIdValidation.success) {
        return ResultHelper.failure(userIdValidation.error);
      }

      const userResult = await this._findUserById(userId);
      if (!userResult.success) {
        return ResultHelper.failure(userResult.error);
      }

      if (!userResult.data) {
        return ResultHelper.failure(this.USER_NOT_FOUND);
      }

      return ResultHelper.success(userResult.data);
    } catch (error) {
      return ResultHelper.failure(
        error instanceof Error ? error.message : this.FAILED_TO_FETCH_USER,
      );
    }
  }

  private _validateUserId(userId: string): Result<string> {
    if (!userId || userId.trim() === '') {
      return ResultHelper.failure(this.INVALID_USER_ID);
    }
    return ResultHelper.success(userId);
  }

  private async _findUserById(userId: string): Promise<Result<User | null>> {
    return this.userRepository.findById(userId);
  }
}

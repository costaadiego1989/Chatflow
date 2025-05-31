import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../../domain/ports/user-repository.interface';
import { ResultHelper, Result } from '../../../helpers/result-helper';
import { User } from '../../../domain/entities/user.entity';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  private readonly USER_NOT_FOUND = 'User not found';
  private readonly INVALID_USER_ID = 'Invalid user ID';
  private readonly FAILED_TO_DELETE_USER = 'Failed to delete user';

  async execute(userId: string): Promise<Result<boolean>> {
    try {
      const allValidations = await this._allValidations(userId);
      if (!allValidations.success) {
        return ResultHelper.failure(allValidations.error);
      }

      return ResultHelper.success(true);
    } catch (error) {
      return ResultHelper.failure(
        error instanceof Error ? error.message : this.FAILED_TO_DELETE_USER,
      );
    }
  }

  private _validateUserId(userId: string): Result<string> {
    if (!userId || userId.trim().length === 0) {
      return ResultHelper.failure(this.INVALID_USER_ID);
    }
    return ResultHelper.success(userId);
  }

  private async _allValidations(userId: string): Promise<Result<boolean>> {
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

    const deleteResult = await this._deleteUser(userId);
    if (!deleteResult.success) {
      return ResultHelper.failure(deleteResult.error);
    }

    return ResultHelper.success(true);
  }

  private async _findUserById(userId: string): Promise<Result<User | null>> {
    return this.userRepository.findById(userId);
  }

  private async _deleteUser(userId: string): Promise<Result<void>> {
    return this.userRepository.delete(userId);
  }
}

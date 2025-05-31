import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/ports/user-repository.interface';
import { IHashService } from '../../../domain/ports/hash-service.interface';
import { ResultHelper, Result } from '../../../helpers/result-helper';
import { UpdateUserProfileInput } from '../../protocols/update-user-profile.interface';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IHashService')
    private readonly hashService: IHashService,
  ) {}

  private readonly USER_NOT_FOUND = 'User not found';
  private readonly INVALID_USER_ID = 'Invalid user ID';
  private readonly FAILED_TO_UPDATE_USER = 'Failed to update user';

  async execute(
    userId: string,
    updateData: Omit<UpdateUserProfileInput, 'userId'>,
  ): Promise<Result<User>> {
    try {
      const allValidations = await this._allValidations(userId);
      if (!allValidations.success) {
        return ResultHelper.failure(allValidations.error);
      }

      const userResult = await this._findUserById(userId);
      await this._applyUpdates(userResult.data, updateData);

      const updateResult = await this._updateUser(userId, userResult.data);
      if (!updateResult.success) {
        return ResultHelper.failure(updateResult.error);
      }

      return ResultHelper.success(updateResult.data);
    } catch (error) {
      return ResultHelper.failure(
        error instanceof Error ? error.message : this.FAILED_TO_UPDATE_USER,
      );
    }
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

    return ResultHelper.success(true);
  }

  private _validateUserId(userId: string): Result<string> {
    if (!userId || userId.trim().length === 0) {
      return ResultHelper.failure(this.INVALID_USER_ID);
    }
    return ResultHelper.success(userId);
  }

  private async _findUserById(userId: string): Promise<Result<User | null>> {
    return this.userRepository.findById(userId);
  }

  private async _updateUser(userId: string, user: User): Promise<Result<User>> {
    return this.userRepository.update(userId, user);
  }

  private async _applyUpdates(
    user: User,
    updateData: Omit<UpdateUserProfileInput, 'userId'>,
  ): Promise<void> {
    await this._handleUsername(user, updateData);
    await this._handleEmail(user, updateData);
    await this._handlePassword(user, updateData);
    await this._handleAvatar(user, updateData);
  }

  private async _handleUsername(
    user: User,
    updateData: Omit<UpdateUserProfileInput, 'userId'>,
  ): Promise<void> {
    if (updateData.username) {
      user.setUsername(updateData.username);
    }
  }

  private async _handleEmail(
    user: User,
    updateData: Omit<UpdateUserProfileInput, 'userId'>,
  ): Promise<void> {
    if (updateData.email) {
      user.setEmail(updateData.email);
    }
  }

  private async _handlePassword(
    user: User,
    updateData: Omit<UpdateUserProfileInput, 'userId'>,
  ): Promise<void> {
    if (updateData.password) {
      const hashResult = await this.hashService.hash(updateData.password);
      if (hashResult.success) {
        user.setPassword(hashResult.data);
      }
    }
  }

  private async _handleAvatar(
    user: User,
    updateData: Omit<UpdateUserProfileInput, 'userId'>,
  ): Promise<void> {
    if (updateData.avatar) {
      user.avatar = updateData.avatar;
    }
  }
}

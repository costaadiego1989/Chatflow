import { Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { ValidateEmail } from '../../../helpers/validate-email';
import {
  UpdateUserProfileInput,
  UpdateUserProfileResult,
} from '../../protocols/update-user-profile.interface';
import { ResultHelper, ValidationResult } from '../../../helpers/result-helper';
import { UserRepository } from '../../../infrastructure/repositories/users/user.repository';

@Injectable()
export class UpdateUserProfileUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly validateEmail: ValidateEmail,
  ) {}

  async execute(
    input: UpdateUserProfileInput,
  ): Promise<UpdateUserProfileResult> {
    const { userId, username, email, avatar } = input;

    const validationResult = await this._validateInputs(
      userId,
      username,
      email,
    );
    if (!validationResult.isValid) {
      return ResultHelper.failure(validationResult.error);
    }

    const user = await this.userRepository.findById(userId);

    try {
      const updatedUser = this._createUpdatedUserEntity(
        user.data,
        email,
        username,
        avatar,
      );
      const savedUser = await this.userRepository.update(userId, updatedUser);

      return ResultHelper.success(savedUser.data);
    } catch (error) {
      return ResultHelper.failure(
        error instanceof Error ? error.message : 'Failed to update user profile'
      );
    }
  }

  private async _validateInputs(
    userId: string,
    username?: string,
    email?: string,
  ): Promise<ValidationResult> {
    const userResult = await this.userRepository.findById(userId);
    if (!userResult.success || !userResult.data) {
      return ResultHelper.validationFailure('User not found');
    }

    if (email) {
      const emailValidation = await this._validateEmailInput(email, userId);
      if (!emailValidation.isValid) {
        return emailValidation;
      }
    }

    if (username) {
      const usernameValidation = await this._validateUsernameInput(
        username,
        userId,
      );
      if (!usernameValidation.isValid) {
        return usernameValidation;
      }
    }

    return { isValid: true };
  }

  private async _validateEmailInput(
    email: string,
    userId: string,
  ): Promise<ValidationResult> {
    if (!this.validateEmail.validate(email)) {
      return ResultHelper.validationFailure('Invalid email format');
    }

    const userByEmailResult = await this.userRepository.findByEmail(email);
    if (userByEmailResult.success && userByEmailResult.data && userByEmailResult.data.id !== userId) {
      return ResultHelper.validationFailure('Email already in use');
    }

    return { isValid: true };
  }

  private async _validateUsernameInput(
    username: string,
    userId: string,
  ): Promise<ValidationResult> {
    const userByUsernameResult = await this.userRepository.findByUsername(username);
    if (userByUsernameResult.success && userByUsernameResult.data && userByUsernameResult.data.id !== userId) {
      return ResultHelper.validationFailure('Username already in use');
    }

    return { isValid: true };
  }

  private _createUpdatedUserEntity(
    user: User,
    email?: string,
    username?: string,
    avatar?: string,
  ): User {
    const updatedUser = new User(
      user.id,
      email || user.email,
      username || user.username,
      user.password,
    );

    updatedUser.status = user.status;

    if (avatar !== undefined) {
      updatedUser.avatar = avatar;
    } else if (user.avatar) {
      updatedUser.avatar = user.avatar;
    }

    return updatedUser;
  }
}

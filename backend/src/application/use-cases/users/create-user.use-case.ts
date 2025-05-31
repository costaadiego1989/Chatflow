import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/ports/user-repository.interface';
import { IHashService } from '../../../domain/ports/hash-service.interface';
import { CreateUserInput } from '../../protocols/create-user.interface';
import { ValidateEmail } from '../../../helpers/validate-email';
import {
  ResultHelper,
  ValidationResult,
  Result,
} from '../../../helpers/result-helper';
import { v4 as uuidv4 } from 'uuid';
import { UserFactory } from '../../../domain/factories/user.factory';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IHashService')
    private readonly hashService: IHashService,
    private readonly validateEmail: ValidateEmail,
  ) {}

  private readonly EMAIL_IN_USE = 'Email already in use';
  private readonly USERNAME_IN_USE = 'Username already in use';
  private readonly INVALID_EMAIL_FORMAT = 'Invalid email format';
  private readonly PASSWORD_TOO_SHORT =
    'Password must be at least 6 characters long';
  private readonly FAILED_TO_CREATE_USER = 'Failed to create user';

  async execute(input: CreateUserInput): Promise<Result<User>> {
    try {
      const { email, username, password } = input;

      const validationResult = await this._validateInputs(
        email,
        username,
        password,
      );

      if (!validationResult.isValid) {
        return ResultHelper.failure(validationResult.error);
      }

      const userResult = await this._createUser(email, username, password);
      if (!userResult.success) {
        return ResultHelper.failure(userResult.error);
      }

      return ResultHelper.success(userResult.data);
    } catch (error) {
      return ResultHelper.failure(
        error instanceof Error ? error.message : this.FAILED_TO_CREATE_USER,
      );
    }
  }

  private async _validateInputs(
    email: string,
    username: string,
    password: string,
  ): Promise<ValidationResult> {
    const emailFormatValidation = this._validateEmailFormat(email);
    if (!emailFormatValidation.isValid) {
      return emailFormatValidation;
    }

    const passwordValidation = this._validatePassword(password);
    if (!passwordValidation.isValid) {
      return passwordValidation;
    }

    const emailInUseResult = await this._checkEmailInUse(email);
    if (!emailInUseResult.success) {
      return ResultHelper.validationFailure(emailInUseResult.error);
    }

    if (emailInUseResult.data) {
      return ResultHelper.validationFailure(this.EMAIL_IN_USE);
    }

    const usernameInUseResult = await this._checkUsernameInUse(username);
    if (!usernameInUseResult.success) {
      return ResultHelper.validationFailure(usernameInUseResult.error);
    }

    if (usernameInUseResult.data) {
      return ResultHelper.validationFailure(this.USERNAME_IN_USE);
    }

    return ResultHelper.validationSuccess();
  }

  private _validateEmailFormat(email: string): ValidationResult {
    if (!this.validateEmail.validate(email)) {
      return ResultHelper.validationFailure(this.INVALID_EMAIL_FORMAT);
    }
    return ResultHelper.validationSuccess();
  }

  private _validatePassword(password: string): ValidationResult {
    if (password.length < 6) {
      return ResultHelper.validationFailure(this.PASSWORD_TOO_SHORT);
    }
    return ResultHelper.validationSuccess();
  }

  private async _checkEmailInUse(email: string): Promise<Result<User | null>> {
    return this.userRepository.findByEmail(email);
  }

  private async _checkUsernameInUse(
    username: string,
  ): Promise<Result<User | null>> {
    return this.userRepository.findByUsername(username);
  }

  private async _createUser(
    email: string,
    username: string,
    password: string,
  ): Promise<Result<User>> {
    const hashResult = await this.hashService.hash(password);
    if (!hashResult.success) {
      return ResultHelper.failure(hashResult.error);
    }
    const hashedPassword = hashResult.data;
    const userId = uuidv4();
    const user = UserFactory.create({
      id: userId,
      email,
      username,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }
}

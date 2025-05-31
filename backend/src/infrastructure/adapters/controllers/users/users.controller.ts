import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateUserDto } from '../../dtos/user/create-user.dto';
import { UserResponseDto } from '../../dtos/user/user-response.dto';
import { UpdateUserDto } from '../../dtos/user/update-user.dto';
import { CreateUserUseCase } from '../../../../application/use-cases/users/create-user.use-case';
import { FindUserByIdUseCase } from '../../../../application/use-cases/users/find-user-by-id.use-case';
import { UpdateUserUseCase } from '../../../../application/use-cases/users/update-user.use-case';
import { FindUserByUsernameUseCase } from '../../../../application/use-cases/users/find-user-by-username.use-case';
import { DeleteUserUseCase } from '../../../../application/use-cases/users/delete-user.use-case';
import { Result, ResultHelper } from '../../../../helpers/result-helper';
import { User } from '../../../../domain/entities/user.entity';

@Controller('users')
export class UsersController {
  private readonly ERROR_USER_ID_REQUIRED = 'User ID is required';
  private readonly ERROR_USERNAME_REQUIRED = 'Username is required';
  private readonly ERROR_EMAIL_REQUIRED = 'Email is required and must be valid';
  private readonly ERROR_EMAIL_INVALID = 'Email must be valid';
  private readonly ERROR_TO_ACCESS_THIS_RESOURCE =
    'Error to access this resource';
  private readonly SUCCESS_USER_DELETED = 'User deleted successfully';

  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly findUserByUsernameUseCase: FindUserByUsernameUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<Result<UserResponseDto>> {
    try {
      if (!this._validateEmail(createUserDto.email).success) {
        return ResultHelper.failure(this.ERROR_EMAIL_REQUIRED);
      }
      if (!this._validateUsername(createUserDto.username).success) {
        return ResultHelper.failure(this.ERROR_USERNAME_REQUIRED);
      }
      const result = await this.createUserUseCase.execute(createUserDto);
      if (!result.success) {
        return ResultHelper.failure(result.error);
      }
      return ResultHelper.success(this._mapToResponseDto(result.data));
    } catch (error) {
      return this._handleError(error);
    }
  }

  @Get('username/:username')
  async findByUsername(
    @Param('username') username: string,
  ): Promise<Result<UserResponseDto>> {
    try {
      if (!this._validateUsername(username).success) {
        return ResultHelper.failure(this.ERROR_USERNAME_REQUIRED);
      }
      const result = await this.findUserByUsernameUseCase.execute(username);
      if (!result.success) {
        return ResultHelper.failure(result.error);
      }
      return ResultHelper.success(this._mapToResponseDto(result.data));
    } catch (error) {
      return this._handleError(error);
    }
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Result<UserResponseDto>> {
    try {
      if (!this._validateId(id).success) {
        return ResultHelper.failure(this.ERROR_USER_ID_REQUIRED);
      }
      const result = await this.findUserByIdUseCase.execute(id);
      if (!result.success) {
        return ResultHelper.failure(result.error);
      }
      return ResultHelper.success(this._mapToResponseDto(result.data));
    } catch (error) {
      return this._handleError(error);
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Result<UserResponseDto>> {
    try {
      const validationResult = this._validateUpdateUser(id, updateUserDto);
      if (!validationResult.success) {
        return ResultHelper.failure(validationResult.error);
      }
      const result = await this.updateUserUseCase.execute(id, updateUserDto);
      if (!result.success) {
        return ResultHelper.failure(result.error);
      }
      return ResultHelper.success(this._mapToResponseDto(result.data));
    } catch (error) {
      return this._handleError(error);
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<Result<string>> {
    try {
      if (!this._validateId(id).success) {
        return ResultHelper.failure(this.ERROR_USER_ID_REQUIRED);
      }
      const result = await this.deleteUserUseCase.execute(id);
      if (!result.success) {
        return ResultHelper.failure(result.error);
      }
      return ResultHelper.success(this.SUCCESS_USER_DELETED);
    } catch (error) {
      return this._handleError(error);
    }
  }

  private _validateId(id: string): Result<string> {
    if (!id || id.trim() === '') {
      return ResultHelper.failure(this.ERROR_USER_ID_REQUIRED);
    }
    return ResultHelper.success(id);
  }

  private _validateUsername(username: string): Result<string> {
    if (!username || username.trim() === '') {
      return ResultHelper.failure(this.ERROR_USERNAME_REQUIRED);
    }
    return ResultHelper.success(username);
  }

  private _validateEmail(email: string): Result<string> {
    if (!email || email.trim() === '') {
      return ResultHelper.failure(this.ERROR_EMAIL_INVALID);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ResultHelper.failure(this.ERROR_EMAIL_INVALID);
    }
    return ResultHelper.success(email);
  }

  private _validateUpdateUser(id: string, updateUserDto: UpdateUserDto): Result<UpdateUserDto> {
    if (!this._validateId(id).success) {
      return ResultHelper.failure(this.ERROR_USER_ID_REQUIRED);
    }
    if (
      updateUserDto.email &&
      !this._validateEmail(updateUserDto.email).success
    ) {
      return ResultHelper.failure(this.ERROR_EMAIL_INVALID);
    }
    if (
      updateUserDto.username &&
      !this._validateUsername(updateUserDto.username).success
    ) {
      return ResultHelper.failure(this.ERROR_USERNAME_REQUIRED);
    }
    return ResultHelper.success(updateUserDto);
  }

  private _mapToResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }

  private _handleError(error: unknown): Result<any> {
    return ResultHelper.failure(
      error instanceof Error
        ? error.message
        : this.ERROR_TO_ACCESS_THIS_RESOURCE,
    );
  }
}

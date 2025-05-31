import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/ports/user-repository.interface';
import { Result, ResultHelper } from '../../../helpers/result-helper';
import { UserFactory } from '../../../domain/factories/user.factory';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  private readonly ERROR_MESSAGE_SAVE_USER = 'Error saving user';
  private readonly ERROR_MESSAGE_INTERNAL_SERVER_ERROR = 'Error internal server';
  private readonly ERROR_MESSAGE_FIND_USER_BY_ID = 'Error finding user by id';
  private readonly ERROR_MESSAGE_FIND_USER_BY_EMAIL = 'Error finding user by email';
  private readonly ERROR_MESSAGE_FIND_USER_BY_USERNAME = 'Error finding user by username';
  private readonly ERROR_MESSAGE_UPDATE_USER = 'Error updating user';
  private readonly ERROR_MESSAGE_DELETE_USER = 'Error deleting user';
  private readonly ERROR_MESSAGE_USER_NOT_FOUND = 'User not found';

  async findById(id: string): Promise<Result<User>> {
    try {
      const userModel = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!userModel) {
        return ResultHelper.failure(this.ERROR_MESSAGE_USER_NOT_FOUND);
      }

      return ResultHelper.success(this._mapToDomain(userModel));
    } catch (error) {
      return this._handleError(error, this.ERROR_MESSAGE_FIND_USER_BY_ID);
    }
  }

  async findByEmail(email: string): Promise<Result<User>> {
    try {
      const userModel = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!userModel) {
        return ResultHelper.success(null);
      }

      return ResultHelper.success(this._mapToDomain(userModel));
    } catch (error) {
      return this._handleError(error, this.ERROR_MESSAGE_FIND_USER_BY_EMAIL);
    }
  }

  async findByUsername(username: string): Promise<Result<User>> {
    try {
      const userModel = await this.prisma.user.findUnique({
        where: { username },
      });

      if (!userModel) {
        return ResultHelper.success(null);
      }

      return ResultHelper.success(this._mapToDomain(userModel));
    } catch (error) {
      return this._handleError(error, this.ERROR_MESSAGE_FIND_USER_BY_USERNAME);
    }
  }

  async save(user: User): Promise<Result<User>> {
    try {
      const userData = {
        id: user.id,
        email: user.email,
        username: user.username,
        password: user.password,
        status: user.status,
        avatar: user.avatar || null,
        lastSeen: user.lastSeen ? new Date(user.lastSeen) : null,
      };

      const savedUser = await this.prisma.user.create({
        data: userData,
      });

      if (!savedUser) {
        return ResultHelper.failure(this.ERROR_MESSAGE_SAVE_USER);
      }

      return ResultHelper.success(this._mapToDomain(savedUser));
    } catch (error) {
      return this._handleError(error, this.ERROR_MESSAGE_SAVE_USER);
    }
  }

  async update(id: string, user: User): Promise<Result<User>> {
    try {
      const userData = {
        email: user.email,
        username: user.username,
        password: user.password,
        status: user.status,
        avatar: user.avatar || null,
      };

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: userData,
      });

      if (!updatedUser) {
        return ResultHelper.failure(this.ERROR_MESSAGE_UPDATE_USER);
      }

      return ResultHelper.success(this._mapToDomain(updatedUser));
    } catch (error) {
      return this._handleError(error, this.ERROR_MESSAGE_UPDATE_USER);
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });

      return ResultHelper.success(undefined);
    } catch (error) {
      return this._handleError(error, this.ERROR_MESSAGE_DELETE_USER);
    }
  }

  private _mapToDomain(userModel: any): User {
    const user = UserFactory.create({
      id: userModel.id,
      email: userModel.email,
      username: userModel.username,
      password: userModel.password,
    });

    user.status = userModel.status;

    if (userModel.avatar) {
      user.avatar = userModel.avatar;
    }

    if (userModel.lastSeen) {
      user.goOffline();
    }

    return user;
  }

  private _handleError(error: any, defaultMessage?: string): Result<any> {
    return ResultHelper.failure(
      error instanceof Error
        ? error.message
        : defaultMessage || this.ERROR_MESSAGE_INTERNAL_SERVER_ERROR,
    );
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { IHashService } from '../../../domain/ports/hash-service.interface';
import { ResultHelper, Result } from '../../../helpers/result-helper';
import * as bcrypt from 'bcrypt';

const HASH_MESSAGES = {
  ERROR_HASHING: 'Error hashing password',
  ERROR_COMPARING: 'Error comparing passwords',
};

@Injectable()
export class BcryptHashService implements IHashService {
  private readonly saltRounds = 10;
  private readonly logger = new Logger(BcryptHashService.name);

  async hash(password: string): Promise<Result<string>> {
    try {
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);
      return ResultHelper.success(hashedPassword);
    } catch (error) {
      return this._handleError('hash', error);
    }
  }

  async compare(
    password: string,
    hashedPassword: string,
  ): Promise<Result<boolean>> {
    try {
      const isMatch = await bcrypt.compare(password, hashedPassword);
      return ResultHelper.success(isMatch);
    } catch (error) {
      return this._handleError('compare', error);
    }
  }

  private _handleError(operation: string, error: Error): Result<any> {
    const errorMessage = `Error in ${operation}: ${error.message}`;
    this.logger.error(errorMessage);
    if (operation === 'hash') {
      return ResultHelper.failure(HASH_MESSAGES.ERROR_HASHING);
    }
    return ResultHelper.failure(HASH_MESSAGES.ERROR_COMPARING);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenService } from '../../../domain/ports/token-service.interface';
import { ResultHelper, Result } from '../../../helpers/result-helper';

const TOKEN_MESSAGES = {
  ERROR_GENERATING: 'Error generating token',
  ERROR_VALIDATING: 'Error validating token',
  TOKEN_EXPIRED: 'Token expired',
  TOKEN_INVALID: 'Invalid token',
};

@Injectable()
export class JwtTokenService implements ITokenService {
  private readonly logger = new Logger(JwtTokenService.name);

  constructor(private readonly jwtService: JwtService) {}

  async generateToken(user: { id: string; email: string, username: string }): Promise<Result<string>> {
    try {
      const token = this.jwtService.sign(
        { sub: user.id, email: user.email, username: user.username },
        { secret: process.env.JWT_SECRET, expiresIn: '1h' },
      );
      return ResultHelper.success(token);
    } catch (error) {
      return this._handleError('generateToken', error);
    }
  }

  async validateToken(token: string): Promise<Result<string | null>> {
    try {
      const payload = this.jwtService.verify(token);
      return ResultHelper.success(payload.sub);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        this.logger.warn(TOKEN_MESSAGES.TOKEN_EXPIRED);
        return ResultHelper.failure(TOKEN_MESSAGES.TOKEN_EXPIRED);
      }
      if (error.name === 'JsonWebTokenError') {
        this.logger.warn(TOKEN_MESSAGES.TOKEN_INVALID);
        return ResultHelper.failure(TOKEN_MESSAGES.TOKEN_INVALID);
      }
      return this._handleError('validateToken', error);
    }
  }

  private _handleError(operation: string, error: Error): Result<any> {
    const errorMessage = `Error in ${operation}: ${error.message}`;
    this.logger.error(errorMessage);
    return ResultHelper.failure(errorMessage);
  }
}

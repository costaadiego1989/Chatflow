import { Body, Controller, Post } from '@nestjs/common';
import { AuthenticateUserUseCase } from '../../../../application/use-cases/auth/authenticate-user.use-case';
import { AuthRequestDto } from '../../dtos/auth/auth-request.dto';
import { AuthResponseDto } from '../../dtos/auth/auth-response.dto';
import { Result, ResultHelper } from '../../../../helpers/result-helper';

@Controller('auth')
export class AuthController {
  private readonly ERROR_EMAIL_REQUIRED = 'Email is required';
  private readonly ERROR_PASSWORD_REQUIRED = 'Password is required';
  private readonly ERROR_AUTHENTICATION_FAILED = 'Authentication failed';
  private readonly ERROR_TO_ACCESS_THIS_RESOURCE = 'Error to access this resource';

  constructor(
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
  ) {}

  @Post('login')
  async login(
    @Body() loginDto: AuthRequestDto,
  ): Promise<Result<AuthResponseDto>> {
    try {
      const validationResult = this._validateLoginInput(loginDto);
      if (!validationResult.success) {
        return ResultHelper.failure(validationResult.error);
      }

      const result = await this.authenticateUserUseCase.authenticate(
        loginDto.email,
        loginDto.password,
      );

      if (!result.success) {
        return ResultHelper.failure(
          result.error || this.ERROR_AUTHENTICATION_FAILED,
        );
      }

      return ResultHelper.success(this._mapToResponseDTO(result.data));
    } catch (error) {
      return this._handleError(error);
    }
  }

  private _validateLoginInput(
    loginDto: AuthRequestDto,
  ): Result<AuthRequestDto> {
    if (!this._validateEmail(loginDto.email)) {
      return ResultHelper.failure(this.ERROR_EMAIL_REQUIRED);
    }

    if (!this._validatePassword(loginDto.password)) {
      return ResultHelper.failure(this.ERROR_PASSWORD_REQUIRED);
    }

    return ResultHelper.success(loginDto);
  }

  private _validateEmail(email: string): boolean {
    return !!email && email.trim() !== '';
  }

  private _validatePassword(password: string): boolean {
    return !!password && password.trim() !== '';
  }

  private _mapToResponseDTO(data: any): AuthResponseDto {
    return {
      token: data.token,
      user: {
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
      },
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

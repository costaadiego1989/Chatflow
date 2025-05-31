import { Result } from '../../helpers/result-helper';

export interface ITokenService {
  generateToken(user: { id: string; email: string, username: string }): Promise<Result<string>>;
  validateToken(token: string): Promise<Result<string | null>>;
}

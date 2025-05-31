import { User } from 'src/domain/entities/user.entity';
import { Result } from '../../helpers/result-helper';

export interface AuthenticationData {
  token: string;
  user: User;
}

export type AuthenticationResult = Result<AuthenticationData>;

export interface AuthenticationUseCaseInterface {
  authenticate(email: string, password: string): Promise<AuthenticationResult>;
}

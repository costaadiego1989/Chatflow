import { User } from '../entities/user.entity';

export interface IAuthenticationService {
  authenticate(email: string, password: string): Promise<User | null>;
}

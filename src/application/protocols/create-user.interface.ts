import { User } from 'src/domain/entities/user.entity';
import { Result } from '../../helpers/result-helper';

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
}

export type CreateUserResult = Result<User>;

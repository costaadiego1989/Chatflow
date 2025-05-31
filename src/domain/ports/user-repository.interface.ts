import { User } from '../entities/user.entity';
import { Result } from '../../helpers/result-helper';

export interface IUserRepository {
  findById(id: string): Promise<Result<User | null>>;
  findByEmail(email: string): Promise<Result<User | null>>;
  findByUsername(username: string): Promise<Result<User | null>>;
  save(user: User): Promise<Result<User>>;
  update(id: string, user: User): Promise<Result<User>>;
  delete(id: string): Promise<Result<void>>;
}

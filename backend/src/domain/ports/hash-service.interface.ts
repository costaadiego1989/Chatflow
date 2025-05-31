import { Result } from '../../helpers/result-helper';

export interface IHashService {
  hash(plainPassword: string): Promise<Result<string>>;
  compare(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<Result<boolean>>;
}

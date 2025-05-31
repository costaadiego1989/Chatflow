import { User } from '../../domain/entities/user.entity';
import { Result } from '../../helpers/result-helper';

export interface FindUserByIdDTO {
  userId: string;
}

export type FindUserByIdResult = Result<User>;

export interface FindUserByIdUseCaseInterface {
  execute(data: FindUserByIdDTO): Promise<FindUserByIdResult>;
} 
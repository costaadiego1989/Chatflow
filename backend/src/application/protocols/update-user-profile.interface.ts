import { User } from 'src/domain/entities/user.entity';

export interface UpdateUserProfileInput {
  userId: string;
  username?: string;
  email?: string;
  avatar?: string;
  password?: string;
}

export interface UpdateUserProfileResult {
  success: boolean;
  user?: User;
  error?: string;
}

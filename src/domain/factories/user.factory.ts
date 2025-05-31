import { User } from '../entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

export interface CreateUserProps {
  id?: string;
  email: string;
  username: string;
  password: string;
}

export class UserFactory {
  static create(props: CreateUserProps): User {
    const userId = props.id || uuidv4();

    return new User(userId, props.email, props.username, props.password);
  }
}

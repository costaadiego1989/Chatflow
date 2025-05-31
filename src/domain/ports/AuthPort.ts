import { User } from '../entities/User'

export interface AuthPort {
  register(user: User): Promise<User>
  login(email: string, password: string): Promise<User>
  logout(): Promise<void>
} 
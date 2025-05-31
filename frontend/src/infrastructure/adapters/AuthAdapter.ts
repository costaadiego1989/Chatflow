import { User } from '../../domain/entities/User'
import { AuthPort } from '../../domain/ports/AuthPort'

export class AuthAdapter implements AuthPort {
  async register(user: User): Promise<User> {
    console.log('Register user:', user)
    return user
  }

  async login(email: string, password: string): Promise<User> {
    console.log('Login with:', email, password)
    return new User('User Name', email, password, '1')
  }

  async logout(): Promise<void> {
    console.log('Logout')
  }
} 
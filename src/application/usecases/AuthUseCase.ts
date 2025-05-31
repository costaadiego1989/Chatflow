import { User } from '../../domain/entities/User'
import { AuthPort } from '../../domain/ports/AuthPort'

export class AuthUseCase {
  constructor(private authPort: AuthPort) {}

  async register(user: User): Promise<User> {
    return this.authPort.register(user)
  }

  async login(email: string, password: string): Promise<User> {
    return this.authPort.login(email, password)
  }

  async logout(): Promise<void> {
    return this.authPort.logout()
  }
} 
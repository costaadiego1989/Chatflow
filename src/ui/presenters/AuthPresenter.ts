import { User } from '../../domain/entities/User'
import { AuthUseCase } from '../../application/usecases/AuthUseCase'

export class AuthPresenter {
  constructor(private authUseCase: AuthUseCase) {}

  async register(username: string, email: string, password: string): Promise<User> {
    const user = new User(username, email, password)
    return this.authUseCase.register(user)
  }

  async login(email: string, password: string): Promise<User> {
    return this.authUseCase.login(email, password)
  }

  async logout(): Promise<void> {
    return this.authUseCase.logout()
  }
} 
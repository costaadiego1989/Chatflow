import { User } from '../entities/User'

interface UserAPIResponse {
  id: string
  email: string
  username?: string
  name?: string
  token?: string
}

export class UserFactory {
  static create(username: string, email: string, password?: string, id?: string, token?: string): User {
    return new User(username, email, password, id, token)
  }

  static createFromAPI(data: UserAPIResponse): User {
    const displayName = data.username || data.name || 'Usuário'
    
    return new User(
      displayName,
      data.email,
      undefined,
      data.id,
      data.token
    )
  }
} 
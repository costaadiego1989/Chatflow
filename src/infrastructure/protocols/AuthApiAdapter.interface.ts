export interface LoginRequest {
    email: string
    password: string
  }
  
  export interface RegisterRequest {
    username: string
    email: string
    password: string
  }
  
  export interface AuthResponse {
    success: boolean
    data?: {
      token: string
      user: {
        id: string
        email: string
        username?: string
        name?: string
      }
    }
    error?: string
  }
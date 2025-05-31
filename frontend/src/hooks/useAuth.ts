import { useState } from 'react'
import { User } from '../domain/entities/User'
import { AuthApiAdapter } from '../infrastructure/adapters/api/AuthApiAdapter'
import { AuthUseCase } from '../application/usecases/AuthUseCase'
import { AuthPresenter } from '../ui/presenters/AuthPresenter'

const API_BASE_URL = 'http://localhost:3001/api/v1'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const authAdapter = new AuthApiAdapter(API_BASE_URL)
  const authUseCase = new AuthUseCase(authAdapter)
  const authPresenter = new AuthPresenter(authUseCase)
  
  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const loggedUser = await authPresenter.login(email, password)
      setUser(loggedUser)
      return loggedUser
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
      return null
    } finally {
      setLoading(false)
    }
  }

  const register = async (username: string, email: string, password: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const newUser = await authPresenter.register(username, email, password)
      setUser(newUser)
      return newUser
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar usuário')
      return null
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    setError(null)
    
    try {
      await authPresenter.logout()
      setUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer logout')
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    login,
    register,
    logout
  }
} 
import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { AuthContextData, AuthProviderProps } from '../protocols/AuthContextData.interface'

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, loading, error, login: authLogin, register: authRegister, logout: authLogout } = useAuth()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('ChatFlow:token')
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  useEffect(() => {
    if (user) {
      const authToken = user.token || null
      
      if (authToken) {
        localStorage.setItem('ChatFlow:token', authToken)
        setToken(authToken)
      }
    } else {
      localStorage.removeItem('ChatFlow:token')
      setToken(null)
    }
  }, [user])

  const login = async (email: string, password: string) => {
    const loggedUser = await authLogin(email, password)
    return loggedUser
  }

  const register = async (username: string, email: string, password: string) => {
    const newUser = await authRegister(username, email, password)
    return newUser
  }

  const logout = async () => {
    await authLogout()
    localStorage.removeItem('ChatFlow:token')
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => useContext(AuthContext) 
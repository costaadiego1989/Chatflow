import React, { useState, useEffect } from 'react'
import LoginForm from '../../components/auth/LoginForm'
import RegisterForm from '../../components/auth/RegisterForm'
import { useAuthContext } from '../../contexts/AuthContext'

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const { login, register, error, loading, isAuthenticated, user } = useAuthContext()

  useEffect(() => {
    if (isAuthenticated) {
      console.log('User authenticated:', user)
    }
  }, [isAuthenticated, user])

  const handleLogin = async (email: string, password: string) => {
    await login(email, password)
  }

  const handleRegister = async (username: string, email: string, password: string) => {
    await register(username, email, password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-center text-gray-900">ChatFlow</h1>
          <div className="flex justify-center mt-6">
            <div className="flex space-x-4 bg-white p-1 rounded-md shadow-sm">
              <button
                className={`px-4 py-2 rounded-md ${
                  isLogin ? 'bg-indigo-600 text-white' : 'text-gray-700'
                }`}
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  !isLogin ? 'bg-indigo-600 text-white' : 'text-gray-700'
                }`}
                onClick={() => setIsLogin(false)}
              >
                Cadastro
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {isAuthenticated ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            <p className="font-bold">Autenticado com sucesso!</p>
            <p>Bem-vindo, {user?.username}</p>
          </div>
        ) : (
          <>
            {isLogin ? (
              <LoginForm onSubmit={handleLogin} />
            ) : (
              <RegisterForm onSubmit={(user) => handleRegister(user.username, user.email, user.password || '')} />
            )}
          </>
        )}

        {loading && (
          <div className="text-center mt-4">
            <p className="text-gray-500">Carregando...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthPage 
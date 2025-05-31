import React from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import Header from '../../components/shared/Header'

const ChatPage: React.FC = () => {
  const { user, token } = useAuthContext()

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      <div className="container mx-auto p-4 flex-1">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Bem-vindo ao Chat!</h2>
          <p className="text-gray-600">Você está logado como <span className="font-semibold">{user?.username}</span></p>
          
          {/* Exibir o token para teste */}
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="text-lg font-semibold mb-2">Token de autenticação:</h3>
            <p className="text-xs break-all bg-gray-200 p-2 rounded">{token}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatPage 
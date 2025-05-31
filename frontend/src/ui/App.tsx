import React from 'react'
import AuthPage from './pages/auth/AuthPage'
import ChatPage from './pages/chat/ChatPage'
import { AuthProvider, useAuthContext } from './contexts/AuthContext'

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuthContext()

  return (
    <div className="min-h-screen bg-gray-100">
      {isAuthenticated ? <ChatPage /> : <AuthPage />}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App 
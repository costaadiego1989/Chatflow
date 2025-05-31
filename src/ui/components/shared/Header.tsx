import React from 'react'
import { useAuthContext } from '../../contexts/AuthContext'

const Header: React.FC = () => {
  const { user, logout } = useAuthContext()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="bg-indigo-600 text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center p-4">
        <div className="flex items-center space-x-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
            />
          </svg>
          <h1 className="text-xl font-bold">ChatFlow</h1>
        </div>
        
        {user && (
          <div className="flex items-center">
            <span className="mr-4">{user.username}</span>
            <button 
              onClick={handleLogout}
              className="bg-white text-indigo-600 rounded-full p-2 hover:bg-indigo-100 transition-colors"
              title="Sair"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header 
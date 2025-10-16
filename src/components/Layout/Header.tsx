
import React from 'react'
import { useRAGStore } from '../../store/ragStore'

interface HeaderProps {
  children?: React.ReactNode
  onMenuToggle?: () => void
  onSidebarToggle?: () => void
}

export const Header: React.FC<HeaderProps> = ({ 
  children, 
  onMenuToggle, 
  onSidebarToggle 
}) => {
  const { error, setError } = useRAGStore()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-label="Open mobile menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Sidebar toggle button */}
            <button
              onClick={onSidebarToggle}
              className="hidden lg:block p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-label="Toggle sidebar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </button>

            {/* Logo and title */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">RAG</span>
                </div>
              </div>
              <h1 className="ml-3 text-xl lg:text-2xl font-bold text-gray-900">
                Pipeline Educator
              </h1>
            </div>
          </div>

          {/* Desktop navigation and actions */}
          <div className="flex items-center space-x-4">
            {children}
            
            {/* Global actions */}
            <div className="hidden sm:flex items-center space-x-2">
              <GlobalActions />
            </div>
          </div>
        </div>
      </div>

      {/* Global error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-red-400 mr-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-red-800">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

// Global actions component
const GlobalActions: React.FC = () => {
  const { resetStore } = useRAGStore()

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all data? This will clear all chunks, embeddings, and results.')) {
      resetStore()
    }
  }

  return (
    <>
      <button
        onClick={handleReset}
        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
        title="Reset all data"
      >
        Reset
      </button>
      
      <div className="w-px h-4 bg-gray-300" />
      
      <button
        onClick={() => window.open('https://github.com/your-repo/rag-pipeline-educator', '_blank')}
        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
        title="View source code"
      >
        GitHub
      </button>
    </>
  )
}


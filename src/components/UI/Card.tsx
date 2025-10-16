

import React from 'react'
import { LoadingSpinner } from './LoadingSpinner'

interface CardProps {
  title?: string
  children: React.ReactNode
  className?: string
  loading?: boolean
  error?: string | null
  actions?: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  className = '', 
  loading = false,
  error = null,
  actions,
  collapsible = false,
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)

  const handleToggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed)
    }
  }

  return (
    <div className={`card ${className} ${loading ? 'opacity-75' : ''}`}>
      {/* Header */}
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {title && (
              <h3 
                className={`text-lg font-semibold text-gray-900 ${
                  collapsible ? 'cursor-pointer hover:text-gray-700' : ''
                }`}
                onClick={handleToggleCollapse}
              >
                {title}
              </h3>
            )}
            {collapsible && (
              <button
                onClick={handleToggleCollapse}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={isCollapsed ? 'Expand' : 'Collapse'}
              >
                <svg 
                  className={`w-4 h-4 transform transition-transform ${
                    isCollapsed ? 'rotate-0' : 'rotate-90'
                  }`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            {loading && (
              <LoadingSpinner size="sm" className="text-blue-600" />
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-banner mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Content */}
      {(!collapsible || !isCollapsed) && (
        <div className={`${loading ? 'pointer-events-none' : ''}`}>
          {children}
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-xl">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Card
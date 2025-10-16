import React, { useState } from 'react'
import { Header } from './Header'
import { Navigation } from './Navigation'
import { MobileNavigation } from './MobileNavigation'
import { Sidebar } from './Sidebar'
import { useRAGStore } from '../../store/ragStore'

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { currentModule } = useRAGStore()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header 
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {/* Desktop Navigation */}
        <div className="hidden lg:block">
          <Navigation />
        </div>
      </Header>

      {/* Mobile Navigation Overlay */}
      <MobileNavigation 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Module Status Bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 lg:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Current Module:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {currentModule}
                </span>
              </div>
              
              {/* Module Progress Indicator */}
              <ModuleProgressIndicator />
            </div>
          </div>

          {/* Content Area */}
          {children}
        </div>
      </div>
    </div>
  )
}

// Module progress indicator component
const ModuleProgressIndicator: React.FC = () => {
  const { currentModule, chunks, embeddings, searchResults, generationResults } = useRAGStore()

  const getModuleStatus = () => {
    switch (currentModule) {
      case 'chunking':
        return {
          completed: chunks.length > 0,
          label: chunks.length > 0 ? `${chunks.length} chunks` : 'No chunks'
        }
      case 'embedding':
        return {
          completed: embeddings.length > 0,
          label: embeddings.length > 0 ? `${embeddings.length} embeddings` : 'No embeddings'
        }
      case 'retrieval':
        return {
          completed: searchResults.length > 0,
          label: searchResults.length > 0 ? `${searchResults.length} results` : 'No results'
        }
      case 'generation':
        return {
          completed: generationResults.length > 0,
          label: generationResults.length > 0 ? `${generationResults.length} responses` : 'No responses'
        }
      default:
        return { completed: false, label: 'Ready' }
    }
  }

  const status = getModuleStatus()

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${
        status.completed ? 'bg-green-500' : 'bg-gray-300'
      }`} />
      <span className="text-xs text-gray-600">{status.label}</span>
    </div>
  )
}

export default MainLayout
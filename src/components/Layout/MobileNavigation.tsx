import React from 'react'
import { useRAGStore, ModuleType } from '../../store/ragStore'

interface MobileNavigationProps {
  isOpen: boolean
  onClose: () => void
}

const modules: { id: ModuleType; label: string; description: string; icon: string }[] = [
  {
    id: 'chunking',
    label: 'Chunking',
    description: 'Text segmentation strategies',
    icon: '📝'
  },
  {
    id: 'embedding',
    label: 'Embedding',
    description: 'Vector representations',
    icon: '🔢'
  },
  {
    id: 'retrieval',
    label: 'Retrieval',
    description: 'Search and matching',
    icon: '🔍'
  },
  {
    id: 'generation',
    label: 'Generation',
    description: 'Response generation',
    icon: '🤖'
  },
]

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose }) => {
  const { currentModule, setCurrentModule, chunks, embeddings, searchResults, generationResults } = useRAGStore()

  const handleModuleSelect = (moduleId: ModuleType) => {
    setCurrentModule(moduleId)
    onClose()
  }

  const getModuleStatus = (moduleId: ModuleType) => {
    switch (moduleId) {
      case 'chunking':
        return chunks.length > 0
      case 'embedding':
        return embeddings.length > 0
      case 'retrieval':
        return searchResults.length > 0
      case 'generation':
        return generationResults.length > 0
      default:
        return false
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Mobile menu */}
      <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 lg:hidden transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Module Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {modules.map((module) => {
                const isActive = currentModule === module.id
                const hasData = getModuleStatus(module.id)
                
                return (
                  <button
                    key={module.id}
                    onClick={() => handleModuleSelect(module.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{module.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">{module.label}</h3>
                          {hasData && (
                            <div className="w-2 h-2 bg-green-500 rounded-full ml-2" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Pipeline Flow Indicator */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Pipeline Flow</h3>
              <div className="space-y-2">
                {modules.map((module, index) => {
                  const hasData = getModuleStatus(module.id)
                  const isActive = currentModule === module.id
                  
                  return (
                    <div key={module.id} className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        hasData 
                          ? 'bg-green-500 text-white' 
                          : isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <span className={`text-sm ${
                        isActive ? 'text-blue-600 font-medium' : 'text-gray-600'
                      }`}>
                        {module.label}
                      </span>
                      {hasData && (
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                RAG Pipeline Educator
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Interactive learning tool
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MobileNavigation
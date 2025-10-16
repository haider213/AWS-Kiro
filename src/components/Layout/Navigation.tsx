
import React from 'react'
import { useRAGStore, ModuleType } from '../../store/ragStore'

const modules: { 
  id: ModuleType; 
  label: string; 
  description: string; 
  icon: string;
  shortLabel: string;
}[] = [
  {
    id: 'chunking',
    label: 'Chunking',
    shortLabel: 'Chunk',
    description: 'Text segmentation strategies',
    icon: '📝'
  },
  {
    id: 'embedding',
    label: 'Embedding',
    shortLabel: 'Embed',
    description: 'Vector representations',
    icon: '🔢'
  },
  {
    id: 'retrieval',
    label: 'Retrieval',
    shortLabel: 'Search',
    description: 'Search and matching',
    icon: '🔍'
  },
  {
    id: 'generation',
    label: 'Generation',
    shortLabel: 'Generate',
    description: 'Response generation',
    icon: '🤖'
  },
]

export const Navigation: React.FC = () => {
  const { 
    currentModule, 
    setCurrentModule, 
    chunks, 
    embeddings, 
    searchResults, 
    generationResults 
  } = useRAGStore()

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

  const getModuleCount = (moduleId: ModuleType) => {
    switch (moduleId) {
      case 'chunking':
        return chunks.length
      case 'embedding':
        return embeddings.length
      case 'retrieval':
        return searchResults.length
      case 'generation':
        return generationResults.length
      default:
        return 0
    }
  }

  return (
    <nav id="navigation" data-tour="navigation" className="flex space-x-1">
      {modules.map((module, index) => {
        const isActive = currentModule === module.id
        const hasData = getModuleStatus(module.id)
        const count = getModuleCount(module.id)
        const isAccessible = index === 0 || getModuleStatus(modules[index - 1].id)

        return (
          <button
            key={module.id}
            onClick={() => setCurrentModule(module.id)}
            disabled={!isAccessible}
            className={`
              relative px-3 lg:px-4 py-2 rounded-lg font-medium transition-all duration-200 
              flex items-center space-x-2 group
              ${isActive
                ? 'bg-blue-600 text-white shadow-md'
                : isAccessible
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed opacity-50'
              }
            `}
            title={`${module.description}${!isAccessible ? ' (Complete previous steps first)' : ''}`}
          >
            {/* Module icon */}
            <span className="text-sm lg:text-base">{module.icon}</span>
            
            {/* Module label - responsive */}
            <span className="hidden sm:inline lg:hidden">{module.shortLabel}</span>
            <span className="hidden lg:inline">{module.label}</span>
            
            {/* Status indicator */}
            {hasData && (
              <div className="flex items-center space-x-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? 'bg-white' : 'bg-green-500'
                }`} />
                {count > 0 && (
                  <span className={`text-xs font-medium ${
                    isActive ? 'text-white' : 'text-green-600'
                  }`}>
                    {count}
                  </span>
                )}
              </div>
            )}

            {/* Pipeline flow indicator */}
            {index < modules.length - 1 && (
              <div className={`
                absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-0.5 
                ${hasData ? 'bg-green-400' : 'bg-gray-300'}
                hidden lg:block
              `} />
            )}

            {/* Tooltip for disabled modules */}
            {!isAccessible && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Complete {modules[index - 1].label} first
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800" />
              </div>
            )}
          </button>
        )
      })}
    </nav>
  )
}


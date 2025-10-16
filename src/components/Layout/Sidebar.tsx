import React from 'react'
import { useRAGStore } from '../../store/ragStore'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { 
    currentModule, 
    chunks, 
    embeddings, 
    searchResults, 
    generationResults,
    chunkingParameters,
    searchParameters,
    generationParameters
  } = useRAGStore()

  const getModuleInfo = () => {
    switch (currentModule) {
      case 'chunking':
        return {
          title: 'Chunking Information',
          stats: [
            { label: 'Total Chunks', value: chunks.length },
            { label: 'Strategy', value: chunkingParameters.strategy },
            { label: 'Chunk Size', value: chunkingParameters.chunkSize || 'N/A' },
            { label: 'Overlap', value: chunkingParameters.overlap || 'N/A' }
          ],
          tips: [
            'Smaller chunks provide more precise retrieval but may lose context',
            'Overlap helps maintain continuity between chunks',
            'Semantic chunking adapts to content structure'
          ]
        }
      case 'embedding':
        return {
          title: 'Embedding Information',
          stats: [
            { label: 'Embeddings', value: embeddings.length },
            { label: 'Dimensions', value: embeddings[0]?.dimensions || 'N/A' },
            { label: 'Model', value: embeddings[0]?.model || 'N/A' }
          ],
          tips: [
            'Higher dimensional embeddings capture more nuanced relationships',
            'Similar chunks cluster together in vector space',
            'Embedding quality affects retrieval accuracy'
          ]
        }
      case 'retrieval':
        return {
          title: 'Retrieval Information',
          stats: [
            { label: 'Search Results', value: searchResults.length },
            { label: 'Search Mode', value: searchParameters.mode },
            { label: 'Result Limit', value: searchParameters.resultLimit },
            { label: 'Threshold', value: searchParameters.similarityThreshold }
          ],
          tips: [
            'Semantic search uses vector similarity',
            'Keyword search uses text matching',
            'Hybrid search combines both approaches'
          ]
        }
      case 'generation':
        return {
          title: 'Generation Information',
          stats: [
            { label: 'Responses', value: generationResults.length },
            { label: 'Max Context', value: generationParameters.maxContextLength },
            { label: 'Temperature', value: generationParameters.temperature },
            { label: 'Strategy', value: generationParameters.contextSelectionStrategy }
          ],
          tips: [
            'Higher temperature increases response creativity',
            'Context selection affects response relevance',
            'Token limits may truncate context'
          ]
        }
      default:
        return {
          title: 'Welcome',
          stats: [],
          tips: [
            'Start with the Chunking module to segment text',
            'Progress through each module sequentially',
            'Experiment with different parameters'
          ]
        }
    }
  }

  const moduleInfo = getModuleInfo()

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 right-0 w-80 bg-white shadow-xl lg:shadow-none border-l border-gray-200 z-40
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        ${isOpen ? 'lg:block' : 'lg:hidden'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{moduleInfo.title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Statistics */}
            {moduleInfo.stats.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Current Status</h3>
                <div className="space-y-2">
                  {moduleInfo.stats.map((stat, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{stat.label}</span>
                      <span className="text-sm font-medium text-gray-900">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Tips & Insights</h3>
              <div className="space-y-3">
                {moduleInfo.tips.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-600">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Progress */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Pipeline Progress</h3>
              <div className="space-y-2">
                {[
                  { name: 'Chunking', completed: chunks.length > 0 },
                  { name: 'Embedding', completed: embeddings.length > 0 },
                  { name: 'Retrieval', completed: searchResults.length > 0 },
                  { name: 'Generation', completed: generationResults.length > 0 }
                ].map((step, index) => (
                  <div key={step.name} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      step.completed 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step.completed ? '✓' : index + 1}
                    </div>
                    <span className={`text-sm ${
                      step.completed ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <QuickActionButton
                  icon="📋"
                  label="Copy Sample Text"
                  onClick={() => {
                    const { sampleText } = useRAGStore.getState()
                    navigator.clipboard.writeText(sampleText)
                  }}
                />
                <QuickActionButton
                  icon="🔄"
                  label="Reset Module"
                  onClick={() => {
                    // Reset current module data
                    const { setChunks, setEmbeddings, setSearchResults, setGenerationResults } = useRAGStore.getState()
                    switch (currentModule) {
                      case 'chunking':
                        setChunks([])
                        break
                      case 'embedding':
                        setEmbeddings([])
                        break
                      case 'retrieval':
                        setSearchResults([])
                        break
                      case 'generation':
                        setGenerationResults([])
                        break
                    }
                  }}
                />
                <QuickActionButton
                  icon="💾"
                  label="Export Data"
                  onClick={() => {
                    const state = useRAGStore.getState()
                    const data = {
                      chunks: state.chunks,
                      embeddings: state.embeddings,
                      searchResults: state.searchResults,
                      generationResults: state.generationResults,
                      parameters: {
                        chunking: state.chunkingParameters,
                        search: state.searchParameters,
                        generation: state.generationParameters
                      }
                    }
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'rag-pipeline-data.json'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Quick action button component
interface QuickActionButtonProps {
  icon: string
  label: string
  onClick: () => void
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center space-x-3 p-2 text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
  >
    <span className="text-base">{icon}</span>
    <span>{label}</span>
  </button>
)

export default Sidebar
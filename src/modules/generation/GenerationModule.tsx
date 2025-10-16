
import React, { useEffect } from 'react'
import { Card } from '../../components/UI/Card'
import { LoadingSpinner } from '../../components/UI/LoadingSpinner'
import { useRAGStore } from '../../store/ragStore'
import { useGenerationStore } from '../../store/generationStore'
import GenerationControls from './components/GenerationControls'
import PromptVisualization from './components/PromptVisualization'
import GenerationResults from './components/GenerationResults'
import ModelComparison from './components/ModelComparison'

export const GenerationModule: React.FC = () => {
  const { searchResults, isLoading: ragLoading } = useRAGStore()
  const { 
    generationError,
    clearGeneration 
  } = useGenerationStore()

  // Clear generation when leaving module
  useEffect(() => {
    return () => {
      clearGeneration()
    }
  }, [clearGeneration])

  if (ragLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading RAG system...</p>
        </div>
      </div>
    )
  }

  const hasSearchResults = searchResults.length > 0

  return (
    <div className="space-y-6" data-tour="generation-module">
      {/* Module Header */}
      <Card title="Response Generation">
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Experiment with prompt construction and response generation using retrieved context. 
            This module demonstrates how context integration affects AI response quality and shows 
            the complete RAG pipeline in action.
          </p>
          
          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{searchResults.length}</div>
              <div className="text-sm text-gray-600">Available Context</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {hasSearchResults ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600">Ready to Generate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-sm text-gray-600">Available Models</div>
            </div>
          </div>
        </div>

        {!hasSearchResults && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-yellow-500 mr-2">⚠️</div>
              <div>
                <h4 className="text-yellow-800 font-medium">No Search Results Available</h4>
                <p className="text-yellow-600 text-sm mt-1">
                  To generate responses, you need to first search for relevant content in the Retrieval module.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Generation Controls */}
        <div data-tour="generation-parameters">
          <GenerationControls />
        </div>
      </Card>

      {/* Error Display */}
      {generationError && (
        <Card title="Generation Error">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-500 mr-2">⚠️</div>
              <div>
                <h4 className="text-red-800 font-medium">Generation Error</h4>
                <p className="text-red-600 text-sm mt-1">{generationError}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Prompt Visualization */}
      <Card title="Prompt Construction" data-tour="prompt-construction">
        <PromptVisualization />
      </Card>

      {/* Generation Results */}
      <Card title="Generated Response" data-tour="generate-response">
        <GenerationResults />
      </Card>

      {/* Model Comparison */}
      <Card title="Model Comparison">
        <ModelComparison />
      </Card>

      {/* Educational Information */}
      <Card title="Understanding Response Generation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
            <h4 className="font-semibold text-blue-800 mb-2">🔧 Prompt Construction</h4>
            <p className="text-sm text-blue-700 mb-2">
              The process of combining retrieved context with user queries to create effective prompts 
              for language models. Key considerations include token limits and context relevance.
            </p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• Context selection strategies</li>
              <li>• Token budget management</li>
              <li>• Template structure optimization</li>
              <li>• Relevance-based truncation</li>
            </ul>
          </div>

          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <h4 className="font-semibold text-green-800 mb-2">🎯 Context Integration</h4>
            <p className="text-sm text-green-700 mb-2">
              How retrieved information is incorporated into prompts affects response quality. 
              Different strategies balance comprehensiveness with focus.
            </p>
            <ul className="text-xs text-green-600 space-y-1">
              <li>• Top-K selection (best matches)</li>
              <li>• Threshold-based filtering</li>
              <li>• Diverse content sampling</li>
              <li>• Hierarchical context organization</li>
            </ul>
          </div>

          <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
            <h4 className="font-semibold text-purple-800 mb-2">🤖 Model Comparison</h4>
            <p className="text-sm text-purple-700 mb-2">
              Different language models have varying strengths in processing context and generating 
              responses. Comparing outputs helps understand model characteristics.
            </p>
            <ul className="text-xs text-purple-600 space-y-1">
              <li>• Response style differences</li>
              <li>• Context utilization patterns</li>
              <li>• Confidence and accuracy metrics</li>
              <li>• Speed vs quality trade-offs</li>
            </ul>
          </div>

          <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
            <h4 className="font-semibold text-orange-800 mb-2">📊 Quality Assessment</h4>
            <p className="text-sm text-orange-700 mb-2">
              Evaluating response quality involves multiple factors including relevance, 
              accuracy, completeness, and coherence with the provided context.
            </p>
            <ul className="text-xs text-orange-600 space-y-1">
              <li>• Context relevance scoring</li>
              <li>• Response completeness metrics</li>
              <li>• Factual accuracy validation</li>
              <li>• Coherence and fluency assessment</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default GenerationModule
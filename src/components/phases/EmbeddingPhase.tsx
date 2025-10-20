import React, { useState } from 'react'
import EmbeddingVisualization from '../visualizations/EmbeddingVisualization'

interface DocumentChunk {
  id: string
  content: string
  word_count: number
  char_count: number
  strategy: string
}

interface EmbeddingData {
  embeddings: number[][]
  tsne_coordinates: number[][]
  feature_names: string[]
  method: string
  model_id: string
  dimensions: number
}

interface EmbeddingPhaseProps {
  processedChunks: DocumentChunk[]
  embeddingData: EmbeddingData | null
  embeddingMethod: string
  onEmbeddingMethodChange: (method: string) => void
  embeddingModel: string
  onEmbeddingModelChange: (model: string) => void
  isProcessing: boolean
}

const EmbeddingPhase: React.FC<EmbeddingPhaseProps> = ({
  processedChunks,
  embeddingData,
  embeddingMethod,
  onEmbeddingMethodChange,
  embeddingModel,
  onEmbeddingModelChange
}) => {
  const [selectedChunk, setSelectedChunk] = useState<DocumentChunk | null>(null)

  const embeddingMethods = [
    {
      id: 'bedrock',
      name: 'Amazon Bedrock',
      description: 'Advanced neural embeddings from AWS',
      icon: '🚀',
      pros: ['Rich semantics', 'Dense vectors', 'State-of-the-art'],
      cons: ['Requires AWS', 'API costs', 'Network dependency']
    }
  ]

  const bedrockModels = [
    {
      id: 'amazon.titan-embed-text-v1',
      name: 'Titan Text v1',
      dimensions: 1536,
      description: 'High-quality embeddings for semantic search'
    },
    {
      id: 'amazon.titan-embed-text-v2:0',
      name: 'Titan Text v2',
      dimensions: 1024,
      description: 'Improved performance and multilingual support'
    }
  ]

  if (processedChunks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold">Phase 2: Vector Embeddings</h2>
        </div>
        <div className="p-6 text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Chunks Available</h3>
          <p className="text-gray-600">Please process a document in Phase 1 first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-xl">
        <h2 className="text-2xl font-bold">Phase 2: Vector Embeddings</h2>
        <p className="text-green-100">Convert text chunks into numerical representations</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Method Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {embeddingMethods.map((method) => (
            <div
              key={method.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                embeddingMethod === method.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onEmbeddingMethodChange(method.id)}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="text-2xl">{method.icon}</div>
                <h4 className="font-semibold text-gray-900">{method.name}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">{method.description}</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-medium text-green-700">Pros:</span>
                  <ul className="text-green-600 ml-2">
                    {method.pros.map((pro, index) => (
                      <li key={index}>• {pro}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-medium text-red-700">Cons:</span>
                  <ul className="text-red-600 ml-2">
                    {method.cons.map((con, index) => (
                      <li key={index}>• {con}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bedrock Models */}
        {embeddingMethod === 'bedrock' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bedrockModels.map((model) => (
              <div
                key={model.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  embeddingModel === model.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onEmbeddingModelChange(model.id)}
              >
                <h5 className="font-medium text-gray-900">{model.name}</h5>
                <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                <div className="text-xs text-gray-500">
                  {model.dimensions} dimensions
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Visualization */}
        {embeddingData && (
          <EmbeddingVisualization
            chunks={processedChunks}
            embeddings={embeddingData}
            onChunkSelect={setSelectedChunk}
            selectedChunk={selectedChunk}
          />
        )}
      </div>
    </div>
  )
}

export default EmbeddingPhase
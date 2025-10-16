import React from 'react'
import { useEmbeddingStore } from '../../../store/embeddingStore'

const EMBEDDING_MODELS = [
  {
    id: 'amazon.titan-embed-text-v1',
    name: 'Amazon Titan Embed Text v1',
    dimensions: 1536,
    description: 'General-purpose text embedding model'
  },
  {
    id: 'cohere.embed-english-v3',
    name: 'Cohere Embed English v3',
    dimensions: 1024,
    description: 'Optimized for English text'
  },
  {
    id: 'cohere.embed-multilingual-v3',
    name: 'Cohere Embed Multilingual v3',
    dimensions: 1024,
    description: 'Supports multiple languages'
  }
]

const COLOR_SCHEMES = [
  { id: 'similarity', name: 'Similarity', description: 'Color by distance from center' },
  { id: 'cluster', name: 'Cluster', description: 'Categorical colors' },
  { id: 'chunk-size', name: 'Chunk Size', description: 'Color by text length' }
]

export const EmbeddingControls: React.FC = () => {
  const {
    settings,
    selectedModel,
    updateSettings,
    setSelectedModel,
    isGeneratingEmbeddings,
    isReducingDimensions
  } = useEmbeddingStore()

  return (
    <div className="space-y-6">
      {/* Generate Embeddings Button */}
      <div>
        <button
          data-tour="generate-embeddings"
          disabled={isGeneratingEmbeddings}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isGeneratingEmbeddings ? 'Generating...' : 'Generate Embeddings'}
        </button>
        <p className="mt-1 text-xs text-gray-500">
          Create vector representations of text chunks
        </p>
      </div>

      {/* Model Selection */}
      <div data-tooltip="embedding-model">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Embedding Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={isGeneratingEmbeddings}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          {EMBEDDING_MODELS.map(model => (
            <option key={model.id} value={model.id}>
              {model.name} ({model.dimensions}d)
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {EMBEDDING_MODELS.find(m => m.id === selectedModel)?.description}
        </p>
      </div>

      {/* Visualization Settings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Visualization Dimensions
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="dimensions"
              value="2"
              checked={settings.dimensions === 2}
              onChange={() => updateSettings({ dimensions: 2 })}
              disabled={isReducingDimensions}
              className="mr-2"
            />
            2D
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="dimensions"
              value="3"
              checked={settings.dimensions === 3}
              onChange={() => updateSettings({ dimensions: 3 })}
              disabled={isReducingDimensions}
              className="mr-2"
            />
            3D
          </label>
        </div>
      </div>

      {/* Similarity Threshold */}
      <div data-tooltip="similarity-threshold">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Similarity Threshold: {settings.similarityThreshold.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={settings.similarityThreshold}
          onChange={(e) => updateSettings({ similarityThreshold: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0.0 (Show all)</span>
          <span>1.0 (Only identical)</span>
        </div>
      </div>

      {/* Show Connections Toggle */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.showConnections}
            onChange={(e) => updateSettings({ showConnections: e.target.checked })}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm font-medium text-gray-700">Show Similarity Connections</span>
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Display lines between similar chunks
        </p>
      </div>

      {/* Color Scheme */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color Scheme
        </label>
        <select
          value={settings.colorScheme}
          onChange={(e) => updateSettings({ colorScheme: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {COLOR_SCHEMES.map(scheme => (
            <option key={scheme.id} value={scheme.id}>
              {scheme.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {COLOR_SCHEMES.find(s => s.id === settings.colorScheme)?.description}
        </p>
      </div>

      {/* Point Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Point Size: {settings.pointSize}px
        </label>
        <input
          type="range"
          min="4"
          max="16"
          step="1"
          value={settings.pointSize}
          onChange={(e) => updateSettings({ pointSize: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Advanced t-SNE Parameters */}
      <details className="border border-gray-200 rounded-lg p-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
          Advanced t-SNE Parameters
        </summary>
        
        <div className="space-y-4 mt-4">
          {/* Perplexity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Perplexity: {settings.perplexity}
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={settings.perplexity}
              onChange={(e) => updateSettings({ perplexity: parseInt(e.target.value) })}
              disabled={isReducingDimensions}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <p className="mt-1 text-xs text-gray-500">
              Controls local vs global structure balance
            </p>
          </div>

          {/* Learning Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learning Rate: {settings.learningRate}
            </label>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={settings.learningRate}
              onChange={(e) => updateSettings({ learningRate: parseInt(e.target.value) })}
              disabled={isReducingDimensions}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <p className="mt-1 text-xs text-gray-500">
              Controls optimization speed
            </p>
          </div>

          {/* Max Iterations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Iterations: {settings.maxIterations}
            </label>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={settings.maxIterations}
              onChange={(e) => updateSettings({ maxIterations: parseInt(e.target.value) })}
              disabled={isReducingDimensions}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <p className="mt-1 text-xs text-gray-500">
              More iterations = better quality, slower computation
            </p>
          </div>
        </div>
      </details>

      {/* Status Indicators */}
      {(isGeneratingEmbeddings || isReducingDimensions) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-800">
              {isGeneratingEmbeddings && 'Generating embeddings...'}
              {isReducingDimensions && 'Reducing dimensions...'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmbeddingControls
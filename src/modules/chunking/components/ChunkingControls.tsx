import React from 'react'
import { ChunkingParameters, ChunkingStrategy } from '../../../types'
import { Card } from '../../../components/UI/Card'

interface ChunkingControlsProps {
  parameters: ChunkingParameters
  onParameterChange: (params: Partial<ChunkingParameters>) => void
  onStrategyChange: (strategy: ChunkingStrategy) => void
}

const ChunkingControls: React.FC<ChunkingControlsProps> = ({
  parameters,
  onParameterChange,
  onStrategyChange
}) => {
  const strategies: { value: ChunkingStrategy; label: string; description: string }[] = [
    {
      value: 'fixed-size',
      label: 'Fixed Size',
      description: 'Split text into chunks of fixed word count with optional overlap'
    },
    {
      value: 'sentence',
      label: 'Sentence-based',
      description: 'Split text at sentence boundaries for natural language flow'
    },
    {
      value: 'paragraph',
      label: 'Paragraph-based',
      description: 'Split text at paragraph boundaries to preserve topic coherence'
    },
    {
      value: 'semantic',
      label: 'Semantic',
      description: 'Split text based on semantic similarity between sentences'
    }
  ]

  return (
    <Card title="Chunking Parameters" className="bg-white">
      <div className="space-y-6">
        {/* Strategy Selection */}
        <div data-tour="chunking-strategy">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Chunking Strategy
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {strategies.map((strategy) => (
              <div
                key={strategy.value}
                className={`relative cursor-pointer rounded-lg border p-4 transition-all ${
                  parameters.strategy === strategy.value
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => onStrategyChange(strategy.value)}
              >
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      type="radio"
                      name="strategy"
                      value={strategy.value}
                      checked={parameters.strategy === strategy.value}
                      onChange={() => onStrategyChange(strategy.value)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label className="font-medium text-gray-900 cursor-pointer">
                      {strategy.label}
                    </label>
                    <p className="text-gray-500 text-xs mt-1">
                      {strategy.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy-specific Parameters */}
        {parameters.strategy === 'fixed-size' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700">Fixed Size Parameters</h4>
            
            {/* Chunk Size */}
            <div data-tooltip="chunk-size">
              <label className="block text-sm text-gray-600 mb-2">
                Chunk Size (words): {parameters.chunkSize}
              </label>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={parameters.chunkSize || 200}
                onChange={(e) => onParameterChange({ chunkSize: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                data-tour="chunk-size"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50</span>
                <span>1000</span>
              </div>
            </div>

            {/* Overlap */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Overlap (words): {parameters.overlap}
              </label>
              <input
                type="range"
                min="0"
                max={Math.min(200, (parameters.chunkSize || 200) / 2)}
                step="10"
                value={parameters.overlap || 0}
                onChange={(e) => onParameterChange({ overlap: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>{Math.min(200, (parameters.chunkSize || 200) / 2)}</span>
              </div>
            </div>
          </div>
        )}

        {parameters.strategy === 'semantic' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700">Semantic Parameters</h4>
            
            {/* Similarity Threshold */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Similarity Threshold: {parameters.similarityThreshold?.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={parameters.similarityThreshold || 0.7}
                onChange={(e) => onParameterChange({ similarityThreshold: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.1 (More chunks)</span>
                <span>0.9 (Fewer chunks)</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Higher values create fewer, more semantically coherent chunks
              </p>
            </div>
          </div>
        )}

        {(parameters.strategy === 'sentence' || parameters.strategy === 'paragraph') && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {parameters.strategy === 'sentence' ? 'Sentence-based' : 'Paragraph-based'} Chunking
            </h4>
            <p className="text-sm text-gray-600">
              {parameters.strategy === 'sentence' 
                ? 'Text is automatically split at sentence boundaries. No additional parameters needed.'
                : 'Text is automatically split at paragraph boundaries. No additional parameters needed.'
              }
            </p>
          </div>
        )}

        {/* Quick Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quick Presets
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onParameterChange({ 
                strategy: 'fixed-size', 
                chunkSize: 100, 
                overlap: 20 
              })}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              Small Chunks
            </button>
            <button
              onClick={() => onParameterChange({ 
                strategy: 'fixed-size', 
                chunkSize: 300, 
                overlap: 50 
              })}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
            >
              Medium Chunks
            </button>
            <button
              onClick={() => onParameterChange({ 
                strategy: 'fixed-size', 
                chunkSize: 500, 
                overlap: 100 
              })}
              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
            >
              Large Chunks
            </button>
            <button
              onClick={() => onParameterChange({ 
                strategy: 'semantic', 
                similarityThreshold: 0.8 
              })}
              className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors"
            >
              High Coherence
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ChunkingControls
import React, { useState } from 'react'
import GenerationVisualization from '../visualizations/GenerationVisualization'

interface DocumentChunk {
  id: string
  content: string
  word_count: number
  char_count: number
  strategy: string
  similarity_score?: number
  rank?: number
}

interface GenerationPhaseProps {
  retrievedChunks: DocumentChunk[]
  query: string
  generationModel: string
  onGenerationModelChange: (model: string) => void
  generatedResponse: string
  onGenerateResponse: () => void
  isProcessing: boolean
}

const GenerationPhase: React.FC<GenerationPhaseProps> = ({
  retrievedChunks,
  query,
  generationModel,
  onGenerationModelChange,
  generatedResponse,
  onGenerateResponse,
  isProcessing
}) => {
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant. Use the provided context to answer questions accurately and concisely.')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1000)

  const bedrockModels = [
    {
      id: 'anthropic.claude-3-haiku-20240307-v1:0',
      name: 'Claude 3 Haiku',
      provider: 'Anthropic',
      description: 'Fast and efficient model',
      icon: '⚡'
    },
    {
      id: 'anthropic.claude-3-sonnet-20240229-v1:0',
      name: 'Claude 3 Sonnet',
      provider: 'Anthropic',
      description: 'Balanced performance',
      icon: '🎯'
    },
    {
      id: 'amazon.titan-text-premier-v1:0',
      name: 'Titan Text Premier',
      provider: 'Amazon',
      description: 'High-performance text generation',
      icon: '🚀'
    }
  ]

  if (retrievedChunks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold">Phase 4: Response Generation</h2>
        </div>
        <div className="p-6 text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Context Available</h3>
          <p className="text-gray-600">Please retrieve relevant chunks in Phase 3 first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-xl">
        <h2 className="text-2xl font-bold">Phase 4: Response Generation</h2>
        <p className="text-orange-100">Generate AI responses using retrieved context</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Model Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bedrockModels.map((model) => (
            <div
              key={model.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                generationModel === model.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onGenerationModelChange(model.id)}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="text-2xl">{model.icon}</div>
                <div>
                  <h4 className="font-semibold text-gray-900">{model.name}</h4>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {model.provider}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">{model.description}</p>
            </div>
          ))}
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            System Prompt
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            placeholder="Enter your system prompt..."
          />
        </div>

        {/* Generation Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature: {temperature.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Focused</span>
              <span>Creative</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Tokens: {maxTokens}
            </label>
            <input
              type="range"
              min="100"
              max="4000"
              step="100"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>100</span>
              <span>4000</span>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={onGenerateResponse}
          disabled={isProcessing}
          className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {isProcessing ? '⏳ Generating Response...' : '🤖 Generate AI Response'}
        </button>

        {/* Generated Response */}
        {generatedResponse && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg border border-orange-200">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  AI
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {generatedResponse}
                  </p>
                </div>
              </div>
            </div>

            {/* Response Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Response Quality</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Length:</span>
                    <span className="text-gray-900">{generatedResponse.split(' ').length} words</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model:</span>
                    <span className="text-gray-900">{generationModel.split('.')[1]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Temperature:</span>
                    <span className="text-gray-900">{temperature}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Context Usage</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sources Used:</span>
                    <span className="text-gray-900">{retrievedChunks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Similarity:</span>
                    <span className="text-gray-900">
                      {(retrievedChunks.reduce((sum, chunk) => sum + chunk.similarity_score!, 0) / retrievedChunks.length * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Generation Settings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Tokens:</span>
                    <span className="text-gray-900">{maxTokens}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span className="text-gray-900">
                      {bedrockModels.find(m => m.id === generationModel)?.provider}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visualization */}
            <GenerationVisualization
              systemPrompt={systemPrompt}
              retrievedChunks={retrievedChunks}
              query={query}
              generatedResponse={generatedResponse}
              modelConfig={{
                model: generationModel,
                temperature,
                maxTokens,
                topP: 0.9
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default GenerationPhase
import React from 'react'
import { useGenerationStore } from '../../../store/generationStore'

export const GenerationResults: React.FC = () => {
  const { generationResult } = useGenerationStore()

  if (!generationResult) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Response Generated Yet
        </h3>
        <p className="text-gray-600">
          Construct a prompt and generate a response to see the results here.
        </p>
      </div>
    )
  }

  const {
    response,
    contextUsed,
    confidence,
    parameters,
    model,
    promptTokens,
    responseTokens
  } = generationResult

  return (
    <div className="space-y-6">
      {/* Response Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Generated Response</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Model: {model.includes('claude-3-haiku') ? 'Claude 3 Haiku' : 
                           model.includes('claude-3-sonnet') ? 'Claude 3 Sonnet' : 
                           'Amazon Titan'}</span>
          <span>Confidence: {Math.round(confidence * 100)}%</span>
        </div>
      </div>

      {/* Generated Response */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="prose max-w-none">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {response}
          </p>
        </div>
      </div>

      {/* Response Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{promptTokens}</div>
          <div className="text-sm text-gray-600">Prompt Tokens</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{responseTokens}</div>
          <div className="text-sm text-gray-600">Response Tokens</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{contextUsed.length}</div>
          <div className="text-sm text-gray-600">Context Chunks</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{Math.round(confidence * 100)}%</div>
          <div className="text-sm text-gray-600">Confidence</div>
        </div>
      </div>

      {/* Context Used */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">
          Context Used in Generation
        </h4>
        <div className="space-y-3">
          {contextUsed.map((chunk, index) => (
            <div key={chunk.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Context Chunk {index + 1}
                </span>
                <span className="text-xs text-gray-500">
                  {chunk.content.length} characters
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3">
                {chunk.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Generation Parameters Used */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Generation Parameters</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Temperature:</span>
              <span className="ml-2 text-gray-600">{parameters.temperature}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Max Tokens:</span>
              <span className="ml-2 text-gray-600">{parameters.maxTokens}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Context Strategy:</span>
              <span className="ml-2 text-gray-600 capitalize">{parameters.contextSelectionStrategy}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Max Context Length:</span>
              <span className="ml-2 text-gray-600">{parameters.maxContextLength}</span>
            </div>
            {parameters.topP && (
              <div>
                <span className="font-medium text-gray-700">Top P:</span>
                <span className="ml-2 text-gray-600">{parameters.topP}</span>
              </div>
            )}
            {parameters.topK && (
              <div>
                <span className="font-medium text-gray-700">Top K:</span>
                <span className="ml-2 text-gray-600">{parameters.topK}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Response Quality Indicators */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Response Quality Indicators</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="font-medium text-green-800">Relevance</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {Math.round(confidence * 100)}%
            </div>
            <p className="text-xs text-green-700">
              Based on context alignment and model confidence
            </p>
          </div>

          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="font-medium text-blue-800">Context Usage</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {Math.round((contextUsed.length / Math.max(contextUsed.length, 5)) * 100)}%
            </div>
            <p className="text-xs text-blue-700">
              Percentage of available context utilized
            </p>
          </div>

          <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span className="font-medium text-purple-800">Efficiency</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {Math.round((responseTokens / (promptTokens + responseTokens)) * 100)}%
            </div>
            <p className="text-xs text-purple-700">
              Response tokens vs total tokens used
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GenerationResults
import React from 'react'
import { useGenerationStore } from '../../../store/generationStore'

export const ModelComparison: React.FC = () => {
  const { modelComparisons, showModelComparison } = useGenerationStore()

  if (!showModelComparison || modelComparisons.length === 0) {
    return null
  }

  const getModelDisplayName = (modelId: string): string => {
    if (modelId.includes('claude-3-haiku')) return 'Claude 3 Haiku'
    if (modelId.includes('claude-3-sonnet')) return 'Claude 3 Sonnet'
    if (modelId.includes('titan-text-premier')) return 'Amazon Titan Text Premier'
    return modelId
  }

  const getModelColorClasses = (modelId: string) => {
    if (modelId.includes('claude-3-haiku')) {
      return {
        border: 'border-blue-200',
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        textSecondary: 'text-blue-700',
        bgSecondary: 'bg-blue-100'
      }
    }
    if (modelId.includes('claude-3-sonnet')) {
      return {
        border: 'border-green-200',
        bg: 'bg-green-50',
        text: 'text-green-800',
        textSecondary: 'text-green-700',
        bgSecondary: 'bg-green-100'
      }
    }
    if (modelId.includes('titan-text-premier')) {
      return {
        border: 'border-purple-200',
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        textSecondary: 'text-purple-700',
        bgSecondary: 'bg-purple-100'
      }
    }
    return {
      border: 'border-gray-200',
      bg: 'bg-gray-50',
      text: 'text-gray-800',
      textSecondary: 'text-gray-700',
      bgSecondary: 'bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Model Comparison</h3>
        <span className="text-sm text-gray-600">
          {modelComparisons.length} models compared
        </span>
      </div>

      {/* Comparison Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modelComparisons.map((comparison, index) => {
          const colors = getModelColorClasses(comparison.model)
          const displayName = getModelDisplayName(comparison.model)
          
          return (
            <div key={comparison.model} className={`${colors.border} ${colors.bg} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-medium ${colors.text}`}>{displayName}</h4>
                <span className={`text-xs px-2 py-1 ${colors.bgSecondary} ${colors.textSecondary} rounded`}>
                  #{index + 1}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={colors.textSecondary}>Confidence:</span>
                  <span className={`font-medium ${colors.text}`}>
                    {Math.round(comparison.result.confidence * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.textSecondary}>Response Tokens:</span>
                  <span className={`font-medium ${colors.text}`}>
                    {comparison.result.responseTokens}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.textSecondary}>Context Used:</span>
                  <span className={`font-medium ${colors.text}`}>
                    {comparison.result.contextUsed.length} chunks
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Side-by-Side Responses */}
      <div className="space-y-6">
        {modelComparisons.map((comparison) => {
          const colors = getModelColorClasses(comparison.model)
          const displayName = getModelDisplayName(comparison.model)
          
          return (
            <div key={comparison.model} className={`${colors.border} rounded-lg overflow-hidden`}>
              <div className={`${colors.bgSecondary} px-4 py-3 border-b ${colors.border}`}>
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${colors.text}`}>{displayName}</h4>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={colors.textSecondary}>
                      Confidence: {Math.round(comparison.result.confidence * 100)}%
                    </span>
                    <span className={colors.textSecondary}>
                      {comparison.result.responseTokens} tokens
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-white">
                <div className="prose max-w-none">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {comparison.result.response}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison Metrics */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Comparison Metrics</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response Length
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tokens Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Context Chunks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {modelComparisons.map((comparison) => (
                <tr key={comparison.model}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getModelDisplayName(comparison.model)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${comparison.result.confidence * 100}%` }}
                        ></div>
                      </div>
                      {Math.round(comparison.result.confidence * 100)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {comparison.result.response.length} chars
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {comparison.result.responseTokens}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {comparison.result.contextUsed.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Analysis Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Highest Confidence:</span>
            <span className="ml-2 text-gray-600">
              {getModelDisplayName(
                modelComparisons.reduce((prev, current) => 
                  prev.result.confidence > current.result.confidence ? prev : current
                ).model
              )}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Most Concise:</span>
            <span className="ml-2 text-gray-600">
              {getModelDisplayName(
                modelComparisons.reduce((prev, current) => 
                  prev.result.responseTokens < current.result.responseTokens ? prev : current
                ).model
              )}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Most Detailed:</span>
            <span className="ml-2 text-gray-600">
              {getModelDisplayName(
                modelComparisons.reduce((prev, current) => 
                  prev.result.responseTokens > current.result.responseTokens ? prev : current
                ).model
              )}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Average Confidence:</span>
            <span className="ml-2 text-gray-600">
              {Math.round(
                modelComparisons.reduce((sum, comp) => sum + comp.result.confidence, 0) / 
                modelComparisons.length * 100
              )}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModelComparison
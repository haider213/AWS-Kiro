import React, { useState } from 'react'
import RetrievalVisualization from '../visualizations/RetrievalVisualization'

interface DocumentChunk {
  id: string
  content: string
  word_count: number
  char_count: number
  strategy: string
  similarity_score?: number
  rank?: number
  initial_rank?: number
  combined_score?: number
  bm25_score?: number
  keyword_score?: number
  diversity_score?: number
  length_score?: number
  cross_encoder_score?: number
  chunk_index?: number
}

interface EmbeddingData {
  embeddings: number[][]
  tsne_coordinates: number[][]
  feature_names: string[]
  method: string
  model_id: string
  dimensions: number
}

interface RetrievalPhaseProps {
  processedChunks: DocumentChunk[]
  embeddingData: EmbeddingData | null
  query: string
  onQueryChange: (query: string) => void
  retrievedChunks: DocumentChunk[]
  similarityMetric: 'cosine' | 'euclidean' | 'dot_product'
  onSimilarityMetricChange: (metric: 'cosine' | 'euclidean' | 'dot_product') => void
  rerankingMethod: string
  onRerankingMethodChange: (method: string) => void
  onPerformRetrieval: () => void
  isProcessing: boolean
  comparisonResults?: DocumentChunk[]
  showComparison?: boolean
  onShowComparisonChange?: (show: boolean) => void
}

const RetrievalPhase: React.FC<RetrievalPhaseProps> = ({
  processedChunks,
  embeddingData,
  query,
  onQueryChange,
  retrievedChunks,
  similarityMetric,
  onSimilarityMetricChange,
  rerankingMethod,
  onRerankingMethodChange,
  onPerformRetrieval,
  isProcessing,
  comparisonResults = [],
  showComparison = false,
  onShowComparisonChange
}) => {
  const similarityMetrics = [
    {
      id: 'cosine' as const,
      name: 'Cosine Similarity',
      description: 'Measures angle between vectors',
      icon: '📐',
      pros: ['Normalized', 'Direction-focused'],
      cons: ['Ignores magnitude']
    },
    {
      id: 'euclidean' as const,
      name: 'Euclidean Distance',
      description: 'Straight-line distance',
      icon: '📏',
      pros: ['Intuitive', 'Fast'],
      cons: ['Sensitive to dimensions']
    },
    {
      id: 'dot_product' as const,
      name: 'Dot Product',
      description: 'Raw similarity score',
      icon: '⚡',
      pros: ['Very fast', 'Simple'],
      cons: ['Not normalized']
    }
  ]

  const rerankingMethods = [
    {
      id: 'none',
      name: 'No Reranking',
      description: 'Use original similarity scores',
      icon: '🎯',
      pros: ['Fast', 'Simple', 'Consistent'],
      cons: ['May miss nuanced relevance']
    },
    {
      id: 'bm25',
      name: 'BM25 Hybrid',
      description: 'Combines semantic similarity with keyword matching',
      icon: '🔍',
      pros: ['Keyword aware', 'Proven effective', 'Balanced'],
      cons: ['Requires tuning', 'Language dependent']
    },
    {
      id: 'cross_encoder',
      name: 'Cross-Encoder',
      description: 'Deep interaction between query and document',
      icon: '🧠',
      pros: ['High accuracy', 'Context aware', 'State-of-art'],
      cons: ['Slower', 'More complex']
    },
    {
      id: 'diversity',
      name: 'Diversity Reranking',
      description: 'Promotes diverse results to avoid redundancy',
      icon: '🌈',
      pros: ['Reduces redundancy', 'Broader coverage', 'User satisfaction'],
      cons: ['May lower precision', 'Complex scoring']
    },
    {
      id: 'length_penalty',
      name: 'Length Optimization',
      description: 'Prefers chunks of optimal length',
      icon: '📏',
      pros: ['Optimal chunk size', 'Better readability', 'Consistent'],
      cons: ['May miss short/long relevant content']
    },
    {
      id: 'keyword_boost',
      name: 'Keyword Boosting',
      description: 'Boosts results with exact keyword matches',
      icon: '🎯',
      pros: ['Exact match priority', 'User intent', 'Interpretable'],
      cons: ['May over-emphasize keywords', 'Less semantic']
    }
  ]

  if (processedChunks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold">Phase 3: Information Retrieval</h2>
        </div>
        <div className="p-6 text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Embeddings Available</h3>
          <p className="text-gray-600">Please process a document and generate embeddings first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-xl">
        <h2 className="text-2xl font-bold">Phase 3: Information Retrieval</h2>
        <p className="text-purple-100">Find relevant chunks using similarity search</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Query Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Query
          </label>
          <textarea
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            placeholder="What would you like to know?"
          />
        </div>

        {/* Similarity Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {similarityMetrics.map((metric) => (
            <div
              key={metric.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                similarityMetric === metric.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSimilarityMetricChange(metric.id)}
            >
              <div className="flex items-center space-x-2 mb-3">
                <div className="text-2xl">{metric.icon}</div>
                <h4 className="font-semibold text-gray-900">{metric.name}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">{metric.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium text-green-700">Pros:</span>
                  <ul className="text-green-600 ml-2">
                    {metric.pros.map((pro, index) => (
                      <li key={index}>• {pro}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-medium text-red-700">Cons:</span>
                  <ul className="text-red-600 ml-2">
                    {metric.cons.map((con, index) => (
                      <li key={index}>• {con}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reranking Methods */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reranking Methods</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rerankingMethods.map((method) => (
              <div
                key={method.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  rerankingMethod === method.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onRerankingMethodChange(method.id)}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <div className="text-2xl">{method.icon}</div>
                  <h4 className="font-semibold text-gray-900">{method.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                <div className="grid grid-cols-1 gap-2 text-xs">
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
        </div>

        {/* Search Button */}
        <button
          onClick={onPerformRetrieval}
          disabled={isProcessing || !query.trim()}
          className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {isProcessing ? '⏳ Searching...' : '🔍 Search for Relevant Chunks'}
        </button>

        {/* Reranking Info */}
        {rerankingMethod !== 'none' && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="text-indigo-500 text-lg">ℹ️</div>
              <h4 className="font-medium text-indigo-900">Reranking Active</h4>
            </div>
            <p className="text-sm text-indigo-700">
              Results will be reranked using <strong>{rerankingMethods.find(m => m.id === rerankingMethod)?.name}</strong> after initial similarity search.
              Look for rank changes and additional scores in the results below.
            </p>
          </div>
        )}

        {/* Results */}
        {retrievedChunks.length > 0 && (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{retrievedChunks.length}</div>
                <div className="text-sm text-purple-600">Retrieved</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {retrievedChunks.length > 0 ? (retrievedChunks[0].similarity_score! * 100).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-green-600">Top Score</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {retrievedChunks.length > 0 ?
                    (retrievedChunks.reduce((sum, chunk) => sum + chunk.similarity_score!, 0) / retrievedChunks.length * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="text-sm text-blue-600">Avg Score</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{similarityMetric}</div>
                <div className="text-sm text-orange-600">Metric</div>
              </div>
            </div>

            {/* Reranking Summary */}
            {rerankingMethod !== 'none' && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-indigo-500 text-xl">🔄</div>
                    <h4 className="font-semibold text-indigo-900">Reranking Applied: {rerankingMethod}</h4>
                  </div>
                  {comparisonResults.length > 0 && onShowComparisonChange && (
                    <button
                      onClick={() => onShowComparisonChange(!showComparison)}
                      className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      {showComparison ? 'Hide' : 'Show'} Comparison
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-indigo-700">Method:</span>
                    <p className="text-indigo-600">
                      {rerankingMethods.find(m => m.id === rerankingMethod)?.name || rerankingMethod}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-indigo-700">Reranked Items:</span>
                    <p className="text-indigo-600">
                      {retrievedChunks.filter(chunk => 
                        (chunk as any).initial_rank && (chunk as any).initial_rank !== (chunk.rank || retrievedChunks.indexOf(chunk) + 1)
                      ).length} of {retrievedChunks.length}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-indigo-700">Effect:</span>
                    <p className="text-indigo-600">
                      {retrievedChunks.some(chunk => (chunk as any).initial_rank && (chunk as any).initial_rank !== (chunk.rank || retrievedChunks.indexOf(chunk) + 1))
                        ? 'Order changed'
                        : 'Order preserved'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Comparison View */}
            {showComparison && comparisonResults.length > 0 && rerankingMethod !== 'none' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-gray-500 mr-2">📊</span>
                    Original Ranking (No Reranking)
                  </h4>
                  <div className="space-y-3">
                    {comparisonResults.map((chunk, index) => (
                      <div key={chunk.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              Original #{index + 1}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-600">
                              {(chunk.similarity_score! * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">{chunk.content.substring(0, 100)}...</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-indigo-500 mr-2">🔄</span>
                    Reranked Results ({rerankingMethods.find(m => m.id === rerankingMethod)?.name})
                  </h4>
                  <div className="space-y-3">
                    {retrievedChunks.map((chunk, index) => {
                      const wasReranked = (chunk as any).initial_rank && (chunk as any).initial_rank !== (chunk.rank || index + 1);
                      return (
                        <div key={chunk.id} className={`border rounded-lg p-3 ${wasReranked ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                              <div className={`w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-bold ${wasReranked ? 'bg-indigo-500' : 'bg-gray-500'}`}>
                                {index + 1}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                  Reranked #{index + 1}
                                </span>
                                {wasReranked && (
                                  <span className="text-xs text-indigo-600">
                                    (moved from #{(chunk as any).initial_rank})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-indigo-600">
                                {(chunk.similarity_score! * 100).toFixed(1)}%
                              </div>
                              {(chunk as any).combined_score && (
                                <div className="text-xs text-indigo-500">
                                  Combined: {((chunk as any).combined_score * 100).toFixed(1)}%
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600">{chunk.content.substring(0, 100)}...</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Retrieved Chunks */}
            <div className="space-y-4">
              {retrievedChunks.map((chunk, index) => (
                <div key={chunk.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          Rank #{chunk.rank || index + 1}
                        </span>
                        {(chunk as any).initial_rank && (chunk as any).initial_rank !== (chunk.rank || index + 1) && (
                          <span className="text-xs text-gray-500">
                            (was #{(chunk as any).initial_rank})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">
                        {(chunk.similarity_score! * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Similarity</div>
                      
                      {/* Show reranking scores if available */}
                      {rerankingMethod !== 'none' && (
                        <div className="mt-2 space-y-1">
                          {(chunk as any).combined_score && (
                            <div className="text-sm font-medium text-indigo-600">
                              {((chunk as any).combined_score * 100).toFixed(1)}%
                            </div>
                          )}
                          <div className="text-xs text-indigo-500">
                            {rerankingMethod === 'bm25' && 'BM25 Combined'}
                            {rerankingMethod === 'cross_encoder' && 'Cross-Encoder'}
                            {rerankingMethod === 'diversity' && 'Diversity'}
                            {rerankingMethod === 'length_penalty' && 'Length Optimized'}
                            {rerankingMethod === 'keyword_boost' && 'Keyword Boosted'}
                          </div>
                          
                          {/* Show specific reranking scores */}
                          {(chunk as any).bm25_score !== undefined && (
                            <div className="text-xs text-gray-500">
                              BM25: {(chunk as any).bm25_score.toFixed(2)}
                            </div>
                          )}
                          {(chunk as any).keyword_score !== undefined && (
                            <div className="text-xs text-gray-500">
                              Keywords: {(chunk as any).keyword_score.toFixed(2)}
                            </div>
                          )}
                          {(chunk as any).diversity_score !== undefined && (
                            <div className="text-xs text-gray-500">
                              Diversity: {(chunk as any).diversity_score.toFixed(2)}
                            </div>
                          )}
                          {(chunk as any).length_score !== undefined && (
                            <div className="text-xs text-gray-500">
                              Length: {(chunk as any).length_score.toFixed(2)}
                            </div>
                          )}
                          {(chunk as any).cross_encoder_score !== undefined && (
                            <div className="text-xs text-gray-500">
                              Cross-Enc: {(chunk as any).cross_encoder_score.toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{chunk.content}</p>
                  </div>
                  
                  {/* Show reranking explanation */}
                  {rerankingMethod !== 'none' && (chunk as any).initial_rank && (chunk as any).initial_rank !== (chunk.rank || index + 1) && (
                    <div className="mt-3 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="text-indigo-500 text-sm">🔄</div>
                        <span className="text-xs text-indigo-700">
                          Reranked from position #{(chunk as any).initial_rank} to #{chunk.rank || index + 1} using {rerankingMethod}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Visualization */}
            {embeddingData && (
              <RetrievalVisualization
                chunks={processedChunks}
                embeddings={embeddingData}
                query={query}
                retrievedChunks={retrievedChunks}
                similarityMetric={similarityMetric}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RetrievalPhase
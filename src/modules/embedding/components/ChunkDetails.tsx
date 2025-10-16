import React from 'react'
import { Chunk, Embedding } from '../../../types'
import { useEmbeddingStore } from '../../../store/embeddingStore'

interface ChunkDetailsProps {
  chunk: Chunk | null
  embedding?: Embedding
  similarChunks?: Chunk[]
  className?: string
}

export const ChunkDetails: React.FC<ChunkDetailsProps> = ({
  chunk,
  embedding,
  similarChunks = [],
  className = ''
}) => {
  const { getSimilarChunks, settings } = useEmbeddingStore()

  if (!chunk) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <p className="text-gray-500 text-center">
          Hover over a point to see chunk details
        </p>
      </div>
    )
  }

  const actualSimilarChunks = similarChunks.length > 0 ? similarChunks : getSimilarChunks(chunk)

  return (
    <div className={`bg-white rounded-lg border shadow-sm p-4 ${className}`}>
      {/* Chunk Header */}
      <div className="border-b border-gray-200 pb-3 mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Chunk {chunk.id.slice(0, 8)}...
        </h3>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {chunk.metadata.strategy}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {chunk.content.length} chars
          </span>
          {chunk.metadata.wordCount && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {chunk.metadata.wordCount} words
            </span>
          )}
        </div>
      </div>

      {/* Chunk Content */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Content</h4>
        <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
          <p className="text-sm text-gray-800 leading-relaxed">
            {chunk.content}
          </p>
        </div>
      </div>

      {/* Embedding Information */}
      {embedding && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Embedding</h4>
          <div className="bg-gray-50 rounded-md p-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium text-gray-600">Model:</span>
                <p className="text-gray-800">{embedding.model}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Dimensions:</span>
                <p className="text-gray-800">{embedding.dimensions}</p>
              </div>
            </div>
            
            {/* Vector Preview */}
            <div className="mt-2">
              <span className="font-medium text-gray-600 text-xs">Vector (first 10 dims):</span>
              <div className="mt-1 font-mono text-xs text-gray-700 bg-white rounded px-2 py-1">
                [{embedding.vector.slice(0, 10).map(v => v.toFixed(4)).join(', ')}...]
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Similar Chunks */}
      {actualSimilarChunks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Similar Chunks (threshold: {settings.similarityThreshold.toFixed(2)})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {actualSimilarChunks.slice(0, 5).map((similarChunk) => (
              <div
                key={similarChunk.id}
                className="bg-gray-50 rounded-md p-2 border-l-4 border-blue-200"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-medium text-gray-600">
                    Chunk {similarChunk.id.slice(0, 8)}...
                  </span>
                  <span className="text-xs text-blue-600 font-medium">
                    {/* Similarity score would be calculated here */}
                    Similar
                  </span>
                </div>
                <p className="text-xs text-gray-700 line-clamp-2">
                  {similarChunk.content.slice(0, 100)}...
                </p>
              </div>
            ))}
            {actualSimilarChunks.length > 5 && (
              <p className="text-xs text-gray-500 text-center">
                +{actualSimilarChunks.length - 5} more similar chunks
              </p>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700">
          Metadata
        </summary>
        <div className="mt-2 bg-gray-50 rounded-md p-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium text-gray-600">Start Index:</span>
              <p className="text-gray-800">{chunk.startIndex}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">End Index:</span>
              <p className="text-gray-800">{chunk.endIndex}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Size:</span>
              <p className="text-gray-800">{chunk.metadata.size}</p>
            </div>
            {chunk.metadata.overlap && (
              <div>
                <span className="font-medium text-gray-600">Overlap:</span>
                <p className="text-gray-800">{chunk.metadata.overlap}</p>
              </div>
            )}
            {chunk.metadata.sentenceCount && (
              <div>
                <span className="font-medium text-gray-600">Sentences:</span>
                <p className="text-gray-800">{chunk.metadata.sentenceCount}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-600">Created:</span>
              <p className="text-gray-800">{chunk.metadata.createdAt.toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}

export default ChunkDetails
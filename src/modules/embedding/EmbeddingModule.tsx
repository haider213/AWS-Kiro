
import React, { useEffect, useState } from 'react'
import { Card } from '../../components/UI/Card'
import { LoadingSpinner } from '../../components/UI/LoadingSpinner'
import { useRAGStore } from '../../store/ragStore'
import { useEmbeddingStore } from '../../store/embeddingStore'
import { embeddingService } from '../../services/embeddingService'
import { DimensionalityReduction } from '../../utils/dimensionalityReduction'
import VectorVisualization from './components/VectorVisualization'
import EmbeddingControls from './components/EmbeddingControls'
import ChunkDetails from './components/ChunkDetails'
import { Chunk, Embedding, SimilarityConnection } from '../../types'

export const EmbeddingModule: React.FC = () => {
  const { chunks } = useRAGStore()
  const {
    visualizationPoints,
    similarityConnections,
    settings,
    selectedModel,
    hoveredChunk,
    selectedChunk,
    isGeneratingEmbeddings,
    isReducingDimensions,
    setVisualizationPoints,
    setSimilarityConnections,
    setHoveredChunk,
    setSelectedChunk,
    setIsGeneratingEmbeddings,
    setIsReducingDimensions,
    setSimilarityMatrix
  } = useEmbeddingStore()

  const [embeddings, setEmbeddings] = useState<Embedding[]>([])
  const [error, setError] = useState<string | null>(null)

  // Generate embeddings when chunks or model changes
  useEffect(() => {
    if (chunks.length === 0) return

    const generateEmbeddings = async () => {
      setIsGeneratingEmbeddings(true)
      setError(null)

      try {
        const newEmbeddings = await embeddingService.generateEmbeddings(chunks, selectedModel)
        setEmbeddings(newEmbeddings)
        
        // Calculate similarity matrix
        await calculateSimilarityMatrix(newEmbeddings, chunks)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate embeddings')
        console.error('Error generating embeddings:', err)
      } finally {
        setIsGeneratingEmbeddings(false)
      }
    }

    generateEmbeddings()
  }, [chunks, selectedModel, setIsGeneratingEmbeddings])

  // Reduce dimensions when embeddings or settings change
  useEffect(() => {
    if (embeddings.length === 0) return

    const reduceDimensions = async () => {
      setIsReducingDimensions(true)
      setError(null)

      try {
        const points = await DimensionalityReduction.reduceDimensions(
          embeddings,
          chunks,
          {
            dimensions: settings.dimensions,
            perplexity: settings.perplexity,
            learningRate: settings.learningRate,
            maxIterations: settings.maxIterations
          }
        )
        
        setVisualizationPoints(points)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reduce dimensions')
        console.error('Error reducing dimensions:', err)
      } finally {
        setIsReducingDimensions(false)
      }
    }

    reduceDimensions()
  }, [
    embeddings,
    chunks,
    settings.dimensions,
    settings.perplexity,
    settings.learningRate,
    settings.maxIterations,
    setVisualizationPoints,
    setIsReducingDimensions
  ])

  // Calculate similarity matrix and connections
  const calculateSimilarityMatrix = async (embeddings: Embedding[], chunks: Chunk[]) => {
    const matrix: number[][] = []
    const connections: SimilarityConnection[] = []

    for (let i = 0; i < embeddings.length; i++) {
      matrix[i] = []
      for (let j = 0; j < embeddings.length; j++) {
        if (i === j) {
          matrix[i][j] = 1.0
        } else if (j < i) {
          // Use already calculated similarity (matrix is symmetric)
          matrix[i][j] = matrix[j][i]
        } else {
          // Calculate new similarity
          const similarity = await embeddingService.calculateSimilarity(
            embeddings[i],
            embeddings[j]
          )
          matrix[i][j] = similarity

          // Create connection if above threshold
          if (similarity >= settings.similarityThreshold) {
            connections.push({
              source: chunks[i],
              target: chunks[j],
              similarity,
              visible: true
            })
          }
        }
      }
    }

    setSimilarityMatrix(matrix)
    setSimilarityConnections(connections)
  }

  // Update connections when similarity threshold changes
  useEffect(() => {
    if (embeddings.length === 0) return

    const updateConnections = async () => {
      await calculateSimilarityMatrix(embeddings, chunks)
    }

    updateConnections()
  }, [settings.similarityThreshold])

  const handlePointHover = (chunk: Chunk | null) => {
    setHoveredChunk(chunk)
  }

  const handlePointClick = (chunk: Chunk) => {
    setSelectedChunk(selectedChunk?.id === chunk.id ? null : chunk)
  }

  const getChunkEmbedding = (chunk: Chunk): Embedding | undefined => {
    const index = chunks.findIndex(c => c.id === chunk.id)
    return index >= 0 ? embeddings[index] : undefined
  }

  if (chunks.length === 0) {
    return (
      <div className="space-y-6">
        <Card title="Vector Embeddings">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              No chunks available for embedding generation.
            </p>
            <p className="text-sm text-gray-500">
              Please go to the Chunking module first to create text chunks.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-tour="embedding-module">
      {/* Header */}
      <Card title="Vector Embeddings">
        <p className="text-gray-600 mb-4">
          Generate vector embeddings for text chunks and visualize their relationships in 2D/3D space.
          Adjust similarity thresholds to explore semantic connections between chunks.
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Chunks: {chunks.length}</span>
          <span>Model: {selectedModel}</span>
          <span>Dimensions: {settings.dimensions}D</span>
          {visualizationPoints.length > 0 && (
            <span>Points: {visualizationPoints.length}</span>
          )}
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1" data-tour="similarity-controls">
          <Card title="Controls">
            <EmbeddingControls />
          </Card>
        </div>

        {/* Visualization */}
        <div className="lg:col-span-2" data-tour="embedding-visualization">
          <Card title="Vector Space Visualization">
            {(isGeneratingEmbeddings || isReducingDimensions) ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <LoadingSpinner size="lg" className="mx-auto mb-4" />
                  <p className="text-gray-600">
                    {isGeneratingEmbeddings && 'Generating embeddings...'}
                    {isReducingDimensions && 'Reducing dimensions with t-SNE...'}
                  </p>
                  {isReducingDimensions && (
                    <p className="text-sm text-gray-500 mt-2">
                      This may take a few moments for large datasets
                    </p>
                  )}
                </div>
              </div>
            ) : visualizationPoints.length > 0 ? (
              <VectorVisualization
                points={visualizationPoints}
                connections={similarityConnections}
                onPointHover={handlePointHover}
                onPointClick={handlePointClick}
              />
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No visualization data available</p>
              </div>
            )}
          </Card>
        </div>

        {/* Chunk Details */}
        <div className="lg:col-span-1">
          <Card title="Chunk Details">
            <ChunkDetails
              chunk={hoveredChunk || selectedChunk}
              embedding={
                (hoveredChunk || selectedChunk) 
                  ? getChunkEmbedding(hoveredChunk || selectedChunk!)
                  : undefined
              }
            />
          </Card>
        </div>
      </div>

      {/* Statistics */}
      {visualizationPoints.length > 0 && (
        <Card title="Embedding Statistics">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{embeddings.length}</div>
              <div className="text-sm text-gray-600">Total Embeddings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {embeddings[0]?.dimensions || 0}
              </div>
              <div className="text-sm text-gray-600">Vector Dimensions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {similarityConnections.filter(c => c.visible).length}
              </div>
              <div className="text-sm text-gray-600">Similarity Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {settings.similarityThreshold.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Similarity Threshold</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default EmbeddingModule
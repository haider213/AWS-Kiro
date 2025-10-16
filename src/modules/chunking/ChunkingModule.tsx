
import React, { useEffect, useMemo } from 'react'
import { useRAGStore } from '../../store/ragStore'
import { Card } from '../../components/UI/Card'
import { chunkText } from '../../utils/textProcessing'
import { ChunkingParameters, ChunkingStrategy } from '../../types'
import ChunkingControls from './components/ChunkingControls'
import TextDisplay from './components/TextDisplay'
import ChunkMetrics from './components/ChunkMetrics'

export const ChunkingModule: React.FC = () => {
  const {
    sampleText,
    chunks,
    chunkingParameters,
    setChunks,
    updateChunkingParameters,
    setLoading,
    setError
  } = useRAGStore()

  // Process text whenever parameters or sample text changes
  const processedChunks = useMemo(() => {
    if (!sampleText.trim()) return []
    
    try {
      return chunkText(sampleText, chunkingParameters)
    } catch (error) {
      console.error('Error processing chunks:', error)
      return []
    }
  }, [sampleText, chunkingParameters])

  // Update store when chunks change
  useEffect(() => {
    setChunks(processedChunks)
  }, [processedChunks, setChunks])

  const handleParameterChange = (params: Partial<ChunkingParameters>) => {
    setLoading(true)
    setError(null)
    
    try {
      updateChunkingParameters(params)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update parameters')
    } finally {
      setLoading(false)
    }
  }

  const handleStrategyChange = (strategy: ChunkingStrategy) => {
    // Set default parameters for each strategy
    const defaultParams: Record<ChunkingStrategy, Partial<ChunkingParameters>> = {
      'fixed-size': { 
        strategy, 
        chunkSize: 200, 
        overlap: 50,
        similarityThreshold: undefined 
      },
      'sentence': { 
        strategy,
        chunkSize: undefined,
        overlap: undefined,
        similarityThreshold: undefined
      },
      'paragraph': { 
        strategy,
        chunkSize: undefined,
        overlap: undefined,
        similarityThreshold: undefined
      },
      'semantic': { 
        strategy,
        chunkSize: undefined,
        overlap: undefined,
        similarityThreshold: 0.7
      }
    }
    
    handleParameterChange(defaultParams[strategy])
  }

  return (
    <div className="space-y-6" data-tour="chunking-module">
      {/* Header Card */}
      <Card title="Text Chunking" className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <p className="text-gray-700 mb-4">
          Explore different text segmentation strategies and see how they affect chunk boundaries. 
          Adjust parameters in real-time to understand the impact on text processing.
        </p>
        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
          <span className="bg-blue-100 px-2 py-1 rounded">Interactive Controls</span>
          <span className="bg-green-100 px-2 py-1 rounded">Real-time Processing</span>
          <span className="bg-purple-100 px-2 py-1 rounded">Visual Feedback</span>
        </div>
      </Card>

      {/* Controls */}
      <div data-tour="chunking-parameters">
        <ChunkingControls
          parameters={chunkingParameters}
          onParameterChange={handleParameterChange}
          onStrategyChange={handleStrategyChange}
        />
      </div>

      {/* Metrics */}
      <div data-tour="chunking-metrics">
        <ChunkMetrics chunks={chunks} />
      </div>

      {/* Text Display with Chunk Visualization */}
      <div data-tour="chunking-visualization">
        <TextDisplay
          text={sampleText}
          chunks={chunks}
          parameters={chunkingParameters}
        />
      </div>
    </div>
  )
}

export default ChunkingModule
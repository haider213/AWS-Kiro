import React, { useEffect, useCallback } from 'react'
import { useRAGStore } from '../../store/ragStore'

/**
 * ParameterPropagation handles automatic parameter updates between related modules.
 * It ensures that changes in one module appropriately affect downstream modules.
 */
export const ParameterPropagation: React.FC = () => {
  const { 
    chunks,
    embeddings,
    searchResults,
    searchParameters,
    generationParameters,
    updateSearchParameters,
    updateGenerationParameters,
    setSearchResults,
    setGenerationResults
  } = useRAGStore()

  // Propagate chunking changes to downstream modules
  useEffect(() => {
    // When chunks change, clear downstream data that depends on them
    if (chunks.length === 0) {
      // Clear embeddings and search results when chunks are cleared
      const { setEmbeddings, setSearchResults, setGenerationResults } = useRAGStore.getState()
      setEmbeddings([])
      setSearchResults([])
      setGenerationResults([])
    }
  }, [chunks])

  // Propagate embedding changes to downstream modules
  useEffect(() => {
    // When embeddings change, clear search results and generation results
    if (embeddings.length === 0) {
      setSearchResults([])
      setGenerationResults([])
    }
  }, [embeddings, setSearchResults, setGenerationResults])

  // Propagate search parameter changes
  useEffect(() => {
    // When search parameters change significantly, clear search results
    // This prevents stale results from being displayed with new parameters
    if (searchResults.length > 0) {
      // Clear results to force re-search with new parameters
      setSearchResults([])
    }
  }, [
    searchParameters.mode,
    searchParameters.similarityThreshold,
    searchParameters.keywordWeight,
    searchParameters.semanticWeight,
    setSearchResults
  ])

  // Propagate search results to generation parameters
  useEffect(() => {
    // Automatically adjust generation context length based on available search results
    if (searchResults.length > 0) {
      const totalContextLength = searchResults.reduce((total, result) => 
        total + result.chunk.content.length, 0
      )
      
      // If total context exceeds current max, suggest increasing it
      if (totalContextLength > generationParameters.maxContextLength) {
        const suggestedLength = Math.min(totalContextLength + 500, 4000) // Cap at 4000
        updateGenerationParameters({
          maxContextLength: suggestedLength
        })
      }
    }
  }, [searchResults, generationParameters.maxContextLength, updateGenerationParameters])

  // Auto-adjust search result limit based on chunk availability
  useEffect(() => {
    if (chunks.length > 0 && chunks.length < searchParameters.resultLimit) {
      // Reduce result limit if we have fewer chunks than the limit
      updateSearchParameters({
        resultLimit: Math.max(1, chunks.length)
      })
    }
  }, [chunks.length, searchParameters.resultLimit, updateSearchParameters])

  // Intelligent parameter suggestions based on content
  const suggestOptimalParameters = useCallback(() => {
    if (chunks.length === 0) return

    const avgChunkLength = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / chunks.length
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0)

    // Suggest search parameters based on content characteristics
    if (avgChunkLength < 100) {
      // Short chunks - increase result limit, lower similarity threshold
      updateSearchParameters({
        resultLimit: Math.min(10, chunks.length),
        similarityThreshold: 0.6
      })
    } else if (avgChunkLength > 500) {
      // Long chunks - decrease result limit, higher similarity threshold
      updateSearchParameters({
        resultLimit: Math.min(3, chunks.length),
        similarityThreshold: 0.8
      })
    }

    // Suggest generation parameters based on total content
    if (totalLength > 5000) {
      // Large content - increase context window
      updateGenerationParameters({
        maxContextLength: Math.min(3000, totalLength * 0.6),
        contextSelectionStrategy: 'diverse'
      })
    } else if (totalLength < 1000) {
      // Small content - use all available context
      updateGenerationParameters({
        maxContextLength: totalLength + 200,
        contextSelectionStrategy: 'top-k'
      })
    }
  }, [chunks, updateSearchParameters, updateGenerationParameters])

  // Trigger parameter optimization when chunks change significantly
  useEffect(() => {
    if (chunks.length > 0) {
      // Debounce the optimization to avoid excessive updates
      const timeoutId = setTimeout(suggestOptimalParameters, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [chunks.length, suggestOptimalParameters])

  // Handle parameter conflicts and provide warnings
  useEffect(() => {
    const { setError } = useRAGStore.getState()

    // Check for parameter conflicts
    const warnings: string[] = []

    // Search parameter warnings
    if (searchParameters.mode === 'hybrid' && 
        (searchParameters.keywordWeight || 0) + (searchParameters.semanticWeight || 0) !== 1) {
      warnings.push('Hybrid search weights should sum to 1.0')
    }

    if (searchParameters.resultLimit > chunks.length && chunks.length > 0) {
      warnings.push(`Result limit (${searchParameters.resultLimit}) exceeds available chunks (${chunks.length})`)
    }

    // Generation parameter warnings
    if (generationParameters.maxContextLength < 100) {
      warnings.push('Context length may be too small for meaningful generation')
    }

    if (generationParameters.temperature > 1.0) {
      warnings.push('High temperature may produce inconsistent results')
    }

    // Display warnings if any exist
    if (warnings.length > 0 && !useRAGStore.getState().error) {
      setError(`Parameter warnings: ${warnings.join('; ')}`)
    }
  }, [
    searchParameters,
    generationParameters,
    chunks.length
  ])

  // Provide global parameter optimization functions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).ragParameterOptimizer = {
        optimizeForSpeed: () => {
          updateSearchParameters({
            resultLimit: 3,
            similarityThreshold: 0.7
          })
          updateGenerationParameters({
            maxContextLength: 1000,
            contextSelectionStrategy: 'top-k',
            temperature: 0.3
          })
        },
        optimizeForQuality: () => {
          updateSearchParameters({
            resultLimit: Math.min(8, chunks.length),
            similarityThreshold: 0.6
          })
          updateGenerationParameters({
            maxContextLength: 2500,
            contextSelectionStrategy: 'diverse',
            temperature: 0.7
          })
        },
        optimizeForContent: suggestOptimalParameters
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).ragParameterOptimizer
      }
    }
  }, [chunks.length, updateSearchParameters, updateGenerationParameters, suggestOptimalParameters])

  // This component doesn't render anything - it's a pure logic component
  return null
}

// Hook for components that need parameter propagation utilities
export const useParameterPropagation = () => {
  const { 
    chunkingParameters,
    searchParameters,
    generationParameters,
    updateChunkingParameters,
    updateSearchParameters,
    updateGenerationParameters
  } = useRAGStore()

  const propagateChunkingChange = useCallback((newParams: Partial<typeof chunkingParameters>) => {
    updateChunkingParameters(newParams)
    
    // Clear downstream data when chunking parameters change significantly
    if (newParams.strategy || newParams.chunkSize || newParams.overlap) {
      const { setChunks, setEmbeddings, setSearchResults, setGenerationResults } = useRAGStore.getState()
      setChunks([])
      setEmbeddings([])
      setSearchResults([])
      setGenerationResults([])
    }
  }, [updateChunkingParameters])

  const propagateSearchChange = useCallback((newParams: Partial<typeof searchParameters>) => {
    updateSearchParameters(newParams)
    
    // Clear search results when search parameters change
    if (newParams.mode || newParams.similarityThreshold) {
      const { setSearchResults, setGenerationResults } = useRAGStore.getState()
      setSearchResults([])
      setGenerationResults([])
    }
  }, [updateSearchParameters])

  const propagateGenerationChange = useCallback((newParams: Partial<typeof generationParameters>) => {
    updateGenerationParameters(newParams)
    
    // Clear generation results when generation parameters change significantly
    if (newParams.maxContextLength || newParams.contextSelectionStrategy) {
      const { setGenerationResults } = useRAGStore.getState()
      setGenerationResults([])
    }
  }, [updateGenerationParameters])

  return {
    propagateChunkingChange,
    propagateSearchChange,
    propagateGenerationChange
  }
}

export default ParameterPropagation
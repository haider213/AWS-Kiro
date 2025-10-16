import { useCallback, useMemo } from 'react'
import { useRAGStore } from '../../../store/ragStore'
import { useGenerationStore } from '../../../store/generationStore'

export const useGeneration = () => {
  const { searchResults, generationParameters } = useRAGStore()
  const {
    query,
    selectedModel,
    promptConstruction,
    generationResult,
    modelComparisons,
    isGenerating,
    isComparing,
    generationError,
    availableModels,
    constructPrompt,
    generateResponse,
    compareModels,
    setQuery,
    setSelectedModel,
    clearGeneration
  } = useGenerationStore()

  // Check if generation is available
  const isGenerationAvailable = useMemo(() => {
    return searchResults.length > 0
  }, [searchResults.length])

  // Check if prompt can be constructed
  const canConstructPrompt = useMemo(() => {
    return query.trim().length > 0 && searchResults.length > 0
  }, [query, searchResults.length])

  // Check if response can be generated
  const canGenerate = useMemo(() => {
    return promptConstruction !== null && !isGenerating
  }, [promptConstruction, isGenerating])

  // Check if models can be compared
  const canCompare = useMemo(() => {
    return promptConstruction !== null && !isComparing && availableModels.length > 1
  }, [promptConstruction, isComparing, availableModels.length])

  // Get generation statistics
  const generationStats = useMemo(() => {
    return {
      availableContext: searchResults.length,
      hasPrompt: promptConstruction !== null,
      hasResult: generationResult !== null,
      hasComparisons: modelComparisons.length > 0,
      totalModels: availableModels.length
    }
  }, [searchResults.length, promptConstruction, generationResult, modelComparisons.length, availableModels.length])

  // Handle prompt construction
  const handleConstructPrompt = useCallback(async () => {
    if (!canConstructPrompt) return
    
    const retrievedChunks = searchResults.map(result => result.chunk)
    await constructPrompt(query, retrievedChunks, generationParameters)
  }, [canConstructPrompt, searchResults, query, generationParameters, constructPrompt])

  // Handle response generation
  const handleGenerateResponse = useCallback(async () => {
    if (!canGenerate) return
    
    await generateResponse(generationParameters)
  }, [canGenerate, generationParameters, generateResponse])

  // Handle model comparison
  const handleCompareModels = useCallback(async () => {
    if (!canCompare) return
    
    const modelsToCompare = availableModels.map(model => model.modelId)
    await compareModels(modelsToCompare, generationParameters)
  }, [canCompare, availableModels, generationParameters, compareModels])

  // Get suggested queries based on search results
  const getSuggestedQueries = useCallback(() => {
    if (searchResults.length === 0) return []
    
    const suggestions = [
      "What are the main concepts discussed in this content?",
      "Can you summarize the key points from the retrieved information?",
      "How do these concepts relate to each other?",
      "What are the practical applications mentioned?",
      "What are the benefits and limitations discussed?"
    ]
    
    return suggestions
  }, [searchResults])

  // Get context summary
  const getContextSummary = useCallback(() => {
    if (searchResults.length === 0) return null
    
    const totalChars = searchResults.reduce((sum, result) => sum + result.chunk.content.length, 0)
    const avgScore = searchResults.reduce((sum, result) => sum + result.score, 0) / searchResults.length
    
    return {
      chunkCount: searchResults.length,
      totalCharacters: totalChars,
      averageScore: avgScore,
      estimatedTokens: Math.ceil(totalChars / 4)
    }
  }, [searchResults])

  return {
    // State
    query,
    selectedModel,
    promptConstruction,
    generationResult,
    modelComparisons,
    isGenerating,
    isComparing,
    generationError,
    availableModels,
    
    // Computed state
    isGenerationAvailable,
    canConstructPrompt,
    canGenerate,
    canCompare,
    generationStats,
    
    // Actions
    setQuery,
    setSelectedModel,
    handleConstructPrompt,
    handleGenerateResponse,
    handleCompareModels,
    clearGeneration,
    
    // Utilities
    getSuggestedQueries,
    getContextSummary
  }
}

export default useGeneration
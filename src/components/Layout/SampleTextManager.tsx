import React, { useEffect, useCallback } from 'react'
import { useRAGStore } from '../../store/ragStore'

/**
 * SampleTextManager handles consistent sample text management across all modules.
 * It ensures that when sample text changes, all dependent data is properly updated.
 */
export const SampleTextManager: React.FC = () => {
  const { 
    sampleText, 
    setSampleText,
    setChunks,
    setEmbeddings,
    setSearchResults,
    setGenerationResults,
    setError
  } = useRAGStore()

  // Handle sample text changes
  const handleSampleTextChange = useCallback((newText: string) => {
    try {
      // Update the sample text
      setSampleText(newText)
      
      // Clear all dependent data when sample text changes
      setChunks([])
      setEmbeddings([])
      setSearchResults([])
      setGenerationResults([])
      
      // Clear any existing errors
      setError(null)
      
      // Store in localStorage for persistence
      localStorage.setItem('rag-sample-text', newText)
    } catch (error) {
      console.error('Error updating sample text:', error)
      setError('Failed to update sample text')
    }
  }, [setSampleText, setChunks, setEmbeddings, setSearchResults, setGenerationResults, setError])

  // Load sample text from localStorage on mount
  useEffect(() => {
    const savedText = localStorage.getItem('rag-sample-text')
    if (savedText && savedText !== sampleText) {
      setSampleText(savedText)
    }
  }, [setSampleText, sampleText])

  // Provide global sample text management functions
  useEffect(() => {
    // Attach global functions to window for debugging/testing
    if (typeof window !== 'undefined') {
      (window as any).ragSampleTextManager = {
        getText: () => sampleText,
        setText: handleSampleTextChange,
        resetToDefault: () => {
          const defaultText = `Artificial Intelligence (AI) has revolutionized numerous industries and continues to shape our future. Machine learning, a subset of AI, enables computers to learn and improve from experience without being explicitly programmed. Deep learning, which uses neural networks with multiple layers, has achieved remarkable breakthroughs in image recognition, natural language processing, and game playing.

Natural Language Processing (NLP) is a field of AI that focuses on the interaction between computers and human language. It involves developing algorithms and models that can understand, interpret, and generate human language in a valuable way. Recent advances in transformer architectures, such as BERT and GPT models, have significantly improved the performance of NLP tasks.

Retrieval-Augmented Generation (RAG) is an innovative approach that combines the power of large language models with external knowledge retrieval. This technique allows AI systems to access and incorporate relevant information from external databases or documents when generating responses, leading to more accurate and contextually relevant outputs. RAG systems typically involve three main components: document chunking, embedding generation, and retrieval mechanisms.`
          handleSampleTextChange(defaultText)
        }
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).ragSampleTextManager
      }
    }
  }, [sampleText, handleSampleTextChange])

  // This component doesn't render anything - it's a pure logic component
  return null
}

// Hook for components that need to manage sample text
export const useSampleTextManager = () => {
  const { sampleText, setSampleText } = useRAGStore()

  const updateSampleText = useCallback((newText: string) => {
    const { 
      setChunks,
      setEmbeddings,
      setSearchResults,
      setGenerationResults,
      setError
    } = useRAGStore.getState()

    try {
      // Update the sample text
      setSampleText(newText)
      
      // Clear all dependent data
      setChunks([])
      setEmbeddings([])
      setSearchResults([])
      setGenerationResults([])
      
      // Clear any existing errors
      setError(null)
      
      // Store in localStorage
      localStorage.setItem('rag-sample-text', newText)
    } catch (error) {
      console.error('Error updating sample text:', error)
      setError('Failed to update sample text')
    }
  }, [setSampleText])

  const resetToDefault = useCallback(() => {
    const defaultText = `Artificial Intelligence (AI) has revolutionized numerous industries and continues to shape our future. Machine learning, a subset of AI, enables computers to learn and improve from experience without being explicitly programmed. Deep learning, which uses neural networks with multiple layers, has achieved remarkable breakthroughs in image recognition, natural language processing, and game playing.

Natural Language Processing (NLP) is a field of AI that focuses on the interaction between computers and human language. It involves developing algorithms and models that can understand, interpret, and generate human language in a valuable way. Recent advances in transformer architectures, such as BERT and GPT models, have significantly improved the performance of NLP tasks.

Retrieval-Augmented Generation (RAG) is an innovative approach that combines the power of large language models with external knowledge retrieval. This technique allows AI systems to access and incorporate relevant information from external databases or documents when generating responses, leading to more accurate and contextually relevant outputs. RAG systems typically involve three main components: document chunking, embedding generation, and retrieval mechanisms.`
    updateSampleText(defaultText)
  }, [updateSampleText])

  return {
    sampleText,
    updateSampleText,
    resetToDefault
  }
}

export default SampleTextManager
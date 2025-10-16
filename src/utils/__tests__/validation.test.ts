import { describe, it, expect } from 'vitest'
import {
  validateChunkingParameters,
  validateSearchParameters,
  validateGenerationParameters,
  validateEmbeddingParameters,
} from '../validation'

describe('Parameter Validation', () => {
  describe('validateChunkingParameters', () => {
    it('should validate correct chunking parameters', () => {
      const validParams = {
        strategy: 'fixed-size' as const,
        chunkSize: 500,
        overlap: 50,
      }
      
      expect(() => validateChunkingParameters(validParams)).not.toThrow()
    })

    it('should reject invalid chunk size', () => {
      const invalidParams = {
        strategy: 'fixed-size' as const,
        chunkSize: -100,
        overlap: 50,
      }
      
      expect(() => validateChunkingParameters(invalidParams)).toThrow()
    })

    it('should reject overlap larger than chunk size', () => {
      const invalidParams = {
        strategy: 'fixed-size' as const,
        chunkSize: 100,
        overlap: 150,
      }
      
      expect(() => validateChunkingParameters(invalidParams)).toThrow()
    })

    it('should validate semantic chunking parameters', () => {
      const validParams = {
        strategy: 'semantic' as const,
        similarityThreshold: 0.7,
      }
      
      expect(() => validateChunkingParameters(validParams)).not.toThrow()
    })

    it('should reject invalid similarity threshold', () => {
      const invalidParams = {
        strategy: 'semantic' as const,
        similarityThreshold: 1.5,
      }
      
      expect(() => validateChunkingParameters(invalidParams)).toThrow()
    })
  })

  describe('validateSearchParameters', () => {
    it('should validate correct search parameters', () => {
      const validParams = {
        mode: 'hybrid' as const,
        resultLimit: 10,
        similarityThreshold: 0.8,
        keywordWeight: 0.3,
        semanticWeight: 0.7,
      }
      
      expect(() => validateSearchParameters(validParams)).not.toThrow()
    })

    it('should reject invalid result limit', () => {
      const invalidParams = {
        mode: 'semantic' as const,
        resultLimit: 0,
        similarityThreshold: 0.8,
      }
      
      expect(() => validateSearchParameters(invalidParams)).toThrow()
    })

    it('should reject invalid similarity threshold', () => {
      const invalidParams = {
        mode: 'semantic' as const,
        resultLimit: 10,
        similarityThreshold: -0.1,
      }
      
      expect(() => validateSearchParameters(invalidParams)).toThrow()
    })

    it('should validate hybrid mode weights', () => {
      const invalidParams = {
        mode: 'hybrid' as const,
        resultLimit: 10,
        similarityThreshold: 0.8,
        keywordWeight: 0.8,
        semanticWeight: 0.8,
      }
      
      // Weights should sum to approximately 1.0
      expect(() => validateSearchParameters(invalidParams)).toThrow()
    })
  })

  describe('validateGenerationParameters', () => {
    it('should validate correct generation parameters', () => {
      const validParams = {
        maxContextLength: 4000,
        contextSelectionStrategy: 'top-k' as const,
        temperature: 0.7,
      }
      
      expect(() => validateGenerationParameters(validParams)).not.toThrow()
    })

    it('should reject invalid context length', () => {
      const invalidParams = {
        maxContextLength: -1000,
        contextSelectionStrategy: 'top-k' as const,
        temperature: 0.7,
      }
      
      expect(() => validateGenerationParameters(invalidParams)).toThrow()
    })

    it('should reject invalid temperature', () => {
      const invalidParams = {
        maxContextLength: 4000,
        contextSelectionStrategy: 'top-k' as const,
        temperature: 2.5,
      }
      
      expect(() => validateGenerationParameters(invalidParams)).toThrow()
    })

    it('should validate context selection strategies', () => {
      const validStrategies = ['top-k', 'threshold', 'diverse'] as const
      
      validStrategies.forEach(strategy => {
        const params = {
          maxContextLength: 4000,
          contextSelectionStrategy: strategy,
          temperature: 0.7,
        }
        
        expect(() => validateGenerationParameters(params)).not.toThrow()
      })
    })
  })

  describe('validateEmbeddingParameters', () => {
    it('should validate correct embedding parameters', () => {
      const validParams = {
        model: 'amazon.titan-embed-text-v1',
        dimensions: 1536,
      }
      
      expect(() => validateEmbeddingParameters(validParams)).not.toThrow()
    })

    it('should reject invalid dimensions', () => {
      const invalidParams = {
        model: 'amazon.titan-embed-text-v1',
        dimensions: 0,
      }
      
      expect(() => validateEmbeddingParameters(invalidParams)).toThrow()
    })

    it('should validate supported models', () => {
      const supportedModels = [
        'amazon.titan-embed-text-v1',
        'cohere.embed-english-v3',
        'cohere.embed-multilingual-v3',
      ]
      
      supportedModels.forEach(model => {
        const params = {
          model,
          dimensions: 1536,
        }
        
        expect(() => validateEmbeddingParameters(params)).not.toThrow()
      })
    })

    it('should reject unsupported models', () => {
      const invalidParams = {
        model: 'unsupported-model',
        dimensions: 1536,
      }
      
      expect(() => validateEmbeddingParameters(invalidParams)).toThrow()
    })
  })
})
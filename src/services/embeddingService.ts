import { Embedding, EmbeddingRequest, EmbeddingResponse, Chunk } from '../types'

const API_BASE_URL = 'http://localhost:3001/api'

export class EmbeddingService {
  /**
   * Generate embeddings for text strings
   */
  async generateEmbeddingsFromTexts(texts: string[], model: string = 'amazon.titan-embed-text-v1'): Promise<Embedding[]> {
    try {
      const request: EmbeddingRequest = {
        texts,
        model
      }

      const response = await fetch(`${API_BASE_URL}/embeddings/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: EmbeddingResponse = await response.json()
      return data.embeddings
    } catch (error) {
      console.error('Error generating embeddings:', error)
      // Return mock embeddings for development/demo purposes
      return this.generateMockEmbeddingsFromTexts(texts)
    }
  }

  /**
   * Generate embeddings for multiple text chunks
   */
  async generateEmbeddings(chunks: Chunk[], model: string = 'amazon.titan-embed-text-v1'): Promise<Embedding[]> {
    try {
      const texts = chunks.map(chunk => chunk.content)
      
      const request: EmbeddingRequest = {
        texts,
        model
      }

      const response = await fetch(`${API_BASE_URL}/embeddings/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: EmbeddingResponse = await response.json()
      return data.embeddings
    } catch (error) {
      console.error('Error generating embeddings:', error)
      // Return mock embeddings for development/demo purposes
      return this.generateMockEmbeddings(chunks)
    }
  }

  /**
   * Calculate similarity between two embeddings
   */
  async calculateSimilarity(embedding1: Embedding, embedding2: Embedding): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/embeddings/similarity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ embedding1, embedding2 }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.similarity
    } catch (error) {
      console.error('Error calculating similarity:', error)
      // Fallback to cosine similarity calculation
      return this.cosineSimilarity(embedding1.vector, embedding2.vector)
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i]
      normA += vectorA[i] * vectorA[i]
      normB += vectorB[i] * vectorB[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (normA * normB)
  }

  /**
   * Generate mock embeddings for text strings
   */
  private generateMockEmbeddingsFromTexts(texts: string[]): Embedding[] {
    return texts.map((text) => {
      // Generate deterministic but varied embeddings based on text content
      const vector = this.generateMockVector(text, 1536) // Titan embedding size
      
      return {
        vector,
        model: 'amazon.titan-embed-text-v1',
        dimensions: 1536
      }
    })
  }

  /**
   * Generate mock embeddings for development/demo purposes
   */
  private generateMockEmbeddings(chunks: Chunk[]): Embedding[] {
    return chunks.map((chunk) => {
      // Generate deterministic but varied embeddings based on chunk content
      const vector = this.generateMockVector(chunk.content, 1536) // Titan embedding size
      
      return {
        vector,
        model: 'amazon.titan-embed-text-v1',
        dimensions: 1536
      }
    })
  }

  /**
   * Generate a mock vector based on text content
   */
  private generateMockVector(text: string, dimensions: number): number[] {
    const vector: number[] = []
    
    // Use text characteristics to generate deterministic vectors
    const textHash = this.simpleHash(text)
    const words = text.toLowerCase().split(/\s+/)
    
    for (let i = 0; i < dimensions; i++) {
      // Create pseudo-random but deterministic values based on text content
      const seed = (textHash + i) % 1000
      const wordInfluence = words.length > 0 ? words[i % words.length].charCodeAt(0) : 0
      const value = (Math.sin(seed * 0.01) + Math.cos(wordInfluence * 0.1)) * 0.5
      vector.push(value)
    }
    
    // Normalize the vector
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    return vector.map(val => val / norm)
  }

  /**
   * Simple hash function for text
   */
  private simpleHash(text: string): number {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

export const embeddingService = new EmbeddingService()
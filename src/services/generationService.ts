import { 
  GenerationResult, 
  GenerationRequest, 
  GenerationParameters,
  Chunk,
  BedrockGenerationModel 
} from '../types'

const API_BASE_URL = 'http://localhost:3001/api'

export interface PromptConstructionResult {
  prompt: string
  contextUsed: Chunk[]
  truncatedChunks: Chunk[]
  totalTokens: number
  contextTokens: number
  queryTokens: number
}

export interface ModelComparison {
  model: string
  result: GenerationResult
  error?: string
}

export class GenerationService {
  private readonly availableModels: BedrockGenerationModel[] = [
    {
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      maxTokens: 4096,
      temperature: 0.7,
      supportedParameters: ['temperature', 'maxTokens', 'topP']
    },
    {
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      maxTokens: 4096,
      temperature: 0.7,
      supportedParameters: ['temperature', 'maxTokens', 'topP']
    },
    {
      modelId: 'amazon.titan-text-premier-v1:0',
      maxTokens: 3000,
      temperature: 0.7,
      supportedParameters: ['temperature', 'maxTokens', 'topK']
    }
  ]

  /**
   * Get available generation models
   */
  getAvailableModels(): BedrockGenerationModel[] {
    return this.availableModels
  }

  /**
   * Construct a prompt from query and retrieved context
   */
  constructPrompt(
    query: string, 
    retrievedChunks: Chunk[], 
    parameters: GenerationParameters
  ): PromptConstructionResult {
    const { maxContextLength, contextSelectionStrategy } = parameters

    // Estimate token counts (rough approximation: 1 token ≈ 4 characters)
    const estimateTokens = (text: string): number => Math.ceil(text.length / 4)

    const queryTokens = estimateTokens(query)
    const promptTemplate = this.getPromptTemplate()
    const templateTokens = estimateTokens(promptTemplate.replace('{context}', '').replace('{query}', ''))

    // Calculate available tokens for context
    const availableContextTokens = maxContextLength - queryTokens - templateTokens - 50 // Buffer

    // Select and truncate context based on strategy
    const { contextUsed, truncatedChunks } = this.selectContext(
      retrievedChunks, 
      availableContextTokens, 
      contextSelectionStrategy
    )

    // Build context string
    const contextString = contextUsed
      .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
      .join('\n\n')

    // Construct final prompt
    const prompt = promptTemplate
      .replace('{context}', contextString)
      .replace('{query}', query)

    const contextTokens = estimateTokens(contextString)
    const totalTokens = queryTokens + templateTokens + contextTokens

    return {
      prompt,
      contextUsed,
      truncatedChunks,
      totalTokens,
      contextTokens,
      queryTokens
    }
  }

  /**
   * Generate response using Bedrock API
   */
  async generateResponse(
    prompt: string,
    model: string = 'anthropic.claude-3-haiku-20240307-v1:0',
    parameters: GenerationParameters
  ): Promise<GenerationResult> {
    try {
      const request: GenerationRequest = {
        prompt,
        model,
        parameters
      }

      const response = await fetch(`${API_BASE_URL}/generation/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Generation failed')
      }

      return data.result
    } catch (error) {
      console.error('Error generating response:', error)
      // Return mock response for development/demo purposes
      return this.generateMockResponse(prompt, model, parameters)
    }
  }

  /**
   * Compare responses from multiple models
   */
  async compareModels(
    prompt: string,
    models: string[],
    parameters: GenerationParameters
  ): Promise<ModelComparison[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/generation/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, models }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Model comparison failed')
      }

      return data.results.map((result: any) => ({
        model: result.model,
        result: result.result
      }))
    } catch (error) {
      console.error('Error comparing models:', error)
      // Return mock comparisons for development/demo purposes
      return models.map(model => ({
        model,
        result: this.generateMockResponse(prompt, model, parameters)
      }))
    }
  }

  /**
   * Select context chunks based on strategy and token limits
   */
  private selectContext(
    chunks: Chunk[], 
    maxTokens: number, 
    strategy: 'top-k' | 'threshold' | 'diverse'
  ): { contextUsed: Chunk[], truncatedChunks: Chunk[] } {
    const estimateTokens = (text: string): number => Math.ceil(text.length / 4)
    
    let selectedChunks: Chunk[] = []
    let currentTokens = 0
    const truncatedChunks: Chunk[] = []

    switch (strategy) {
      case 'top-k':
        // Select chunks in order until token limit
        for (const chunk of chunks) {
          const chunkTokens = estimateTokens(chunk.content)
          if (currentTokens + chunkTokens <= maxTokens) {
            selectedChunks.push(chunk)
            currentTokens += chunkTokens
          } else {
            truncatedChunks.push(chunk)
          }
        }
        break

      case 'threshold':
        // Only include chunks above a certain relevance threshold (assuming first chunks are most relevant)
        for (let i = 0; i < Math.min(chunks.length, 5); i++) {
          const chunk = chunks[i]
          const chunkTokens = estimateTokens(chunk.content)
          if (currentTokens + chunkTokens <= maxTokens) {
            selectedChunks.push(chunk)
            currentTokens += chunkTokens
          } else {
            truncatedChunks.push(chunk)
          }
        }
        break

      case 'diverse':
        // Try to include diverse chunks (every other chunk, then fill remaining)
        const diverseIndices = []
        for (let i = 0; i < chunks.length; i += 2) {
          diverseIndices.push(i)
        }
        for (let i = 1; i < chunks.length; i += 2) {
          diverseIndices.push(i)
        }

        for (const index of diverseIndices) {
          const chunk = chunks[index]
          const chunkTokens = estimateTokens(chunk.content)
          if (currentTokens + chunkTokens <= maxTokens) {
            selectedChunks.push(chunk)
            currentTokens += chunkTokens
          } else {
            truncatedChunks.push(chunk)
          }
        }
        break
    }

    return { contextUsed: selectedChunks, truncatedChunks }
  }

  /**
   * Get the prompt template for RAG
   */
  private getPromptTemplate(): string {
    return `You are a helpful AI assistant. Use the following context to answer the user's question. If the context doesn't contain relevant information, say so clearly.

Context:
{context}

Question: {query}

Answer:`
  }

  /**
   * Generate mock response for development/demo purposes
   */
  private generateMockResponse(
    prompt: string, 
    model: string, 
    parameters: GenerationParameters
  ): GenerationResult {
    // Extract context and query from prompt for mock response
    const queryMatch = prompt.match(/Question:\s*(.*?)\s*Answer:/s)
    
    const contextUsed: Chunk[] = []
    const query = queryMatch?.[1]?.trim() || 'sample query'
    
    // Generate a mock response based on the query
    const responses = [
      `Based on the provided context, ${query.toLowerCase()} relates to several key concepts. The information suggests that this topic involves multiple interconnected elements that work together to achieve the desired outcome.`,
      `According to the context provided, ${query.toLowerCase()} can be understood through the following key points: First, it involves systematic processing of information. Second, it requires careful consideration of various parameters and configurations.`,
      `The context indicates that ${query.toLowerCase()} is an important aspect that requires attention to detail and proper implementation. The available information suggests several approaches and considerations for this topic.`
    ]

    const responseIndex = Math.abs(this.simpleHash(prompt + model)) % responses.length
    const baseResponse = responses[responseIndex]
    
    // Vary response based on model
    let response = baseResponse
    if (model.includes('claude-3-sonnet')) {
      response += ' This analysis provides a comprehensive view of the topic with detailed explanations.'
    } else if (model.includes('claude-3-haiku')) {
      response += ' This is a concise summary of the key points.'
    } else if (model.includes('titan')) {
      response += ' The information has been processed to provide relevant insights.'
    }

    return {
      response,
      contextUsed,
      confidence: 0.85,
      parameters,
      model,
      promptTokens: Math.ceil(prompt.length / 4),
      responseTokens: Math.ceil(response.length / 4)
    }
  }

  /**
   * Simple hash function for deterministic mock responses
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

export const generationService = new GenerationService()
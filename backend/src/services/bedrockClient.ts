import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { BedrockEmbeddingModel, BedrockGenerationModel, Embedding, GenerationResult } from '../types/bedrock.js';

export class BedrockService {
  private client: BedrockRuntimeClient;
  
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1',
    });
  }

  async generateEmbeddings(texts: string[], modelId: string = 'amazon.titan-embed-text-v1'): Promise<Embedding[]> {
    const embeddings: Embedding[] = [];
    
    for (const text of texts) {
      try {
        const command = new InvokeModelCommand({
          modelId,
          body: JSON.stringify({
            inputText: text,
          }),
          contentType: 'application/json',
          accept: 'application/json',
        });

        const response = await this.client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        const embedding: Embedding = {
          vector: responseBody.embedding,
          model: modelId,
          dimensions: responseBody.embedding.length,
        };
        
        embeddings.push(embedding);
      } catch (error) {
        console.error(`Error generating embedding for text: ${text.substring(0, 50)}...`, error);
        throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return embeddings;
  }

  async generateResponse(prompt: string, modelId: string = 'anthropic.claude-3-haiku-20240307-v1:0', temperature: number = 0.7): Promise<GenerationResult> {
    try {
      let body: any;
      
      if (modelId.startsWith('anthropic.claude')) {
        body = {
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1000,
          temperature,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        };
      } else if (modelId.startsWith('amazon.titan')) {
        body = {
          inputText: prompt,
          textGenerationConfig: {
            maxTokenCount: 1000,
            temperature,
            topP: 0.9,
          },
        };
      } else {
        throw new Error(`Unsupported model: ${modelId}`);
      }

      const command = new InvokeModelCommand({
        modelId,
        body: JSON.stringify(body),
        contentType: 'application/json',
        accept: 'application/json',
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      let generatedText: string;
      
      if (modelId.startsWith('anthropic.claude')) {
        generatedText = responseBody.content[0].text;
      } else if (modelId.startsWith('amazon.titan')) {
        generatedText = responseBody.results[0].outputText;
      } else {
        throw new Error(`Unsupported model response format: ${modelId}`);
      }

      return {
        response: generatedText,
        contextUsed: [], // Will be populated by the calling function
        confidence: 0.8, // Placeholder - Bedrock doesn't provide confidence scores
        parameters: {
          maxContextLength: 1000,
          contextSelectionStrategy: 'top-k',
          temperature,
        },
      };
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  calculateSimilarity(embedding1: Embedding, embedding2: Embedding): number {
    if (embedding1.vector.length !== embedding2.vector.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.vector.length; i++) {
      dotProduct += embedding1.vector[i] * embedding2.vector[i];
      norm1 += embedding1.vector[i] * embedding1.vector[i];
      norm2 += embedding2.vector[i] * embedding2.vector[i];
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return Math.max(-1, Math.min(1, similarity)); // Clamp to [-1, 1]
  }

  getAvailableEmbeddingModels(): BedrockEmbeddingModel[] {
    return [
      {
        modelId: 'amazon.titan-embed-text-v1',
        dimensions: 1536,
      },
      {
        modelId: 'cohere.embed-english-v3',
        dimensions: 1024,
      },
      {
        modelId: 'cohere.embed-multilingual-v3',
        dimensions: 1024,
      },
    ];
  }

  getAvailableGenerationModels(): BedrockGenerationModel[] {
    return [
      {
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        maxTokens: 4096,
        temperature: 0.7,
      },
      {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        maxTokens: 4096,
        temperature: 0.7,
      },
      {
        modelId: 'amazon.titan-text-premier-v1:0',
        maxTokens: 3000,
        temperature: 0.7,
      },
    ];
  }
}
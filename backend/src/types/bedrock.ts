export interface BedrockEmbeddingModel {
  modelId: 'amazon.titan-embed-text-v1' | 'cohere.embed-english-v3' | 'cohere.embed-multilingual-v3';
  dimensions: number;
}

export interface BedrockGenerationModel {
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0' | 'anthropic.claude-3-haiku-20240307-v1:0' | 'amazon.titan-text-premier-v1:0';
  maxTokens: number;
  temperature: number;
}

export interface Embedding {
  vector: number[];
  model: string;
  dimensions: number;
}

export interface GenerationResult {
  response: string;
  contextUsed: string[];
  confidence: number;
  parameters: GenerationParameters;
}

export interface GenerationParameters {
  maxContextLength: number;
  contextSelectionStrategy: 'top-k' | 'threshold' | 'diverse';
  temperature: number;
}

export interface EmbeddingRequest {
  texts: string[];
  model?: string;
}

export interface GenerationRequest {
  prompt: string;
  model?: string;
  parameters?: Partial<GenerationParameters>;
}

export interface SimilarityRequest {
  embedding1: Embedding;
  embedding2: Embedding;
}
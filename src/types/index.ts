// Core data models and interfaces for RAG Pipeline Educator

export interface Chunk {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  metadata: ChunkMetadata;
  embedding?: Embedding;
}

export interface ChunkMetadata {
  strategy: ChunkingStrategy;
  size: number;
  overlap?: number;
  sentenceCount?: number;
  wordCount?: number;
  similarityThreshold?: number;
  createdAt: Date;
}

export interface Embedding {
  vector: number[];
  model: string;
  dimensions: number;
}

export interface SearchResult {
  chunk: Chunk;
  score: number;
  matchType: 'keyword' | 'semantic' | 'hybrid';
  highlights: TextHighlight[];
}

export interface TextHighlight {
  startIndex: number;
  endIndex: number;
  text: string;
  type: 'exact' | 'partial' | 'semantic';
}

export interface GenerationResult {
  response: string;
  contextUsed: Chunk[];
  confidence: number;
  parameters: GenerationParameters;
  model: string;
  promptTokens: number;
  responseTokens: number;
}

// Configuration Models
export interface ChunkingParameters {
  strategy: ChunkingStrategy;
  chunkSize?: number;
  overlap?: number;
  similarityThreshold?: number;
  preserveSentences?: boolean;
  preserveParagraphs?: boolean;
}

export interface SearchParameters {
  mode: SearchMode;
  resultLimit: number;
  similarityThreshold: number;
  keywordWeight?: number;
  semanticWeight?: number;
  enableHighlighting: boolean;
}

export interface GenerationParameters {
  maxContextLength: number;
  contextSelectionStrategy: ContextSelectionStrategy;
  temperature: number;
  maxTokens: number;
  topP?: number;
  topK?: number;
}

// Enums and Union Types
export type ChunkingStrategy = 'fixed-size' | 'semantic' | 'sentence' | 'paragraph';
export type SearchMode = 'keyword' | 'semantic' | 'hybrid';
export type ContextSelectionStrategy = 'top-k' | 'threshold' | 'diverse';

// Bedrock Model Interfaces
export interface BedrockEmbeddingModel {
  modelId: 'amazon.titan-embed-text-v1' | 'cohere.embed-english-v3' | 'cohere.embed-multilingual-v3';
  dimensions: number;
  maxInputTokens: number;
  costPerToken: number;
}

export interface BedrockGenerationModel {
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0' | 'anthropic.claude-3-haiku-20240307-v1:0' | 'amazon.titan-text-premier-v1:0';
  maxTokens: number;
  temperature: number;
  supportedParameters: string[];
}

// API Request/Response Types
export interface EmbeddingRequest {
  texts: string[];
  model: string;
}

export interface EmbeddingResponse {
  embeddings: Embedding[];
  model: string;
  usage: {
    inputTokens: number;
    totalTokens: number;
  };
}

export interface GenerationRequest {
  prompt: string;
  model: string;
  parameters: GenerationParameters;
}

export interface GenerationResponse {
  response: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

// Visualization Types
export interface VisualizationPoint {
  x: number;
  y: number;
  z?: number;
  chunk: Chunk;
  color?: string;
  size?: number;
}

export interface SimilarityConnection {
  source: Chunk;
  target: Chunk;
  similarity: number;
  visible: boolean;
}

// Error Types
export interface RAGError {
  type: 'validation' | 'api' | 'processing' | 'visualization';
  message: string;
  details?: any;
  timestamp: Date;
}

// Performance Metrics
export interface PerformanceMetrics {
  chunkingTime: number;
  embeddingTime: number;
  searchTime: number;
  generationTime: number;
  visualizationTime: number;
  memoryUsage: number;
}
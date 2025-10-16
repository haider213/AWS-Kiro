// Data validation functions for API requests and responses

import {
  Chunk,
  ChunkingParameters,
  SearchParameters,
  GenerationParameters,
  EmbeddingRequest,
  EmbeddingResponse,
  GenerationRequest,
  GenerationResponse,
  ChunkingStrategy,
  SearchMode,
  ContextSelectionStrategy,
  RAGError
} from '../types';

// Validation helper functions
export function isValidString(value: any, minLength = 1, maxLength = Infinity): boolean {
  return typeof value === 'string' && value.length >= minLength && value.length <= maxLength;
}

export function isValidNumber(value: any, min = -Infinity, max = Infinity): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
}

export function isValidArray<T>(value: any, validator?: (item: T) => boolean): boolean {
  if (!Array.isArray(value)) return false;
  if (validator) {
    return value.every(validator);
  }
  return true;
}

// Chunk validation
export function validateChunk(chunk: any): chunk is Chunk {
  if (!chunk || typeof chunk !== 'object') return false;
  
  return (
    isValidString(chunk.id) &&
    isValidString(chunk.content) &&
    isValidNumber(chunk.startIndex, 0) &&
    isValidNumber(chunk.endIndex, 0) &&
    chunk.endIndex >= chunk.startIndex &&
    validateChunkMetadata(chunk.metadata)
  );
}

export function validateChunkMetadata(metadata: any): boolean {
  if (!metadata || typeof metadata !== 'object') return false;
  
  const validStrategies: ChunkingStrategy[] = ['fixed-size', 'semantic', 'sentence', 'paragraph'];
  
  return (
    validStrategies.includes(metadata.strategy) &&
    isValidNumber(metadata.size, 1) &&
    (metadata.overlap === undefined || isValidNumber(metadata.overlap, 0)) &&
    (metadata.sentenceCount === undefined || isValidNumber(metadata.sentenceCount, 0)) &&
    (metadata.wordCount === undefined || isValidNumber(metadata.wordCount, 0)) &&
    metadata.createdAt instanceof Date
  );
}

// Parameter validation
export function validateChunkingParameters(params: any): params is ChunkingParameters {
  if (!params || typeof params !== 'object') return false;
  
  const validStrategies: ChunkingStrategy[] = ['fixed-size', 'semantic', 'sentence', 'paragraph'];
  
  const isValidStrategy = validStrategies.includes(params.strategy);
  const isValidChunkSize = params.chunkSize === undefined || isValidNumber(params.chunkSize, 1, 10000);
  const isValidOverlap = params.overlap === undefined || isValidNumber(params.overlap, 0, 1000);
  const isValidThreshold = params.similarityThreshold === undefined || isValidNumber(params.similarityThreshold, 0, 1);
  
  return isValidStrategy && isValidChunkSize && isValidOverlap && isValidThreshold;
}

export function validateSearchParameters(params: any): params is SearchParameters {
  if (!params || typeof params !== 'object') return false;
  
  const validModes: SearchMode[] = ['keyword', 'semantic', 'hybrid'];
  
  return (
    validModes.includes(params.mode) &&
    isValidNumber(params.resultLimit, 1, 100) &&
    isValidNumber(params.similarityThreshold, 0, 1) &&
    (params.keywordWeight === undefined || isValidNumber(params.keywordWeight, 0, 1)) &&
    (params.semanticWeight === undefined || isValidNumber(params.semanticWeight, 0, 1)) &&
    typeof params.enableHighlighting === 'boolean'
  );
}

export function validateGenerationParameters(params: any): params is GenerationParameters {
  if (!params || typeof params !== 'object') return false;
  
  const validStrategies: ContextSelectionStrategy[] = ['top-k', 'threshold', 'diverse'];
  
  return (
    isValidNumber(params.maxContextLength, 1, 100000) &&
    validStrategies.includes(params.contextSelectionStrategy) &&
    isValidNumber(params.temperature, 0, 2) &&
    isValidNumber(params.maxTokens, 1, 100000) &&
    (params.topP === undefined || isValidNumber(params.topP, 0, 1)) &&
    (params.topK === undefined || isValidNumber(params.topK, 1, 500))
  );
}

// API request validation
export function validateEmbeddingRequest(request: any): request is EmbeddingRequest {
  if (!request || typeof request !== 'object') return false;
  
  return (
    isValidArray(request.texts, (text: any) => isValidString(text, 1, 10000)) &&
    request.texts.length > 0 &&
    request.texts.length <= 100 &&
    isValidString(request.model)
  );
}

export function validateGenerationRequest(request: any): request is GenerationRequest {
  if (!request || typeof request !== 'object') return false;
  
  return (
    isValidString(request.prompt, 1, 50000) &&
    isValidString(request.model) &&
    validateGenerationParameters(request.parameters)
  );
}

// API response validation
export function validateEmbeddingResponse(response: any): response is EmbeddingResponse {
  if (!response || typeof response !== 'object') return false;
  
  const isValidEmbedding = (embedding: any) => (
    embedding &&
    typeof embedding === 'object' &&
    Array.isArray(embedding.vector) &&
    embedding.vector.every((v: any) => typeof v === 'number') &&
    isValidString(embedding.model) &&
    isValidNumber(embedding.dimensions, 1)
  );
  
  return (
    isValidArray(response.embeddings, isValidEmbedding) &&
    isValidString(response.model) &&
    response.usage &&
    isValidNumber(response.usage.inputTokens, 0) &&
    isValidNumber(response.usage.totalTokens, 0)
  );
}

export function validateGenerationResponse(response: any): response is GenerationResponse {
  if (!response || typeof response !== 'object') return false;
  
  return (
    isValidString(response.response) &&
    isValidString(response.model) &&
    response.usage &&
    isValidNumber(response.usage.inputTokens, 0) &&
    isValidNumber(response.usage.outputTokens, 0) &&
    isValidNumber(response.usage.totalTokens, 0) &&
    isValidString(response.finishReason)
  );
}

// Error creation helper
export function createValidationError(message: string, details?: any): RAGError {
  return {
    type: 'validation',
    message,
    details,
    timestamp: new Date()
  };
}

// Sanitization functions
export function sanitizeText(text: string): string {
  // Remove potentially harmful characters and normalize whitespace
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

export function sanitizeChunkingParameters(params: Partial<ChunkingParameters>): ChunkingParameters {
  const defaults: ChunkingParameters = {
    strategy: 'fixed-size',
    chunkSize: 500,
    overlap: 50,
    similarityThreshold: 0.7,
    preserveSentences: true,
    preserveParagraphs: false
  };
  
  return {
    strategy: params.strategy || defaults.strategy,
    chunkSize: Math.max(1, Math.min(10000, params.chunkSize || defaults.chunkSize!)),
    overlap: Math.max(0, Math.min(1000, params.overlap || defaults.overlap!)),
    similarityThreshold: Math.max(0, Math.min(1, params.similarityThreshold || defaults.similarityThreshold!)),
    preserveSentences: params.preserveSentences ?? defaults.preserveSentences,
    preserveParagraphs: params.preserveParagraphs ?? defaults.preserveParagraphs
  };
}

export function sanitizeSearchParameters(params: Partial<SearchParameters>): SearchParameters {
  const defaults: SearchParameters = {
    mode: 'hybrid',
    resultLimit: 10,
    similarityThreshold: 0.7,
    keywordWeight: 0.3,
    semanticWeight: 0.7,
    enableHighlighting: true
  };
  
  return {
    mode: params.mode || defaults.mode,
    resultLimit: Math.max(1, Math.min(100, params.resultLimit || defaults.resultLimit)),
    similarityThreshold: Math.max(0, Math.min(1, params.similarityThreshold || defaults.similarityThreshold)),
    keywordWeight: Math.max(0, Math.min(1, params.keywordWeight || defaults.keywordWeight!)),
    semanticWeight: Math.max(0, Math.min(1, params.semanticWeight || defaults.semanticWeight!)),
    enableHighlighting: params.enableHighlighting ?? defaults.enableHighlighting
  };
}

export function sanitizeGenerationParameters(params: Partial<GenerationParameters>): GenerationParameters {
  const defaults: GenerationParameters = {
    maxContextLength: 4000,
    contextSelectionStrategy: 'top-k',
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9,
    topK: 50
  };
  
  return {
    maxContextLength: Math.max(1, Math.min(100000, params.maxContextLength || defaults.maxContextLength)),
    contextSelectionStrategy: params.contextSelectionStrategy || defaults.contextSelectionStrategy,
    temperature: Math.max(0, Math.min(2, params.temperature || defaults.temperature)),
    maxTokens: Math.max(1, Math.min(100000, params.maxTokens || defaults.maxTokens)),
    topP: params.topP !== undefined ? Math.max(0, Math.min(1, params.topP)) : defaults.topP,
    topK: params.topK !== undefined ? Math.max(1, Math.min(500, params.topK)) : defaults.topK
  };
}
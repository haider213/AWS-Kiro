export interface Chunk {
  id: string
  content: string
  startIndex: number
  endIndex: number
  wordCount: number
  charCount: number
  parentId?: string
  isChild?: boolean
  childrenIds?: string[]
}

export type ChunkingStrategy = 'fixed-size' | 'default' | 'sentence' | 'paragraph' | 'hierarchical' | 'semantic' | 'no-chunking'

export interface ChunkingParameters {
  strategy: ChunkingStrategy
  chunkSize: number
  overlap: number
  similarityThreshold: number
  // Hierarchical chunking parameters
  parentChunkSize?: number
  childChunkSize?: number
  // Semantic chunking parameters
  bufferSize?: number
  breakpointThreshold?: number
}

export interface ChunkingMetrics {
  totalChunks: number
  averageChunkSize: number
  minChunkSize: number
  maxChunkSize: number
  totalWords: number
  overlapPercentage: number
}
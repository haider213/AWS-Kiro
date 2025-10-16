import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  Chunk, 
  Embedding, 
  SearchResult, 
  GenerationResult,
  ChunkingParameters,
  SearchParameters,
  GenerationParameters,
  ChunkingStrategy
} from '../types'

// Additional types specific to the store
export type SearchMode = 'keyword' | 'semantic' | 'hybrid'
export type ModuleType = 'chunking' | 'embedding' | 'retrieval' | 'generation'

// Main store interface
interface RAGStore {
  // Current state
  currentModule: ModuleType
  sampleText: string
  
  // Data
  chunks: Chunk[]
  embeddings: Embedding[]
  searchResults: SearchResult[]
  generationResults: GenerationResult[]
  
  // Parameters
  chunkingParameters: ChunkingParameters
  searchParameters: SearchParameters
  generationParameters: GenerationParameters
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // Actions
  setCurrentModule: (module: ModuleType) => void
  setSampleText: (text: string) => void
  setChunks: (chunks: Chunk[]) => void
  setEmbeddings: (embeddings: Embedding[]) => void
  setSearchResults: (results: SearchResult[]) => void
  setGenerationResults: (results: GenerationResult[]) => void
  updateChunkingParameters: (params: Partial<ChunkingParameters>) => void
  updateSearchParameters: (params: Partial<SearchParameters>) => void
  updateGenerationParameters: (params: Partial<GenerationParameters>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetStore: () => void
}

// Default sample text for demonstrations
const DEFAULT_SAMPLE_TEXT = `Artificial Intelligence (AI) has revolutionized numerous industries and continues to shape our future. Machine learning, a subset of AI, enables computers to learn and improve from experience without being explicitly programmed. Deep learning, which uses neural networks with multiple layers, has achieved remarkable breakthroughs in image recognition, natural language processing, and game playing.

Natural Language Processing (NLP) is a field of AI that focuses on the interaction between computers and human language. It involves developing algorithms and models that can understand, interpret, and generate human language in a valuable way. Recent advances in transformer architectures, such as BERT and GPT models, have significantly improved the performance of NLP tasks.

Retrieval-Augmented Generation (RAG) is an innovative approach that combines the power of large language models with external knowledge retrieval. This technique allows AI systems to access and incorporate relevant information from external databases or documents when generating responses, leading to more accurate and contextually relevant outputs. RAG systems typically involve three main components: document chunking, embedding generation, and retrieval mechanisms.`

// Initial state
const initialState = {
  currentModule: 'chunking' as ModuleType,
  sampleText: DEFAULT_SAMPLE_TEXT,
  chunks: [],
  embeddings: [],
  searchResults: [],
  generationResults: [],
  chunkingParameters: {
    strategy: 'fixed-size' as ChunkingStrategy,
    chunkSize: 200,
    overlap: 50,
    similarityThreshold: 0.7,
  },
  searchParameters: {
    mode: 'semantic' as SearchMode,
    resultLimit: 5,
    similarityThreshold: 0.7,
    keywordWeight: 0.3,
    semanticWeight: 0.7,
    enableHighlighting: true,
  },
  generationParameters: {
    maxContextLength: 2000,
    contextSelectionStrategy: 'top-k' as const,
    temperature: 0.7,
    maxTokens: 1000,
  },
  isLoading: false,
  error: null,
}

export const useRAGStore = create<RAGStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Actions
      setCurrentModule: (module) => set({ currentModule: module }),
      
      setSampleText: (text) => set({ sampleText: text }),
      
      setChunks: (chunks) => set({ chunks }),
      
      setEmbeddings: (embeddings) => set({ embeddings }),
      
      setSearchResults: (results) => set({ searchResults: results }),
      
      setGenerationResults: (results) => set({ generationResults: results }),
      
      updateChunkingParameters: (params) =>
        set((state) => ({
          chunkingParameters: { ...state.chunkingParameters, ...params },
        })),
      
      updateSearchParameters: (params) =>
        set((state) => ({
          searchParameters: { ...state.searchParameters, ...params },
        })),
      
      updateGenerationParameters: (params) =>
        set((state) => ({
          generationParameters: { ...state.generationParameters, ...params },
        })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      resetStore: () => set(initialState),
    }),
    {
      name: 'rag-store',
    }
  )
)
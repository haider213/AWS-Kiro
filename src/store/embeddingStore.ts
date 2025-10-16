import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { VisualizationPoint, SimilarityConnection, Chunk } from '../types'

export interface EmbeddingVisualizationSettings {
  dimensions: 2 | 3
  similarityThreshold: number
  showConnections: boolean
  colorScheme: 'similarity' | 'cluster' | 'chunk-size'
  pointSize: number
  perplexity: number
  learningRate: number
  maxIterations: number
}

export interface ClusterInfo {
  id: string
  chunks: Chunk[]
  centroid: VisualizationPoint
  color: string
  averageSimilarity: number
}

interface EmbeddingStore {
  // Visualization data
  visualizationPoints: VisualizationPoint[]
  similarityConnections: SimilarityConnection[]
  clusters: ClusterInfo[]
  
  // Settings
  settings: EmbeddingVisualizationSettings
  
  // UI state
  selectedModel: string
  hoveredChunk: Chunk | null
  selectedChunk: Chunk | null
  isGeneratingEmbeddings: boolean
  isReducingDimensions: boolean
  
  // Computed similarities
  similarityMatrix: number[][]
  
  // Actions
  setVisualizationPoints: (points: VisualizationPoint[]) => void
  setSimilarityConnections: (connections: SimilarityConnection[]) => void
  setClusters: (clusters: ClusterInfo[]) => void
  updateSettings: (settings: Partial<EmbeddingVisualizationSettings>) => void
  setSelectedModel: (model: string) => void
  setHoveredChunk: (chunk: Chunk | null) => void
  setSelectedChunk: (chunk: Chunk | null) => void
  setIsGeneratingEmbeddings: (loading: boolean) => void
  setIsReducingDimensions: (loading: boolean) => void
  setSimilarityMatrix: (matrix: number[][]) => void
  
  // Computed getters
  getVisibleConnections: () => SimilarityConnection[]
  getChunksByCluster: (clusterId: string) => Chunk[]
  getSimilarChunks: (chunk: Chunk, threshold?: number) => Chunk[]
}

const defaultSettings: EmbeddingVisualizationSettings = {
  dimensions: 2,
  similarityThreshold: 0.7,
  showConnections: true,
  colorScheme: 'similarity',
  pointSize: 8,
  perplexity: 30,
  learningRate: 100,
  maxIterations: 1000
}

export const useEmbeddingStore = create<EmbeddingStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      visualizationPoints: [],
      similarityConnections: [],
      clusters: [],
      settings: defaultSettings,
      selectedModel: 'amazon.titan-embed-text-v1',
      hoveredChunk: null,
      selectedChunk: null,
      isGeneratingEmbeddings: false,
      isReducingDimensions: false,
      similarityMatrix: [],

      // Actions
      setVisualizationPoints: (points) => set({ visualizationPoints: points }),
      
      setSimilarityConnections: (connections) => set({ similarityConnections: connections }),
      
      setClusters: (clusters) => set({ clusters }),
      
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        })),
      
      setSelectedModel: (model) => set({ selectedModel: model }),
      
      setHoveredChunk: (chunk) => set({ hoveredChunk: chunk }),
      
      setSelectedChunk: (chunk) => set({ selectedChunk: chunk }),
      
      setIsGeneratingEmbeddings: (loading) => set({ isGeneratingEmbeddings: loading }),
      
      setIsReducingDimensions: (loading) => set({ isReducingDimensions: loading }),
      
      setSimilarityMatrix: (matrix) => set({ similarityMatrix: matrix }),

      // Computed getters
      getVisibleConnections: () => {
        const { similarityConnections, settings } = get()
        return similarityConnections.filter(
          conn => conn.similarity >= settings.similarityThreshold && conn.visible
        )
      },

      getChunksByCluster: (clusterId) => {
        const { clusters } = get()
        const cluster = clusters.find(c => c.id === clusterId)
        return cluster ? cluster.chunks : []
      },

      getSimilarChunks: (chunk, threshold) => {
        const { similarityConnections, settings } = get()
        const actualThreshold = threshold ?? settings.similarityThreshold
        
        return similarityConnections
          .filter(conn => 
            (conn.source.id === chunk.id || conn.target.id === chunk.id) &&
            conn.similarity >= actualThreshold
          )
          .map(conn => conn.source.id === chunk.id ? conn.target : conn.source)
      }
    }),
    {
      name: 'embedding-store'
    }
  )
)
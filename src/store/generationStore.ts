import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  GenerationResult, 
  GenerationParameters,
  Chunk,
  BedrockGenerationModel 
} from '../types'
import { generationService, PromptConstructionResult, ModelComparison } from '../services/generationService'

interface GenerationStore {
  // Current state
  query: string
  selectedModel: string
  promptConstruction: PromptConstructionResult | null
  generationResult: GenerationResult | null
  modelComparisons: ModelComparison[]
  
  // UI state
  isGenerating: boolean
  isComparing: boolean
  showPromptDetails: boolean
  showModelComparison: boolean
  generationError: string | null
  
  // Available models
  availableModels: BedrockGenerationModel[]
  
  // Actions
  setQuery: (query: string) => void
  setSelectedModel: (model: string) => void
  setShowPromptDetails: (show: boolean) => void
  setShowModelComparison: (show: boolean) => void
  
  // Generation actions
  constructPrompt: (query: string, retrievedChunks: Chunk[], parameters: GenerationParameters) => Promise<void>
  generateResponse: (parameters: GenerationParameters) => Promise<void>
  compareModels: (models: string[], parameters: GenerationParameters) => Promise<void>
  
  // Utility actions
  clearGeneration: () => void
  setError: (error: string | null) => void
  resetStore: () => void
}

const initialState = {
  query: '',
  selectedModel: 'anthropic.claude-3-haiku-20240307-v1:0',
  promptConstruction: null,
  generationResult: null,
  modelComparisons: [],
  isGenerating: false,
  isComparing: false,
  showPromptDetails: false,
  showModelComparison: false,
  generationError: null,
  availableModels: generationService.getAvailableModels(),
}

export const useGenerationStore = create<GenerationStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Basic setters
      setQuery: (query) => set({ query }),
      
      setSelectedModel: (model) => set({ selectedModel: model }),
      
      setShowPromptDetails: (show) => set({ showPromptDetails: show }),
      
      setShowModelComparison: (show) => set({ showModelComparison: show }),

      // Construct prompt from query and retrieved chunks
      constructPrompt: async (query, retrievedChunks, parameters) => {
        try {
          set({ generationError: null })
          
          const promptConstruction = generationService.constructPrompt(
            query, 
            retrievedChunks, 
            parameters
          )
          
          set({ 
            query,
            promptConstruction,
            generationResult: null // Clear previous result when constructing new prompt
          })
        } catch (error) {
          console.error('Error constructing prompt:', error)
          set({ 
            generationError: error instanceof Error ? error.message : 'Failed to construct prompt',
            promptConstruction: null
          })
        }
      },

      // Generate response using current prompt
      generateResponse: async (parameters) => {
        const { promptConstruction, selectedModel } = get()
        
        if (!promptConstruction) {
          set({ generationError: 'No prompt constructed. Please construct a prompt first.' })
          return
        }

        try {
          set({ isGenerating: true, generationError: null })
          
          const result = await generationService.generateResponse(
            promptConstruction.prompt,
            selectedModel,
            parameters
          )
          
          // Add context information from prompt construction
          const enhancedResult: GenerationResult = {
            ...result,
            contextUsed: promptConstruction.contextUsed
          }
          
          set({ 
            generationResult: enhancedResult,
            isGenerating: false
          })
        } catch (error) {
          console.error('Error generating response:', error)
          set({ 
            generationError: error instanceof Error ? error.message : 'Failed to generate response',
            isGenerating: false,
            generationResult: null
          })
        }
      },

      // Compare responses from multiple models
      compareModels: async (models, parameters) => {
        const { promptConstruction } = get()
        
        if (!promptConstruction) {
          set({ generationError: 'No prompt constructed. Please construct a prompt first.' })
          return
        }

        try {
          set({ isComparing: true, generationError: null })
          
          const comparisons = await generationService.compareModels(
            promptConstruction.prompt,
            models,
            parameters
          )
          
          // Enhance results with context information
          const enhancedComparisons = comparisons.map(comparison => ({
            ...comparison,
            result: {
              ...comparison.result,
              contextUsed: promptConstruction.contextUsed
            }
          }))
          
          set({ 
            modelComparisons: enhancedComparisons,
            isComparing: false,
            showModelComparison: true
          })
        } catch (error) {
          console.error('Error comparing models:', error)
          set({ 
            generationError: error instanceof Error ? error.message : 'Failed to compare models',
            isComparing: false,
            modelComparisons: []
          })
        }
      },

      // Clear generation results
      clearGeneration: () => set({
        query: '',
        promptConstruction: null,
        generationResult: null,
        modelComparisons: [],
        generationError: null,
        showPromptDetails: false,
        showModelComparison: false
      }),

      // Set error
      setError: (error) => set({ generationError: error }),

      // Reset store to initial state
      resetStore: () => set(initialState),
    }),
    {
      name: 'generation-store',
    }
  )
)
import React, { useState, useEffect } from 'react'
import ChunkingVisualization from './ChunkingVisualization'
import EmbeddingVisualization from './EmbeddingVisualization'
import ChunkingStrategiesComparison from './ChunkingStrategiesComparison'

interface DocumentChunk {
  id: string
  content: string
  word_count: number
  char_count: number
  strategy: string
  similarity_score?: number
  rank?: number
}

interface EmbeddingData {
  embeddings: number[][]
  tsne_coordinates: number[][]
  feature_names: string[]
}

interface ChunkingStrategy {
  name: string
  description: string
  parameters: Record<string, any>
  pros: string[]
  cons: string[]
}

interface SystemPromptConfig {
  temperature: number
  maxTokens: number
  model: string
  systemPrompt: string
}

interface RAGConfig {
  maxChunks: number
  minScore: number
  contextWindow: number
  chunkSize: number
  chunkOverlap: number
  includeMetadata: boolean
}

const FullRAGWorkflow: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['document']))
  const [availableStrategies, setAvailableStrategies] = useState<Record<string, ChunkingStrategy>>({})
  const [selectedChunk, setSelectedChunk] = useState<DocumentChunk | null>(null)
  const [embeddingData, setEmbeddingData] = useState<EmbeddingData | null>(null)
  const [currentStrategy, setCurrentStrategy] = useState('sentence_based')
  const [strategyParameters, setStrategyParameters] = useState<Record<string, any>>({})
  
  const [documentText, setDocumentText] = useState(`# Understanding Retrieval-Augmented Generation (RAG)

## Introduction to RAG
Retrieval-Augmented Generation (RAG) is a powerful technique that combines information retrieval with text generation to create more accurate and contextually relevant AI responses.`) 
 
  const [processedChunks, setProcessedChunks] = useState<DocumentChunk[]>([])
  const [systemConfig, setSystemConfig] = useState<SystemPromptConfig>({
    temperature: 0.7,
    maxTokens: 1000,
    model: 'anthropic.claude-3-haiku-20240307-v1:0',
    systemPrompt: `You are an expert AI assistant specializing in RAG systems.`
  })
  
  const [ragConfig, setRAGConfig] = useState<RAGConfig>({
    maxChunks: 3,
    minScore: 0.7,
    contextWindow: 2000,
    chunkSize: 500,
    chunkOverlap: 50,
    includeMetadata: true
  })
  
  const [query, setQuery] = useState('')
  const [retrievedChunks, setRetrievedChunks] = useState<DocumentChunk[]>([])
  const [finalPrompt, setFinalPrompt] = useState('')
  const [generatedResponse, setGeneratedResponse] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const sampleQueries = [
    "What is RAG and how does it work?",
    "Explain the different text chunking strategies",
    "How do vector embeddings work in RAG systems?",
    "What are the best practices for RAG systems?"
  ]

  // Load available chunking strategies on component mount
  useEffect(() => {
    const loadStrategies = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/chunk-strategies')
        const data = await response.json()
        if (data.success) {
          setAvailableStrategies(data.strategies)
        }
      } catch (error) {
        console.error('Failed to load chunking strategies:', error)
      }
    }
    loadStrategies()
  }, [])

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleStrategyChange = (strategy: string, parameters: Record<string, any>) => {
    setCurrentStrategy(strategy)
    setStrategyParameters(parameters)
  }

  const processDocument = async () => {
    setIsProcessing(true)
    setError('')
    
    try {
      const response = await fetch('http://localhost:5000/api/process-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: documentText,
          strategy: currentStrategy,
          ...strategyParameters
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setProcessedChunks(data.chunks)
        setEmbeddingData(data.embeddings)
        setExpandedSections(prev => new Set([...prev, 'visualization', 'embeddings']))
      } else {
        throw new Error(data.error || 'Failed to process document')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process document')
    } finally {
      setIsProcessing(false)
    }
  }

  const performRetrieval = async () => {
    if (!query.trim() || processedChunks.length === 0) {
      setError('Please process a document and enter a query first')
      return
    }

    setIsProcessing(true)
    setError('')
    
    try {
      const response = await fetch('http://localhost:5000/api/search-chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          top_k: ragConfig.maxChunks
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setRetrievedChunks(data.results)
        
        const context = data.results.map((chunk: DocumentChunk, index: number) => {
          let chunkText = chunk.content
          if (ragConfig.includeMetadata) {
            chunkText = `[Chunk ${index + 1}, Score: ${(chunk.similarity_score! * 100).toFixed(1)}%]\n${chunkText}`
          }
          return chunkText
        }).join('\n\n---\n\n')
        
        const truncatedContext = context.length > ragConfig.contextWindow 
          ? context.substring(0, ragConfig.contextWindow) + '\n\n[Context truncated...]'
          : context
        
        const prompt = `${systemConfig.systemPrompt}\n\nContext:\n${truncatedContext}\n\nQuestion: ${query}\n\nAnswer:`
        setFinalPrompt(prompt)
      } else {
        throw new Error(data.error || 'Failed to search chunks')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve relevant chunks')
    } finally {
      setIsProcessing(false)
    }
  }  c
onst generateResponse = async () => {
    if (!finalPrompt.trim()) {
      setError('Please retrieve chunks first to generate a prompt')
      return
    }

    setIsGenerating(true)
    setError('')
    
    try {
      const response = await fetch('http://localhost:3001/api/generation/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: systemConfig.model,
          parameters: {
            temperature: systemConfig.temperature,
            maxTokens: systemConfig.maxTokens
          }
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setGeneratedResponse(data.result.response)
      } else {
        throw new Error(data.error || 'Generation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate response')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">🚀 Interactive RAG Playground</h1>
        <p className="text-blue-100 mb-4">
          Explore and experiment with every part of the RAG pipeline with advanced visualizations
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{processedChunks.length}</div>
            <div className="text-xs text-blue-200">Document Chunks</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{retrievedChunks.length}</div>
            <div className="text-xs text-blue-200">Retrieved Chunks</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{query ? '1' : '0'}</div>
            <div className="text-xs text-blue-200">Active Query</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{generatedResponse ? '1' : '0'}</div>
            <div className="text-xs text-blue-200">AI Response</div>
          </div>
        </div>
      </div>   
   {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400">❌</div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chunking Strategies Comparison */}
      {Object.keys(availableStrategies).length > 0 && (
        <ChunkingStrategiesComparison
          strategies={availableStrategies}
          currentStrategy={currentStrategy}
          onStrategyChange={handleStrategyChange}
        />
      )}

      {/* Document Processing Section */}
      <div className="bg-white rounded-lg shadow-lg">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('document')}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              processedChunks.length > 0 ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              {processedChunks.length > 0 ? '✓' : '📄'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Document Processing & Chunking</h2>
              <p className="text-sm text-gray-600">
                Upload documents, configure chunking, and process text with Python backend
              </p>
            </div>
          </div>
          <div className="text-gray-400">
            {expandedSections.has('document') ? '▼' : '▶'}
          </div>
        </div>
        
        {expandedSections.has('document') && (
          <div className="p-6 border-t border-gray-200">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Text
                </label>
                <textarea
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paste your document text here..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  {documentText.length} characters • ~{Math.ceil(documentText.length / 4)} tokens
                </p>
              </div>

              <button
                onClick={processDocument}
                disabled={isProcessing || !documentText.trim()}
                className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isProcessing ? '⏳ Processing with Python Backend...' : '🔄 Process Document with AI'}
              </button>
              
              {processedChunks.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    ✅ Document processed into {processedChunks.length} chunks using {currentStrategy.replace('_', ' ')} strategy
                  </h4>
                  <div className="text-sm text-green-700">
                    Average chunk size: {Math.round(processedChunks.reduce((sum, chunk) => sum + chunk.char_count, 0) / processedChunks.length)} characters
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
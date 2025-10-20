import React, { useState, useEffect } from 'react'
import ChunkingPhase from './phases/ChunkingPhase'
import EmbeddingPhase from './phases/EmbeddingPhase'
import RetrievalPhase from './phases/RetrievalPhase'
import GenerationPhase from './phases/GenerationPhase'
import EvaluationPhase from './phases/EvaluationPhase'

interface DocumentChunk {
  id: string
  content: string
  word_count: number
  char_count: number
  strategy: string
  similarity_score?: number
  rank?: number
  initial_rank?: number
  combined_score?: number
  bm25_score?: number
  keyword_score?: number
  diversity_score?: number
  length_score?: number
  cross_encoder_score?: number
  chunk_index?: number
}

interface EmbeddingData {
  embeddings: number[][]
  tsne_coordinates: number[][]
  feature_names: string[]
  method: string
  model_id: string
  dimensions: number
}

interface EvaluationResult {
  rating: number | null
  explanation: string
  raw_response: string
}

interface RAGEvaluation {
  relevance: EvaluationResult
  completeness: EvaluationResult
  answer_quality: EvaluationResult
  faithfulness: EvaluationResult
}

interface RetrievalEvaluation {
  relevance: EvaluationResult
  coverage: EvaluationResult
  diversity: EvaluationResult
  ranking: EvaluationResult
  overall: EvaluationResult
}

const RAGPipelineEducator: React.FC = () => {
  // Backend URL from environment variable
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
  
  // Global state for the RAG pipeline
  const [documentText, setDocumentText] = useState(`# Understanding Retrieval-Augmented Generation (RAG)

## What is RAG?
Retrieval-Augmented Generation (RAG) is a powerful AI technique that combines information retrieval with text generation to create more accurate and contextually relevant responses. RAG systems work by first retrieving relevant information from a knowledge base, then using that information to generate more informed responses.

## Key Components of RAG
1. **Document Processing**: Breaking down documents into manageable chunks for efficient processing
2. **Vector Embeddings**: Converting text into numerical representations that capture semantic meaning
3. **Similarity Search**: Finding relevant chunks based on query similarity using various distance metrics
4. **Response Generation**: Using retrieved context to generate accurate, contextual answers

## Benefits of RAG
- **Improved Accuracy**: External knowledge reduces hallucination in AI responses
- **Up-to-date Information**: Can work with current data without retraining models
- **Source Attribution**: Provides transparency through traceable source references
- **Domain Expertise**: Can be specialized for specific knowledge domains

## RAG Pipeline Phases
This educational tool demonstrates each phase of the RAG pipeline with interactive controls and real-time visualizations to help you understand how each component affects the final output.`)

  // Phase data
  const [processedChunks, setProcessedChunks] = useState<DocumentChunk[]>([])
  const [embeddingData, setEmbeddingData] = useState<EmbeddingData | null>(null)
  const [retrievedChunks, setRetrievedChunks] = useState<DocumentChunk[]>([])
  const [generatedResponse, setGeneratedResponse] = useState('')
  const [query, setQuery] = useState('What is RAG and how does it work?')

  // Current phase settings
  const [chunkingStrategy, setChunkingStrategy] = useState('sentence_based')
  const [embeddingMethod, setEmbeddingMethod] = useState('bedrock')
  const [embeddingModel, setEmbeddingModel] = useState('amazon.titan-embed-text-v1')
  const [similarityMetric, setSimilarityMetric] = useState<'cosine' | 'euclidean' | 'dot_product'>('cosine')
  const [rerankingMethod, setRerankingMethod] = useState('none')
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonResults, setComparisonResults] = useState<DocumentChunk[]>([])
  const [generationModel, setGenerationModel] = useState('anthropic.claude-3-haiku-20240307-v1:0')

  // Evaluation state
  const [ragEvaluation, setRagEvaluation] = useState<RAGEvaluation | null>(null)
  const [retrievalEvaluation, setRetrievalEvaluation] = useState<RetrievalEvaluation | null>(null)
  const [overallScore, setOverallScore] = useState<number | null>(null)
  const [evaluationSummary, setEvaluationSummary] = useState('')

  // UI state
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  // Process document when text or strategy changes
  useEffect(() => {
    if (documentText.trim()) {
      processDocument()
    }
  }, [documentText, chunkingStrategy, embeddingMethod, embeddingModel])

  const processDocument = async () => {
    setIsProcessing(true)
    setError('')
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/process-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: documentText,
          strategy: chunkingStrategy,
          embedding_method: embeddingMethod,
          embedding_model: embeddingModel,
          chunk_size: 500,
          overlap: 50,
          sentences_per_chunk: 3
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setProcessedChunks(data.chunks)
        setEmbeddingData(data.embeddings)
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
      // Get results with current reranking method
      const response = await fetch(`${BACKEND_URL}/api/search-chunks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          top_k: 3,
          similarity_metric: similarityMetric,
          reranking_method: rerankingMethod
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('Search results received:', data.results)
        console.log('Reranking method used:', data.reranking_method)
        setRetrievedChunks(data.results)
        
        // If reranking is enabled, also get comparison results without reranking
        if (rerankingMethod !== 'none') {
          try {
            const comparisonResponse = await fetch(`${BACKEND_URL}/api/search-chunks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: query,
                top_k: 3,
                similarity_metric: similarityMetric,
                reranking_method: 'none'
              })
            })
            
            const comparisonData = await comparisonResponse.json()
            if (comparisonData.success) {
              setComparisonResults(comparisonData.results)
            }
          } catch (compErr) {
            console.warn('Failed to get comparison results:', compErr)
          }
        } else {
          setComparisonResults([])
        }
      } else {
        throw new Error(data.error || 'Failed to search chunks')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve relevant chunks')
    } finally {
      setIsProcessing(false)
    }
  }

  const generateResponse = async () => {
    if (retrievedChunks.length === 0) {
      setError('Please retrieve chunks first')
      return
    }

    setIsProcessing(true)
    setError('')
    
    try {
      const context = retrievedChunks.map((chunk, index) => {
        return `[Source ${index + 1}]: ${chunk.content}`
      }).join('\n\n')
      
      const prompt = `Based on the following context, answer the question accurately and concisely.

Context:
${context}

Question: ${query}

Answer:`

      const response = await fetch(`${BACKEND_URL}/api/bedrock/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          model_id: generationModel,
          max_tokens: 1000,
          temperature: 0.7
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setGeneratedResponse(data.generated_text)
        // Clear previous evaluations when new response is generated
        setRagEvaluation(null)
        setRetrievalEvaluation(null)
        setOverallScore(null)
        setEvaluationSummary('')
      } else {
        throw new Error(data.error || 'Generation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate response')
    } finally {
      setIsProcessing(false)
    }
  }

  const evaluateRAG = async () => {
    if (!query.trim() || retrievedChunks.length === 0 || !generatedResponse.trim()) {
      setError('Please complete retrieval and generation phases first')
      return
    }

    setIsProcessing(true)
    setError('')
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/evaluate-rag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          retrieved_chunks: retrievedChunks,
          generated_response: generatedResponse,
          evaluation_model: generationModel
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setRagEvaluation(data.evaluations)
        setOverallScore(data.overall_score)
        setEvaluationSummary(data.summary)
      } else {
        throw new Error(data.error || 'Evaluation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate RAG pipeline')
    } finally {
      setIsProcessing(false)
    }
  }

  const evaluateRetrieval = async () => {
    if (!query.trim() || retrievedChunks.length === 0) {
      setError('Please complete retrieval phase first')
      return
    }

    setIsProcessing(true)
    setError('')
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/evaluate-retrieval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          retrieved_chunks: retrievedChunks,
          evaluation_model: generationModel
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setRetrievalEvaluation(data.evaluations)
      } else {
        throw new Error(data.error || 'Evaluation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate retrieval')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold mb-4">🚀 RAG Pipeline Educator</h1>
          <p className="text-xl text-blue-100 mb-6">
            Interactive exploration of Retrieval-Augmented Generation with real-time visualizations
          </p>
          
          {/* Pipeline Progress */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{processedChunks.length}</div>
              <div className="text-xs text-blue-200">Document Chunks</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{embeddingData ? embeddingData.dimensions : 0}</div>
              <div className="text-xs text-blue-200">Embedding Dimensions</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{retrievedChunks.length}</div>
              <div className="text-xs text-blue-200">Retrieved Chunks</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{generatedResponse ? '1' : '0'}</div>
              <div className="text-xs text-blue-200">AI Response</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{overallScore ? overallScore.toFixed(1) : '0'}</div>
              <div className="text-xs text-blue-200">Evaluation Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-400 text-xl">⚠️</div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-800">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Phase 1: Document Chunking */}
        <ChunkingPhase
          documentText={documentText}
          onDocumentTextChange={setDocumentText}
          chunkingStrategy={chunkingStrategy}
          onChunkingStrategyChange={setChunkingStrategy}
          processedChunks={processedChunks}
          isProcessing={isProcessing}
          onProcessDocument={processDocument}
        />

        {/* Phase 2: Embedding Generation */}
        <EmbeddingPhase
          processedChunks={processedChunks}
          embeddingData={embeddingData}
          embeddingMethod={embeddingMethod}
          onEmbeddingMethodChange={setEmbeddingMethod}
          embeddingModel={embeddingModel}
          onEmbeddingModelChange={setEmbeddingModel}
          isProcessing={isProcessing}
        />

        {/* Phase 3: Information Retrieval */}
        <RetrievalPhase
          processedChunks={processedChunks}
          embeddingData={embeddingData}
          query={query}
          onQueryChange={setQuery}
          retrievedChunks={retrievedChunks}
          similarityMetric={similarityMetric}
          onSimilarityMetricChange={setSimilarityMetric}
          rerankingMethod={rerankingMethod}
          onRerankingMethodChange={setRerankingMethod}
          onPerformRetrieval={performRetrieval}
          isProcessing={isProcessing}
          comparisonResults={comparisonResults}
          showComparison={showComparison}
          onShowComparisonChange={setShowComparison}
        />

        {/* Phase 4: Response Generation */}
        <GenerationPhase
          retrievedChunks={retrievedChunks}
          query={query}
          generationModel={generationModel}
          onGenerationModelChange={setGenerationModel}
          generatedResponse={generatedResponse}
          onGenerateResponse={generateResponse}
          isProcessing={isProcessing}
        />

        {/* Phase 5: LLM-as-a-Judge Evaluation */}
        <EvaluationPhase
          query={query}
          retrievedChunks={retrievedChunks}
          generatedResponse={generatedResponse}
          onEvaluateRAG={evaluateRAG}
          onEvaluateRetrieval={evaluateRetrieval}
          isProcessing={isProcessing}
          ragEvaluation={ragEvaluation}
          retrievalEvaluation={retrievalEvaluation}
          overallScore={overallScore}
          evaluationSummary={evaluationSummary}
        />
      </div>
    </div>
  )
}

export default RAGPipelineEducator
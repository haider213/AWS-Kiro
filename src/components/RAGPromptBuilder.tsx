import React, { useState, useEffect } from 'react'

interface DocumentChunk {
  id: string
  content: string
  source: string
  score: number
  metadata: {
    title: string
    section: string
    wordCount: number
    timestamp: string
  }
}

interface RAGPromptConfig {
  maxChunks: number
  minScore: number
  contextWindow: number
  promptTemplate: string
  includeMetadata: boolean
  chunkSeparator: string
}

const RAGPromptBuilder: React.FC = () => {
  const [query, setQuery] = useState('')
  const [retrievedChunks, setRetrievedChunks] = useState<DocumentChunk[]>([])
  const [finalPrompt, setFinalPrompt] = useState('')
  const [isRetrieving, setIsRetrieving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResponse, setGeneratedResponse] = useState('')
  const [generationError, setGenerationError] = useState('')
  const [config, setConfig] = useState<RAGPromptConfig>({
    maxChunks: 3,
    minScore: 0.7,
    contextWindow: 2000,
    promptTemplate: `You are a helpful AI assistant. Use the following context to answer the user's question accurately and comprehensively.

Context:
{context}

Question: {query}

Instructions:
- Base your answer primarily on the provided context
- If the context doesn't contain enough information, clearly state what's missing
- Cite specific parts of the context when relevant
- Maintain a helpful and educational tone

Answer:`,
    includeMetadata: true,
    chunkSeparator: '\n\n---\n\n'
  })

  // Sample document chunks for demonstration
  const sampleDocuments: DocumentChunk[] = [
    {
      id: 'chunk_1',
      content: 'Retrieval-Augmented Generation (RAG) is a technique that combines information retrieval with text generation. It works by first retrieving relevant documents from a knowledge base, then using those documents as context to generate more accurate and informed responses. This approach helps overcome the limitations of pure language models by providing them with up-to-date, domain-specific information.',
      source: 'rag_fundamentals.pdf',
      score: 0.95,
      metadata: {
        title: 'RAG Fundamentals',
        section: 'Introduction',
        wordCount: 67,
        timestamp: '2024-01-15T10:30:00Z'
      }
    },
    {
      id: 'chunk_2',
      content: 'Text chunking is a critical preprocessing step in RAG systems. It involves breaking down large documents into smaller, manageable pieces that can be effectively processed by embedding models. Common chunking strategies include fixed-size chunking (splitting by character or token count), sentence-based chunking, and semantic chunking (splitting based on topic boundaries). The choice of chunking strategy significantly impacts retrieval quality.',
      source: 'text_processing.pdf',
      score: 0.88,
      metadata: {
        title: 'Text Processing in RAG',
        section: 'Chunking Strategies',
        wordCount: 73,
        timestamp: '2024-01-16T14:20:00Z'
      }
    },
    {
      id: 'chunk_3',
      content: 'Vector embeddings are numerical representations of text that capture semantic meaning. In RAG systems, both the document chunks and user queries are converted into embeddings using models like BERT, Sentence-BERT, or OpenAI\'s text-embedding models. Similarity between embeddings is typically measured using cosine similarity or dot product, allowing the system to find the most relevant chunks for a given query.',
      source: 'embeddings_guide.pdf',
      score: 0.82,
      metadata: {
        title: 'Understanding Embeddings',
        section: 'Vector Representations',
        wordCount: 71,
        timestamp: '2024-01-17T09:15:00Z'
      }
    },
    {
      id: 'chunk_4',
      content: 'The retrieval phase in RAG involves searching through the vector database to find chunks most similar to the user\'s query. This typically uses approximate nearest neighbor (ANN) algorithms like FAISS, Pinecone, or Weaviate for efficient similarity search. The retrieved chunks are then ranked by relevance score, and the top-k most relevant chunks are selected for context.',
      source: 'retrieval_systems.pdf',
      score: 0.79,
      metadata: {
        title: 'Retrieval Systems',
        section: 'Similarity Search',
        wordCount: 68,
        timestamp: '2024-01-18T11:45:00Z'
      }
    },
    {
      id: 'chunk_5',
      content: 'Prompt engineering for RAG systems requires careful consideration of context length, chunk ordering, and instruction clarity. The system prompt should clearly instruct the model to use the provided context, handle cases where context is insufficient, and maintain consistency with the retrieved information. Effective prompts also include examples of desired behavior and clear formatting instructions.',
      source: 'prompt_engineering.pdf',
      score: 0.76,
      metadata: {
        title: 'RAG Prompt Engineering',
        section: 'Best Practices',
        wordCount: 69,
        timestamp: '2024-01-19T16:30:00Z'
      }
    },
    {
      id: 'chunk_6',
      content: 'Evaluation of RAG systems involves multiple metrics including retrieval accuracy (how well the system finds relevant chunks), generation quality (fluency and coherence of responses), and factual accuracy (whether the generated content aligns with the source material). Common evaluation frameworks include RAGAS, which provides automated metrics for RAG system assessment.',
      source: 'evaluation_methods.pdf',
      score: 0.73,
      metadata: {
        title: 'RAG Evaluation',
        section: 'Metrics and Methods',
        wordCount: 65,
        timestamp: '2024-01-20T13:10:00Z'
      }
    }
  ]

  const sampleQueries = [
    "What is RAG and how does it work?",
    "Explain different text chunking strategies",
    "How do vector embeddings work in RAG?",
    "What is the retrieval process in RAG systems?",
    "How do you evaluate RAG system performance?"
  ]

  const simulateRetrieval = async (searchQuery: string) => {
    setIsRetrieving(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simple keyword-based scoring simulation
    const scoredChunks = sampleDocuments.map(chunk => {
      const queryWords = searchQuery.toLowerCase().split(' ')
      const chunkWords = chunk.content.toLowerCase().split(' ')
      
      // Calculate simple relevance score based on keyword overlap
      const overlap = queryWords.filter(word => 
        chunkWords.some(chunkWord => chunkWord.includes(word) || word.includes(chunkWord))
      ).length
      
      const adjustedScore = Math.min(chunk.score * (1 + overlap * 0.1), 1.0)
      
      return {
        ...chunk,
        score: adjustedScore
      }
    })
    
    // Filter and sort chunks
    const relevantChunks = scoredChunks
      .filter(chunk => chunk.score >= config.minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, config.maxChunks)
    
    setRetrievedChunks(relevantChunks)
    setIsRetrieving(false)
  }

  const buildPrompt = () => {
    if (retrievedChunks.length === 0) return ''
    
    // Build context from retrieved chunks
    let context = retrievedChunks.map((chunk, index) => {
      let chunkText = chunk.content
      
      if (config.includeMetadata) {
        chunkText = `[Source: ${chunk.metadata.title} - ${chunk.metadata.section}]\n${chunkText}`
      }
      
      return `Chunk ${index + 1} (Relevance: ${(chunk.score * 100).toFixed(1)}%):\n${chunkText}`
    }).join(config.chunkSeparator)
    
    // Truncate context if it exceeds the window
    if (context.length > config.contextWindow) {
      context = context.substring(0, config.contextWindow) + '\n\n[Context truncated due to length limits...]'
    }
    
    // Replace placeholders in template
    const prompt = config.promptTemplate
      .replace('{context}', context)
      .replace('{query}', query)
    
    return prompt
  }

  useEffect(() => {
    if (retrievedChunks.length > 0) {
      setFinalPrompt(buildPrompt())
    }
  }, [retrievedChunks, config, query])

  const handleSearch = () => {
    if (query.trim()) {
      simulateRetrieval(query)
    }
  }

  const handleConfigChange = (key: keyof RAGPromptConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const generateResponse = async () => {
    if (!finalPrompt.trim()) {
      alert('Please retrieve chunks first to generate a prompt')
      return
    }

    setIsGenerating(true)
    setGenerationError('')
    setGeneratedResponse('')

    try {
      const response = await fetch('http://localhost:3001/api/generation/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: 'anthropic.claude-3-haiku-20240307-v1:0',
          parameters: {
            temperature: 0.7,
            maxTokens: 1000
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
    } catch (error) {
      console.error('Generation error:', error)
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate response')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">🔍 RAG Prompt Builder</h2>
        <p className="text-blue-100">
          See how queries are transformed into context-aware prompts through retrieval and prompt engineering
        </p>
      </div>

      {/* Query Input */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">1️⃣ Enter Your Query</h3>
        
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your question about RAG systems..."
              className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={isRetrieving || !query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isRetrieving ? '🔍 Searching...' : '🚀 Search'}
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Test Queries
            </label>
            <div className="flex flex-wrap gap-2">
              {sampleQueries.map((sampleQuery, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(sampleQuery)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {sampleQuery}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Retrieval & Prompt Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Chunks: {config.maxChunks}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={config.maxChunks}
              onChange={(e) => handleConfigChange('maxChunks', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Score: {config.minScore}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.minScore}
              onChange={(e) => handleConfigChange('minScore', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Context Window: {config.contextWindow}
            </label>
            <input
              type="range"
              min="500"
              max="4000"
              step="100"
              value={config.contextWindow}
              onChange={(e) => handleConfigChange('contextWindow', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
        
        <div className="mt-4 flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.includeMetadata}
              onChange={(e) => handleConfigChange('includeMetadata', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Include chunk metadata</span>
          </label>
        </div>
      </div>

      {/* Retrieved Chunks */}
      {retrievedChunks.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            2️⃣ Retrieved Chunks ({retrievedChunks.length})
          </h3>
          
          <div className="space-y-4">
            {retrievedChunks.map((chunk, index) => (
              <div key={chunk.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                      Rank #{index + 1}
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                      Score: {(chunk.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {chunk.metadata.title} - {chunk.metadata.section}
                  </div>
                </div>
                
                <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded">
                  {chunk.content}
                </div>
                
                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                  <span>📄 {chunk.source}</span>
                  <span>📝 {chunk.metadata.wordCount} words</span>
                  <span>🕒 {new Date(chunk.metadata.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompt Template Editor */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">3️⃣ Prompt Template</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template (use {'{context}'} and {'{query}'} placeholders)
            </label>
            <textarea
              value={config.promptTemplate}
              onChange={(e) => handleConfigChange('promptTemplate', e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Template Variables</h4>
            <div className="text-blue-800 text-sm space-y-1">
              <div><code className="bg-blue-100 px-1 rounded">{'{context}'}</code> - Retrieved chunks formatted with metadata</div>
              <div><code className="bg-blue-100 px-1 rounded">{'{query}'}</code> - Original user query</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Prompt */}
      {finalPrompt && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">4️⃣ Generated Prompt</h3>
            <div className="space-x-2">
              <button
                onClick={() => navigator.clipboard.writeText(finalPrompt)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium text-sm"
              >
                📋 Copy Prompt
              </button>
              <button
                onClick={generateResponse}
                disabled={isGenerating || !finalPrompt.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                {isGenerating ? '⏳ Generating...' : '🚀 Generate Response'}
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed max-h-96 overflow-y-auto">
              {finalPrompt}
            </pre>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <div className="font-medium text-blue-900">Total Length</div>
              <div className="text-blue-700">{finalPrompt.length} characters</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="font-medium text-green-900">Est. Tokens</div>
              <div className="text-green-700">~{Math.ceil(finalPrompt.length / 4)}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="font-medium text-purple-900">Chunks Used</div>
              <div className="text-purple-700">{retrievedChunks.length}</div>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <div className="font-medium text-orange-900">Avg. Relevance</div>
              <div className="text-orange-700">
                {retrievedChunks.length > 0 
                  ? (retrievedChunks.reduce((sum, chunk) => sum + chunk.score, 0) / retrievedChunks.length * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generated Response */}
      {(generatedResponse || generationError || isGenerating) && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">5️⃣ AI Generated Response</h3>
          
          {isGenerating && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Generating response using AWS Bedrock...</span>
            </div>
          )}
          
          {generationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-800">Generation Error</h4>
                  <p className="text-sm text-red-700 mt-1">{generationError}</p>
                </div>
              </div>
              <div className="mt-3">
                <button
                  onClick={generateResponse}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium text-sm"
                >
                  🔄 Retry Generation
                </button>
              </div>
            </div>
          )}
          
          {generatedResponse && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-purple-900">🤖 Claude 3 Haiku Response</h4>
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedResponse)}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                  >
                    📋 Copy
                  </button>
                </div>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {generatedResponse}
                  </div>
                </div>
              </div>
              
              {/* Response Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="font-medium text-blue-900">Response Length</div>
                  <div className="text-blue-700">{generatedResponse.length} characters</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="font-medium text-green-900">Est. Tokens</div>
                  <div className="text-green-700">~{Math.ceil(generatedResponse.length / 4)}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="font-medium text-purple-900">Context Used</div>
                  <div className="text-purple-700">{retrievedChunks.length} chunks</div>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <div className="font-medium text-orange-900">Model</div>
                  <div className="text-orange-700">Claude 3 Haiku</div>
                </div>
              </div>
              
              {/* Context Attribution */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">📚 Sources Used in Response</h4>
                <div className="space-y-2">
                  {retrievedChunks.map((chunk, index) => (
                    <div key={chunk.id} className="flex items-center space-x-2 text-sm">
                      <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                        #{index + 1}
                      </span>
                      <span className="text-yellow-800">
                        {chunk.metadata.title} - {chunk.metadata.section}
                      </span>
                      <span className="text-yellow-600">
                        ({(chunk.score * 100).toFixed(1)}% relevance)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setGeneratedResponse('')
                    setGenerationError('')
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium text-sm"
                >
                  🗑️ Clear Response
                </button>
                <button
                  onClick={generateResponse}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 font-medium text-sm"
                >
                  🔄 Generate New Response
                </button>
                <button
                  onClick={() => {
                    const fullConversation = `Query: ${query}\n\nContext Used:\n${retrievedChunks.map((chunk, i) => `${i+1}. ${chunk.content}`).join('\n\n')}\n\nGenerated Response:\n${generatedResponse}`
                    navigator.clipboard.writeText(fullConversation)
                    alert('Full conversation copied to clipboard!')
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium text-sm"
                >
                  📄 Export Full Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RAGPromptBuilder
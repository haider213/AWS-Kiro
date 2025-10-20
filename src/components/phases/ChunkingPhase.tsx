import React, { useState } from 'react'
import ChunkingVisualization from '../visualizations/ChunkingVisualization'

interface DocumentChunk {
  id: string
  content: string
  word_count: number
  char_count: number
  strategy: string
}

interface ChunkingPhaseProps {
  documentText: string
  onDocumentTextChange: (text: string) => void
  chunkingStrategy: string
  onChunkingStrategyChange: (strategy: string) => void
  processedChunks: DocumentChunk[]
  isProcessing: boolean
  onProcessDocument: () => void
}

const ChunkingPhase: React.FC<ChunkingPhaseProps> = ({
  documentText,
  onDocumentTextChange,
  chunkingStrategy,
  onChunkingStrategyChange,
  processedChunks,
  isProcessing,
  onProcessDocument
}) => {
  const [selectedChunk, setSelectedChunk] = useState<DocumentChunk | null>(null)
  const [chunkSize, setChunkSize] = useState(500)
  const [overlap, setOverlap] = useState(50)
  const [sentencesPerChunk, setSentencesPerChunk] = useState(3)

  const chunkingStrategies = [
    {
      id: 'sentence_based',
      name: 'Sentence-Based Chunking',
      description: 'Each sentence becomes a separate chunk using NLTK tokenization',
      icon: '📝',
      color: 'blue',
      pros: ['Preserves sentence boundaries', 'Simple and reliable', 'Natural language units'],
      cons: ['Variable chunk sizes', 'May create very small chunks'],
      parameters: []
    },
    {
      id: 'fixed_size',
      name: 'Fixed-Size Chunking',
      description: 'Creates chunks of consistent character length',
      icon: '📏',
      color: 'green',
      pros: ['Consistent chunk sizes', 'Predictable memory usage', 'Simple implementation'],
      cons: ['May break sentences', 'Ignores semantic boundaries'],
      parameters: ['chunk_size', 'overlap']
    },
    {
      id: 'paragraph_based',
      name: 'Paragraph-Based Chunking',
      description: 'Uses natural paragraph breaks as chunk boundaries',
      icon: '📄',
      color: 'purple',
      pros: ['Preserves document structure', 'Semantic coherence', 'Natural boundaries'],
      cons: ['Variable chunk sizes', 'Depends on document formatting'],
      parameters: []
    },
    {
      id: 'semantic_based',
      name: 'Semantic-Based Chunking',
      description: 'Groups semantically similar sentences together',
      icon: '🧠',
      color: 'orange',
      pros: ['Semantic coherence', 'Context preservation', 'Intelligent boundaries'],
      cons: ['Computationally expensive', 'Variable chunk sizes', 'Complex implementation'],
      parameters: ['similarity_threshold']
    }
  ]

  const currentStrategy = chunkingStrategies.find(s => s.id === chunkingStrategy)

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Phase Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
            📄
          </div>
          <div>
            <h2 className="text-2xl font-bold">Phase 1: Document Chunking</h2>
            <p className="text-blue-100">
              Break down documents into manageable pieces for processing
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎯 Purpose</h4>
            <p className="text-sm text-blue-100">
              Divide large documents into smaller, semantically meaningful chunks that can be processed efficiently.
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">⚙️ Key Factors</h4>
            <ul className="text-sm text-blue-100 space-y-1">
              <li>• Chunk size and overlap</li>
              <li>• Semantic boundaries</li>
              <li>• Context preservation</li>
            </ul>
          </div>
          <div className="bg-white/10 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📊 Impact</h4>
            <p className="text-sm text-blue-100">
              Chunking strategy directly affects retrieval quality and response accuracy.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Document Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Text
          </label>
          <textarea
            value={documentText}
            onChange={(e) => onDocumentTextChange(e.target.value)}
            className="w-full h-48 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter your document text here..."
          />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{documentText.length} characters</span>
            <span>~{Math.ceil(documentText.length / 4)} tokens</span>
          </div>
        </div>

        {/* Chunking Strategy Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Chunking Strategies</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {chunkingStrategies.map((strategy) => (
              <div
                key={strategy.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  chunkingStrategy === strategy.id
                    ? `border-${strategy.color}-500 bg-${strategy.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onChunkingStrategyChange(strategy.id)}
              >
                <div className="text-center mb-3">
                  <div className="text-3xl mb-2">{strategy.icon}</div>
                  <h4 className="font-semibold text-gray-900">{strategy.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-green-700">Pros:</span>
                    <ul className="text-xs text-green-600 ml-2">
                      {strategy.pros.slice(0, 2).map((pro, index) => (
                        <li key={index}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-red-700">Cons:</span>
                    <ul className="text-xs text-red-600 ml-2">
                      {strategy.cons.slice(0, 2).map((con, index) => (
                        <li key={index}>• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy Parameters */}
        {currentStrategy && currentStrategy.parameters.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Strategy Parameters</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentStrategy.parameters.includes('chunk_size') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chunk Size: {chunkSize} characters
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={chunkSize}
                    onChange={(e) => setChunkSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>100</span>
                    <span>2000</span>
                  </div>
                </div>
              )}
              
              {currentStrategy.parameters.includes('sentences_per_chunk') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sentences per Chunk: {sentencesPerChunk}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={sentencesPerChunk}
                    onChange={(e) => setSentencesPerChunk(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>
              )}
              
              {currentStrategy.parameters.includes('overlap') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overlap: {overlap} characters
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="10"
                    value={overlap}
                    onChange={(e) => setOverlap(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>200</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Process Button */}
        <button
          onClick={onProcessDocument}
          disabled={isProcessing || !documentText.trim()}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {isProcessing ? '⏳ Processing Document...' : '🔄 Process Document'}
        </button>

        {/* Results */}
        {processedChunks.length > 0 && (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{processedChunks.length}</div>
                <div className="text-sm text-blue-600">Total Chunks</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(processedChunks.reduce((sum, chunk) => sum + chunk.char_count, 0) / processedChunks.length)}
                </div>
                <div className="text-sm text-green-600">Avg Characters</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(processedChunks.reduce((sum, chunk) => sum + chunk.word_count, 0) / processedChunks.length)}
                </div>
                <div className="text-sm text-purple-600">Avg Words</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{currentStrategy?.name.split(' ')[0]}</div>
                <div className="text-sm text-orange-600">Strategy</div>
              </div>
            </div>

            {/* Visualization */}
            <ChunkingVisualization
              chunks={processedChunks}
              strategy={chunkingStrategy}
              onChunkSelect={setSelectedChunk}
              selectedChunk={selectedChunk}
            />

            {/* Chunk List */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Generated Chunks</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {processedChunks.map((chunk, index) => (
                  <div
                    key={chunk.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedChunk?.id === chunk.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedChunk(chunk)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Chunk {index + 1}
                      </span>
                      <div className="flex space-x-4 text-xs text-gray-500">
                        <span>{chunk.word_count} words</span>
                        <span>{chunk.char_count} chars</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChunkingPhase
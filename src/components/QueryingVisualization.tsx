import { useState, useMemo } from 'react'
import type { Chunk } from '../types/chunking'

interface QueryingVisualizationProps {
  chunks: Chunk[]
  onBack?: () => void
}

interface QueryResult {
  chunk: Chunk
  similarity: number
  rank: number
  rerankScore?: number
  finalRank?: number
  selected: boolean
}

interface QueryEmbedding {
  vector: number[]
  dimensions: number
}

const SAMPLE_QUERIES = [
  "What is artificial intelligence?",
  "How does machine learning work?",
  "Explain deep learning neural networks",
  "What are the applications of AI?",
  "How does natural language processing work?"
]

const RERANKING_METHODS = [
  { id: 'none', name: 'No Reranking', description: 'Use only vector similarity' },
  { id: 'cross-encoder', name: 'Cross-Encoder', description: 'Deep semantic understanding' },
  { id: 'bm25', name: 'BM25 Hybrid', description: 'Combine semantic + keyword matching' },
  { id: 'llm-rerank', name: 'LLM Reranking', description: 'Use LLM to judge relevance' }
]

const SIMILARITY_METRICS = [
  { id: 'cosine', name: 'Cosine Similarity', description: 'Measures angle between vectors' },
  { id: 'euclidean', name: 'Euclidean Distance', description: 'Straight-line distance in space' },
  { id: 'manhattan', name: 'Manhattan Distance', description: 'Sum of absolute differences' },
  { id: 'dot-product', name: 'Dot Product', description: 'Raw vector multiplication' }
]

export default function QueryingVisualization({ chunks, onBack }: QueryingVisualizationProps) {
  const [query, setQuery] = useState(SAMPLE_QUERIES[0])
  const [topK, setTopK] = useState(5)
  const [rerankMethod, setRerankMethod] = useState(RERANKING_METHODS[0])
  const [showProcess, setShowProcess] = useState(false)
  const [animationStep, setAnimationStep] = useState(0)
  const [selectedResult, setSelectedResult] = useState<number | null>(null)
  const [similarityMetric, setSimilarityMetric] = useState(SIMILARITY_METRICS[0])
  const [showDistances, setShowDistances] = useState(true)
  const [hoveredChunk, setHoveredChunk] = useState<string | null>(null)

  // Generate query embedding
  const queryEmbedding = useMemo((): QueryEmbedding => {
    // Mock query embedding generation
    const dimensions = 1536
    const vector = Array.from({ length: dimensions }, (_, i) => {
      const queryHash = query.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
      return Math.sin((queryHash + i) * 0.01) * Math.cos(i * 0.001)
    })
    
    return { vector, dimensions }
  }, [query])

  // Calculate different similarity metrics
  const calculateSimilarity = (vec1: number[], vec2: number[], metric: string): number => {
    switch (metric) {
      case 'cosine': {
        const dotProduct = vec1.reduce((sum, a, idx) => sum + a * vec2[idx], 0)
        const magnitude1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0))
        const magnitude2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0))
        return dotProduct / (magnitude1 * magnitude2)
      }
      case 'euclidean': {
        const distance = Math.sqrt(vec1.reduce((sum, a, idx) => sum + Math.pow(a - vec2[idx], 2), 0))
        return 1 / (1 + distance) // Convert distance to similarity
      }
      case 'manhattan': {
        const distance = vec1.reduce((sum, a, idx) => sum + Math.abs(a - vec2[idx]), 0)
        return 1 / (1 + distance) // Convert distance to similarity
      }
      case 'dot-product': {
        const dotProduct = vec1.reduce((sum, a, idx) => sum + a * vec2[idx], 0)
        return Math.max(0, dotProduct) // Ensure non-negative
      }
      default:
        return 0
    }
  }

  // Generate chunk embeddings and calculate similarities
  const chunkEmbeddings = useMemo(() => {
    return chunks.map((chunk, index) => {
      const chunkVector = Array.from({ length: 1536 }, (_, i) => {
        const contentHash = chunk.content.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0)
          return a & a
        }, 0)
        return Math.sin((contentHash + i) * 0.01) * Math.cos(index * 0.1 + i * 0.001)
      })
      
      return {
        chunk,
        vector: chunkVector,
        similarity: calculateSimilarity(queryEmbedding.vector, chunkVector, similarityMetric.id)
      }
    })
  }, [chunks, queryEmbedding, similarityMetric])

  // Calculate initial ranking based on selected similarity metric
  const initialResults = useMemo((): QueryResult[] => {
    return chunkEmbeddings
      .map(({ chunk, similarity }) => ({
        chunk,
        similarity: Math.max(0, similarity),
        rank: 0,
        selected: false
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .map((result, index) => ({ ...result, rank: index + 1 }))
      .slice(0, topK)
  }, [chunkEmbeddings, topK])

  // Generate 2D positions for visualization
  const visualizationPoints = useMemo(() => {
    const allEmbeddings = [...chunkEmbeddings, { 
      chunk: { id: 'query', content: query } as Chunk, 
      vector: queryEmbedding.vector, 
      similarity: 1.0 
    }]
    
    return allEmbeddings.map((embedding, index) => {
      // Add some clustering based on similarity to query
      const isQuery = embedding.chunk.id === 'query'
      const similarity = embedding.similarity
      
      let x, y
      if (isQuery) {
        // Place query at center
        x = 300
        y = 200
      } else {
        // Position chunks based on similarity - closer chunks are nearer to query
        const angle = (index * 2 * Math.PI) / chunks.length
        const distance = (1 - similarity) * 200 + 50 // Higher similarity = closer to center
        x = 300 + Math.cos(angle) * distance
        y = 200 + Math.sin(angle) * distance
      }
      
      return {
        ...embedding,
        x: Math.max(50, Math.min(550, x)),
        y: Math.max(50, Math.min(350, y)),
        isQuery
      }
    })
  }, [chunkEmbeddings, queryEmbedding, query, chunks.length])

  // Apply reranking
  const rerankedResults = useMemo((): QueryResult[] => {
    if (rerankMethod.id === 'none') {
      return initialResults.map(result => ({ ...result, finalRank: result.rank }))
    }

    // Mock reranking logic
    const reranked = initialResults.map(result => {
      let rerankScore = result.similarity

      switch (rerankMethod.id) {
        case 'cross-encoder':
          // Simulate cross-encoder giving different scores
          rerankScore = result.similarity * (0.8 + Math.random() * 0.4)
          break
        case 'bm25':
          // Simulate BM25 keyword matching boost
          const keywordBoost = query.toLowerCase().split(' ').some(word => 
            result.chunk.content.toLowerCase().includes(word)
          ) ? 0.2 : 0
          rerankScore = result.similarity + keywordBoost
          break
        case 'llm-rerank':
          // Simulate LLM reranking with more sophisticated scoring
          rerankScore = result.similarity * (0.7 + Math.random() * 0.6)
          break
      }

      return {
        ...result,
        rerankScore: Math.min(1, Math.max(0, rerankScore))
      }
    })

    return reranked
      .sort((a, b) => (b.rerankScore || 0) - (a.rerankScore || 0))
      .map((result, index) => ({ ...result, finalRank: index + 1 }))
  }, [initialResults, rerankMethod, query])

  const startAnimation = () => {
    setAnimationStep(0)
    const interval = setInterval(() => {
      setAnimationStep(prev => {
        if (prev >= 5) {
          clearInterval(interval)
          return 5
        }
        return prev + 1
      })
    }, 1500)
  }

  const handleQuerySubmit = () => {
    setShowProcess(true)
    startAnimation()
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>🔍 RAG Pipeline Educator - Querying & Reranking</h1>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              padding: '10px 20px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            ← Back to Embeddings
          </button>
        )}
      </div>

      {/* Query Configuration */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
        <h3>Query Configuration</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Query:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ 
                  flex: 1, 
                  padding: '8px', 
                  borderRadius: '4px', 
                  border: '1px solid #ccc',
                  fontSize: '14px'
                }}
                placeholder="Enter your query..."
              />
              <select
                onChange={(e) => setQuery(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">Sample Queries</option>
                {SAMPLE_QUERIES.map((sampleQuery, index) => (
                  <option key={index} value={sampleQuery}>{sampleQuery}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Top-K Results: {topK}
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Similarity Metric:</label>
            <select
              value={similarityMetric.id}
              onChange={(e) => setSimilarityMetric(SIMILARITY_METRICS.find(m => m.id === e.target.value) || SIMILARITY_METRICS[0])}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {SIMILARITY_METRICS.map(metric => (
                <option key={metric.id} value={metric.id}>{metric.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Reranking:</label>
            <select
              value={rerankMethod.id}
              onChange={(e) => setRerankMethod(RERANKING_METHODS.find(m => m.id === e.target.value) || RERANKING_METHODS[0])}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {RERANKING_METHODS.map(method => (
                <option key={method.id} value={method.id}>{method.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleQuerySubmit}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔍 Execute Query
          </button>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="checkbox"
              checked={showDistances}
              onChange={(e) => setShowDistances(e.target.checked)}
            />
            Show Distances
          </label>
          
          <div style={{ 
            padding: '8px 12px', 
            backgroundColor: '#e8f4f8', 
            borderRadius: '4px', 
            fontSize: '12px',
            flex: 1,
            minWidth: '200px'
          }}>
            <strong>{similarityMetric.name}:</strong> {similarityMetric.description}
          </div>
        </div>
      </div>

      {/* Process Flow */}
      {showProcess && (
        <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
          <h3 style={{ marginBottom: '20px', color: '#495057' }}>🔄 Query Processing Pipeline</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', overflowX: 'auto', padding: '20px 0' }}>
            {/* Step 1: Query Input */}
            <div style={{ 
              minWidth: '120px', 
              textAlign: 'center',
              opacity: animationStep >= 0 ? 1 : 0.3,
              transition: 'opacity 0.5s ease'
            }}>
              <div style={{
                width: '100px',
                height: '70px',
                backgroundColor: '#e3f2fd',
                border: '2px solid #2196f3',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                🔍 Query
                <div style={{ fontSize: '9px', marginTop: '3px' }}>"{query.substring(0, 15)}..."</div>
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>User Input</div>
            </div>

            <div style={{ fontSize: '20px', color: animationStep >= 1 ? '#4caf50' : '#ccc' }}>➡️</div>

            {/* Step 2: Query Embedding */}
            <div style={{ 
              minWidth: '120px', 
              textAlign: 'center',
              opacity: animationStep >= 1 ? 1 : 0.3,
              transition: 'opacity 0.5s ease'
            }}>
              <div style={{
                width: '100px',
                height: '70px',
                backgroundColor: '#fff3e0',
                border: '2px solid #ff9800',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                🧠 Embed
                <div style={{ fontSize: '9px', marginTop: '3px' }}>{queryEmbedding.dimensions}D</div>
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>Query Vector</div>
            </div>

            <div style={{ fontSize: '20px', color: animationStep >= 2 ? '#4caf50' : '#ccc' }}>➡️</div>

            {/* Step 3: Vector Search */}
            <div style={{ 
              minWidth: '120px', 
              textAlign: 'center',
              opacity: animationStep >= 2 ? 1 : 0.3,
              transition: 'opacity 0.5s ease'
            }}>
              <div style={{
                width: '100px',
                height: '70px',
                backgroundColor: '#f3e5f5',
                border: '2px solid #9c27b0',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                🎯 Search
                <div style={{ fontSize: '9px', marginTop: '3px' }}>Top-{topK}</div>
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>Vector Search</div>
            </div>

            <div style={{ fontSize: '20px', color: animationStep >= 3 ? '#4caf50' : '#ccc' }}>➡️</div>

            {/* Step 4: Initial Results */}
            <div style={{ 
              minWidth: '120px', 
              textAlign: 'center',
              opacity: animationStep >= 3 ? 1 : 0.3,
              transition: 'opacity 0.5s ease'
            }}>
              <div style={{
                width: '100px',
                height: '70px',
                backgroundColor: '#e8f5e8',
                border: '2px solid #4caf50',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                📋 Results
                <div style={{ fontSize: '9px', marginTop: '3px' }}>{initialResults.length} chunks</div>
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>Initial Ranking</div>
            </div>

            <div style={{ fontSize: '20px', color: animationStep >= 4 ? '#4caf50' : '#ccc' }}>➡️</div>

            {/* Step 5: Reranking */}
            <div style={{ 
              minWidth: '120px', 
              textAlign: 'center',
              opacity: animationStep >= 4 ? 1 : 0.3,
              transition: 'opacity 0.5s ease'
            }}>
              <div style={{
                width: '100px',
                height: '70px',
                backgroundColor: '#fce4ec',
                border: '2px solid #e91e63',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                🔄 Rerank
                <div style={{ fontSize: '9px', marginTop: '3px' }}>{rerankMethod.name}</div>
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>Reranking</div>
            </div>

            <div style={{ fontSize: '20px', color: animationStep >= 5 ? '#4caf50' : '#ccc' }}>➡️</div>

            {/* Step 6: Final Results */}
            <div style={{ 
              minWidth: '120px', 
              textAlign: 'center',
              opacity: animationStep >= 5 ? 1 : 0.3,
              transition: 'opacity 0.5s ease'
            }}>
              <div style={{
                width: '100px',
                height: '70px',
                backgroundColor: '#fff8e1',
                border: '2px solid #ffc107',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                ✨ Final
                <div style={{ fontSize: '9px', marginTop: '3px' }}>Ranked</div>
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>Final Results</div>
            </div>
          </div>
        </div>
      )}

      {/* 2D Vector Space Visualization */}
      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <h3 style={{ marginBottom: '15px', color: '#495057' }}>🌌 Query in Vector Space ({similarityMetric.name})</h3>
        
        <div style={{ position: 'relative', width: '600px', height: '400px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', margin: '0 auto' }}>
          <svg width="600" height="400" style={{ position: 'absolute', top: 0, left: 0 }}>
            {/* Grid */}
            {Array.from({ length: 6 }, (_, i) => (
              <g key={i}>
                <line x1={50 + i * 100} y1="50" x2={50 + i * 100} y2="350" stroke="#f0f0f0" strokeWidth="1" />
                <line x1="50" y1={50 + i * 60} x2="550" y2={50 + i * 60} stroke="#f0f0f0" strokeWidth="1" />
              </g>
            ))}
            
            {/* Axes */}
            <line x1="50" y1="350" x2="550" y2="350" stroke="#ccc" strokeWidth="2" />
            <line x1="50" y1="50" x2="50" y2="350" stroke="#ccc" strokeWidth="2" />
            <text x="300" y="380" textAnchor="middle" fontSize="12" fill="#666">Semantic Dimension 1</text>
            <text x="25" y="200" textAnchor="middle" fontSize="12" fill="#666" transform="rotate(-90, 25, 200)">Semantic Dimension 2</text>
            
            {/* Distance circles from query (if enabled) */}
            {showDistances && visualizationPoints.find(p => p.isQuery) && (
              <>
                {[0.3, 0.6, 0.9].map((threshold, index) => {
                  const queryPoint = visualizationPoints.find(p => p.isQuery)!
                  const radius = (1 - threshold) * 150
                  return (
                    <circle
                      key={index}
                      cx={queryPoint.x}
                      cy={queryPoint.y}
                      r={radius}
                      fill="none"
                      stroke="#e3f2fd"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      opacity="0.6"
                    />
                  )
                })}
              </>
            )}
            
            {/* Similarity connections to top results */}
            {initialResults.slice(0, 3).map((result, index) => {
              const queryPoint = visualizationPoints.find(p => p.isQuery)
              const chunkPoint = visualizationPoints.find(p => p.chunk.id === result.chunk.id)
              
              if (!queryPoint || !chunkPoint) return null
              
              return (
                <line
                  key={result.chunk.id}
                  x1={queryPoint.x}
                  y1={queryPoint.y}
                  x2={chunkPoint.x}
                  y2={chunkPoint.y}
                  stroke={index === 0 ? '#e74c3c' : index === 1 ? '#f39c12' : '#3498db'}
                  strokeWidth={3 - index}
                  opacity={0.7}
                  strokeDasharray={index === 0 ? 'none' : '4,2'}
                />
              )
            })}
            
            {/* Chunk points */}
            {visualizationPoints.filter(p => !p.isQuery).map((point, index) => {
              const isTopResult = initialResults.some(r => r.chunk.id === point.chunk.id)
              const resultRank = initialResults.findIndex(r => r.chunk.id === point.chunk.id) + 1
              const isHovered = hoveredChunk === point.chunk.id
              const isSelected = selectedResult !== null && initialResults[selectedResult]?.chunk.id === point.chunk.id
              
              return (
                <g key={point.chunk.id}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isSelected ? 14 : isHovered ? 12 : isTopResult ? 10 : 7}
                    fill={isSelected ? '#e74c3c' : isTopResult ? '#3498db' : '#95a5a6'}
                    stroke="#fff"
                    strokeWidth="2"
                    style={{ cursor: 'pointer' }}
                    opacity={isTopResult ? 1 : 0.6}
                    onMouseEnter={() => setHoveredChunk(point.chunk.id)}
                    onMouseLeave={() => setHoveredChunk(null)}
                    onClick={() => {
                      const resultIndex = initialResults.findIndex(r => r.chunk.id === point.chunk.id)
                      if (resultIndex >= 0) {
                        setSelectedResult(selectedResult === resultIndex ? null : resultIndex)
                      }
                    }}
                  />
                  
                  {/* Chunk label */}
                  <text
                    x={point.x}
                    y={point.y - (isSelected ? 20 : isHovered ? 18 : isTopResult ? 16 : 13)}
                    textAnchor="middle"
                    fontSize={isSelected || isHovered ? "11" : "9"}
                    fill="#333"
                    fontWeight="bold"
                  >
                    {isTopResult ? `#${resultRank}` : `C${index + 1}`}
                  </text>
                  
                  {/* Similarity score on hover */}
                  {(isHovered || isSelected) && (
                    <text
                      x={point.x}
                      y={point.y + (isSelected ? 25 : 23)}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#666"
                      fontWeight="bold"
                    >
                      {(point.similarity * 100).toFixed(1)}%
                    </text>
                  )}
                </g>
              )
            })}
            
            {/* Query point (always on top) */}
            {visualizationPoints.filter(p => p.isQuery).map(point => (
              <g key="query">
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="15"
                  fill="#e91e63"
                  stroke="#fff"
                  strokeWidth="3"
                />
                <text
                  x={point.x}
                  y={point.y + 5}
                  textAnchor="middle"
                  fontSize="12"
                  fill="white"
                  fontWeight="bold"
                >
                  Q
                </text>
                <text
                  x={point.x}
                  y={point.y - 25}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#e91e63"
                  fontWeight="bold"
                >
                  Query
                </text>
              </g>
            ))}
          </svg>
        </div>
        
        <div style={{ marginTop: '15px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#e91e63' }}>●</span> Query Vector &nbsp;&nbsp;
            <span style={{ color: '#3498db' }}>●</span> Top Results &nbsp;&nbsp;
            <span style={{ color: '#95a5a6' }}>●</span> Other Chunks &nbsp;&nbsp;
            {showDistances && <span style={{ color: '#e3f2fd' }}>⭕</span>} {showDistances && 'Similarity Thresholds'}
          </div>
          <div>
            <span style={{ color: '#e74c3c' }}>━━━</span> Best Match &nbsp;&nbsp;
            <span style={{ color: '#f39c12' }}>┅┅┅</span> 2nd Best &nbsp;&nbsp;
            <span style={{ color: '#3498db' }}>┅┅┅</span> 3rd Best
          </div>
        </div>
        
        {/* Similarity Metrics Comparison */}
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff', borderRadius: '5px', border: '1px solid #ddd' }}>
          <h4 style={{ marginBottom: '10px', color: '#495057' }}>📊 Similarity Metrics Comparison</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {SIMILARITY_METRICS.map(metric => {
              const isActive = metric.id === similarityMetric.id
              const sampleChunk = chunkEmbeddings[0]
              const score = sampleChunk ? calculateSimilarity(queryEmbedding.vector, sampleChunk.vector, metric.id) : 0
              
              return (
                <div
                  key={metric.id}
                  style={{
                    padding: '10px',
                    backgroundColor: isActive ? '#e3f2fd' : '#f8f9fa',
                    border: `1px solid ${isActive ? '#2196f3' : '#dee2e6'}`,
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSimilarityMetric(metric)}
                >
                  <div style={{ fontWeight: 'bold', color: isActive ? '#1976d2' : '#495057', fontSize: '13px' }}>
                    {metric.name} {isActive ? '✓' : ''}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '3px' }}>
                    {metric.description}
                  </div>
                  <div style={{ fontSize: '12px', color: isActive ? '#1976d2' : '#495057', marginTop: '5px', fontWeight: 'bold' }}>
                    Sample: {(score * 100).toFixed(1)}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Results Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: rerankMethod.id === 'none' ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Initial Results */}
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#fff' }}>
          <h3 style={{ color: '#3498db' }}>🎯 Initial Vector Search Results</h3>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
            Ranked by cosine similarity to query vector
          </div>
          
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {initialResults.map((result, index) => (
              <div
                key={result.chunk.id}
                style={{
                  padding: '12px',
                  margin: '8px 0',
                  border: `1px solid ${selectedResult === index ? '#3498db' : '#eee'}`,
                  borderRadius: '5px',
                  backgroundColor: selectedResult === index ? '#f0f8ff' : '#fafafa',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedResult(selectedResult === index ? null : index)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ color: '#3498db' }}>
                    #{result.rank} {selectedResult === index ? '🔍' : ''}
                  </strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Similarity: {(result.similarity * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div style={{ 
                  fontSize: '13px', 
                  color: '#555',
                  lineHeight: '1.4',
                  marginBottom: '8px'
                }}>
                  {result.chunk.content.substring(0, 150)}...
                </div>
                
                <div style={{ 
                  fontSize: '11px', 
                  color: '#888',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{result.chunk.charCount} chars</span>
                  <span>Chunk ID: {result.chunk.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reranked Results */}
        {rerankMethod.id !== 'none' && (
          <div style={{ padding: '15px', border: '1px solid #e91e63', borderRadius: '5px', backgroundColor: '#fff' }}>
            <h3 style={{ color: '#e91e63' }}>🔄 Reranked Results</h3>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
              Reranked using {rerankMethod.name}
            </div>
            
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {rerankedResults.map((result, index) => {
                const rankChange = result.rank - (result.finalRank || 0)
                return (
                  <div
                    key={result.chunk.id}
                    style={{
                      padding: '12px',
                      margin: '8px 0',
                      border: `1px solid ${selectedResult === index ? '#e91e63' : '#eee'}`,
                      borderRadius: '5px',
                      backgroundColor: selectedResult === index ? '#fdf2f8' : '#fafafa',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedResult(selectedResult === index ? null : index)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#e91e63' }}>
                          #{result.finalRank} {selectedResult === index ? '🔍' : ''}
                        </strong>
                        {rankChange !== 0 && (
                          <span style={{ 
                            fontSize: '11px', 
                            color: rankChange > 0 ? '#4caf50' : '#f44336',
                            fontWeight: 'bold'
                          }}>
                            {rankChange > 0 ? '↑' : '↓'}{Math.abs(rankChange)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Score: {((result.rerankScore || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                    
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#555',
                      lineHeight: '1.4',
                      marginBottom: '8px'
                    }}>
                      {result.chunk.content.substring(0, 150)}...
                    </div>
                    
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#888',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>Original: #{result.rank}</span>
                      <span>Rerank: #{result.finalRank}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Query Analysis */}
      {selectedResult !== null && (
        <div style={{ padding: '15px', border: '1px solid #ffc107', borderRadius: '5px', backgroundColor: '#fff8e1' }}>
          <h3 style={{ color: '#f57c00' }}>🔍 Selected Result Analysis</h3>
          
          {(() => {
            const result = rerankMethod.id === 'none' ? initialResults[selectedResult] : rerankedResults[selectedResult]
            if (!result) return null
            
            return (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Content:</strong>
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#fff', 
                    borderRadius: '5px', 
                    fontSize: '14px',
                    marginTop: '5px',
                    border: '1px solid #ddd'
                  }}>
                    {result.chunk.content}
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <strong>Similarity Scores:</strong>
                    <div style={{ fontSize: '13px', marginTop: '5px' }}>
                      • Vector Similarity: {(result.similarity * 100).toFixed(2)}%<br/>
                      {result.rerankScore && (
                        <>• Rerank Score: {(result.rerankScore * 100).toFixed(2)}%<br/></>
                      )}
                      • Initial Rank: #{result.rank}<br/>
                      {result.finalRank && result.finalRank !== result.rank && (
                        <>• Final Rank: #{result.finalRank}<br/></>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <strong>Relevance Factors:</strong>
                    <div style={{ fontSize: '13px', marginTop: '5px' }}>
                      • Length: {result.chunk.charCount} characters<br/>
                      • Word Count: {result.chunk.wordCount} words<br/>
                      • Keyword Match: {
                        query.toLowerCase().split(' ').some(word => 
                          result.chunk.content.toLowerCase().includes(word)
                        ) ? 'Yes' : 'No'
                      }<br/>
                      • Semantic Match: {result.similarity > 0.7 ? 'High' : result.similarity > 0.5 ? 'Medium' : 'Low'}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Statistics */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f0f8f0' }}>
        <h3>📊 Query Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <strong>Query:</strong> "{query}"
          </div>
          <div>
            <strong>Results Retrieved:</strong> {topK} of {chunks.length} chunks
          </div>
          <div>
            <strong>Reranking Method:</strong> {rerankMethod.name}
          </div>
          <div>
            <strong>Avg Initial Similarity:</strong> {
              initialResults.length > 0 
                ? (initialResults.reduce((sum, r) => sum + r.similarity, 0) / initialResults.length * 100).toFixed(1) + '%'
                : '0%'
            }
          </div>
          {rerankMethod.id !== 'none' && (
            <div>
              <strong>Avg Rerank Score:</strong> {
                rerankedResults.length > 0 
                  ? (rerankedResults.reduce((sum, r) => sum + (r.rerankScore || 0), 0) / rerankedResults.length * 100).toFixed(1) + '%'
                  : '0%'
              }
            </div>
          )}
          <div>
            <strong>Rank Changes:</strong> {
              rerankMethod.id !== 'none' 
                ? rerankedResults.filter(r => r.rank !== r.finalRank).length + ' chunks'
                : 'N/A'
            }
          </div>
        </div>
      </div>
    </div>
  )
}
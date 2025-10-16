import { useState, useMemo } from 'react'
import type { Chunk } from '../types/chunking'

interface EmbeddingVisualizationProps {
  chunks: Chunk[]
  onBack?: () => void
  onNext?: () => void
}



const EMBEDDING_MODELS = [
  { id: 'amazon.titan-embed-text-v1', name: 'Amazon Titan Text v1', dimensions: 1536 },
  { id: 'cohere.embed-english-v3', name: 'Cohere Embed English v3', dimensions: 1024 },
  { id: 'cohere.embed-multilingual-v3', name: 'Cohere Embed Multilingual v3', dimensions: 1024 }
]

export default function EmbeddingVisualization({ chunks, onBack, onNext }: EmbeddingVisualizationProps) {
  const [selectedModel, setSelectedModel] = useState(EMBEDDING_MODELS[0])
  const [showVectors, setShowVectors] = useState(false)
  const [selectedChunk, setSelectedChunk] = useState<string | null>(null)
  const [animationStep, setAnimationStep] = useState(0)

  // Generate mock embeddings
  const embeddings = useMemo(() => {
    return chunks.map((chunk, index) => {
      // Generate mock vector with some semantic meaning
      const vector = Array.from({ length: selectedModel.dimensions }, (_, i) => {
        // Add some patterns based on chunk content
        const contentHash = chunk.content.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0)
          return a & a
        }, 0)
        
        return Math.sin((contentHash + i) * 0.01) * Math.cos(index * 0.1 + i * 0.001)
      })

      return {
        id: `embedding-${chunk.id}`,
        chunkId: chunk.id,
        vector,
        dimensions: selectedModel.dimensions,
        model: selectedModel.id
      }
    })
  }, [chunks, selectedModel])

  // Calculate 2D positions for visualization
  const visualizationPoints = useMemo(() => {
    return embeddings.map((embedding, index) => {
      // Simple 2D projection using first two dimensions
      const x = (embedding.vector[0] * 200) + 300 + (index % 3) * 100
      const y = (embedding.vector[1] * 200) + 200 + Math.floor(index / 3) * 80
      
      return {
        ...embedding,
        x: Math.max(50, Math.min(550, x)),
        y: Math.max(50, Math.min(350, y))
      }
    })
  }, [embeddings])

  // Calculate similarities between chunks
  const similarities = useMemo(() => {
    const sims: { chunk1: string, chunk2: string, similarity: number }[] = []
    
    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        // Cosine similarity calculation
        const vec1 = embeddings[i].vector
        const vec2 = embeddings[j].vector
        
        const dotProduct = vec1.reduce((sum, a, idx) => sum + a * vec2[idx], 0)
        const magnitude1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0))
        const magnitude2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0))
        
        const similarity = dotProduct / (magnitude1 * magnitude2)
        
        if (similarity > 0.7) {
          sims.push({
            chunk1: embeddings[i].chunkId,
            chunk2: embeddings[j].chunkId,
            similarity
          })
        }
      }
    }
    
    return sims
  }, [embeddings])

  const startAnimation = () => {
    setAnimationStep(0)
    const interval = setInterval(() => {
      setAnimationStep(prev => {
        if (prev >= 4) {
          clearInterval(interval)
          return 4
        }
        return prev + 1
      })
    }, 1500)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>🧠 RAG Pipeline Educator - Embedding Module</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
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
              ← Back to Chunking
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e91e63',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
              disabled={chunks.length === 0}
            >
              Next: Query & Rerank →
            </button>
          )}
        </div>
      </div>
      
      {/* Controls */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
        <h3>Embedding Configuration</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Model:</label>
            <select 
              value={selectedModel.id}
              onChange={(e) => setSelectedModel(EMBEDDING_MODELS.find(m => m.id === e.target.value) || EMBEDDING_MODELS[0])}
              style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {EMBEDDING_MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.dimensions}D)
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'end', gap: '10px' }}>
            <button
              onClick={startAnimation}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🎬 Animate Process
            </button>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={showVectors}
                onChange={(e) => setShowVectors(e.target.checked)}
              />
              Show Vector Details
            </label>
          </div>
        </div>

        <div style={{ 
          padding: '10px', 
          backgroundColor: '#e8f4f8', 
          borderRadius: '5px', 
          fontSize: '14px' 
        }}>
          <strong>Embedding Process:</strong> Text chunks are converted into high-dimensional vectors ({selectedModel.dimensions}D) 
          that capture semantic meaning. Similar chunks will have vectors that are close together in the vector space.
        </div>
      </div>

      {/* Process Flow Visualization */}
      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <h3 style={{ marginBottom: '20px', color: '#495057' }}>🔄 Text-to-Vector Transformation Process</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', overflowX: 'auto', padding: '20px 0' }}>
          {/* Step 1: Text Chunks */}
          <div style={{ 
            minWidth: '150px', 
            textAlign: 'center',
            opacity: animationStep >= 0 ? 1 : 0.3,
            transition: 'opacity 0.5s ease'
          }}>
            <div style={{
              width: '120px',
              height: '80px',
              backgroundColor: '#e3f2fd',
              border: '2px solid #2196f3',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              📄 Text Chunks
              <div style={{ fontSize: '10px', marginTop: '5px' }}>{chunks.length} chunks</div>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Raw Text</div>
          </div>

          {/* Arrow 1 */}
          <div style={{ 
            fontSize: '24px', 
            color: animationStep >= 1 ? '#4caf50' : '#ccc',
            transition: 'color 0.5s ease'
          }}>
            ➡️
          </div>

          {/* Step 2: Tokenization */}
          <div style={{ 
            minWidth: '150px', 
            textAlign: 'center',
            opacity: animationStep >= 1 ? 1 : 0.3,
            transition: 'opacity 0.5s ease'
          }}>
            <div style={{
              width: '120px',
              height: '80px',
              backgroundColor: '#fff3e0',
              border: '2px solid #ff9800',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              🔤 Tokenization
              <div style={{ fontSize: '10px', marginTop: '5px' }}>Split → Tokens</div>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Text Processing</div>
          </div>

          {/* Arrow 2 */}
          <div style={{ 
            fontSize: '24px', 
            color: animationStep >= 2 ? '#4caf50' : '#ccc',
            transition: 'color 0.5s ease'
          }}>
            ➡️
          </div>

          {/* Step 3: Model Processing */}
          <div style={{ 
            minWidth: '150px', 
            textAlign: 'center',
            opacity: animationStep >= 2 ? 1 : 0.3,
            transition: 'opacity 0.5s ease'
          }}>
            <div style={{
              width: '120px',
              height: '80px',
              backgroundColor: '#f3e5f5',
              border: '2px solid #9c27b0',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              🧠 {selectedModel.name.split(' ')[0]}
              <div style={{ fontSize: '10px', marginTop: '5px' }}>Neural Network</div>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Model Processing</div>
          </div>

          {/* Arrow 3 */}
          <div style={{ 
            fontSize: '24px', 
            color: animationStep >= 3 ? '#4caf50' : '#ccc',
            transition: 'color 0.5s ease'
          }}>
            ➡️
          </div>

          {/* Step 4: Vector Output */}
          <div style={{ 
            minWidth: '150px', 
            textAlign: 'center',
            opacity: animationStep >= 3 ? 1 : 0.3,
            transition: 'opacity 0.5s ease'
          }}>
            <div style={{
              width: '120px',
              height: '80px',
              backgroundColor: '#e8f5e8',
              border: '2px solid #4caf50',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              🔢 Vectors
              <div style={{ fontSize: '10px', marginTop: '5px' }}>{selectedModel.dimensions}D</div>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Embeddings</div>
          </div>

          {/* Arrow 4 */}
          <div style={{ 
            fontSize: '24px', 
            color: animationStep >= 4 ? '#4caf50' : '#ccc',
            transition: 'color 0.5s ease'
          }}>
            ➡️
          </div>

          {/* Step 5: Vector Space */}
          <div style={{ 
            minWidth: '150px', 
            textAlign: 'center',
            opacity: animationStep >= 4 ? 1 : 0.3,
            transition: 'opacity 0.5s ease'
          }}>
            <div style={{
              width: '120px',
              height: '80px',
              backgroundColor: '#fce4ec',
              border: '2px solid #e91e63',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              🌌 Vector Space
              <div style={{ fontSize: '10px', marginTop: '5px' }}>Similarity</div>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Semantic Space</div>
          </div>
        </div>
      </div>

      {/* Vector Space Visualization */}
      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <h3 style={{ marginBottom: '15px', color: '#495057' }}>🌌 2D Vector Space Projection</h3>
        
        <div style={{ position: 'relative', width: '600px', height: '400px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', margin: '0 auto' }}>
          {/* Axes */}
          <svg width="600" height="400" style={{ position: 'absolute', top: 0, left: 0 }}>
            {/* X-axis */}
            <line x1="50" y1="350" x2="550" y2="350" stroke="#ccc" strokeWidth="1" />
            <text x="300" y="380" textAnchor="middle" fontSize="12" fill="#666">Dimension 1</text>
            
            {/* Y-axis */}
            <line x1="50" y1="50" x2="50" y2="350" stroke="#ccc" strokeWidth="1" />
            <text x="25" y="200" textAnchor="middle" fontSize="12" fill="#666" transform="rotate(-90, 25, 200)">Dimension 2</text>
            
            {/* Grid */}
            {Array.from({ length: 5 }, (_, i) => (
              <g key={i}>
                <line x1={50 + i * 125} y1="50" x2={50 + i * 125} y2="350" stroke="#f0f0f0" strokeWidth="1" />
                <line x1="50" y1={50 + i * 75} x2="550" y2={50 + i * 75} stroke="#f0f0f0" strokeWidth="1" />
              </g>
            ))}
            
            {/* Similarity connections */}
            {similarities.map((sim, index) => {
              const point1 = visualizationPoints.find(p => p.chunkId === sim.chunk1)
              const point2 = visualizationPoints.find(p => p.chunkId === sim.chunk2)
              
              if (!point1 || !point2) return null
              
              return (
                <line
                  key={index}
                  x1={point1.x}
                  y1={point1.y}
                  x2={point2.x}
                  y2={point2.y}
                  stroke="#e74c3c"
                  strokeWidth={Math.max(1, sim.similarity * 3)}
                  opacity={0.6}
                  strokeDasharray="2,2"
                />
              )
            })}
            
            {/* Vector points */}
            {visualizationPoints.map((point, index) => (
              <g key={point.id}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={selectedChunk === point.chunkId ? 12 : 8}
                  fill={selectedChunk === point.chunkId ? '#e74c3c' : '#3498db'}
                  stroke="#fff"
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedChunk(selectedChunk === point.chunkId ? null : point.chunkId)}
                />
                <text
                  x={point.x}
                  y={point.y - 15}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#333"
                  fontWeight="bold"
                >
                  C{index + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>
        
        <div style={{ marginTop: '15px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          <span style={{ color: '#3498db' }}>●</span> Chunk vectors &nbsp;&nbsp;
          <span style={{ color: '#e74c3c' }}>---</span> High similarity connections (&gt;0.7) &nbsp;&nbsp;
          Click points to see details
        </div>
      </div>

      {/* Chunk Details and Vectors */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedChunk ? '1fr 1fr' : '1fr', gap: '20px' }}>
        {/* Chunks List */}
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#fff' }}>
          <h3>📄 Text Chunks & Embeddings</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {chunks.map((chunk, index) => {
              const embedding = embeddings[index]
              const isSelected = selectedChunk === chunk.id
              
              return (
                <div
                  key={chunk.id}
                  style={{
                    padding: '10px',
                    margin: '5px 0',
                    border: `1px solid ${isSelected ? '#3498db' : '#eee'}`,
                    borderRadius: '5px',
                    backgroundColor: isSelected ? '#f0f8ff' : '#fafafa',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedChunk(isSelected ? null : chunk.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <strong style={{ color: isSelected ? '#3498db' : '#333' }}>
                      Chunk {index + 1} {isSelected ? '🔍' : ''}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {chunk.charCount} chars | {embedding.dimensions}D vector
                    </span>
                  </div>
                  
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#555',
                    marginBottom: '8px',
                    lineHeight: '1.4'
                  }}>
                    {chunk.content.substring(0, 100)}...
                  </div>
                  
                  {showVectors && (
                    <div style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: '#666',
                      backgroundColor: '#f5f5f5',
                      padding: '5px',
                      borderRadius: '3px',
                      maxHeight: '60px',
                      overflowY: 'auto'
                    }}>
                      Vector: [{embedding.vector.slice(0, 8).map(v => v.toFixed(3)).join(', ')}...]
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Chunk Details */}
        {selectedChunk && (
          <div style={{ padding: '15px', border: '1px solid #3498db', borderRadius: '5px', backgroundColor: '#f0f8ff' }}>
            <h3 style={{ color: '#3498db' }}>🔍 Selected Chunk Analysis</h3>
            
            {(() => {
              const chunk = chunks.find(c => c.id === selectedChunk)
              const embedding = embeddings.find(e => e.chunkId === selectedChunk)
              const chunkIndex = chunks.findIndex(c => c.id === selectedChunk)
              
              if (!chunk || !embedding) return null
              
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
                      {chunk.content}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Vector Properties:</strong>
                    <div style={{ fontSize: '13px', marginTop: '5px' }}>
                      • Dimensions: {embedding.dimensions}<br/>
                      • Model: {selectedModel.name}<br/>
                      • Magnitude: {Math.sqrt(embedding.vector.reduce((sum, v) => sum + v * v, 0)).toFixed(4)}<br/>
                      • Position: ({visualizationPoints[chunkIndex]?.x.toFixed(1)}, {visualizationPoints[chunkIndex]?.y.toFixed(1)})
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Similar Chunks:</strong>
                    <div style={{ fontSize: '13px', marginTop: '5px' }}>
                      {similarities
                        .filter(sim => sim.chunk1 === selectedChunk || sim.chunk2 === selectedChunk)
                        .map((sim, index) => {
                          const otherChunkId = sim.chunk1 === selectedChunk ? sim.chunk2 : sim.chunk1
                          const otherChunkIndex = chunks.findIndex(c => c.id === otherChunkId)
                          return (
                            <div key={index} style={{ 
                              padding: '5px', 
                              backgroundColor: '#e8f4f8', 
                              borderRadius: '3px', 
                              margin: '3px 0',
                              border: '1px solid #bee5eb'
                            }}>
                              Chunk {otherChunkIndex + 1}: {(sim.similarity * 100).toFixed(1)}% similar
                            </div>
                          )
                        })}
                      {similarities.filter(sim => sim.chunk1 === selectedChunk || sim.chunk2 === selectedChunk).length === 0 && (
                        <div style={{ color: '#666', fontStyle: 'italic' }}>No high-similarity chunks found</div>
                      )}
                    </div>
                  </div>
                  
                  {showVectors && (
                    <div>
                      <strong>Full Vector:</strong>
                      <div style={{
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        backgroundColor: '#f5f5f5',
                        padding: '8px',
                        borderRadius: '3px',
                        maxHeight: '120px',
                        overflowY: 'auto',
                        marginTop: '5px',
                        border: '1px solid #ddd'
                      }}>
                        [{embedding.vector.map(v => v.toFixed(4)).join(',\n ')}]
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f0f8f0' }}>
        <h3>📊 Embedding Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <strong>Total Embeddings:</strong> {embeddings.length}
          </div>
          <div>
            <strong>Vector Dimensions:</strong> {selectedModel.dimensions}
          </div>
          <div>
            <strong>Model:</strong> {selectedModel.name}
          </div>
          <div>
            <strong>High Similarities:</strong> {similarities.length} connections
          </div>
          <div>
            <strong>Avg Vector Magnitude:</strong> {
              embeddings.length > 0 
                ? (embeddings.reduce((sum, emb) => 
                    sum + Math.sqrt(emb.vector.reduce((s, v) => s + v * v, 0)), 0
                  ) / embeddings.length).toFixed(4)
                : '0'
            }
          </div>
        </div>
      </div>
    </div>
  )
}
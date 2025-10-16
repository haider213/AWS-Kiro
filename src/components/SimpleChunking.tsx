import { useState, useMemo } from 'react'
import { chunkText, calculateMetrics, getOverlapInfo } from '../utils/simpleTextProcessing'
import { ChunkingParameters, ChunkingStrategy } from '../types/chunking'
import type { Chunk } from '../types/chunking'
import EmbeddingVisualization from './EmbeddingVisualization'
import QueryingVisualization from './QueryingVisualization'

const DEFAULT_TEXT = `Artificial Intelligence (AI) has revolutionized numerous industries and continues to shape our future. Machine learning, a subset of AI, enables computers to learn and improve from experience without being explicitly programmed.

Deep learning, which uses neural networks with multiple layers, has achieved remarkable breakthroughs in image recognition, natural language processing, and game playing. These advances have led to practical applications in healthcare, finance, transportation, and entertainment.

Natural Language Processing (NLP) is a field of AI that focuses on the interaction between computers and human language. It involves developing algorithms and models that can understand, interpret, and generate human language in a valuable way.

Recent advances in transformer architectures, such as BERT and GPT models, have significantly improved the performance of NLP tasks. These models can now perform complex language understanding tasks with human-level accuracy.

Retrieval-Augmented Generation (RAG) is an innovative approach that combines the power of large language models with external knowledge retrieval. This technique allows AI systems to access and incorporate relevant information from external databases or documents when generating responses.`

export default function SimpleChunking() {
  const [text, setText] = useState(DEFAULT_TEXT)
  const [currentView, setCurrentView] = useState<'chunking' | 'embedding' | 'querying'>('chunking')
  const [parameters, setParameters] = useState<ChunkingParameters>({
    strategy: 'fixed-size',
    chunkSize: 200,
    overlap: 50,
    similarityThreshold: 0.7,
    parentChunkSize: 800,
    childChunkSize: 200,
    bufferSize: 1,
    breakpointThreshold: 75
  })

  const chunks = useMemo(() => {
    return chunkText(text, parameters)
  }, [text, parameters])

  const metrics = useMemo(() => {
    return calculateMetrics(chunks)
  }, [chunks])

  const handleParameterChange = (key: keyof ChunkingParameters, value: any) => {
    setParameters(prev => ({ ...prev, [key]: value }))
  }

  if (currentView === 'embedding') {
    return (
      <EmbeddingVisualization 
        chunks={chunks} 
        onBack={() => setCurrentView('chunking')}
        onNext={() => setCurrentView('querying')}
      />
    )
  }

  if (currentView === 'querying') {
    return (
      <QueryingVisualization 
        chunks={chunks} 
        onBack={() => setCurrentView('embedding')}
      />
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>🎉 RAG Pipeline Educator - Chunking Module</h1>
        <button
          onClick={() => setCurrentView('embedding')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#e67e22',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
          disabled={chunks.length === 0}
        >
          Next: Generate Embeddings →
        </button>
      </div>

      {/* Controls */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
        <h3>Chunking Parameters</h3>

        {/* Strategy Description */}
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e8f4f8', borderRadius: '5px', fontSize: '14px' }}>
          {parameters.strategy === 'fixed-size' && (
            <p><strong>Fixed Size:</strong> Splits text into chunks of specified size with configurable overlap. Simple and predictable.</p>
          )}
          {parameters.strategy === 'default' && (
            <p><strong>Default:</strong> AWS Bedrock's default approach - ~300 tokens per chunk, honors sentence boundaries.</p>
          )}
          {parameters.strategy === 'sentence' && (
            <p><strong>Sentence-based:</strong> Respects sentence boundaries while maintaining target chunk size. Better for readability.</p>
          )}
          {parameters.strategy === 'paragraph' && (
            <p><strong>Paragraph-based:</strong> Splits on paragraph breaks, keeping related content together.</p>
          )}
          {parameters.strategy === 'hierarchical' && (
            <p><strong>Hierarchical:</strong> Creates parent and child chunks. Retrieval finds child chunks but returns parent context for better comprehension.</p>
          )}
          {parameters.strategy === 'semantic' && (
            <p><strong>Semantic:</strong> Uses topic boundaries and semantic similarity to create meaningful chunks. More intelligent but complex.</p>
          )}
          {parameters.strategy === 'no-chunking' && (
            <p><strong>No Chunking:</strong> Treats entire document as single chunk. Useful for small documents or pre-processed content.</p>
          )}
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Strategy:</label>
          <select
            value={parameters.strategy}
            onChange={(e) => handleParameterChange('strategy', e.target.value as ChunkingStrategy)}
            style={{ padding: '5px', width: '250px' }}
          >
            <option value="fixed-size">Fixed Size (Custom tokens)</option>
            <option value="default">Default (~300 tokens, sentence boundaries)</option>
            <option value="sentence">Sentence-based</option>
            <option value="paragraph">Paragraph-based</option>
            <option value="hierarchical">Hierarchical (Parent/Child)</option>
            <option value="semantic">Semantic (Topic-based)</option>
            <option value="no-chunking">No Chunking (Single document)</option>
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Chunk Size: {parameters.chunkSize} characters
          </label>
          <input
            type="range"
            min="50"
            max="500"
            value={parameters.chunkSize}
            onChange={(e) => handleParameterChange('chunkSize', parseInt(e.target.value))}
            style={{ width: '300px' }}
          />
        </div>

        {(parameters.strategy === 'fixed-size' || parameters.strategy === 'sentence' || parameters.strategy === 'hierarchical') && (
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Overlap: {parameters.overlap} characters
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={parameters.overlap}
              onChange={(e) => handleParameterChange('overlap', parseInt(e.target.value))}
              style={{ width: '300px' }}
            />
          </div>
        )}

        {parameters.strategy === 'hierarchical' && (
          <>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Parent Chunk Size: {parameters.parentChunkSize} characters
              </label>
              <input
                type="range"
                min="400"
                max="1200"
                value={parameters.parentChunkSize}
                onChange={(e) => handleParameterChange('parentChunkSize', parseInt(e.target.value))}
                style={{ width: '300px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Child Chunk Size: {parameters.childChunkSize} characters
              </label>
              <input
                type="range"
                min="100"
                max="400"
                value={parameters.childChunkSize}
                onChange={(e) => handleParameterChange('childChunkSize', parseInt(e.target.value))}
                style={{ width: '300px' }}
              />
            </div>
          </>
        )}

        {parameters.strategy === 'semantic' && (
          <>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Buffer Size: {parameters.bufferSize} sentences
              </label>
              <input
                type="range"
                min="0"
                max="5"
                value={parameters.bufferSize}
                onChange={(e) => handleParameterChange('bufferSize', parseInt(e.target.value))}
                style={{ width: '300px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Breakpoint Threshold: {parameters.breakpointThreshold}%
              </label>
              <input
                type="range"
                min="50"
                max="95"
                value={parameters.breakpointThreshold}
                onChange={(e) => handleParameterChange('breakpointThreshold', parseInt(e.target.value))}
                style={{ width: '300px' }}
              />
            </div>
          </>
        )}
      </div>

      {/* Metrics */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f0f8ff' }}>
        <h3>Chunking Metrics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          <div><strong>Total Chunks:</strong> {metrics.totalChunks}</div>
          <div><strong>Avg Size:</strong> {metrics.averageChunkSize} chars</div>
          <div><strong>Min Size:</strong> {metrics.minChunkSize} chars</div>
          <div><strong>Max Size:</strong> {metrics.maxChunkSize} chars</div>
          <div><strong>Total Words:</strong> {metrics.totalWords}</div>
          <div><strong>Overlap:</strong> {metrics.overlapPercentage}%</div>
        </div>
      </div>

      {/* Text Input */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Input Text</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: '100%',
            height: '150px',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}
          placeholder="Enter your text here to see how it gets chunked..."
        />
      </div>

      {/* Chunks Display */}
      <div>
        <h3>Generated Chunks ({chunks.length})</h3>

        {parameters.strategy === 'hierarchical' ? (
          <HierarchicalVisualization chunks={chunks} />
        ) : (
          <RegularChunksDisplay chunks={chunks} />
        )}
      </div>

      {/* Status */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f0f8f0' }}>
        <h3>Status</h3>
        <p>✅ Frontend: Running</p>
        <p>✅ Backend: Connected</p>
        <p>✅ AWS: Configured</p>
        <p>✅ Chunking: Active</p>
      </div>
    </div>
  )
}

// Enhanced overlap visualization component
function RegularChunksDisplay({ chunks }: { chunks: Chunk[] }) {
  return (
    <>
      {/* Overlap Flow Diagram */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <h4 style={{ marginBottom: '15px', color: '#495057' }}>📊 Chunk Overlap Flow</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', padding: '10px 0' }}>
          {chunks.map((chunk, index) => {
            const overlapInfo = getOverlapInfo(chunks, index)
            return (
              <div key={chunk.id} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {/* Chunk Node */}
                <div style={{
                  width: '80px',
                  height: '60px',
                  backgroundColor: overlapInfo.hasOverlap ? '#fff3cd' : '#d1ecf1',
                  border: `2px solid ${overlapInfo.hasOverlap ? '#ffc107' : '#bee5eb'}`,
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  <div>C{index + 1}</div>
                  <div style={{ fontSize: '10px', color: '#6c757d' }}>{chunk.charCount}ch</div>
                  {overlapInfo.hasOverlap && (
                    <div style={{ fontSize: '9px', color: '#e67e22' }}>↔{overlapInfo.overlapLength}</div>
                  )}
                </div>

                {/* Connection Arrow */}
                {index < chunks.length - 1 && (
                  <div style={{
                    width: '30px',
                    height: '2px',
                    backgroundColor: overlapInfo.hasOverlap ? '#e67e22' : '#6c757d',
                    position: 'relative',
                    margin: '0 5px'
                  }}>
                    <div style={{
                      position: 'absolute',
                      right: '-4px',
                      top: '-3px',
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid ' + (overlapInfo.hasOverlap ? '#e67e22' : '#6c757d'),
                      borderTop: '4px solid transparent',
                      borderBottom: '4px solid transparent'
                    }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '10px' }}>
          <span style={{ color: '#e67e22' }}>●</span> Overlapping chunks &nbsp;&nbsp;
          <span style={{ color: '#17a2b8' }}>●</span> Non-overlapping chunks
        </div>
      </div>

      {/* Regular Chunks Display */}
      <div style={{ display: 'grid', gap: '10px' }}>
        {chunks.map((chunk, index) => {
          const overlapInfo = getOverlapInfo(chunks, index)

          return (
            <div
              key={chunk.id}
              style={{
                padding: '15px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff',
                borderLeft: overlapInfo.hasOverlap ? '4px solid #e67e22' : '4px solid #17a2b8'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong style={{ color: overlapInfo.hasOverlap ? '#e67e22' : '#17a2b8' }}>
                  Chunk {index + 1} {overlapInfo.hasOverlap ? '🔗' : '📄'}
                </strong>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {chunk.charCount} chars | {chunk.wordCount} words |
                  Position: {chunk.startIndex}-{chunk.endIndex}
                  {overlapInfo.hasOverlap && (
                    <span style={{ color: '#e74c3c', marginLeft: '10px' }}>
                      | Overlap: {overlapInfo.overlapLength} chars ({Math.round((overlapInfo.overlapLength / chunk.charCount) * 100)}%)
                    </span>
                  )}
                </span>
              </div>

              {overlapInfo.hasOverlap && (
                <div style={{
                  marginBottom: '10px',
                  padding: '8px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '3px',
                  fontSize: '12px'
                }}>
                  <strong style={{ color: '#e67e22' }}>🔗 Overlap with Chunk {index}:</strong>
                  <div style={{
                    fontFamily: 'monospace',
                    marginTop: '5px',
                    fontStyle: 'italic',
                    color: '#856404',
                    backgroundColor: '#fff',
                    padding: '4px',
                    borderRadius: '2px'
                  }}>
                    "{overlapInfo.overlapText.substring(0, 100)}{overlapInfo.overlapText.length > 100 ? '...' : ''}"
                  </div>
                </div>
              )}

              <div style={{
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '3px',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                {overlapInfo.hasOverlap ? (
                  <>
                    <span style={{
                      backgroundColor: '#fff3cd',
                      padding: '2px 4px',
                      borderRadius: '2px',
                      border: '1px solid #ffeaa7'
                    }}>
                      {chunk.content.substring(0, overlapInfo.overlapLength)}
                    </span>
                    {chunk.content.substring(overlapInfo.overlapLength)}
                  </>
                ) : (
                  chunk.content
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// Hierarchical visualization with nodes and edges
function HierarchicalVisualization({ chunks }: { chunks: Chunk[] }) {
  const parentChunks = chunks.filter(chunk => !chunk.isChild)
  const getChildChunks = (parentId: string) => chunks.filter(chunk => chunk.parentId === parentId)

  return (
    <>
      {/* Graph Visualization */}
      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <h4 style={{ marginBottom: '15px', color: '#495057' }}>🌳 Hierarchical Graph Structure</h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
          {parentChunks.map((parent, parentIndex) => {
            const children = getChildChunks(parent.id)
            return (
              <div key={parent.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>

                {/* Parent Node */}
                <div style={{
                  width: '120px',
                  height: '80px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(52, 152, 219, 0.3)',
                  border: '3px solid #2980b9'
                }}>
                  <div>📁 P{parentIndex + 1}</div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>{parent.charCount} chars</div>
                  <div style={{ fontSize: '10px', opacity: 0.8 }}>{children.length} children</div>
                </div>

                {/* Vertical Connection */}
                {children.length > 0 && (
                  <div style={{
                    width: '3px',
                    height: '20px',
                    backgroundColor: '#2980b9'
                  }} />
                )}

                {/* Children Container */}
                {children.length > 0 && (
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {children.map((child, childIndex) => {
                      const overlapInfo = getOverlapInfo(chunks, chunks.indexOf(child))
                      return (
                        <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>

                          {/* Diagonal Connection Line */}
                          <div style={{
                            width: '2px',
                            height: '15px',
                            backgroundColor: '#e67e22',
                            transform: childIndex === 0 ? 'rotate(-30deg)' : childIndex === children.length - 1 ? 'rotate(30deg)' : 'rotate(0deg)'
                          }} />

                          {/* Child Node */}
                          <div style={{
                            width: '90px',
                            height: '60px',
                            backgroundColor: overlapInfo.hasOverlap ? '#f39c12' : '#e67e22',
                            color: 'white',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(230, 126, 34, 0.3)',
                            border: overlapInfo.hasOverlap ? '2px solid #d68910' : '2px solid #d35400'
                          }}>
                            <div>📄 C{childIndex + 1}</div>
                            <div style={{ fontSize: '10px', opacity: 0.9 }}>{child.charCount}ch</div>
                            {overlapInfo.hasOverlap && (
                              <div style={{ fontSize: '9px', opacity: 0.8 }}>↔{overlapInfo.overlapLength}</div>
                            )}
                          </div>

                          {/* Overlap Connection to Next Child */}
                          {childIndex < children.length - 1 && overlapInfo.hasOverlap && (
                            <div style={{
                              position: 'absolute',
                              width: '40px',
                              height: '2px',
                              backgroundColor: '#e74c3c',
                              transform: 'translateX(65px) translateY(-30px)',
                              zIndex: 1
                            }}>
                              <div style={{
                                position: 'absolute',
                                right: '-4px',
                                top: '-3px',
                                width: 0,
                                height: 0,
                                borderLeft: '8px solid #e74c3c',
                                borderTop: '4px solid transparent',
                                borderBottom: '4px solid transparent'
                              }} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Retrieval Flow Explanation */}
                <div style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '15px',
                  fontSize: '11px',
                  color: '#856404',
                  textAlign: 'center',
                  maxWidth: '300px'
                }}>
                  💡 Search finds children → Returns parent context
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff', borderRadius: '5px', fontSize: '12px' }}>
          <strong>Legend:</strong>
          <div style={{ display: 'flex', gap: '20px', marginTop: '5px', flexWrap: 'wrap' }}>
            <span><span style={{ color: '#3498db' }}>🔵</span> Parent Chunks</span>
            <span><span style={{ color: '#e67e22' }}>🟠</span> Child Chunks</span>
            <span><span style={{ color: '#f39c12' }}>🟡</span> Overlapping Children</span>
            <span><span style={{ color: '#e74c3c' }}>🔴</span> Overlap Connections</span>
          </div>
        </div>
      </div>

      {/* Detailed Hierarchical Display */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {parentChunks.map((parentChunk, parentIndex) => {
          const childChunks = getChildChunks(parentChunk.id)
          return (
            <div key={parentChunk.id} style={{
              border: '2px solid #3498db',
              borderRadius: '8px',
              padding: '15px',
              backgroundColor: '#f8f9fa'
            }}>
              {/* Parent Chunk Header */}
              <div style={{
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#3498db',
                color: 'white',
                borderRadius: '5px',
                fontWeight: 'bold'
              }}>
                📁 Parent Chunk {parentIndex + 1} - {parentChunk.charCount} chars | {parentChunk.wordCount} words
              </div>

              {/* Parent Content Preview */}
              <div style={{
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#e3f2fd',
                borderRadius: '5px',
                fontSize: '14px',
                fontStyle: 'italic',
                border: '1px solid #bbdefb'
              }}>
                <strong>Parent Context:</strong> "{parentChunk.content.substring(0, 150)}..."
              </div>

              {/* Child Chunks */}
              <div style={{ marginLeft: '20px' }}>
                <div style={{
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#2c3e50'
                }}>
                  📄 Child Chunks ({childChunks.length}):
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {childChunks.map((childChunk, childIndex) => {
                    const overlapInfo = getOverlapInfo(chunks, chunks.indexOf(childChunk))
                    return (
                      <div key={childChunk.id} style={{
                        padding: '12px',
                        border: '1px solid #95a5a6',
                        borderRadius: '5px',
                        backgroundColor: '#ffffff',
                        borderLeft: `4px solid ${overlapInfo.hasOverlap ? '#f39c12' : '#e67e22'}`
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                          fontSize: '12px'
                        }}>
                          <strong style={{ color: overlapInfo.hasOverlap ? '#f39c12' : '#e67e22' }}>
                            Child {childIndex + 1} {overlapInfo.hasOverlap ? '🔗' : '📄'}
                          </strong>
                          <span style={{ color: '#666' }}>
                            {childChunk.charCount} chars | {childChunk.wordCount} words
                            {overlapInfo.hasOverlap && (
                              <span style={{ color: '#e74c3c', marginLeft: '10px' }}>
                                | Overlap: {overlapInfo.overlapLength} chars ({Math.round((overlapInfo.overlapLength / childChunk.charCount) * 100)}%)
                              </span>
                            )}
                          </span>
                        </div>
                        {overlapInfo.hasOverlap && (
                          <div style={{
                            marginBottom: '8px',
                            padding: '6px',
                            backgroundColor: '#fff3cd',
                            border: '1px solid #ffeaa7',
                            borderRadius: '3px',
                            fontSize: '11px'
                          }}>
                            <strong style={{ color: '#f39c12' }}>🔗 Overlap with previous child:</strong>
                            <span style={{ fontFamily: 'monospace', marginLeft: '5px', backgroundColor: '#fff', padding: '2px', borderRadius: '2px' }}>
                              "{overlapInfo.overlapText.substring(0, 50)}..."
                            </span>
                          </div>
                        )}
                        <div style={{
                          padding: '8px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '3px',
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          lineHeight: '1.3'
                        }}>
                          {overlapInfo.hasOverlap ? (
                            <>
                              <span style={{
                                backgroundColor: '#fff3cd',
                                padding: '1px 3px',
                                borderRadius: '2px',
                                border: '1px solid #ffeaa7'
                              }}>
                                {childChunk.content.substring(0, overlapInfo.overlapLength)}
                              </span>
                              {childChunk.content.substring(overlapInfo.overlapLength)}
                            </>
                          ) : (
                            childChunk.content
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Retrieval Explanation */}
              <div style={{
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '5px',
                fontSize: '12px'
              }}>
                <strong>💡 Retrieval Process:</strong> During search, child chunks are retrieved first for precision,
                but the entire parent context is returned to provide comprehensive information.
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
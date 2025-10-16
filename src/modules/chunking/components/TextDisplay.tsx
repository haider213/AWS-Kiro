import React, { useState, useMemo } from 'react'
import { Chunk, ChunkingParameters } from '../../../types'
import { Card } from '../../../components/UI/Card'
import { useRAGStore } from '../../../store/ragStore'
import { ChunkBoundaryVisualization } from '../../../visualization'

interface TextDisplayProps {
  text: string
  chunks: Chunk[]
  parameters: ChunkingParameters
}

const TextDisplay: React.FC<TextDisplayProps> = ({ text, chunks }) => {
  const { setSampleText } = useRAGStore()
  const [selectedChunk, setSelectedChunk] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(text)
  const [viewMode, setViewMode] = useState<'text' | 'visualization'>('text')

  // Generate colors for chunks
  const chunkColors = useMemo(() => {
    const colors = [
      'bg-blue-200 border-blue-400',
      'bg-green-200 border-green-400', 
      'bg-purple-200 border-purple-400',
      'bg-orange-200 border-orange-400',
      'bg-pink-200 border-pink-400',
      'bg-indigo-200 border-indigo-400',
      'bg-yellow-200 border-yellow-400',
      'bg-red-200 border-red-400',
      'bg-teal-200 border-teal-400',
      'bg-cyan-200 border-cyan-400'
    ]
    
    const chunkColorMap: Record<string, string> = {}
    chunks.forEach((chunk, index) => {
      chunkColorMap[chunk.id] = colors[index % colors.length]
    })
    
    return chunkColorMap
  }, [chunks])

  // Create highlighted text with chunk boundaries
  const renderHighlightedText = () => {
    if (chunks.length === 0) {
      return <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{text}</div>
    }

    // Sort chunks by start index to handle overlaps properly
    const sortedChunks = [...chunks].sort((a, b) => a.startIndex - b.startIndex)
    
    const elements: JSX.Element[] = []
    let lastIndex = 0

    sortedChunks.forEach((chunk, index) => {
      // Add text before this chunk
      if (chunk.startIndex > lastIndex) {
        const beforeText = text.slice(lastIndex, chunk.startIndex)
        if (beforeText) {
          elements.push(
            <span key={`before-${index}`} className="text-gray-700">
              {beforeText}
            </span>
          )
        }
      }

      // Add the chunk with highlighting
      const chunkText = text.slice(chunk.startIndex, chunk.endIndex)
      const isSelected = selectedChunk === chunk.id
      const colorClass = chunkColors[chunk.id] || 'bg-gray-200 border-gray-400'
      
      elements.push(
        <span
          key={chunk.id}
          className={`
            relative cursor-pointer transition-all duration-200 px-1 py-0.5 rounded border-2
            ${colorClass}
            ${isSelected ? 'ring-2 ring-blue-500 shadow-lg scale-105' : 'hover:shadow-md'}
          `}
          onClick={() => setSelectedChunk(isSelected ? null : chunk.id)}
          title={`Chunk ${index + 1}: ${chunk.metadata.size} chars, ${chunk.metadata.wordCount} words`}
        >
          {chunkText}
          {isSelected && (
            <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-64 max-w-sm">
              <div className="text-sm space-y-2">
                <div className="font-medium text-gray-900">Chunk #{index + 1}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Strategy:</span>
                    <div className="font-medium capitalize">{chunk.metadata.strategy}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Size:</span>
                    <div className="font-medium">{chunk.metadata.size} chars</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Words:</span>
                    <div className="font-medium">{chunk.metadata.wordCount}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Sentences:</span>
                    <div className="font-medium">{chunk.metadata.sentenceCount}</div>
                  </div>
                  {chunk.metadata.overlap && chunk.metadata.overlap > 0 && (
                    <>
                      <div>
                        <span className="text-gray-500">Overlap:</span>
                        <div className="font-medium">{chunk.metadata.overlap} words</div>
                      </div>
                    </>
                  )}
                  {chunk.metadata.similarityThreshold && (
                    <div>
                      <span className="text-gray-500">Threshold:</span>
                      <div className="font-medium">{chunk.metadata.similarityThreshold.toFixed(2)}</div>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-500 text-xs">Position:</span>
                  <div className="font-medium text-xs">
                    {chunk.startIndex} - {chunk.endIndex}
                  </div>
                </div>
              </div>
            </div>
          )}
        </span>
      )

      lastIndex = Math.max(lastIndex, chunk.endIndex)
    })

    // Add remaining text after last chunk
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex)
      if (remainingText) {
        elements.push(
          <span key="remaining" className="text-gray-700">
            {remainingText}
          </span>
        )
      }
    }

    return <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{elements}</div>
  }

  const handleSaveText = () => {
    setSampleText(editText)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditText(text)
    setIsEditing(false)
  }

  // Sample texts for quick testing
  const sampleTexts = [
    {
      name: 'AI Overview',
      text: `Artificial Intelligence (AI) has revolutionized numerous industries and continues to shape our future. Machine learning, a subset of AI, enables computers to learn and improve from experience without being explicitly programmed. Deep learning, which uses neural networks with multiple layers, has achieved remarkable breakthroughs in image recognition, natural language processing, and game playing.

Natural Language Processing (NLP) is a field of AI that focuses on the interaction between computers and human language. It involves developing algorithms and models that can understand, interpret, and generate human language in a valuable way. Recent advances in transformer architectures, such as BERT and GPT models, have significantly improved the performance of NLP tasks.

Retrieval-Augmented Generation (RAG) is an innovative approach that combines the power of large language models with external knowledge retrieval. This technique allows AI systems to access and incorporate relevant information from external databases or documents when generating responses, leading to more accurate and contextually relevant outputs. RAG systems typically involve three main components: document chunking, embedding generation, and retrieval mechanisms.`
    },
    {
      name: 'Technical Documentation',
      text: `# Getting Started with React

React is a JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called "components".

## Installation

To get started with React, you can use Create React App:

\`\`\`bash
npx create-react-app my-app
cd my-app
npm start
\`\`\`

## Components

React components are JavaScript functions that return JSX:

\`\`\`jsx
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}
\`\`\`

## Props

Props are read-only inputs to components. They allow you to pass data from parent to child components.

## State

State allows components to manage their own data and re-render when that data changes.`
    },
    {
      name: 'Short Text',
      text: `This is a short text sample. It contains only a few sentences. Perfect for testing different chunking strategies on minimal content.`
    }
  ]

  return (
    <Card title="Text Display & Chunk Visualization" className="bg-white">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Text'}
            </button>
            
            {chunks.length > 0 && !isEditing && (
              <>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('text')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      viewMode === 'text' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Text View
                  </button>
                  <button
                    onClick={() => setViewMode('visualization')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      viewMode === 'visualization' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Visualization
                  </button>
                </div>
                
                <div className="text-sm text-gray-600">
                  {chunks.length} chunks • {viewMode === 'text' ? 'Click chunks to see details' : 'Interactive D3.js visualization'}
                </div>
              </>
            )}
          </div>

          {/* Sample Text Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Quick samples:</label>
            <select
              onChange={(e) => {
                const selectedSample = sampleTexts.find(s => s.name === e.target.value)
                if (selectedSample) {
                  setSampleText(selectedSample.text)
                  setEditText(selectedSample.text)
                }
              }}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Select sample...</option>
              {sampleTexts.map(sample => (
                <option key={sample.name} value={sample.name}>
                  {sample.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Text Editor */}
        {isEditing && (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your text here..."
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveText}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Text Display with Chunk Highlighting */}
        {!isEditing && (
          <div className="relative">
            {viewMode === 'text' ? (
              <>
                <div className="max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg border">
                  {renderHighlightedText()}
                </div>
                
                {chunks.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>Visualization Guide:</strong>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• Each colored section represents a chunk boundary</li>
                        <li>• Click on any chunk to see detailed information</li>
                        <li>• Overlapping chunks may show blended colors</li>
                        <li>• Hover over chunks to see size information</li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-96">
                <ChunkBoundaryVisualization
                  text={text}
                  chunks={chunks}
                  selectedChunk={chunks.find(c => c.id === selectedChunk) || null}
                  onChunkHover={() => {
                    // Optional: Add hover effects
                  }}
                  onChunkClick={(chunk) => {
                    setSelectedChunk(selectedChunk === chunk.id ? null : chunk.id);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Chunk Legend */}
        {chunks.length > 0 && !isEditing && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Chunk Legend</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {chunks.slice(0, 12).map((chunk, index) => (
                <div
                  key={chunk.id}
                  className={`
                    flex items-center space-x-2 p-2 rounded cursor-pointer transition-all
                    ${chunkColors[chunk.id]} 
                    ${selectedChunk === chunk.id ? 'ring-2 ring-blue-500' : 'hover:shadow-sm'}
                  `}
                  onClick={() => setSelectedChunk(selectedChunk === chunk.id ? null : chunk.id)}
                >
                  <div className="text-xs font-medium">#{index + 1}</div>
                  <div className="text-xs text-gray-700 truncate">
                    {chunk.content.slice(0, 20)}...
                  </div>
                </div>
              ))}
              {chunks.length > 12 && (
                <div className="flex items-center justify-center p-2 bg-gray-100 rounded text-xs text-gray-500">
                  +{chunks.length - 12} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default TextDisplay
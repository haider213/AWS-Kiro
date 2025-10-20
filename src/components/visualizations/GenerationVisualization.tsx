import React, { useState } from 'react'

interface DocumentChunk {
  id: string
  content: string
  word_count: number
  char_count: number
  strategy: string
  similarity_score?: number
  rank?: number
}

interface ModelConfig {
  model: string
  temperature: number
  maxTokens: number
  topP: number
}

interface GenerationVisualizationProps {
  systemPrompt: string
  retrievedChunks: DocumentChunk[]
  query: string
  generatedResponse: string
  modelConfig: ModelConfig
}

const GenerationVisualization: React.FC<GenerationVisualizationProps> = ({
  systemPrompt,
  retrievedChunks,
  query,
  generatedResponse,
  modelConfig
}) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'analysis'>('flow')

  const analyzeResponse = () => {
    if (!generatedResponse) return null

    const words = generatedResponse.split(/\s+/)
    const sentences = generatedResponse.split(/[.!?]+/).filter(s => s.trim())
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0
    
    // Simple readability score (Flesch-like approximation)
    const avgSentenceLength = avgWordsPerSentence
    const readabilityScore = Math.max(0, Math.min(100, 206.835 - (1.015 * avgSentenceLength)))
    
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: avgWordsPerSentence.toFixed(1),
      readabilityScore: readabilityScore.toFixed(0),
      estimatedReadingTime: Math.ceil(words.length / 200) // 200 words per minute
    }
  }

  const analysis = analyzeResponse()

  const getReadabilityLevel = (score: number) => {
    if (score >= 90) return { level: 'Very Easy', color: 'green' }
    if (score >= 80) return { level: 'Easy', color: 'green' }
    if (score >= 70) return { level: 'Fairly Easy', color: 'yellow' }
    if (score >= 60) return { level: 'Standard', color: 'orange' }
    if (score >= 50) return { level: 'Fairly Difficult', color: 'orange' }
    if (score >= 30) return { level: 'Difficult', color: 'red' }
    return { level: 'Very Difficult', color: 'red' }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Generation Process Visualization
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('flow')}
              className={`px-3 py-1 text-sm rounded ${
                activeTab === 'flow'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Process Flow
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-3 py-1 text-sm rounded ${
                activeTab === 'analysis'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Response Analysis
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {activeTab === 'flow' 
            ? 'Visual representation of how context and prompts flow through the generation process'
            : 'Analysis of the generated response quality and characteristics'
          }
        </p>
      </div>

      {activeTab === 'flow' ? (
        <div className="space-y-6">
          {/* Process Flow Diagram */}
          <div className="relative">
            <div className="flex flex-col space-y-4">
              
              {/* System Prompt */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    1
                  </div>
                  <h4 className="font-medium text-blue-900">System Prompt</h4>
                </div>
                <p className="text-sm text-blue-800 line-clamp-2">
                  {systemPrompt}
                </p>
                <div className="text-xs text-blue-600 mt-1">
                  {systemPrompt.length} characters
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="text-2xl text-gray-400">↓</div>
              </div>

              {/* Retrieved Context */}
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    2
                  </div>
                  <h4 className="font-medium text-green-900">Retrieved Context</h4>
                </div>
                <div className="space-y-2">
                  {retrievedChunks.map((chunk, index) => (
                    <div key={chunk.id} className="bg-white p-2 rounded border">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-medium text-green-700">
                          Source {index + 1}
                        </span>
                        <span className="text-xs text-green-600">
                          {(chunk.similarity_score! * 100).toFixed(1)}% match
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-green-600 mt-2">
                  {retrievedChunks.reduce((sum, chunk) => sum + chunk.word_count, 0)} words total
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="text-2xl text-gray-400">↓</div>
              </div>

              {/* User Query */}
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    3
                  </div>
                  <h4 className="font-medium text-purple-900">User Query</h4>
                </div>
                <p className="text-sm text-purple-800">
                  {query}
                </p>
                <div className="text-xs text-purple-600 mt-1">
                  {query.split(' ').length} words
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="text-2xl text-gray-400">↓</div>
              </div>

              {/* Model Processing */}
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    4
                  </div>
                  <h4 className="font-medium text-orange-900">AI Model Processing</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-orange-700 font-medium">Model:</span>
                    <span className="text-orange-800 ml-2">{modelConfig.model.split('.')[1]}</span>
                  </div>
                  <div>
                    <span className="text-orange-700 font-medium">Temperature:</span>
                    <span className="text-orange-800 ml-2">{modelConfig.temperature}</span>
                  </div>
                  <div>
                    <span className="text-orange-700 font-medium">Max Tokens:</span>
                    <span className="text-orange-800 ml-2">{modelConfig.maxTokens}</span>
                  </div>
                  <div>
                    <span className="text-orange-700 font-medium">Top P:</span>
                    <span className="text-orange-800 ml-2">{modelConfig.topP}</span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="text-2xl text-gray-400">↓</div>
              </div>

              {/* Generated Response */}
              <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    5
                  </div>
                  <h4 className="font-medium text-gray-900">Generated Response</h4>
                </div>
                <p className="text-sm text-gray-700 line-clamp-4">
                  {generatedResponse}
                </p>
                <div className="text-xs text-gray-600 mt-2">
                  {generatedResponse.split(' ').length} words generated
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Response Analysis */}
          {analysis && (
            <>
              {/* Basic Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{analysis.wordCount}</div>
                  <div className="text-sm text-blue-600">Words</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{analysis.sentenceCount}</div>
                  <div className="text-sm text-green-600">Sentences</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{analysis.avgWordsPerSentence}</div>
                  <div className="text-sm text-purple-600">Avg Words/Sentence</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{analysis.estimatedReadingTime}m</div>
                  <div className="text-sm text-orange-600">Reading Time</div>
                </div>
                <div className={`bg-${getReadabilityLevel(parseFloat(analysis.readabilityScore)).color}-50 p-3 rounded-lg text-center`}>
                  <div className={`text-2xl font-bold text-${getReadabilityLevel(parseFloat(analysis.readabilityScore)).color}-600`}>
                    {analysis.readabilityScore}
                  </div>
                  <div className={`text-sm text-${getReadabilityLevel(parseFloat(analysis.readabilityScore)).color}-600`}>
                    Readability
                  </div>
                </div>
              </div>

              {/* Readability Assessment */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Readability Assessment</h4>
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full bg-${getReadabilityLevel(parseFloat(analysis.readabilityScore)).color}-500`}></div>
                  <span className="text-sm text-gray-700">
                    <strong>{getReadabilityLevel(parseFloat(analysis.readabilityScore)).level}</strong> 
                    (Score: {analysis.readabilityScore}/100)
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Based on sentence length and complexity. Higher scores indicate easier readability.
                </p>
              </div>

              {/* Context Utilization */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Context Utilization</h4>
                <div className="space-y-2">
                  {retrievedChunks.map((chunk, index) => (
                    <div key={chunk.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Source {index + 1}</span>
                        <span className="text-xs text-gray-500">
                          ({chunk.word_count} words, {(chunk.similarity_score! * 100).toFixed(1)}% match)
                        </span>
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${chunk.similarity_score! * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generation Parameters Impact */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Generation Parameters Impact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Temperature</span>
                      <span className="text-sm font-medium">{modelConfig.temperature}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${modelConfig.temperature * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {modelConfig.temperature < 0.3 ? 'Very focused' : 
                       modelConfig.temperature < 0.7 ? 'Balanced' : 'Creative'}
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Top P</span>
                      <span className="text-sm font-medium">{modelConfig.topP}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${modelConfig.topP * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {modelConfig.topP < 0.5 ? 'Conservative' : 
                       modelConfig.topP < 0.9 ? 'Moderate' : 'Diverse'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default GenerationVisualization
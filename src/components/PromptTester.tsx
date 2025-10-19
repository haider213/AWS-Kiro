import React, { useState } from 'react'

interface PromptTestResult {
  input: string
  output: string
  timestamp: Date
  model: string
  parameters: {
    temperature: number
    maxTokens: number
    topP: number
    topK: number
  }
  guardrailsTriggered: string[]
  responseTime: number
  tokenCount: number
}

interface PromptTesterProps {
  systemPrompt: string
  config: any
}

const PromptTester: React.FC<PromptTesterProps> = ({ systemPrompt, config }) => {
  const [testInput, setTestInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<PromptTestResult[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const samplePrompts = [
    "What is RAG and how does it work?",
    "Explain the difference between chunking strategies",
    "How do embeddings represent semantic meaning?",
    "What are the benefits of using retrieval-augmented generation?",
    "Can you help me understand vector similarity search?"
  ]

  const simulateAPICall = async (input: string): Promise<PromptTestResult> => {
    const startTime = Date.now()
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    const endTime = Date.now()
    
    // Simulate guardrail checks
    const guardrailsTriggered: string[] = []
    if (input.toLowerCase().includes('hack') || input.toLowerCase().includes('attack')) {
      guardrailsTriggered.push('Content Filter')
    }
    if (input.length > config.guardrails.maxInputLength) {
      guardrailsTriggered.push('Input Length Limit')
    }
    
    // Simulate response based on system prompt and input
    const responses = [
      `Based on the RAG Pipeline Educator context, ${input.toLowerCase().includes('rag') ? 'RAG (Retrieval-Augmented Generation) is a technique that combines information retrieval with text generation. It works by first retrieving relevant documents from a knowledge base, then using those documents as context to generate more accurate and informed responses.' : 'I can help explain that concept in the context of RAG systems.'}`,
      
      `As an educational AI assistant for RAG concepts, I'd be happy to explain. ${input.toLowerCase().includes('chunk') ? 'Text chunking is the process of breaking down large documents into smaller, manageable pieces. Different strategies include fixed-size chunking, sentence-based chunking, and semantic chunking.' : 'This relates to how we process and understand information in RAG systems.'}`,
      
      `In the context of the RAG Pipeline Educator, ${input.toLowerCase().includes('embedding') ? 'embeddings are vector representations of text that capture semantic meaning. They allow us to find similar content by measuring distances in high-dimensional space.' : 'this is an important concept for understanding how AI systems work with text.'}`,
    ]
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    
    return {
      input,
      output: guardrailsTriggered.length > 0 
        ? `⚠️ Request blocked by guardrails: ${guardrailsTriggered.join(', ')}`
        : randomResponse,
      timestamp: new Date(),
      model: config.model,
      parameters: {
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        topP: config.topP,
        topK: config.topK
      },
      guardrailsTriggered,
      responseTime: endTime - startTime,
      tokenCount: Math.floor(randomResponse.length / 4) // Rough token estimate
    }
  }

  const handleTest = async () => {
    if (!testInput.trim()) return
    
    setIsLoading(true)
    try {
      const result = await simulateAPICall(testInput)
      setTestResults(prev => [result, ...prev])
      setTestInput('')
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🧪 Prompt Tester</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </button>
      </div>

      {/* Test Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Input
          </label>
          <div className="flex space-x-2">
            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter a test prompt to see how the AI responds..."
              className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
            <button
              onClick={handleTest}
              disabled={isLoading || !testInput.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? '⏳' : '🚀'} Test
            </button>
          </div>
        </div>

        {/* Sample Prompts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Test Prompts
          </label>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setTestInput(prompt)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Advanced Test Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Current Model:</span>
              <span className="ml-2 text-gray-600">{config.model}</span>
            </div>
            <div>
              <span className="font-medium">Temperature:</span>
              <span className="ml-2 text-gray-600">{config.temperature}</span>
            </div>
            <div>
              <span className="font-medium">Max Tokens:</span>
              <span className="ml-2 text-gray-600">{config.maxTokens}</span>
            </div>
            <div>
              <span className="font-medium">Guardrails:</span>
              <span className="ml-2 text-gray-600">
                {Object.values(config.guardrails).filter(Boolean).length} active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-900">Test Results ({testResults.length})</h4>
            <button
              onClick={clearResults}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 mb-1">Input:</div>
                    <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {result.input}
                    </div>
                  </div>
                  <div className="ml-4 text-xs text-gray-500">
                    {result.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-900 mb-1">Response:</div>
                  <div className={`text-sm p-2 rounded ${
                    result.guardrailsTriggered.length > 0 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : 'bg-blue-50 text-blue-900'
                  }`}>
                    {result.output}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                  <span>⏱️ {result.responseTime}ms</span>
                  <span>🔢 {result.tokenCount} tokens</span>
                  <span>🤖 {result.model.split('.')[1]}</span>
                  {result.guardrailsTriggered.length > 0 && (
                    <span className="text-red-600">
                      🛡️ {result.guardrailsTriggered.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PromptTester
import React, { useState, useEffect } from 'react'
import PromptTester from './PromptTester'

interface SystemPromptConfig {
  temperature: number
  maxTokens: number
  topP: number
  topK: number
  model: string
  systemPrompt: string
  guardrails: {
    contentFilter: boolean
    toxicityFilter: boolean
    piiFilter: boolean
    maxInputLength: number
    rateLimiting: boolean
  }
}

const SystemPromptVisualization: React.FC = () => {
  const [config, setConfig] = useState<SystemPromptConfig>({
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9,
    topK: 50,
    model: 'anthropic.claude-3-haiku-20240307-v1:0',
    systemPrompt: `You are a helpful AI assistant for the RAG Pipeline Educator application. Your role is to:

1. Provide educational explanations about Retrieval-Augmented Generation (RAG) concepts
2. Help users understand how different components of the RAG pipeline work
3. Answer questions about text chunking, embeddings, retrieval, and generation
4. Maintain a friendly, educational tone suitable for learners
5. Use the provided context from retrieved documents to enhance your responses

Guidelines:
- Always base your responses on the retrieved context when available
- If context is insufficient, clearly state what information is missing
- Explain complex concepts in simple, understandable terms
- Provide practical examples when helpful
- Stay focused on RAG and AI/ML educational topics`,
    guardrails: {
      contentFilter: true,
      toxicityFilter: true,
      piiFilter: true,
      maxInputLength: 4000,
      rateLimiting: true
    }
  })

  const [activeTab, setActiveTab] = useState<'prompt' | 'controls' | 'guardrails'>('prompt')
  const [isEditing, setIsEditing] = useState(false)

  const models = [
    'anthropic.claude-3-haiku-20240307-v1:0',
    'anthropic.claude-3-sonnet-20240229-v1:0',
    'amazon.titan-text-premier-v1:0'
  ]

  const handleConfigChange = (key: keyof SystemPromptConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleGuardrailChange = (key: keyof SystemPromptConfig['guardrails'], value: any) => {
    setConfig(prev => ({
      ...prev,
      guardrails: { ...prev.guardrails, [key]: value }
    }))
  }

  const resetToDefaults = () => {
    setConfig({
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9,
      topK: 50,
      model: 'anthropic.claude-3-haiku-20240307-v1:0',
      systemPrompt: `You are a helpful AI assistant for the RAG Pipeline Educator application. Your role is to:

1. Provide educational explanations about Retrieval-Augmented Generation (RAG) concepts
2. Help users understand how different components of the RAG pipeline work
3. Answer questions about text chunking, embeddings, retrieval, and generation
4. Maintain a friendly, educational tone suitable for learners
5. Use the provided context from retrieved documents to enhance your responses

Guidelines:
- Always base your responses on the retrieved context when available
- If context is insufficient, clearly state what information is missing
- Explain complex concepts in simple, understandable terms
- Provide practical examples when helpful
- Stay focused on RAG and AI/ML educational topics`,
      guardrails: {
        contentFilter: true,
        toxicityFilter: true,
        piiFilter: true,
        maxInputLength: 4000,
        rateLimiting: true
      }
    })
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🤖 System Prompt Configuration
        </h2>
        <p className="text-gray-600">
          Configure the AI system prompt, generation parameters, and safety guardrails
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'prompt', label: '📝 System Prompt', icon: '📝' },
          { id: 'controls', label: '⚙️ Generation Controls', icon: '⚙️' },
          { id: 'guardrails', label: '🛡️ Safety Guardrails', icon: '🛡️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* System Prompt Tab */}
      {activeTab === 'prompt' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">System Prompt</h3>
            <div className="space-x-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-md font-medium ${
                  isEditing
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isEditing ? '💾 Save' : '✏️ Edit'}
              </button>
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
              >
                🔄 Reset
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
            {isEditing ? (
              <textarea
                value={config.systemPrompt}
                onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your system prompt here..."
              />
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                {config.systemPrompt}
              </pre>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 System Prompt Best Practices</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Be specific about the AI's role and capabilities</li>
              <li>• Include clear guidelines for handling context and retrieved information</li>
              <li>• Specify the desired tone and communication style</li>
              <li>• Define boundaries and limitations</li>
              <li>• Include examples of desired behavior when helpful</li>
            </ul>
          </div>
        </div>
      )}

      {/* Generation Controls Tab */}
      {activeTab === 'controls' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Generation Parameters</h3>

          {/* Model Selection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🤖 AI Model
            </label>
            <select
              value={config.model}
              onChange={(e) => handleConfigChange('model', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {models.map(model => (
                <option key={model} value={model}>
                  {model.includes('claude-3-haiku') ? '⚡ Claude 3 Haiku (Fast)' :
                   model.includes('claude-3-sonnet') ? '🎯 Claude 3 Sonnet (Balanced)' :
                   '🏢 Amazon Titan Text Premier'}
                </option>
              ))}
            </select>
          </div>

          {/* Parameter Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Temperature */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🌡️ Temperature: {config.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Focused</span>
                <span>Creative</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Controls randomness in responses. Lower = more focused, Higher = more creative
              </p>
            </div>

            {/* Max Tokens */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📏 Max Tokens: {config.maxTokens}
              </label>
              <input
                type="range"
                min="100"
                max="4000"
                step="100"
                value={config.maxTokens}
                onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Short</span>
                <span>Long</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Maximum length of generated response (~4 chars per token)
              </p>
            </div>

            {/* Top P */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 Top P: {config.topP}
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={config.topP}
                onChange={(e) => handleConfigChange('topP', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Narrow</span>
                <span>Diverse</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Nucleus sampling - considers top P% of probability mass
              </p>
            </div>

            {/* Top K */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔢 Top K: {config.topK}
              </label>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={config.topK}
                onChange={(e) => handleConfigChange('topK', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Few</span>
                <span>Many</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Considers only top K most likely next tokens
              </p>
            </div>
          </div>

          {/* Parameter Presets */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-3">⚡ Quick Presets</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  handleConfigChange('temperature', 0.3)
                  handleConfigChange('topP', 0.8)
                  handleConfigChange('topK', 20)
                }}
                className="p-3 bg-white border border-yellow-300 rounded-md hover:bg-yellow-50 text-left"
              >
                <div className="font-medium text-yellow-900">🎯 Precise</div>
                <div className="text-xs text-yellow-700">Factual, consistent responses</div>
              </button>
              <button
                onClick={() => {
                  handleConfigChange('temperature', 0.7)
                  handleConfigChange('topP', 0.9)
                  handleConfigChange('topK', 50)
                }}
                className="p-3 bg-white border border-yellow-300 rounded-md hover:bg-yellow-50 text-left"
              >
                <div className="font-medium text-yellow-900">⚖️ Balanced</div>
                <div className="text-xs text-yellow-700">Good mix of accuracy & creativity</div>
              </button>
              <button
                onClick={() => {
                  handleConfigChange('temperature', 0.9)
                  handleConfigChange('topP', 0.95)
                  handleConfigChange('topK', 80)
                }}
                className="p-3 bg-white border border-yellow-300 rounded-md hover:bg-yellow-50 text-left"
              >
                <div className="font-medium text-yellow-900">🎨 Creative</div>
                <div className="text-xs text-yellow-700">Diverse, imaginative responses</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Guardrails Tab */}
      {activeTab === 'guardrails' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Safety & Security Controls</h3>

          {/* Content Filters */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-4">🛡️ Content Filtering</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-red-900">Content Filter</label>
                  <p className="text-sm text-red-700">Blocks harmful or inappropriate content</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.guardrails.contentFilter}
                    onChange={(e) => handleGuardrailChange('contentFilter', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-red-900">Toxicity Filter</label>
                  <p className="text-sm text-red-700">Detects and blocks toxic language</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.guardrails.toxicityFilter}
                    onChange={(e) => handleGuardrailChange('toxicityFilter', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-red-900">PII Filter</label>
                  <p className="text-sm text-red-700">Prevents exposure of personal information</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.guardrails.piiFilter}
                    onChange={(e) => handleGuardrailChange('piiFilter', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Rate Limiting */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 mb-4">⏱️ Rate Limiting</h4>
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="font-medium text-orange-900">Enable Rate Limiting</label>
                <p className="text-sm text-orange-700">Prevents API abuse and controls costs</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.guardrails.rateLimiting}
                  onChange={(e) => handleGuardrailChange('rateLimiting', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
            
            {config.guardrails.rateLimiting && (
              <div className="bg-white rounded-md p-3 border border-orange-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-orange-900">Per User:</span>
                    <span className="text-orange-700"> 10 req/min</span>
                  </div>
                  <div>
                    <span className="font-medium text-orange-900">Per IP:</span>
                    <span className="text-orange-700"> 50 req/min</span>
                  </div>
                  <div>
                    <span className="font-medium text-orange-900">Global:</span>
                    <span className="text-orange-700"> 1000 req/min</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Validation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-4">📏 Input Validation</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Maximum Input Length: {config.guardrails.maxInputLength} characters
                </label>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={config.guardrails.maxInputLength}
                  onChange={(e) => handleGuardrailChange('maxInputLength', parseInt(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-blue-600 mt-1">
                  <span>100</span>
                  <span>10,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3">✅ Security Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${config.guardrails.contentFilter ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-green-800">Content Filtering</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${config.guardrails.toxicityFilter ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-green-800">Toxicity Detection</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${config.guardrails.piiFilter ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-green-800">PII Protection</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${config.guardrails.rateLimiting ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-green-800">Rate Limiting</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Prompt Tester */}
      <PromptTester systemPrompt={config.systemPrompt} config={config} />

      {/* Footer Actions */}
      <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Configuration will be applied to all AI generation requests
        </div>
        <div className="space-x-3">
          <button
            onClick={() => console.log('Exporting config:', config)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
          >
            📤 Export Config
          </button>
          <button
            onClick={() => {
              const configJson = JSON.stringify(config, null, 2)
              navigator.clipboard.writeText(configJson)
              alert('Configuration copied to clipboard!')
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
          >
            📋 Copy Config
          </button>
        </div>
      </div>
    </div>
  )
}

export default SystemPromptVisualization
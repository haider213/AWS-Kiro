import React, { useState, useEffect } from 'react'

interface EvaluationMetric {
  id: string
  name: string
  description: string
  type: 'faithfulness' | 'relevance' | 'coherence' | 'contradiction' | 'custom'
  prompt: string
  higherIsBetter: boolean
  enabled: boolean
}

interface EvaluationResult {
  metric: string
  score: number
  explanation: string
  timestamp: string
}

interface TestCase {
  id: string
  query: string
  contexts: string[]
  expectedAnswer?: string
  actualAnswer?: string
  results: EvaluationResult[]
}

const RAGEvaluationBuilder: React.FC = () => {
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('')
  const [generatedMetrics, setGeneratedMetrics] = useState<EvaluationMetric[]>([])
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [isGeneratingMetrics, setIsGeneratingMetrics] = useState(false)
  const [isRunningEvaluation, setIsRunningEvaluation] = useState(false)
  const [evaluationResults, setEvaluationResults] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'design' | 'metrics' | 'test' | 'results'>('design')

  const defaultMetrics: EvaluationMetric[] = [
    {
      id: 'faithfulness',
      name: 'Faithfulness',
      description: 'Measures if the response is grounded in the provided context',
      type: 'faithfulness',
      prompt: 'Rate how well the response is supported by the given context. Score 0-1 where 1 means fully supported.',
      higherIsBetter: true,
      enabled: true
    },
    {
      id: 'relevance',
      name: 'Context Relevance',
      description: 'Measures if retrieved contexts are relevant to the query',
      type: 'relevance',
      prompt: 'Rate how relevant the retrieved contexts are to answering the query. Score 0-1 where 1 means highly relevant.',
      higherIsBetter: true,
      enabled: true
    },
    {
      id: 'contradiction',
      name: 'Context Contradiction',
      description: 'Detects contradictions between different context chunks',
      type: 'contradiction',
      prompt: 'Identify contradictions between the provided context chunks. Score 0-1 where 1 means strong contradictions.',
      higherIsBetter: false,
      enabled: true
    }
  ]

  const sampleEvaluationPrompts = [
    "I want to evaluate if my RAG system provides accurate medical information without hallucinations",
    "Create metrics to test if the system maintains consistency across different queries about the same topic",
    "Evaluate whether the retrieved documents actually help answer the user's question",
    "Test if the system can detect when it doesn't have enough information to answer",
    "Measure how well the system handles contradictory information in the knowledge base",
    "Check if responses are appropriate for the intended audience (technical vs general)",
    "Evaluate citation accuracy - does the system correctly reference its sources?"
  ]

  const generateMetricsFromNL = async () => {
    if (!naturalLanguageInput.trim()) return

    setIsGeneratingMetrics(true)
    try {
      const response = await fetch('http://localhost:3001/api/generation/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are an expert in RAG system evaluation. Based on the user's natural language description, generate 3-5 specific evaluation metrics for a RAG system.

User Request: "${naturalLanguageInput}"

For each metric, provide:
1. A clear name (2-4 words)
2. A detailed description of what it measures
3. A specific evaluation prompt that an LLM judge could use
4. Whether higher scores are better (true/false)
5. The metric type (faithfulness, relevance, coherence, contradiction, or custom)

Format your response as a JSON array of metric objects with these fields:
- name: string
- description: string  
- prompt: string
- higherIsBetter: boolean
- type: string

Example format:
[
  {
    "name": "Medical Accuracy",
    "description": "Measures if medical information is factually correct and safe",
    "prompt": "Evaluate if the medical information provided is accurate and safe. Consider factual correctness, potential harm, and appropriateness. Score 0-1 where 1 means completely accurate and safe.",
    "higherIsBetter": true,
    "type": "custom"
  }
]

Generate metrics now:`,
          model: 'anthropic.claude-3-haiku-20240307-v1:0',
          parameters: { temperature: 0.3, maxTokens: 1500 }
        })
      })

      const data = await response.json()
      if (data.success) {
        try {
          // Extract JSON from the response
          const jsonMatch = data.result.response.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            const metrics = JSON.parse(jsonMatch[0])
            const formattedMetrics: EvaluationMetric[] = metrics.map((m: any, index: number) => ({
              id: `custom_${Date.now()}_${index}`,
              name: m.name || `Custom Metric ${index + 1}`,
              description: m.description || 'Custom evaluation metric',
              type: m.type || 'custom',
              prompt: m.prompt || 'Evaluate this aspect of the RAG system.',
              higherIsBetter: m.higherIsBetter !== false,
              enabled: true
            }))
            setGeneratedMetrics([...defaultMetrics, ...formattedMetrics])
          } else {
            throw new Error('Could not parse metrics from response')
          }
        } catch (parseError) {
          console.error('Failed to parse generated metrics:', parseError)
          // Fallback: create a single custom metric based on the input
          const fallbackMetric: EvaluationMetric = {
            id: `custom_${Date.now()}`,
            name: 'Custom Evaluation',
            description: naturalLanguageInput,
            type: 'custom',
            prompt: `Evaluate the RAG system based on this criteria: ${naturalLanguageInput}. Score 0-1.`,
            higherIsBetter: true,
            enabled: true
          }
          setGeneratedMetrics([...defaultMetrics, fallbackMetric])
        }
      }
    } catch (error) {
      console.error('Failed to generate metrics:', error)
    } finally {
      setIsGeneratingMetrics(false)
    }
  }

  const addTestCase = () => {
    const newTestCase: TestCase = {
      id: `test_${Date.now()}`,
      query: '',
      contexts: [''],
      results: []
    }
    setTestCases([...testCases, newTestCase])
  }

  const updateTestCase = (id: string, field: keyof TestCase, value: any) => {
    setTestCases(testCases.map(tc => 
      tc.id === id ? { ...tc, [field]: value } : tc
    ))
  }

  const runEvaluation = async () => {
    if (testCases.length === 0) {
      alert('Please add at least one test case')
      return
    }

    setIsRunningEvaluation(true)
    const results: any[] = []

    try {
      for (const testCase of testCases) {
        if (!testCase.query.trim() || testCase.contexts.every(c => !c.trim())) {
          continue
        }

        const testResults: EvaluationResult[] = []
        
        for (const metric of generatedMetrics.filter(m => m.enabled)) {
          try {
            const evaluationPrompt = `${metric.prompt}

QUERY: ${testCase.query}
CONTEXTS: ${testCase.contexts.filter(c => c.trim()).join('\n\n---\n\n')}
${testCase.actualAnswer ? `RESPONSE: ${testCase.actualAnswer}` : ''}
${testCase.expectedAnswer ? `EXPECTED: ${testCase.expectedAnswer}` : ''}

Provide your evaluation as:
SCORE: [number between 0 and 1]
EXPLANATION: [brief explanation of your scoring]`

            const response = await fetch('http://localhost:3001/api/generation/response', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: evaluationPrompt,
                model: 'anthropic.claude-3-haiku-20240307-v1:0',
                parameters: { temperature: 0.1, maxTokens: 500 }
              })
            })

            const data = await response.json()
            if (data.success) {
              const responseText = data.result.response
              const scoreMatch = responseText.match(/SCORE:\s*([0-9]*\.?[0-9]+)/)
              const explanationMatch = responseText.match(/EXPLANATION:\s*(.+)$/m)
              
              const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0
              const explanation = explanationMatch ? explanationMatch[1].trim() : 'No explanation provided'

              testResults.push({
                metric: metric.name,
                score: Math.max(0, Math.min(1, score)),
                explanation,
                timestamp: new Date().toISOString()
              })
            }
          } catch (error) {
            console.error(`Failed to evaluate ${metric.name}:`, error)
            testResults.push({
              metric: metric.name,
              score: 0,
              explanation: 'Evaluation failed',
              timestamp: new Date().toISOString()
            })
          }
        }

        results.push({
          testCase,
          results: testResults,
          averageScore: testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length
        })
      }

      setEvaluationResults(results)
      setActiveTab('results')
    } catch (error) {
      console.error('Evaluation failed:', error)
    } finally {
      setIsRunningEvaluation(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">🧪 RAG Evaluation Builder</h1>
        <p className="text-green-100 mb-4">
          Create custom evaluation metrics using natural language and test your RAG system's performance
        </p>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/10 p-1 rounded-lg">
          {[
            { id: 'design', label: '🎯 Design', desc: 'Define Evaluation Goals' },
            { id: 'metrics', label: '📊 Metrics', desc: 'Configure Metrics' },
            { id: 'test', label: '🧪 Test Cases', desc: 'Create Test Data' },
            { id: 'results', label: '📈 Results', desc: 'View Evaluation Results' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="text-sm">{tab.label}</div>
              <div className="text-xs opacity-75">{tab.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Design Tab */}
      {activeTab === 'design' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🎯 Define Your Evaluation Goals</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe what you want to evaluate about your RAG system
              </label>
              <textarea
                value={naturalLanguageInput}
                onChange={(e) => setNaturalLanguageInput(e.target.value)}
                placeholder="Example: I want to evaluate if my medical RAG system provides accurate information without hallucinations and properly cites its sources..."
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample Evaluation Goals
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sampleEvaluationPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setNaturalLanguageInput(prompt)}
                    className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateMetricsFromNL}
              disabled={isGeneratingMetrics || !naturalLanguageInput.trim()}
              className="w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isGeneratingMetrics ? '🤖 Generating Custom Metrics...' : '✨ Generate Evaluation Metrics'}
            </button>

            {generatedMetrics.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">
                  ✅ Generated {generatedMetrics.length} evaluation metrics
                </h3>
                <p className="text-sm text-green-700">
                  Review and configure your metrics in the next tab, then create test cases to run evaluations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Configure Evaluation Metrics</h2>
          
          <div className="space-y-4">
            {generatedMetrics.map((metric) => (
              <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={metric.enabled}
                      onChange={(e) => {
                        setGeneratedMetrics(generatedMetrics.map(m => 
                          m.id === metric.id ? { ...m, enabled: e.target.checked } : m
                        ))
                      }}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{metric.name}</h3>
                      <p className="text-sm text-gray-600">{metric.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      metric.type === 'custom' ? 'bg-purple-100 text-purple-800' :
                      metric.type === 'faithfulness' ? 'bg-blue-100 text-blue-800' :
                      metric.type === 'relevance' ? 'bg-green-100 text-green-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {metric.type}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      metric.higherIsBetter ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {metric.higherIsBetter ? 'Higher Better' : 'Lower Better'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded p-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Evaluation Prompt
                  </label>
                  <textarea
                    value={metric.prompt}
                    onChange={(e) => {
                      setGeneratedMetrics(generatedMetrics.map(m => 
                        m.id === metric.id ? { ...m, prompt: e.target.value } : m
                      ))
                    }}
                    className="w-full h-20 p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {generatedMetrics.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>No metrics generated yet. Go to the Design tab to create evaluation metrics.</p>
            </div>
          )}
        </div>
      )}

      {/* Test Cases Tab */}
      {activeTab === 'test' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">🧪 Test Cases</h2>
            <button
              onClick={addTestCase}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              + Add Test Case
            </button>
          </div>
          
          <div className="space-y-6">
            {testCases.map((testCase, index) => (
              <div key={testCase.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Test Case #{index + 1}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Query
                    </label>
                    <input
                      type="text"
                      value={testCase.query}
                      onChange={(e) => updateTestCase(testCase.id, 'query', e.target.value)}
                      placeholder="Enter the user query to test..."
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Retrieved Contexts
                    </label>
                    {testCase.contexts.map((context, ctxIndex) => (
                      <textarea
                        key={ctxIndex}
                        value={context}
                        onChange={(e) => {
                          const newContexts = [...testCase.contexts]
                          newContexts[ctxIndex] = e.target.value
                          updateTestCase(testCase.id, 'contexts', newContexts)
                        }}
                        placeholder={`Context ${ctxIndex + 1}...`}
                        className="w-full h-20 p-2 mb-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    ))}
                    <button
                      onClick={() => {
                        const newContexts = [...testCase.contexts, '']
                        updateTestCase(testCase.id, 'contexts', newContexts)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Context
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Answer (Optional)
                      </label>
                      <textarea
                        value={testCase.expectedAnswer || ''}
                        onChange={(e) => updateTestCase(testCase.id, 'expectedAnswer', e.target.value)}
                        placeholder="What should the ideal answer be?"
                        className="w-full h-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Actual Answer (Optional)
                      </label>
                      <textarea
                        value={testCase.actualAnswer || ''}
                        onChange={(e) => updateTestCase(testCase.id, 'actualAnswer', e.target.value)}
                        placeholder="What did your RAG system actually respond?"
                        className="w-full h-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {testCases.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🧪</div>
              <p>No test cases yet. Add test cases to evaluate your RAG system.</p>
            </div>
          )}

          {testCases.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={runEvaluation}
                disabled={isRunningEvaluation || generatedMetrics.filter(m => m.enabled).length === 0}
                className="w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isRunningEvaluation ? '⏳ Running Evaluation...' : '🚀 Run Evaluation'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📈 Evaluation Results</h2>
          
          {evaluationResults.length > 0 ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">📊 Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {evaluationResults.length}
                    </div>
                    <div className="text-sm text-blue-700">Test Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {generatedMetrics.filter(m => m.enabled).length}
                    </div>
                    <div className="text-sm text-green-700">Metrics</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {(evaluationResults.reduce((sum, r) => sum + r.averageScore, 0) / evaluationResults.length).toFixed(2)}
                    </div>
                    <div className="text-sm text-purple-700">Avg Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {evaluationResults.reduce((sum, r) => sum + r.results.length, 0)}
                    </div>
                    <div className="text-sm text-orange-700">Total Evaluations</div>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              {evaluationResults.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Test Case #{index + 1} - Average Score: {result.averageScore.toFixed(2)}
                  </h3>
                  
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <div className="text-sm font-medium text-gray-700">Query:</div>
                    <div className="text-sm text-gray-600">{result.testCase.query}</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.results.map((metricResult: EvaluationResult, metricIndex: number) => (
                      <div key={metricIndex} className="border border-gray-200 rounded p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900">{metricResult.metric}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            metricResult.score >= 0.8 ? 'bg-green-100 text-green-800' :
                            metricResult.score >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {metricResult.score.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {metricResult.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Export Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    const exportData = {
                      metrics: generatedMetrics.filter(m => m.enabled),
                      testCases,
                      results: evaluationResults,
                      timestamp: new Date().toISOString()
                    }
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `rag_evaluation_${Date.now()}.json`
                    a.click()
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  📥 Export Results
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📈</div>
              <p>No evaluation results yet. Run evaluations from the Test Cases tab.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RAGEvaluationBuilder
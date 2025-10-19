import React, { useState, useEffect } from 'react'

interface ChunkingStrategy {
  name: string
  description: string
  parameters: Record<string, any>
  pros: string[]
  cons: string[]
}

interface ChunkingStrategiesComparisonProps {
  strategies: Record<string, ChunkingStrategy>
  currentStrategy: string
  onStrategyChange: (strategy: string, parameters: Record<string, any>) => void
}

const ChunkingStrategiesComparison: React.FC<ChunkingStrategiesComparisonProps> = ({
  strategies,
  currentStrategy,
  onStrategyChange
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState(currentStrategy)
  const [parameters, setParameters] = useState<Record<string, any>>({})

  useEffect(() => {
    if (strategies[selectedStrategy]) {
      const defaultParams: Record<string, any> = {}
      Object.entries(strategies[selectedStrategy].parameters).forEach(([key, config]) => {
        defaultParams[key] = config.default
      })
      setParameters(defaultParams)
    }
  }, [selectedStrategy, strategies])

  const handleParameterChange = (paramName: string, value: any) => {
    const newParams = { ...parameters, [paramName]: value }
    setParameters(newParams)
    onStrategyChange(selectedStrategy, newParams)
  }

  const handleStrategySelect = (strategy: string) => {
    setSelectedStrategy(strategy)
    if (strategies[strategy]) {
      const defaultParams: Record<string, any> = {}
      Object.entries(strategies[strategy].parameters).forEach(([key, config]) => {
        defaultParams[key] = config.default
      })
      setParameters(defaultParams)
      onStrategyChange(strategy, defaultParams)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Chunking Strategies Comparison
      </h3>
      
      {/* Strategy Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(strategies).map(([key, strategy]) => (
          <div
            key={key}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedStrategy === key
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleStrategySelect(key)}
          >
            <h4 className="font-medium text-gray-900 mb-2">{strategy.name}</h4>
            <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
            
            {/* Strategy Icon/Visual */}
            <div className="mb-3">
              {key === 'sentence_based' && (
                <div className="flex space-x-1">
                  <div className="w-8 h-2 bg-blue-300 rounded"></div>
                  <div className="w-12 h-2 bg-blue-400 rounded"></div>
                  <div className="w-6 h-2 bg-blue-300 rounded"></div>
                </div>
              )}
              {key === 'fixed_size' && (
                <div className="flex space-x-1">
                  <div className="w-8 h-2 bg-green-400 rounded"></div>
                  <div className="w-8 h-2 bg-green-400 rounded"></div>
                  <div className="w-8 h-2 bg-green-400 rounded"></div>
                </div>
              )}
              {key === 'paragraph_based' && (
                <div className="flex space-x-1">
                  <div className="w-6 h-2 bg-purple-300 rounded"></div>
                  <div className="w-10 h-2 bg-purple-400 rounded"></div>
                  <div className="w-4 h-2 bg-purple-300 rounded"></div>
                </div>
              )}
              {key === 'semantic_based' && (
                <div className="flex space-x-1">
                  <div className="w-5 h-2 bg-orange-300 rounded"></div>
                  <div className="w-9 h-2 bg-orange-400 rounded"></div>
                  <div className="w-7 h-2 bg-orange-500 rounded"></div>
                </div>
              )}
            </div>
            
            {/* Pros and Cons Preview */}
            <div className="text-xs">
              <div className="text-green-600 mb-1">
                ✓ {strategy.pros[0]}
              </div>
              <div className="text-red-600">
                ✗ {strategy.cons[0]}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Strategy Details */}
      {strategies[selectedStrategy] && (
        <div className="border-t pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Parameters */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Parameters</h4>
              {Object.keys(strategies[selectedStrategy].parameters).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(strategies[selectedStrategy].parameters).map(([paramName, config]) => (
                    <div key={paramName}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {paramName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: {parameters[paramName]}
                      </label>
                      {config.type === 'int' ? (
                        <input
                          type="range"
                          min={config.min}
                          max={config.max}
                          value={parameters[paramName] || config.default}
                          onChange={(e) => handleParameterChange(paramName, parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      ) : config.type === 'float' ? (
                        <input
                          type="range"
                          min={config.min}
                          max={config.max}
                          step="0.1"
                          value={parameters[paramName] || config.default}
                          onChange={(e) => handleParameterChange(paramName, parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      ) : (
                        <input
                          type="text"
                          value={parameters[paramName] || config.default}
                          onChange={(e) => handleParameterChange(paramName, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{config.min}</span>
                        <span>{config.max}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No configurable parameters</p>
              )}
            </div>

            {/* Pros and Cons */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Pros & Cons</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-green-700 mb-2">✓ Advantages</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {strategies[selectedStrategy].pros.map((pro, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-red-700 mb-2">✗ Disadvantages</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {strategies[selectedStrategy].cons.map((con, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Comparison Chart */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-3">Strategy Comparison</h5>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-900">Aspect</th>
                    {Object.entries(strategies).map(([key, strategy]) => (
                      <th key={key} className="text-center py-2 px-3 font-medium text-gray-900">
                        {strategy.name.split(' ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium text-gray-700">Consistency</td>
                    <td className="text-center py-2 px-3">⭐⭐⭐</td>
                    <td className="text-center py-2 px-3">⭐⭐⭐⭐⭐</td>
                    <td className="text-center py-2 px-3">⭐⭐</td>
                    <td className="text-center py-2 px-3">⭐⭐</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium text-gray-700">Semantic Coherence</td>
                    <td className="text-center py-2 px-3">⭐⭐⭐⭐</td>
                    <td className="text-center py-2 px-3">⭐⭐</td>
                    <td className="text-center py-2 px-3">⭐⭐⭐⭐⭐</td>
                    <td className="text-center py-2 px-3">⭐⭐⭐⭐⭐</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium text-gray-700">Performance</td>
                    <td className="text-center py-2 px-3">⭐⭐⭐⭐</td>
                    <td className="text-center py-2 px-3">⭐⭐⭐⭐⭐</td>
                    <td className="text-center py-2 px-3">⭐⭐⭐⭐⭐</td>
                    <td className="text-center py-2 px-3">⭐⭐</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-gray-700">Complexity</td>
                    <td className="text-center py-2 px-3">⭐⭐</td>
                    <td className="text-center py-2 px-3">⭐</td>
                    <td className="text-center py-2 px-3">⭐</td>
                    <td className="text-center py-2 px-3">⭐⭐⭐⭐⭐</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChunkingStrategiesComparison
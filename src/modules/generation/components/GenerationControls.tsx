import React from 'react'
import { useRAGStore } from '../../../store/ragStore'
import { useGenerationStore } from '../../../store/generationStore'
import { LoadingSpinner } from '../../../components/UI/LoadingSpinner'
import Button from '../../../components/UI/Button'

export const GenerationControls: React.FC = () => {
    const {
        searchResults,
        generationParameters,
        updateGenerationParameters
    } = useRAGStore()

    const {
        query,
        selectedModel,
        availableModels,
        isGenerating,
        isComparing,
        showPromptDetails,
        showModelComparison,
        promptConstruction,
        generationResult,
        setQuery,
        setSelectedModel,
        setShowPromptDetails,
        setShowModelComparison,
        constructPrompt,
        generateResponse,
        compareModels,
        clearGeneration
    } = useGenerationStore()

    const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setQuery(e.target.value)
    }

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedModel(e.target.value)
    }

    const handleParameterChange = (key: keyof typeof generationParameters, value: any) => {
        updateGenerationParameters({ [key]: value })
    }

    const handleConstructPrompt = async () => {
        if (!query.trim()) return

        const retrievedChunks = searchResults.map(result => result.chunk)
        await constructPrompt(query, retrievedChunks, generationParameters)
    }

    const handleGenerateResponse = async () => {
        await generateResponse(generationParameters)
    }

    const handleCompareModels = async () => {
        const modelsToCompare = availableModels.map(model => model.modelId)
        await compareModels(modelsToCompare, generationParameters)
    }

    const canConstructPrompt = query.trim().length > 0 && searchResults.length > 0
    const canGenerate = promptConstruction !== null
    const hasResults = generationResult !== null

    return (
        <div className="space-y-6">
            {/* Query Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Query
                </label>
                <textarea
                    value={query}
                    onChange={handleQueryChange}
                    placeholder="Enter your question about the retrieved content..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                />
                <p className="mt-1 text-sm text-gray-500">
                    {searchResults.length > 0
                        ? `${searchResults.length} chunks available for context`
                        : 'No search results available. Please search for content first.'
                    }
                </p>
            </div>

            {/* Model Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generation Model
                </label>
                <select
                    value={selectedModel}
                    onChange={handleModelChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    {availableModels.map((model) => (
                        <option key={model.modelId} value={model.modelId}>
                            {model.modelId.includes('claude-3-haiku') && 'Claude 3 Haiku (Fast)'}
                            {model.modelId.includes('claude-3-sonnet') && 'Claude 3 Sonnet (Balanced)'}
                            {model.modelId.includes('titan-text-premier') && 'Amazon Titan Text Premier'}
                        </option>
                    ))}
                </select>
            </div>

            {/* Generation Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div data-tooltip="context-length">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Context Length: {generationParameters.maxContextLength}
                    </label>
                    <input
                        type="range"
                        min="500"
                        max="4000"
                        step="100"
                        value={generationParameters.maxContextLength}
                        onChange={(e) => handleParameterChange('maxContextLength', parseInt(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>500</span>
                        <span>4000</span>
                    </div>
                </div>

                <div data-tooltip="temperature">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temperature: {generationParameters.temperature}
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={generationParameters.temperature}
                        onChange={(e) => handleParameterChange('temperature', parseFloat(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0 (Focused)</span>
                        <span>1 (Creative)</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Context Selection Strategy
                    </label>
                    <select
                        value={generationParameters.contextSelectionStrategy}
                        onChange={(e) => handleParameterChange('contextSelectionStrategy', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="top-k">Top-K (Best matches first)</option>
                        <option value="threshold">Threshold (Above similarity threshold)</option>
                        <option value="diverse">Diverse (Varied content selection)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Tokens: {generationParameters.maxTokens}
                    </label>
                    <input
                        type="range"
                        min="100"
                        max="2000"
                        step="50"
                        value={generationParameters.maxTokens}
                        onChange={(e) => handleParameterChange('maxTokens', parseInt(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>100</span>
                        <span>2000</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <Button
                    onClick={handleConstructPrompt}
                    disabled={!canConstructPrompt || isGenerating}
                    variant="primary"
                >
                    {isGenerating ? (
                        <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Constructing...
                        </>
                    ) : (
                        'Construct Prompt'
                    )}
                </Button>

                <Button
                    onClick={handleGenerateResponse}
                    disabled={!canGenerate || isGenerating}
                    variant="secondary"
                    data-tour="generate-response"
                >
                    {isGenerating ? (
                        <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Generating...
                        </>
                    ) : (
                        'Generate Response'
                    )}
                </Button>

                <Button
                    onClick={handleCompareModels}
                    disabled={!canGenerate || isComparing}
                    variant="outline"
                >
                    {isComparing ? (
                        <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Comparing...
                        </>
                    ) : (
                        'Compare Models'
                    )}
                </Button>

                {(promptConstruction || hasResults) && (
                    <Button
                        onClick={clearGeneration}
                        variant="ghost"
                    >
                        Clear
                    </Button>
                )}
            </div>

            {/* Toggle Buttons */}
            {promptConstruction && (
                <div className="flex gap-3">
                    <Button
                        onClick={() => setShowPromptDetails(!showPromptDetails)}
                        variant="ghost"
                        size="sm"
                    >
                        {showPromptDetails ? 'Hide' : 'Show'} Prompt Details
                    </Button>

                    {availableModels.length > 1 && (
                        <Button
                            onClick={() => setShowModelComparison(!showModelComparison)}
                            variant="ghost"
                            size="sm"
                        >
                            {showModelComparison ? 'Hide' : 'Show'} Model Comparison
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

export default GenerationControls
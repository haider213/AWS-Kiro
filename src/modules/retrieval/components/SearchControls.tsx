import React, { useState, useCallback, useEffect } from 'react';
import { useRetrievalStore } from '../../../store/retrievalStore';
import { SearchMode } from '../../../types';

export const SearchControls: React.FC = () => {
  const {
    query,
    searchParameters,
    showAdvancedOptions,
    searchSuggestions,
    isSearching,
    setQuery,
    updateSearchParameters,
    setShowAdvancedOptions,
  } = useRetrievalStore();

  const [localQuery, setLocalQuery] = useState(query);

  // Debounced query update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== query) {
        setQuery(localQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, query, setQuery]);

  const handleModeChange = useCallback((mode: SearchMode) => {
    updateSearchParameters({ mode });
  }, [updateSearchParameters]);

  const handleParameterChange = useCallback((
    parameter: keyof typeof searchParameters,
    value: number | boolean
  ) => {
    updateSearchParameters({ [parameter]: value });
  }, [updateSearchParameters]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setLocalQuery(suggestion);
    setQuery(suggestion);
  }, [setQuery]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative" data-tour="search-query">
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Enter your search query..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSearching}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Search Suggestions */}
      {searchSuggestions.length > 0 && !localQuery && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Suggestions:</span>
          {searchSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Search Mode Selection */}
      <div className="flex space-x-4">
        <label className="text-sm font-medium text-gray-700">Search Mode:</label>
        <div className="flex space-x-3">
          {(['keyword', 'semantic', 'hybrid'] as SearchMode[]).map((mode) => (
            <label key={mode} className="flex items-center">
              <input
                type="radio"
                name="searchMode"
                value={mode}
                checked={searchParameters.mode === mode}
                onChange={() => handleModeChange(mode)}
                className="mr-2"
              />
              <span className="text-sm capitalize">{mode}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Basic Parameters */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Result Limit: {searchParameters.resultLimit}
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={searchParameters.resultLimit}
            onChange={(e) => handleParameterChange('resultLimit', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Similarity Threshold: {searchParameters.similarityThreshold.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={searchParameters.similarityThreshold}
            onChange={(e) => handleParameterChange('similarityThreshold', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <button
        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
      </button>

      {/* Advanced Parameters */}
      {showAdvancedOptions && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {searchParameters.mode === 'hybrid' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keyword Weight: {searchParameters.keywordWeight?.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={searchParameters.keywordWeight || 0.3}
                  onChange={(e) => handleParameterChange('keywordWeight', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semantic Weight: {searchParameters.semanticWeight?.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={searchParameters.semanticWeight || 0.7}
                  onChange={(e) => handleParameterChange('semanticWeight', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableHighlighting"
              checked={searchParameters.enableHighlighting}
              onChange={(e) => handleParameterChange('enableHighlighting', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="enableHighlighting" className="text-sm text-gray-700">
              Enable text highlighting in results
            </label>
          </div>
        </div>
      )}

      {/* Search Mode Descriptions */}
      <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
        <strong>Search Modes:</strong>
        <ul className="mt-1 space-y-1">
          <li><strong>Keyword:</strong> Traditional text matching using TF-IDF and term frequency</li>
          <li><strong>Semantic:</strong> Vector similarity using embeddings to find conceptually related content</li>
          <li><strong>Hybrid:</strong> Combines both approaches with weighted scoring for comprehensive results</li>
        </ul>
      </div>
    </div>
  );
};

export default SearchControls;
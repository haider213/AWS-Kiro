import React, { useCallback } from 'react';
import { useRetrievalStore } from '../../../store/retrievalStore';
import { SearchResult, TextHighlight } from '../../../types';

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onSelect: (result: SearchResult) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ 
  result, 
  isSelected, 
  onSelect 
}) => {
  const handleClick = useCallback(() => {
    onSelect(result);
  }, [result, onSelect]);

  const renderHighlightedText = (text: string, highlights: TextHighlight[]) => {
    if (!highlights.length) return text;

    // Sort highlights by start index
    const sortedHighlights = [...highlights].sort((a, b) => a.startIndex - b.startIndex);
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, index) => {
      // Add text before highlight
      if (highlight.startIndex > lastIndex) {
        parts.push(text.substring(lastIndex, highlight.startIndex));
      }

      // Add highlighted text
      const highlightClass = {
        exact: 'bg-yellow-200 font-semibold',
        partial: 'bg-yellow-100 font-medium',
        semantic: 'bg-blue-100 font-medium'
      }[highlight.type];

      parts.push(
        <span key={index} className={highlightClass}>
          {highlight.text}
        </span>
      );

      lastIndex = highlight.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'keyword': return 'text-green-600 bg-green-50';
      case 'semantic': return 'text-blue-600 bg-blue-50';
      case 'hybrid': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {/* Header with score and match type */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMatchTypeColor(result.matchType)}`}>
            {result.matchType}
          </span>
          <span className="text-xs text-gray-500">
            Chunk {result.chunk.id}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-semibold ${getScoreColor(result.score)}`}>
            {(result.score * 100).toFixed(1)}%
          </span>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                result.score >= 0.8 ? 'bg-green-500' :
                result.score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${result.score * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content with highlights */}
      <div className="text-sm text-gray-800 leading-relaxed">
        {renderHighlightedText(result.chunk.content, result.highlights)}
      </div>

      {/* Metadata */}
      <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
        <div className="flex space-x-4">
          <span>Size: {result.chunk.content.length} chars</span>
          <span>Words: {result.chunk.metadata.wordCount || 'N/A'}</span>
          {result.highlights.length > 0 && (
            <span>Highlights: {result.highlights.length}</span>
          )}
        </div>
        <div>
          Strategy: {result.chunk.metadata.strategy}
        </div>
      </div>
    </div>
  );
};

export const SearchResults: React.FC = () => {
  const {
    searchResults,
    selectedResult,
    query,
    isSearching,
    searchError,
    setSelectedResult,
  } = useRetrievalStore();

  const handleResultSelect = useCallback((result: SearchResult) => {
    setSelectedResult(selectedResult?.chunk.id === result.chunk.id ? null : result);
  }, [selectedResult, setSelectedResult]);

  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Searching...</p>
        </div>
      </div>
    );
  }

  if (searchError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <div className="text-red-500 mr-2">⚠️</div>
          <div>
            <h4 className="text-red-800 font-medium">Search Error</h4>
            <p className="text-red-600 text-sm mt-1">{searchError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-lg">Enter a search query to find relevant chunks</p>
        <p className="text-sm mt-2">Try searching for concepts like "AI", "machine learning", or "neural networks"</p>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-4">📭</div>
        <p className="text-lg">No results found for "{query}"</p>
        <p className="text-sm mt-2">Try adjusting your search parameters or using different keywords</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Search Results ({searchResults.length})
        </h3>
        <div className="text-sm text-gray-600">
          Query: "{query}"
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {searchResults.map((result, index) => (
          <SearchResultItem
            key={`${result.chunk.id}-${index}`}
            result={result}
            isSelected={selectedResult?.chunk.id === result.chunk.id}
            onSelect={handleResultSelect}
          />
        ))}
      </div>

      {/* Results Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Search Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Results:</span>
            <span className="ml-2 font-medium">{searchResults.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Avg Score:</span>
            <span className="ml-2 font-medium">
              {searchResults.length > 0 
                ? (searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length * 100).toFixed(1)
                : 0}%
            </span>
          </div>
          <div>
            <span className="text-gray-600">Best Match:</span>
            <span className="ml-2 font-medium">
              {searchResults.length > 0 ? (searchResults[0].score * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div>
            <span className="text-gray-600">Match Types:</span>
            <span className="ml-2 font-medium">
              {Array.from(new Set(searchResults.map(r => r.matchType))).join(', ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
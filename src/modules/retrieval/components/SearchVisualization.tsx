import React from 'react';
import { useRetrievalStore } from '../../../store/retrievalStore';
import { useRAGStore } from '../../../store/ragStore';
import { SearchResultVisualization } from '../../../visualization';

export const SearchVisualization: React.FC = () => {
  const { searchResults, selectedResult, query, setSelectedResult } = useRetrievalStore();
  const { chunks } = useRAGStore();

  return (
    <SearchResultVisualization
      searchResults={searchResults}
      allChunks={chunks}
      query={query}
      selectedResult={selectedResult}
      onResultHover={() => {
        // Optional: Add hover effects
      }}
      onResultClick={(result) => {
        setSelectedResult(result);
      }}
    />
  );
};

export default SearchVisualization;
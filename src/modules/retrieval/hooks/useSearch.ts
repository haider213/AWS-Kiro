import { useCallback, useEffect, useMemo } from 'react';
import { useRetrievalStore } from '../../../store/retrievalStore';
import { useRAGStore } from '../../../store/ragStore';
import { searchService } from '../../../services/searchService';
import { embeddingService } from '../../../services/embeddingService';
import { Embedding } from '../../../types';

export const useSearch = () => {
  const {
    query,
    searchParameters,
    setSearchResults,
    setQueryEmbedding,
    setIsSearching,
    setSearchError,
    setSearchSuggestions,
  } = useRetrievalStore();

  const { chunks } = useRAGStore();

  // Generate search suggestions based on available chunks
  const generateSuggestions = useCallback(() => {
    if (chunks.length > 0) {
      const suggestions = searchService.getSearchSuggestions(chunks, 8);
      setSearchSuggestions(suggestions);
    }
  }, [chunks, setSearchSuggestions]);

  // Initialize suggestions when chunks change
  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  // Generate query embedding for semantic search
  const generateQueryEmbedding = useCallback(async (queryText: string): Promise<Embedding | null> => {
    if (!queryText.trim() || searchParameters.mode === 'keyword') {
      return null;
    }

    try {
      const embeddings = await embeddingService.generateEmbeddingsFromTexts([queryText]);
      return embeddings[0] || null;
    } catch (error) {
      console.warn('Failed to generate query embedding:', error);
      return null;
    }
  }, [searchParameters.mode]);

  // Perform search operation
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setQueryEmbedding(null);
      return;
    }

    if (chunks.length === 0) {
      setSearchError('No chunks available for search. Please process some text first.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // Generate query embedding if needed
      let embedding: Embedding | null = null;
      if (searchParameters.mode === 'semantic' || searchParameters.mode === 'hybrid') {
        embedding = await generateQueryEmbedding(searchQuery);
        setQueryEmbedding(embedding);
      }

      // Perform search
      const results = searchService.search(
        searchQuery,
        chunks,
        embedding,
        searchParameters
      );

      setSearchResults(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setSearchError(errorMessage);
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [
    chunks,
    searchParameters,
    generateQueryEmbedding,
    setSearchResults,
    setQueryEmbedding,
    setIsSearching,
    setSearchError,
  ]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== '') {
        performSearch(query);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [query, searchParameters, performSearch]);

  // Clear results when query is empty
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setQueryEmbedding(null);
    }
  }, [query, setSearchResults, setQueryEmbedding]);

  // Memoized search statistics
  const searchStats = useMemo(() => {
    const { searchResults } = useRetrievalStore.getState();
    
    if (searchResults.length === 0) {
      return {
        totalResults: 0,
        averageScore: 0,
        bestScore: 0,
        matchTypes: [],
        hasHighlights: false,
      };
    }

    const totalResults = searchResults.length;
    const averageScore = searchResults.reduce((sum, r) => sum + r.score, 0) / totalResults;
    const bestScore = Math.max(...searchResults.map(r => r.score));
    const matchTypes = Array.from(new Set(searchResults.map(r => r.matchType)));
    const hasHighlights = searchResults.some(r => r.highlights.length > 0);

    return {
      totalResults,
      averageScore,
      bestScore,
      matchTypes,
      hasHighlights,
    };
  }, []);

  // Manual search trigger (for immediate search without debounce)
  const triggerSearch = useCallback((searchQuery?: string) => {
    const queryToSearch = searchQuery || query;
    performSearch(queryToSearch);
  }, [query, performSearch]);

  // Clear search state
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setQueryEmbedding(null);
    setSearchError(null);
  }, [setSearchResults, setQueryEmbedding, setSearchError]);

  return {
    // Search operations
    performSearch,
    triggerSearch,
    clearSearch,
    generateSuggestions,
    
    // Search state
    searchStats,
    
    // Utilities
    isSearchAvailable: chunks.length > 0,
    canUseSemanticSearch: chunks.some(chunk => chunk.embedding),
  };
};

export default useSearch;
// Retrieval module store for managing search state and results

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SearchResult, SearchParameters, Embedding } from '../types';

interface RetrievalStore {
  // Search state
  query: string;
  searchResults: SearchResult[];
  queryEmbedding: Embedding | null;
  isSearching: boolean;
  searchError: string | null;
  
  // Search parameters
  searchParameters: SearchParameters;
  
  // UI state
  selectedResult: SearchResult | null;
  showAdvancedOptions: boolean;
  searchSuggestions: string[];
  
  // Actions
  setQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setQueryEmbedding: (embedding: Embedding | null) => void;
  setIsSearching: (searching: boolean) => void;
  setSearchError: (error: string | null) => void;
  updateSearchParameters: (params: Partial<SearchParameters>) => void;
  setSelectedResult: (result: SearchResult | null) => void;
  setShowAdvancedOptions: (show: boolean) => void;
  setSearchSuggestions: (suggestions: string[]) => void;
  clearSearch: () => void;
  resetStore: () => void;
}

const initialSearchParameters: SearchParameters = {
  mode: 'hybrid',
  resultLimit: 5,
  similarityThreshold: 0.3,
  keywordWeight: 0.3,
  semanticWeight: 0.7,
  enableHighlighting: true,
};

export const useRetrievalStore = create<RetrievalStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      query: '',
      searchResults: [],
      queryEmbedding: null,
      isSearching: false,
      searchError: null,
      searchParameters: initialSearchParameters,
      selectedResult: null,
      showAdvancedOptions: false,
      searchSuggestions: [],

      // Actions
      setQuery: (query) => set({ query }),
      
      setSearchResults: (results) => set({ 
        searchResults: results,
        selectedResult: null // Clear selection when new results come in
      }),
      
      setQueryEmbedding: (embedding) => set({ queryEmbedding: embedding }),
      
      setIsSearching: (searching) => set({ 
        isSearching: searching,
        searchError: searching ? null : get().searchError // Clear error when starting new search
      }),
      
      setSearchError: (error) => set({ 
        searchError: error,
        isSearching: false
      }),
      
      updateSearchParameters: (params) => set((state) => ({
        searchParameters: { ...state.searchParameters, ...params }
      })),
      
      setSelectedResult: (result) => set({ selectedResult: result }),
      
      setShowAdvancedOptions: (show) => set({ showAdvancedOptions: show }),
      
      setSearchSuggestions: (suggestions) => set({ searchSuggestions: suggestions }),
      
      clearSearch: () => set({
        query: '',
        searchResults: [],
        queryEmbedding: null,
        selectedResult: null,
        searchError: null,
        isSearching: false
      }),
      
      resetStore: () => set({
        query: '',
        searchResults: [],
        queryEmbedding: null,
        isSearching: false,
        searchError: null,
        searchParameters: initialSearchParameters,
        selectedResult: null,
        showAdvancedOptions: false,
        searchSuggestions: []
      }),
    }),
    {
      name: 'retrieval-store',
    }
  )
);
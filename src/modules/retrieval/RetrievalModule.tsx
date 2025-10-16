
import React, { useEffect } from 'react';
import { Card } from '../../components/UI/Card';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useRAGStore } from '../../store/ragStore';
import { useRetrievalStore } from '../../store/retrievalStore';
import SearchControls from './components/SearchControls';
import SearchResults from './components/SearchResults';
import SearchVisualization from './components/SearchVisualization';
import useSearch from './hooks/useSearch';

export const RetrievalModule: React.FC = () => {
  const { chunks, isLoading: ragLoading } = useRAGStore();
  const { 
    query, 
    searchResults, 
    searchError,
    clearSearch 
  } = useRetrievalStore();
  
  const { 
    isSearchAvailable, 
    canUseSemanticSearch, 
    searchStats,
    generateSuggestions 
  } = useSearch();

  // Initialize suggestions when component mounts
  useEffect(() => {
    if (chunks.length > 0) {
      generateSuggestions();
    }
  }, [chunks.length, generateSuggestions]);

  // Clear search when leaving module
  useEffect(() => {
    return () => {
      clearSearch();
    };
  }, [clearSearch]);

  if (ragLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading RAG system...</p>
        </div>
      </div>
    );
  }

  if (!isSearchAvailable) {
    return (
      <div className="space-y-6">
        <Card title="Information Retrieval">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Content Available for Search
            </h3>
            <p className="text-gray-600 mb-4">
              To use the retrieval module, you need to first process some text in the chunking module.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-blue-900 mb-2">Getting Started:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Navigate to the Chunking module</li>
                <li>2. Load or input sample text</li>
                <li>3. Configure chunking parameters</li>
                <li>4. Process the text into chunks</li>
                <li>5. Return here to search through the chunks</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-tour="retrieval-module">
      {/* Module Header */}
      <Card title="Information Retrieval">
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Experiment with different search strategies to find relevant chunks. 
            This module demonstrates keyword-based, semantic, and hybrid search approaches.
          </p>
          
          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{chunks.length}</div>
              <div className="text-sm text-gray-600">Available Chunks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {canUseSemanticSearch ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600">Semantic Search</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{searchStats.totalResults}</div>
              <div className="text-sm text-gray-600">Current Results</div>
            </div>
          </div>
        </div>

        {/* Search Controls */}
        <div data-tour="search-modes">
          <SearchControls />
        </div>
      </Card>

      {/* Search Results */}
      <Card title="Search Results" data-tour="search-results">
        {searchError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-500 mr-2">⚠️</div>
              <div>
                <h4 className="text-red-800 font-medium">Search Error</h4>
                <p className="text-red-600 text-sm mt-1">{searchError}</p>
              </div>
            </div>
          </div>
        )}
        
        <SearchResults />
      </Card>

      {/* Search Visualization */}
      {(query || searchResults.length > 0) && (
        <Card title="Search Visualization">
          <SearchVisualization />
        </Card>
      )}

      {/* Educational Information */}
      <Card title="Understanding Search Methods">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <h4 className="font-semibold text-green-800 mb-2">🔤 Keyword Search</h4>
            <p className="text-sm text-green-700 mb-2">
              Traditional text matching using TF-IDF (Term Frequency-Inverse Document Frequency) 
              to find documents containing query terms.
            </p>
            <ul className="text-xs text-green-600 space-y-1">
              <li>• Fast and efficient</li>
              <li>• Works well for exact matches</li>
              <li>• Language-dependent</li>
              <li>• Limited semantic understanding</li>
            </ul>
          </div>

          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
            <h4 className="font-semibold text-blue-800 mb-2">🧠 Semantic Search</h4>
            <p className="text-sm text-blue-700 mb-2">
              Vector-based similarity using embeddings to find conceptually related content, 
              even without exact keyword matches.
            </p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• Understands context and meaning</li>
              <li>• Finds related concepts</li>
              <li>• Language-agnostic potential</li>
              <li>• Requires embedding models</li>
            </ul>
          </div>

          <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
            <h4 className="font-semibold text-purple-800 mb-2">🔀 Hybrid Search</h4>
            <p className="text-sm text-purple-700 mb-2">
              Combines keyword and semantic approaches with weighted scoring to leverage 
              the strengths of both methods.
            </p>
            <ul className="text-xs text-purple-600 space-y-1">
              <li>• Best of both worlds</li>
              <li>• Configurable weighting</li>
              <li>• More comprehensive results</li>
              <li>• Higher computational cost</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RetrievalModule;
import React, { useEffect, useRef, useState } from 'react';
import { VisualizationEngine, SearchResultConfig } from '../VisualizationEngine';
import { SearchResult, Chunk } from '../../types';

interface SearchResultVisualizationProps {
  searchResults: SearchResult[];
  allChunks: Chunk[];
  query: string;
  selectedResult?: SearchResult | null;
  onResultHover?: (result: SearchResult | null) => void;
  onResultClick?: (result: SearchResult) => void;
  className?: string;
  config?: Partial<SearchResultConfig>;
}

export const SearchResultVisualization: React.FC<SearchResultVisualizationProps> = ({
  searchResults,
  allChunks,
  query,
  selectedResult: _selectedResult,
  onResultHover,
  onResultClick,
  className = '',
  config = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'searching' | 'complete'>('idle');
  const cleanupRef = useRef<(() => void) | null>(null);

  // Default configuration
  const defaultConfig: SearchResultConfig = {
    width: dimensions.width,
    height: dimensions.height,
    margin: { top: 60, right: 40, bottom: 40, left: 40 },
    animationDuration: 800,
    colorScheme: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    resultColors: {
      keyword: '#10B981',
      semantic: '#3B82F6',
      hybrid: '#8B5CF6',
      selected: '#F59E0B'
    },
    connectionWidth: 2,
    scoreThreshold: 0.1
  };

  const finalConfig = { ...defaultConfig, ...config, width: dimensions.width, height: dimensions.height };

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || 800,
          height: rect.height || 500
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animate search process
  useEffect(() => {
    if (searchResults.length > 0 && query) {
      setAnimationPhase('searching');
      const timer = setTimeout(() => {
        setAnimationPhase('complete');
      }, finalConfig.animationDuration);
      
      return () => clearTimeout(timer);
    } else {
      setAnimationPhase('idle');
    }
  }, [searchResults, query, finalConfig.animationDuration]);

  // Render visualization
  useEffect(() => {
    if (!containerRef.current || allChunks.length === 0) return;

    // Cleanup previous visualization
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    const engine = VisualizationEngine.getInstance();
    
    cleanupRef.current = engine.renderSearchResults(
      containerRef.current,
      searchResults,
      allChunks,
      query,
      finalConfig,
      {
        onResultHover: (result) => {
          onResultHover?.(result);
          if (result) {
            highlightResult(result);
          } else {
            clearHighlights();
          }
        },
        onResultClick
      }
    );

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [searchResults, allChunks, query, dimensions, animationPhase, onResultHover, onResultClick]);

  // Highlight specific result
  const highlightResult = (result: SearchResult) => {
    if (!containerRef.current) return;

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    // Add pulsing animation to the result node
    const resultElements = svg.querySelectorAll(`[data-result-id="${result.chunk.id}"]`);
    resultElements.forEach(element => {
      (element as SVGElement).style.animation = 'pulse 1s infinite';
    });

    // Highlight the connection to query
    const connectionElements = svg.querySelectorAll('.connection');
    connectionElements.forEach(element => {
      const isRelevant = element.getAttribute('data-target') === result.chunk.id;
      (element as SVGElement).style.opacity = isRelevant ? '1' : '0.2';
      if (isRelevant) {
        (element as SVGElement).style.strokeWidth = '4';
      }
    });
  };

  const clearHighlights = () => {
    if (!containerRef.current) return;

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    // Remove animations
    const resultElements = svg.querySelectorAll('[data-result-id]');
    resultElements.forEach(element => {
      (element as SVGElement).style.animation = '';
    });

    // Reset connection styles
    const connectionElements = svg.querySelectorAll('.connection');
    connectionElements.forEach(element => {
      (element as SVGElement).style.opacity = '0.6';
      (element as SVGElement).style.strokeWidth = finalConfig.connectionWidth.toString();
    });
  };

  // Get search statistics
  const getSearchStats = () => {
    if (searchResults.length === 0) return null;

    const stats = {
      total: searchResults.length,
      keyword: searchResults.filter(r => r.matchType === 'keyword').length,
      semantic: searchResults.filter(r => r.matchType === 'semantic').length,
      hybrid: searchResults.filter(r => r.matchType === 'hybrid').length,
      avgScore: searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length,
      maxScore: Math.max(...searchResults.map(r => r.score))
    };

    return stats;
  };

  const stats = getSearchStats();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  if (allChunks.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-500 border border-gray-200 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p>No chunks available for search</p>
          <p className="text-sm mt-2">Process some text in the chunking module first</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full min-h-[500px] border border-gray-200 rounded-lg bg-white ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
            <p className="text-sm text-gray-600 mt-1">
              {query ? `Results for "${query.length > 30 ? query.substring(0, 30) + '...' : query}"` : 'Enter a query to see search results'}
            </p>
          </div>
          
          {/* Animation indicator */}
          {animationPhase === 'searching' && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Searching...</span>
            </div>
          )}
        </div>

        {/* Search statistics */}
        {stats && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="bg-gray-50 rounded p-2">
              <div className="font-medium text-gray-900">{stats.total}</div>
              <div className="text-gray-600">Total Results</div>
            </div>
            <div className="bg-green-50 rounded p-2">
              <div className="font-medium text-green-900">{stats.keyword}</div>
              <div className="text-green-600">Keyword</div>
            </div>
            <div className="bg-blue-50 rounded p-2">
              <div className="font-medium text-blue-900">{stats.semantic}</div>
              <div className="text-blue-600">Semantic</div>
            </div>
            <div className="bg-purple-50 rounded p-2">
              <div className="font-medium text-purple-900">{stats.hybrid}</div>
              <div className="text-purple-600">Hybrid</div>
            </div>
            <div className="bg-yellow-50 rounded p-2">
              <div className="font-medium text-yellow-900">{(stats.avgScore * 100).toFixed(1)}%</div>
              <div className="text-yellow-600">Avg Score</div>
            </div>
          </div>
        )}
      </div>

      <div 
        ref={containerRef}
        className="w-full h-full p-4 relative"
        style={{ minHeight: '400px' }}
      >
        {/* Add CSS for animations */}
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
        `}</style>
      </div>

      {/* Legend */}
      {searchResults.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="font-medium text-gray-700">Legend:</div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Query</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Keyword Match</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Semantic Match</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Hybrid Match</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-gray-400"></div>
              <span>Relevance Connection</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResultVisualization;
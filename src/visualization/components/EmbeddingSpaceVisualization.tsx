import React, { useEffect, useRef, useState } from 'react';
import { VisualizationEngine, EmbeddingSpaceConfig } from '../VisualizationEngine';
import { VisualizationPoint, SimilarityConnection, Chunk } from '../../types';

interface EmbeddingSpaceVisualizationProps {
  points: VisualizationPoint[];
  connections: SimilarityConnection[];
  selectedChunk?: Chunk | null;
  hoveredChunk?: Chunk | null;
  onPointHover?: (chunk: Chunk | null) => void;
  onPointClick?: (chunk: Chunk) => void;
  className?: string;
  config?: Partial<EmbeddingSpaceConfig>;
}

export const EmbeddingSpaceVisualization: React.FC<EmbeddingSpaceVisualizationProps> = ({
  points,
  connections,
  selectedChunk: _selectedChunk,
  hoveredChunk: _hoveredChunk,
  onPointHover,
  onPointClick,
  className = '',
  config = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isZoomed, setIsZoomed] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Default configuration
  const defaultConfig: EmbeddingSpaceConfig = {
    width: dimensions.width,
    height: dimensions.height,
    margin: { top: 40, right: 40, bottom: 60, left: 60 },
    animationDuration: 500,
    colorScheme: [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ],
    pointSize: 8,
    connectionOpacity: 0.4,
    similarityThreshold: 0.5,
    enableZoom: true,
    enablePan: true
  };

  const finalConfig = { ...defaultConfig, ...config, width: dimensions.width, height: dimensions.height };

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || 800,
          height: rect.height || 600
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Render visualization
  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    // Cleanup previous visualization
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    const engine = VisualizationEngine.getInstance();
    
    cleanupRef.current = engine.renderEmbeddingSpace(
      containerRef.current,
      points,
      connections,
      finalConfig,
      {
        onPointHover: (chunk) => {
          onPointHover?.(chunk);
          // Add visual feedback for hover
          if (chunk) {
            highlightSimilarPoints(chunk);
          } else {
            clearHighlights();
          }
        },
        onPointClick
      }
    );

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [points, connections, dimensions, onPointHover, onPointClick]);

  // Highlight similar points when hovering
  const highlightSimilarPoints = (targetChunk: Chunk) => {
    if (!containerRef.current) return;

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    // Find similar chunks based on connections
    const similarChunkIds = new Set(
      connections
        .filter(conn => 
          (conn.source.id === targetChunk.id || conn.target.id === targetChunk.id) &&
          conn.similarity >= finalConfig.similarityThreshold
        )
        .map(conn => conn.source.id === targetChunk.id ? conn.target.id : conn.source.id)
    );

    // Dim non-similar points
    const pointElements = svg.querySelectorAll('.point circle');
    pointElements.forEach(element => {
      const point = points.find(p => {
        const transform = element.parentElement?.getAttribute('transform');
        return transform?.includes(`translate(${p.x}, ${p.y})`);
      });
      
      if (point) {
        const opacity = point.chunk.id === targetChunk.id || similarChunkIds.has(point.chunk.id) ? '1' : '0.3';
        (element as SVGElement).style.opacity = opacity;
      }
    });

    // Highlight relevant connections
    const connectionElements = svg.querySelectorAll('.connection');
    connectionElements.forEach(element => {
      const connection = connections.find(conn => {
        // This is a simplified check - in practice you'd need better element identification
        return conn.source.id === targetChunk.id || conn.target.id === targetChunk.id;
      });
      
      if (connection) {
        const opacity = connection.source.id === targetChunk.id || connection.target.id === targetChunk.id ? '0.8' : '0.1';
        (element as SVGElement).style.opacity = opacity;
      }
    });
  };

  const clearHighlights = () => {
    if (!containerRef.current) return;

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    // Reset all opacities
    const pointElements = svg.querySelectorAll('.point circle');
    pointElements.forEach(element => {
      (element as SVGElement).style.opacity = '1';
    });

    const connectionElements = svg.querySelectorAll('.connection');
    connectionElements.forEach(element => {
      (element as SVGElement).style.opacity = finalConfig.connectionOpacity.toString();
    });
  };

  // Handle zoom reset
  const handleZoomReset = () => {
    if (!containerRef.current) return;
    
    const svg = containerRef.current.querySelector('svg');
    if (svg) {
      // Reset zoom transform
      const g = svg.querySelector('g');
      if (g) {
        g.setAttribute('transform', `translate(${finalConfig.margin.left},${finalConfig.margin.top})`);
        setIsZoomed(false);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  if (points.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-500 border border-gray-200 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">🎯</div>
          <p>No embedding points available</p>
          <p className="text-sm mt-2">Generate embeddings to see vector space visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full min-h-[600px] border border-gray-200 rounded-lg bg-white ${className}`}>
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Embedding Space</h3>
          <p className="text-sm text-gray-600 mt-1">
            Interactive 2D visualization of {points.length} embedding vectors
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {finalConfig.enableZoom && (
            <button
              onClick={handleZoomReset}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              disabled={!isZoomed}
            >
              Reset Zoom
            </button>
          )}
          <div className="text-xs text-gray-500">
            {connections.filter(c => c.visible && c.similarity >= finalConfig.similarityThreshold).length} connections shown
          </div>
        </div>
      </div>
      <div 
        ref={containerRef}
        className="w-full h-full p-4"
        style={{ minHeight: '550px' }}
      />
      
      {/* Controls overlay */}
      <div className="absolute top-20 right-4 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <div className="text-xs text-gray-600 space-y-2">
          <div className="font-medium">Controls:</div>
          {finalConfig.enableZoom && <div>• Mouse wheel: Zoom</div>}
          {finalConfig.enablePan && <div>• Click + drag: Pan</div>}
          <div>• Hover: Highlight similar</div>
          <div>• Click: Select point</div>
        </div>
      </div>
    </div>
  );
};

export default EmbeddingSpaceVisualization;
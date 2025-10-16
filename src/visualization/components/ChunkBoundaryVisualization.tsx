import React, { useEffect, useRef, useState } from 'react';
import { VisualizationEngine, ChunkBoundaryConfig } from '../VisualizationEngine';
import { Chunk } from '../../types';

interface ChunkBoundaryVisualizationProps {
  text: string;
  chunks: Chunk[];
  selectedChunk?: Chunk | null;
  hoveredChunk?: Chunk | null;
  onChunkHover?: (chunk: Chunk | null) => void;
  onChunkClick?: (chunk: Chunk) => void;
  className?: string;
  config?: Partial<ChunkBoundaryConfig>;
}

export const ChunkBoundaryVisualization: React.FC<ChunkBoundaryVisualizationProps> = ({
  text,
  chunks,
  selectedChunk,
  hoveredChunk,
  onChunkHover,
  onChunkClick,
  className = '',
  config = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const cleanupRef = useRef<(() => void) | null>(null);

  // Default configuration
  const defaultConfig: ChunkBoundaryConfig = {
    width: dimensions.width,
    height: dimensions.height,
    margin: { top: 20, right: 20, bottom: 60, left: 20 },
    animationDuration: 300,
    colorScheme: [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ],
    highlightColor: '#FEF3C7',
    selectedColor: '#FDE047',
    hoverColor: '#DBEAFE'
  };

  const finalConfig = { ...defaultConfig, ...config, width: dimensions.width, height: dimensions.height };

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || 800,
          height: rect.height || 400
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Render visualization
  useEffect(() => {
    if (!containerRef.current || !text || chunks.length === 0) return;

    // Cleanup previous visualization
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    const engine = VisualizationEngine.getInstance();
    
    cleanupRef.current = engine.renderChunkBoundaries(
      containerRef.current,
      text,
      chunks,
      finalConfig,
      {
        onChunkHover,
        onChunkClick
      }
    );

    // Highlight selected/hovered chunks
    if (selectedChunk || hoveredChunk) {
      const targetChunk = selectedChunk || hoveredChunk;
      const color = selectedChunk ? finalConfig.selectedColor : finalConfig.hoverColor;
      
      // Add highlighting effect
      const svg = containerRef.current.querySelector('svg');
      if (svg && targetChunk) {
        const chunkElements = svg.querySelectorAll(`[data-chunk-id="${targetChunk.id}"]`);
        chunkElements.forEach(element => {
          (element as SVGElement).style.fill = color;
        });
      }
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [text, chunks, dimensions, selectedChunk, hoveredChunk, onChunkHover, onChunkClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  if (!text || chunks.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-500 border border-gray-200 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">📝</div>
          <p>No text or chunks available</p>
          <p className="text-sm mt-2">Add some text and apply chunking to see visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full min-h-[400px] border border-gray-200 rounded-lg bg-white ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Chunk Boundaries</h3>
        <p className="text-sm text-gray-600 mt-1">
          Interactive visualization of text segmentation with {chunks.length} chunks
        </p>
      </div>
      <div 
        ref={containerRef}
        className="w-full h-full p-4"
        style={{ minHeight: '350px' }}
      />
    </div>
  );
};

export default ChunkBoundaryVisualization;
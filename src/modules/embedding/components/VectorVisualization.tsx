import React from 'react'
import { VisualizationPoint, SimilarityConnection, Chunk } from '../../../types'
import { useEmbeddingStore } from '../../../store/embeddingStore'
import { EmbeddingSpaceVisualization } from '../../../visualization'

interface VectorVisualizationProps {
  points: VisualizationPoint[]
  connections: SimilarityConnection[]
  onPointHover?: (chunk: Chunk | null) => void
  onPointClick?: (chunk: Chunk) => void
  className?: string
}

export const VectorVisualization: React.FC<VectorVisualizationProps> = ({
  points,
  connections,
  onPointHover,
  onPointClick,
  className = ''
}) => {
  const { settings, hoveredChunk, selectedChunk } = useEmbeddingStore()

  // Create configuration for the new visualization engine
  const config = {
    pointSize: settings.pointSize,
    connectionOpacity: 0.6,
    similarityThreshold: settings.similarityThreshold,
    enableZoom: true,
    enablePan: true,
    colorScheme: getColorScheme(settings.colorScheme)
  }

  return (
    <EmbeddingSpaceVisualization
      points={points}
      connections={connections.filter(() => settings.showConnections)}
      selectedChunk={selectedChunk}
      hoveredChunk={hoveredChunk}
      onPointHover={onPointHover}
      onPointClick={onPointClick}
      className={className}
      config={config}
    />
  )
}

// Helper function to get color scheme array
function getColorScheme(scheme: string): string[] {
  switch (scheme) {
    case 'similarity':
      return ['#440154', '#31688e', '#35b779', '#fde725'] // Viridis colors
    case 'chunk-size':
      return ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'] // Blues
    case 'cluster':
    default:
      return ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1']
  }
}

export default VectorVisualization
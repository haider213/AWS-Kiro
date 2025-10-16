// Main visualization engine and components export
export { VisualizationEngine } from './VisualizationEngine';
export type { 
  VisualizationConfig,
  ChunkBoundaryConfig,
  EmbeddingSpaceConfig,
  SearchResultConfig,
  PromptFlowConfig
} from './VisualizationEngine';

// Reusable visualization components
export { default as ChunkBoundaryVisualization } from './components/ChunkBoundaryVisualization';
export { default as EmbeddingSpaceVisualization } from './components/EmbeddingSpaceVisualization';
export { default as SearchResultVisualization } from './components/SearchResultVisualization';
export { default as PromptFlowVisualization } from './components/PromptFlowVisualization';

// Performance optimization utilities
export { VisualizationOptimizer } from './utils/VisualizationOptimizer';
export { AnimationManager } from './utils/AnimationManager';
export { PerformanceMonitor } from './utils/PerformanceMonitor';
import { TSNE } from 'tsne-js'
import { Embedding, VisualizationPoint, Chunk } from '../types'

export interface DimensionalityReductionOptions {
  dimensions: 2 | 3
  perplexity?: number
  learningRate?: number
  maxIterations?: number
}

export class DimensionalityReduction {
  /**
   * Reduce high-dimensional embeddings to 2D or 3D using t-SNE
   */
  static async reduceDimensions(
    embeddings: Embedding[],
    chunks: Chunk[],
    options: DimensionalityReductionOptions = { dimensions: 2 }
  ): Promise<VisualizationPoint[]> {
    const {
      dimensions = 2,
      perplexity = Math.min(30, Math.max(5, Math.floor(embeddings.length / 3))),
      learningRate = 100,
      maxIterations = 1000
    } = options

    if (embeddings.length === 0) {
      return []
    }

    if (embeddings.length < 2) {
      // Handle single embedding case
      return [{
        x: 0,
        y: 0,
        z: dimensions === 3 ? 0 : undefined,
        chunk: chunks[0]
      }]
    }

    try {
      // Prepare data for t-SNE
      const data = embeddings.map(embedding => embedding.vector)
      
      // Create t-SNE instance
      const tsne = new TSNE({
        dim: dimensions,
        perplexity: Math.min(perplexity, embeddings.length - 1),
        earlyExaggeration: 4.0,
        learningRate: learningRate,
        nIter: maxIterations,
        metric: 'euclidean'
      })

      // Initialize with data
      tsne.init({
        data: data,
        type: 'dense'
      })

      // Run t-SNE iterations
      for (let i = 0; i < maxIterations; i++) {
        tsne.step()
      }

      // Get the reduced dimensions
      const solution = tsne.getSolution()

      // Convert to visualization points
      const points: VisualizationPoint[] = solution.map((coords: number[], index: number) => ({
        x: coords[0],
        y: coords[1],
        z: dimensions === 3 ? coords[2] : undefined,
        chunk: chunks[index]
      }))

      return this.normalizePoints(points)
    } catch (error) {
      console.error('Error in t-SNE dimensionality reduction:', error)
      // Fallback to PCA-like projection
      return this.fallbackProjection(embeddings, chunks, dimensions)
    }
  }

  /**
   * Normalize points to fit within a standard coordinate system
   */
  private static normalizePoints(points: VisualizationPoint[]): VisualizationPoint[] {
    if (points.length === 0) return points

    // Find bounds
    const xValues = points.map(p => p.x)
    const yValues = points.map(p => p.y)
    const zValues = points.map(p => p.z).filter(z => z !== undefined) as number[]

    const xMin = Math.min(...xValues)
    const xMax = Math.max(...xValues)
    const yMin = Math.min(...yValues)
    const yMax = Math.max(...yValues)
    const zMin = zValues.length > 0 ? Math.min(...zValues) : 0
    const zMax = zValues.length > 0 ? Math.max(...zValues) : 0

    const xRange = xMax - xMin || 1
    const yRange = yMax - yMin || 1
    const zRange = zMax - zMin || 1

    // Normalize to [-1, 1] range
    return points.map(point => ({
      ...point,
      x: ((point.x - xMin) / xRange) * 2 - 1,
      y: ((point.y - yMin) / yRange) * 2 - 1,
      z: point.z !== undefined ? ((point.z - zMin) / zRange) * 2 - 1 : undefined
    }))
  }

  /**
   * Fallback projection using simple PCA-like approach
   */
  private static fallbackProjection(
    embeddings: Embedding[],
    chunks: Chunk[],
    dimensions: 2 | 3
  ): VisualizationPoint[] {
    if (embeddings.length === 0) return []

    const vectors = embeddings.map(e => e.vector)

    // Simple projection using first few dimensions with some transformation
    return vectors.map((vector, index) => {
      // Use weighted combination of first dimensions
      const x = vector.slice(0, 10).reduce((sum, val, i) => sum + val * (1 / (i + 1)), 0)
      const y = vector.slice(10, 20).reduce((sum, val, i) => sum + val * (1 / (i + 1)), 0)
      const z = dimensions === 3 
        ? vector.slice(20, 30).reduce((sum, val, i) => sum + val * (1 / (i + 1)), 0)
        : undefined

      return {
        x: x * 100, // Scale for visibility
        y: y * 100,
        z: z !== undefined ? z * 100 : undefined,
        chunk: chunks[index]
      }
    })
  }

  /**
   * Calculate optimal perplexity based on dataset size
   */
  static calculateOptimalPerplexity(dataSize: number): number {
    // Rule of thumb: perplexity should be between 5 and 50, typically around dataSize/3
    return Math.min(50, Math.max(5, Math.floor(dataSize / 3)))
  }

  /**
   * Estimate computation time for t-SNE
   */
  static estimateComputationTime(dataSize: number, iterations: number): number {
    // Rough estimate in milliseconds
    return Math.max(100, dataSize * iterations * 0.1)
  }
}
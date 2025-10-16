import * as d3 from 'd3';
import { VisualizationPoint, SimilarityConnection } from '../../types';

export interface OptimizationConfig {
  maxPoints: number;
  maxConnections: number;
  enableLevelOfDetail: boolean;
  enableVirtualization: boolean;
  debounceDelay: number;
  frameRateTarget: number;
}

export class VisualizationOptimizer {
  private static instance: VisualizationOptimizer;
  private frameRateMonitor: FrameRateMonitor;
  private debounceTimers: Map<string, number> = new Map();

  private constructor() {
    this.frameRateMonitor = new FrameRateMonitor();
  }

  public static getInstance(): VisualizationOptimizer {
    if (!VisualizationOptimizer.instance) {
      VisualizationOptimizer.instance = new VisualizationOptimizer();
    }
    return VisualizationOptimizer.instance;
  }

  /**
   * Optimize points for rendering based on viewport and performance constraints
   */
  public optimizePoints(
    points: VisualizationPoint[],
    viewport: { width: number; height: number; scale: number },
    config: OptimizationConfig
  ): VisualizationPoint[] {
    let optimizedPoints = [...points];

    // Apply point limit
    if (optimizedPoints.length > config.maxPoints) {
      optimizedPoints = this.samplePoints(optimizedPoints, config.maxPoints);
    }

    // Apply level of detail based on zoom level
    if (config.enableLevelOfDetail) {
      optimizedPoints = this.applyLevelOfDetail(optimizedPoints, viewport.scale);
    }

    // Apply viewport culling
    optimizedPoints = this.cullPointsOutsideViewport(optimizedPoints, viewport);

    return optimizedPoints;
  }

  /**
   * Optimize connections for rendering
   */
  public optimizeConnections(
    connections: SimilarityConnection[],
    visiblePoints: VisualizationPoint[],
    config: OptimizationConfig
  ): SimilarityConnection[] {
    const visiblePointIds = new Set(visiblePoints.map(p => p.chunk.id));
    
    // Filter connections to only include visible points
    let optimizedConnections = connections.filter(conn => 
      visiblePointIds.has(conn.source.id) && visiblePointIds.has(conn.target.id)
    );

    // Apply connection limit
    if (optimizedConnections.length > config.maxConnections) {
      // Sort by similarity and take top connections
      optimizedConnections = optimizedConnections
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, config.maxConnections);
    }

    return optimizedConnections;
  }

  /**
   * Debounce visualization updates to prevent excessive re-rendering
   */
  public debounceUpdate(
    key: string,
    updateFunction: () => void,
    delay: number = 300
  ): void {
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = window.setTimeout(() => {
      updateFunction();
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Optimize SVG rendering for performance
   */
  public optimizeSVGRendering(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>): void {
    // Enable hardware acceleration
    svg.style('transform', 'translateZ(0)');
    
    // Optimize text rendering
    svg.selectAll('text')
      .style('text-rendering', 'optimizeSpeed')
      .style('shape-rendering', 'optimizeSpeed');

    // Optimize path rendering
    svg.selectAll('path, line, circle')
      .style('shape-rendering', 'optimizeSpeed');

    // Use CSS transforms for animations when possible
    svg.selectAll('.animated')
      .style('will-change', 'transform');
  }

  /**
   * Create efficient data structures for large datasets
   */
  public createSpatialIndex(points: VisualizationPoint[]): SpatialIndex {
    return new SpatialIndex(points);
  }

  /**
   * Monitor and adapt to performance
   */
  public adaptToPerformance(
    currentConfig: OptimizationConfig,
    targetFrameRate: number = 30
  ): OptimizationConfig {
    const currentFrameRate = this.frameRateMonitor.getAverageFrameRate();
    
    if (currentFrameRate < targetFrameRate) {
      // Reduce quality for better performance
      return {
        ...currentConfig,
        maxPoints: Math.max(100, Math.floor(currentConfig.maxPoints * 0.8)),
        maxConnections: Math.max(50, Math.floor(currentConfig.maxConnections * 0.8)),
        enableLevelOfDetail: true,
        enableVirtualization: true
      };
    } else if (currentFrameRate > targetFrameRate * 1.5) {
      // Increase quality if performance allows
      return {
        ...currentConfig,
        maxPoints: Math.min(2000, Math.floor(currentConfig.maxPoints * 1.2)),
        maxConnections: Math.min(1000, Math.floor(currentConfig.maxConnections * 1.2))
      };
    }

    return currentConfig;
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => window.clearTimeout(timer));
    this.debounceTimers.clear();
    
    // Reset frame rate monitor
    this.frameRateMonitor.reset();
  }

  // Private helper methods

  private samplePoints(points: VisualizationPoint[], maxPoints: number): VisualizationPoint[] {
    if (points.length <= maxPoints) return points;

    // Use systematic sampling to maintain distribution
    const step = points.length / maxPoints;
    const sampled: VisualizationPoint[] = [];
    
    for (let i = 0; i < maxPoints; i++) {
      const index = Math.floor(i * step);
      sampled.push(points[index]);
    }

    return sampled;
  }

  private applyLevelOfDetail(points: VisualizationPoint[], scale: number): VisualizationPoint[] {
    // Reduce detail at lower zoom levels
    if (scale < 0.5) {
      // Show only every 4th point at very low zoom
      return points.filter((_, index) => index % 4 === 0);
    } else if (scale < 1.0) {
      // Show only every 2nd point at low zoom
      return points.filter((_, index) => index % 2 === 0);
    }
    
    return points;
  }

  private cullPointsOutsideViewport(
    points: VisualizationPoint[],
    viewport: { width: number; height: number; scale: number }
  ): VisualizationPoint[] {
    // Simple viewport culling - in practice you'd want more sophisticated culling
    const margin = 50; // Extra margin for smooth scrolling
    
    return points.filter(point => 
      point.x >= -margin && 
      point.x <= viewport.width + margin &&
      point.y >= -margin && 
      point.y <= viewport.height + margin
    );
  }
}

/**
 * Spatial index for efficient point queries
 */
class SpatialIndex {
  private quadTree: d3.Quadtree<VisualizationPoint>;

  constructor(points: VisualizationPoint[]) {
    this.quadTree = d3.quadtree<VisualizationPoint>()
      .x(d => d.x)
      .y(d => d.y)
      .addAll(points);
  }

  /**
   * Find points within a radius
   */
  public findPointsInRadius(x: number, y: number, radius: number): VisualizationPoint[] {
    const found: VisualizationPoint[] = [];
    
    this.quadTree.visit((node, x1, y1, x2, y2) => {
      if (!node.length) {
        // Leaf node
        const point = node.data;
        if (point) {
          const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
          if (distance <= radius) {
            found.push(point);
          }
        }
      }
      
      // Continue traversal if the node intersects with the search area
      return x1 >= x + radius || y1 >= y + radius || x2 < x - radius || y2 < y - radius;
    });

    return found;
  }

  /**
   * Find nearest point
   */
  public findNearest(x: number, y: number): VisualizationPoint | undefined {
    return this.quadTree.find(x, y);
  }
}

/**
 * Frame rate monitoring for performance adaptation
 */
class FrameRateMonitor {
  private frameTimes: number[] = [];
  private lastFrameTime: number = 0;
  private maxSamples: number = 60;

  public recordFrame(): void {
    const now = performance.now();
    
    if (this.lastFrameTime > 0) {
      const frameTime = now - this.lastFrameTime;
      this.frameTimes.push(frameTime);
      
      // Keep only recent samples
      if (this.frameTimes.length > this.maxSamples) {
        this.frameTimes.shift();
      }
    }
    
    this.lastFrameTime = now;
  }

  public getAverageFrameRate(): number {
    if (this.frameTimes.length === 0) return 60; // Default assumption
    
    const averageFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
    return 1000 / averageFrameTime; // Convert to FPS
  }

  public reset(): void {
    this.frameTimes = [];
    this.lastFrameTime = 0;
  }
}

export default VisualizationOptimizer;
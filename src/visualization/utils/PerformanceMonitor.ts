export interface PerformanceMetrics {
  renderTime: number;
  frameRate: number;
  memoryUsage: number;
  elementCount: number;
  interactionLatency: number;
  timestamp: number;
}

export interface PerformanceThresholds {
  maxRenderTime: number;
  minFrameRate: number;
  maxMemoryUsage: number;
  maxElementCount: number;
  maxInteractionLatency: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsHistory: number = 100;
  private thresholds: PerformanceThresholds;
  private observers: Array<(metrics: PerformanceMetrics) => void> = [];
  private isMonitoring: boolean = false;
  private monitoringInterval?: number;

  private constructor() {
    this.thresholds = {
      maxRenderTime: 16, // 60 FPS target
      minFrameRate: 30,
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxElementCount: 1000,
      maxInteractionLatency: 100 // 100ms
    };
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(intervalMs: number = 1000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = window.setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      window.clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Measure render time for a visualization operation
   */
  public measureRenderTime<T>(operation: () => T): { result: T; renderTime: number } {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Update metrics
    this.updateMetric('renderTime', renderTime);

    return { result, renderTime };
  }

  /**
   * Measure async render time
   */
  public async measureAsyncRenderTime<T>(operation: () => Promise<T>): Promise<{ result: T; renderTime: number }> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    this.updateMetric('renderTime', renderTime);

    return { result, renderTime };
  }

  /**
   * Measure interaction latency
   */
  public measureInteractionLatency(interactionType: string): InteractionMeasurer {
    return new InteractionMeasurer(interactionType, this);
  }

  /**
   * Record element count for current visualization
   */
  public recordElementCount(count: number): void {
    this.updateMetric('elementCount', count);
  }

  /**
   * Get current performance metrics
   */
  public getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get performance metrics history
   */
  public getMetricsHistory(count?: number): PerformanceMetrics[] {
    if (count) {
      return this.metrics.slice(-count);
    }
    return [...this.metrics];
  }

  /**
   * Get average metrics over time period
   */
  public getAverageMetrics(timeWindowMs: number = 10000): Partial<PerformanceMetrics> {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp <= timeWindowMs);
    
    if (recentMetrics.length === 0) return {};

    const sum = recentMetrics.reduce((acc, metrics) => ({
      renderTime: acc.renderTime + metrics.renderTime,
      frameRate: acc.frameRate + metrics.frameRate,
      memoryUsage: acc.memoryUsage + metrics.memoryUsage,
      elementCount: acc.elementCount + metrics.elementCount,
      interactionLatency: acc.interactionLatency + metrics.interactionLatency
    }), {
      renderTime: 0,
      frameRate: 0,
      memoryUsage: 0,
      elementCount: 0,
      interactionLatency: 0
    });

    const count = recentMetrics.length;
    return {
      renderTime: sum.renderTime / count,
      frameRate: sum.frameRate / count,
      memoryUsage: sum.memoryUsage / count,
      elementCount: sum.elementCount / count,
      interactionLatency: sum.interactionLatency / count
    };
  }

  /**
   * Check if performance is within acceptable thresholds
   */
  public isPerformanceAcceptable(): boolean {
    const current = this.getCurrentMetrics();
    if (!current) return true;

    return (
      current.renderTime <= this.thresholds.maxRenderTime &&
      current.frameRate >= this.thresholds.minFrameRate &&
      current.memoryUsage <= this.thresholds.maxMemoryUsage &&
      current.elementCount <= this.thresholds.maxElementCount &&
      current.interactionLatency <= this.thresholds.maxInteractionLatency
    );
  }

  /**
   * Get performance issues
   */
  public getPerformanceIssues(): string[] {
    const current = this.getCurrentMetrics();
    if (!current) return [];

    const issues: string[] = [];

    if (current.renderTime > this.thresholds.maxRenderTime) {
      issues.push(`Render time too high: ${current.renderTime.toFixed(2)}ms (max: ${this.thresholds.maxRenderTime}ms)`);
    }

    if (current.frameRate < this.thresholds.minFrameRate) {
      issues.push(`Frame rate too low: ${current.frameRate.toFixed(1)}fps (min: ${this.thresholds.minFrameRate}fps)`);
    }

    if (current.memoryUsage > this.thresholds.maxMemoryUsage) {
      issues.push(`Memory usage too high: ${(current.memoryUsage / 1024 / 1024).toFixed(1)}MB (max: ${(this.thresholds.maxMemoryUsage / 1024 / 1024).toFixed(1)}MB)`);
    }

    if (current.elementCount > this.thresholds.maxElementCount) {
      issues.push(`Too many elements: ${current.elementCount} (max: ${this.thresholds.maxElementCount})`);
    }

    if (current.interactionLatency > this.thresholds.maxInteractionLatency) {
      issues.push(`Interaction latency too high: ${current.interactionLatency.toFixed(2)}ms (max: ${this.thresholds.maxInteractionLatency}ms)`);
    }

    return issues;
  }

  /**
   * Set performance thresholds
   */
  public setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Subscribe to performance updates
   */
  public subscribe(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(observer);
    
    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Generate performance report
   */
  public generateReport(timeWindowMs: number = 60000): PerformanceReport {
    const averageMetrics = this.getAverageMetrics(timeWindowMs);
    const recentMetrics = this.getMetricsHistory().filter(m => Date.now() - m.timestamp <= timeWindowMs);
    
    const report: PerformanceReport = {
      timeWindow: timeWindowMs,
      sampleCount: recentMetrics.length,
      averageMetrics,
      issues: this.getPerformanceIssues(),
      recommendations: this.generateRecommendations(averageMetrics),
      timestamp: Date.now()
    };

    return report;
  }

  /**
   * Clear metrics history
   */
  public clearHistory(): void {
    this.metrics = [];
  }

  // Private methods

  private collectMetrics(): void {
    const metrics: PerformanceMetrics = {
      renderTime: this.getLastRenderTime(),
      frameRate: this.calculateFrameRate(),
      memoryUsage: this.getMemoryUsage(),
      elementCount: this.getElementCount(),
      interactionLatency: this.getLastInteractionLatency(),
      timestamp: Date.now()
    };

    this.addMetrics(metrics);
  }

  private addMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Limit history size
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    // Notify observers
    this.observers.forEach(observer => observer(metrics));
  }

  public updateMetric(key: keyof PerformanceMetrics, value: number): void {
    const current = this.getCurrentMetrics();
    if (current) {
      (current as any)[key] = value;
    }
  }

  private getLastRenderTime(): number {
    const current = this.getCurrentMetrics();
    return current ? current.renderTime : 0;
  }

  private calculateFrameRate(): number {
    // Simple frame rate calculation based on recent render times
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length < 2) return 60; // Default assumption

    const avgRenderTime = recentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / recentMetrics.length;
    return avgRenderTime > 0 ? Math.min(60, 1000 / avgRenderTime) : 60;
  }

  private getMemoryUsage(): number {
    // Use Performance API if available
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private getElementCount(): number {
    // Count SVG elements in the document
    return document.querySelectorAll('svg *').length;
  }

  private getLastInteractionLatency(): number {
    const current = this.getCurrentMetrics();
    return current ? current.interactionLatency : 0;
  }

  private generateRecommendations(metrics: Partial<PerformanceMetrics>): string[] {
    const recommendations: string[] = [];

    if (metrics.renderTime && metrics.renderTime > this.thresholds.maxRenderTime) {
      recommendations.push('Consider reducing the number of visual elements or enabling level-of-detail rendering');
      recommendations.push('Use canvas rendering for large datasets instead of SVG');
    }

    if (metrics.frameRate && metrics.frameRate < this.thresholds.minFrameRate) {
      recommendations.push('Enable animation throttling or reduce animation complexity');
      recommendations.push('Consider using CSS transforms instead of SVG attribute animations');
    }

    if (metrics.elementCount && metrics.elementCount > this.thresholds.maxElementCount) {
      recommendations.push('Implement virtualization for large datasets');
      recommendations.push('Use instancing or batching for similar elements');
    }

    if (metrics.interactionLatency && metrics.interactionLatency > this.thresholds.maxInteractionLatency) {
      recommendations.push('Debounce user interactions to reduce processing overhead');
      recommendations.push('Use event delegation instead of individual event listeners');
    }

    return recommendations;
  }
}

/**
 * Helper class for measuring interaction latency
 */
export class InteractionMeasurer {
  private startTime: number;
  private monitor: PerformanceMonitor;

  constructor(_interactionType: string, monitor: PerformanceMonitor) {
    this.monitor = monitor;
    this.startTime = performance.now();
  }

  public end(): number {
    const endTime = performance.now();
    const latency = endTime - this.startTime;
    
    this.monitor.updateMetric('interactionLatency', latency);
    
    return latency;
  }
}

/**
 * Performance report interface
 */
export interface PerformanceReport {
  timeWindow: number;
  sampleCount: number;
  averageMetrics: Partial<PerformanceMetrics>;
  issues: string[];
  recommendations: string[];
  timestamp: number;
}

export default PerformanceMonitor;
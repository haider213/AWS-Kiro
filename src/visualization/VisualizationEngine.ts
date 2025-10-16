import * as d3 from 'd3';
import { Chunk, SearchResult, VisualizationPoint, SimilarityConnection } from '../types';

export interface VisualizationConfig {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  animationDuration: number;
  colorScheme: string[];
}

export interface ChunkBoundaryConfig extends VisualizationConfig {
  highlightColor: string;
  selectedColor: string;
  hoverColor: string;
}

export interface EmbeddingSpaceConfig extends VisualizationConfig {
  pointSize: number;
  connectionOpacity: number;
  similarityThreshold: number;
  enableZoom: boolean;
  enablePan: boolean;
}

export interface SearchResultConfig extends VisualizationConfig {
  resultColors: Record<string, string>;
  connectionWidth: number;
  scoreThreshold: number;
}

export interface PromptFlowConfig extends VisualizationConfig {
  nodeSize: number;
  arrowSize: number;
  flowDirection: 'horizontal' | 'vertical';
}

export class VisualizationEngine {
  private static instance: VisualizationEngine;
  private performanceMetrics: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): VisualizationEngine {
    if (!VisualizationEngine.instance) {
      VisualizationEngine.instance = new VisualizationEngine();
    }
    return VisualizationEngine.instance;
  }

  /**
   * Create reusable chunk boundary visualization
   */
  public renderChunkBoundaries(
    container: HTMLElement,
    text: string,
    chunks: Chunk[],
    config: ChunkBoundaryConfig,
    callbacks?: {
      onChunkHover?: (chunk: Chunk | null) => void;
      onChunkClick?: (chunk: Chunk) => void;
    }
  ): () => void {
    const startTime = performance.now();
    
    // Clear previous content
    d3.select(container).selectAll('*').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', config.width)
      .attr('height', config.height);

    const g = svg.append('g')
      .attr('transform', `translate(${config.margin.left},${config.margin.top})`);

    const innerWidth = config.width - config.margin.left - config.margin.right;
    const innerHeight = config.height - config.margin.top - config.margin.bottom;

    // Create text layout with chunk boundaries
    const textLines = this.createTextLayout(text, chunks, innerWidth);
    
    // Render text with chunk highlighting
    this.renderTextWithChunks(g, textLines, chunks, config, callbacks);

    // Add chunk legend
    this.renderChunkLegend(g, chunks, config, innerHeight);

    const endTime = performance.now();
    this.performanceMetrics.set('chunkBoundaries', endTime - startTime);

    // Return cleanup function
    return () => {
      d3.select(container).selectAll('*').remove();
    };
  }

  /**
   * Create interactive embedding space visualization with zoom and pan
   */
  public renderEmbeddingSpace(
    container: HTMLElement,
    points: VisualizationPoint[],
    connections: SimilarityConnection[],
    config: EmbeddingSpaceConfig,
    callbacks?: {
      onPointHover?: (chunk: Chunk | null) => void;
      onPointClick?: (chunk: Chunk) => void;
    }
  ): () => void {
    const startTime = performance.now();

    // Clear previous content
    d3.select(container).selectAll('*').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', config.width)
      .attr('height', config.height);

    const g = svg.append('g')
      .attr('transform', `translate(${config.margin.left},${config.margin.top})`);

    const innerWidth = config.width - config.margin.left - config.margin.right;
    const innerHeight = config.height - config.margin.top - config.margin.bottom;

    // Set up scales
    const { xScale, yScale } = this.createEmbeddingScales(points, innerWidth, innerHeight);

    // Add zoom behavior if enabled
    if (config.enableZoom || config.enablePan) {
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent(config.enableZoom ? [0.1, 10] : [1, 1])
        .on('zoom', (event) => {
          g.attr('transform', 
            `translate(${config.margin.left + event.transform.x},${config.margin.top + event.transform.y}) scale(${event.transform.k})`
          );
        });

      svg.call(zoom);
    }

    // Render connections
    this.renderEmbeddingConnections(g, connections, points, xScale, yScale, config);

    // Render points
    this.renderEmbeddingPoints(g, points, xScale, yScale, config, callbacks);

    // Add axes
    this.renderEmbeddingAxes(g, xScale, yScale, innerWidth, innerHeight);

    const endTime = performance.now();
    this.performanceMetrics.set('embeddingSpace', endTime - startTime);

    // Return cleanup function
    return () => {
      d3.select(container).selectAll('*').remove();
    };
  }

  /**
   * Render search results with animated highlighting
   */
  public renderSearchResults(
    container: HTMLElement,
    searchResults: SearchResult[],
    allChunks: Chunk[],
    query: string,
    config: SearchResultConfig,
    callbacks?: {
      onResultHover?: (result: SearchResult | null) => void;
      onResultClick?: (result: SearchResult) => void;
    }
  ): () => void {
    const startTime = performance.now();

    // Clear previous content
    d3.select(container).selectAll('*').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', config.width)
      .attr('height', config.height);

    const g = svg.append('g')
      .attr('transform', `translate(${config.margin.left},${config.margin.top})`);

    const innerWidth = config.width - config.margin.left - config.margin.right;
    const innerHeight = config.height - config.margin.top - config.margin.bottom;

    // Create force simulation for layout
    const simulation = this.createSearchResultSimulation(searchResults, allChunks, innerWidth, innerHeight);

    // Render query node
    this.renderQueryNode(g, query, innerWidth / 2, 50);

    // Render result nodes with animation
    this.renderSearchResultNodes(g, searchResults, config, callbacks, simulation);

    // Render connections with animation
    this.renderSearchConnections(g, searchResults, config, simulation);

    // Add legend
    this.renderSearchLegend(g, config, innerWidth);

    const endTime = performance.now();
    this.performanceMetrics.set('searchResults', endTime - startTime);

    // Return cleanup function
    return () => {
      simulation.stop();
      d3.select(container).selectAll('*').remove();
    };
  }

  /**
   * Create prompt construction flow diagram
   */
  public renderPromptConstruction(
    container: HTMLElement,
    query: string,
    retrievedChunks: Chunk[],
    constructedPrompt: string,
    config: PromptFlowConfig,
    callbacks?: {
      onStepHover?: (step: string) => void;
      onStepClick?: (step: string) => void;
    }
  ): () => void {
    const startTime = performance.now();

    // Clear previous content
    d3.select(container).selectAll('*').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', config.width)
      .attr('height', config.height);

    const g = svg.append('g')
      .attr('transform', `translate(${config.margin.left},${config.margin.top})`);

    const innerWidth = config.width - config.margin.left - config.margin.right;
    const innerHeight = config.height - config.margin.top - config.margin.bottom;

    // Create flow steps
    const flowSteps = this.createPromptFlowSteps(query, retrievedChunks, constructedPrompt);

    // Render flow diagram
    this.renderFlowDiagram(g, flowSteps, config, innerWidth, innerHeight, callbacks);

    const endTime = performance.now();
    this.performanceMetrics.set('promptConstruction', endTime - startTime);

    // Return cleanup function
    return () => {
      d3.select(container).selectAll('*').remove();
    };
  }

  /**
   * Animate transitions between visualization states
   */
  public animateTransition(
    container: HTMLElement,
    _fromState: any,
    _toState: any,
    duration: number = 500
  ): Promise<void> {
    return new Promise((resolve) => {
      const svg = d3.select(container).select('svg');
      
      svg.transition()
        .duration(duration)
        .ease(d3.easeQuadInOut)
        .on('end', () => resolve());
    });
  }

  /**
   * Get performance metrics for optimization
   */
  public getPerformanceMetrics(): Record<string, number> {
    return Object.fromEntries(this.performanceMetrics);
  }

  /**
   * Clear performance metrics
   */
  public clearPerformanceMetrics(): void {
    this.performanceMetrics.clear();
  }

  // Private helper methods

  private createTextLayout(text: string, chunks: Chunk[], width: number) {
    // Implementation for text layout with word wrapping
    const words = text.split(/\s+/);
    const lines: Array<{ text: string; chunks: Chunk[] }> = [];
    let currentLine = '';
    let currentChunks: Chunk[] = [];
    
    // This is a simplified implementation - in practice, you'd want more sophisticated text layout
    words.forEach((word, index) => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      if (testLine.length * 8 > width && currentLine) { // Rough character width estimation
        lines.push({ text: currentLine, chunks: [...currentChunks] });
        currentLine = word;
        currentChunks = [];
      } else {
        currentLine = testLine;
      }
      
      // Find chunks that contain this word
      const wordStart = text.indexOf(word, index > 0 ? text.indexOf(words[index - 1]) + words[index - 1].length : 0);
      const wordEnd = wordStart + word.length;
      
      chunks.forEach(_chunk => {
        if (_chunk.startIndex <= wordStart && _chunk.endIndex >= wordEnd) {
          if (!currentChunks.find(c => c.id === _chunk.id)) {
            currentChunks.push(_chunk);
          }
        }
      });
    });
    
    if (currentLine) {
      lines.push({ text: currentLine, chunks: [...currentChunks] });
    }
    
    return lines;
  }

  private renderTextWithChunks(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    textLines: Array<{ text: string; chunks: Chunk[] }>,
    _chunks: Chunk[],
    config: ChunkBoundaryConfig,
    callbacks?: {
      onChunkHover?: (chunk: Chunk | null) => void;
      onChunkClick?: (chunk: Chunk) => void;
    }
  ) {
    const lineHeight = 20;
    
    textLines.forEach((line, lineIndex) => {
      const y = lineIndex * lineHeight + 20;
      
      // Render background for chunks
      line.chunks.forEach((chunk, chunkIndex) => {
        g.append('rect')
          .attr('x', 0)
          .attr('y', y - 15)
          .attr('width', line.text.length * 8) // Rough estimation
          .attr('height', lineHeight)
          .attr('fill', config.colorScheme[chunkIndex % config.colorScheme.length])
          .attr('opacity', 0.3)
          .attr('rx', 3)
          .style('cursor', 'pointer')
          .on('mouseenter', () => callbacks?.onChunkHover?.(chunk))
          .on('mouseleave', () => callbacks?.onChunkHover?.(null))
          .on('click', () => callbacks?.onChunkClick?.(chunk));
      });
      
      // Render text
      g.append('text')
        .attr('x', 5)
        .attr('y', y)
        .attr('font-size', '14px')
        .attr('fill', '#374151')
        .text(line.text);
    });
  }

  private renderChunkLegend(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    chunks: Chunk[],
    config: ChunkBoundaryConfig,
    height: number
  ) {
    const legend = g.append('g')
      .attr('class', 'chunk-legend')
      .attr('transform', `translate(0, ${height - 100})`);

    chunks.slice(0, 10).forEach((_chunk, index) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(${(index % 5) * 120}, ${Math.floor(index / 5) * 25})`);

      legendItem.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', config.colorScheme[index % config.colorScheme.length])
        .attr('opacity', 0.7);

      legendItem.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .attr('font-size', '12px')
        .attr('fill', '#374151')
        .text(`Chunk ${index + 1}`);
    });
  }

  private createEmbeddingScales(points: VisualizationPoint[], width: number, height: number) {
    const xExtent = d3.extent(points, d => d.x) as [number, number];
    const yExtent = d3.extent(points, d => d.y) as [number, number];
    
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([0, width])
      .nice();

    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([height, 0])
      .nice();

    return { xScale, yScale };
  }

  private renderEmbeddingConnections(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    connections: SimilarityConnection[],
    points: VisualizationPoint[],
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    config: EmbeddingSpaceConfig
  ) {
    const visibleConnections = connections.filter(
      conn => conn.similarity >= config.similarityThreshold && conn.visible
    );

    g.selectAll('.connection')
      .data(visibleConnections)
      .enter()
      .append('line')
      .attr('class', 'connection')
      .attr('x1', (d: SimilarityConnection) => {
        const sourcePoint = points.find(p => p.chunk.id === d.source.id);
        return sourcePoint ? xScale(sourcePoint.x) : 0;
      })
      .attr('y1', (d: SimilarityConnection) => {
        const sourcePoint = points.find(p => p.chunk.id === d.source.id);
        return sourcePoint ? yScale(sourcePoint.y) : 0;
      })
      .attr('x2', (d: SimilarityConnection) => {
        const targetPoint = points.find(p => p.chunk.id === d.target.id);
        return targetPoint ? xScale(targetPoint.x) : 0;
      })
      .attr('y2', (d: SimilarityConnection) => {
        const targetPoint = points.find(p => p.chunk.id === d.target.id);
        return targetPoint ? yScale(targetPoint.y) : 0;
      })
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', (d: SimilarityConnection) => Math.max(0.5, d.similarity * 2))
      .attr('stroke-opacity', config.connectionOpacity)
      .attr('stroke-dasharray', '2,2');
  }

  private renderEmbeddingPoints(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    points: VisualizationPoint[],
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    config: EmbeddingSpaceConfig,
    callbacks?: {
      onPointHover?: (chunk: Chunk | null) => void;
      onPointClick?: (chunk: Chunk) => void;
    }
  ) {
    const pointsGroup = g.selectAll('.point')
      .data(points)
      .enter()
      .append('g')
      .attr('class', 'point')
      .attr('transform', (d: VisualizationPoint) => `translate(${xScale(d.x)}, ${yScale(d.y)})`);

    pointsGroup
      .append('circle')
      .attr('r', config.pointSize)
      .attr('fill', (_d: VisualizationPoint, i: number) => config.colorScheme[i % config.colorScheme.length])
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseenter', (_event, d: VisualizationPoint) => callbacks?.onPointHover?.(d.chunk))
      .on('mouseleave', () => callbacks?.onPointHover?.(null))
      .on('click', (_event, d: VisualizationPoint) => callbacks?.onPointClick?.(d.chunk));
  }

  private renderEmbeddingAxes(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    _width: number,
    height: number
  ) {
    const xAxis = d3.axisBottom(xScale).ticks(5);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis);

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);
  }

  private createSearchResultSimulation(
    searchResults: SearchResult[],
    allChunks: Chunk[],
    width: number,
    height: number
  ) {
    const resultChunkIds = new Set(searchResults.map(r => r.chunk.id));
    
    const nodes = allChunks.map((chunk, index) => ({
      id: chunk.id,
      chunk,
      x: (index % 10) * (width / 10) + 50,
      y: Math.floor(index / 10) * 60 + 50,
      isResult: resultChunkIds.has(chunk.id)
    }));

    return d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(25));
  }

  private renderQueryNode(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    query: string,
    x: number,
    y: number
  ) {
    g.append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', 20)
      .attr('fill', '#3B82F6')
      .attr('stroke', '#1E40AF')
      .attr('stroke-width', 2);

    g.append('text')
      .attr('x', x)
      .attr('y', y + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Q');

    g.append('text')
      .attr('x', x)
      .attr('y', y - 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#374151')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text(`Query: "${query.length > 20 ? query.substring(0, 20) + '...' : query}"`);
  }

  private renderSearchResultNodes(
    _g: d3.Selection<SVGGElement, unknown, null, undefined>,
    _searchResults: SearchResult[],
    _config: SearchResultConfig,
    _callbacks?: {
      onResultHover?: (result: SearchResult | null) => void;
      onResultClick?: (result: SearchResult) => void;
    },
    _simulation?: d3.Simulation<any, undefined>
  ) {
    // Implementation for rendering search result nodes
    // This would be similar to the existing search visualization but more modular
  }

  private renderSearchConnections(
    _g: d3.Selection<SVGGElement, unknown, null, undefined>,
    _searchResults: SearchResult[],
    _config: SearchResultConfig,
    _simulation?: d3.Simulation<any, undefined>
  ) {
    // Implementation for rendering connections between query and results
  }

  private renderSearchLegend(
    _g: d3.Selection<SVGGElement, unknown, null, undefined>,
    _config: SearchResultConfig,
    _width: number
  ) {
    // Implementation for search result legend
  }

  private createPromptFlowSteps(query: string, retrievedChunks: Chunk[], constructedPrompt: string) {
    return [
      { id: 'query', label: 'User Query', content: query, type: 'input' },
      { id: 'retrieval', label: 'Retrieved Context', content: `${retrievedChunks.length} chunks`, type: 'process' },
      { id: 'construction', label: 'Prompt Construction', content: 'Combining query + context', type: 'process' },
      { id: 'prompt', label: 'Final Prompt', content: constructedPrompt, type: 'output' }
    ];
  }

  private renderFlowDiagram(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    flowSteps: any[],
    config: PromptFlowConfig,
    width: number,
    height: number,
    callbacks?: {
      onStepHover?: (step: string) => void;
      onStepClick?: (step: string) => void;
    }
  ) {
    const stepWidth = width / flowSteps.length;
    const stepHeight = config.nodeSize;

    flowSteps.forEach((step, index) => {
      const x = index * stepWidth + stepWidth / 2;
      const y = height / 2;

      // Render step node
      const stepGroup = g.append('g')
        .attr('class', 'flow-step')
        .attr('transform', `translate(${x}, ${y})`)
        .style('cursor', 'pointer')
        .on('mouseenter', () => callbacks?.onStepHover?.(step.id))
        .on('mouseleave', () => callbacks?.onStepHover?.(''))
        .on('click', () => callbacks?.onStepClick?.(step.id));

      stepGroup.append('rect')
        .attr('x', -stepWidth / 2 + 10)
        .attr('y', -stepHeight / 2)
        .attr('width', stepWidth - 20)
        .attr('height', stepHeight)
        .attr('fill', this.getStepColor(step.type))
        .attr('stroke', '#374151')
        .attr('stroke-width', 1)
        .attr('rx', 5);

      stepGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-10px')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#374151')
        .text(step.label);

      stepGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '10px')
        .attr('font-size', '10px')
        .attr('fill', '#6B7280')
        .text(step.content.length > 30 ? step.content.substring(0, 30) + '...' : step.content);

      // Render arrow to next step
      if (index < flowSteps.length - 1) {
        g.append('path')
          .attr('d', `M ${x + stepWidth / 2 - 10} ${y} L ${x + stepWidth / 2 + 10} ${y}`)
          .attr('stroke', '#374151')
          .attr('stroke-width', 2)
          .attr('marker-end', 'url(#arrowhead)');
      }
    });

    // Add arrowhead marker
    const defs = g.append('defs');
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#374151');
  }

  private getStepColor(type: string): string {
    const colors = {
      input: '#3B82F6',
      process: '#10B981',
      output: '#F59E0B'
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  }
}

export default VisualizationEngine;
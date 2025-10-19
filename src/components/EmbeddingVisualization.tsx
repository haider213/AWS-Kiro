import React, { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface EmbeddingData {
  embeddings: number[][]
  tsne_coordinates: number[][]
  feature_names: string[]
}

interface Chunk {
  id: string
  content: string
  word_count: number
  char_count: number
  strategy: string
}

interface EmbeddingVisualizationProps {
  chunks: Chunk[]
  embeddings: EmbeddingData
  onChunkSelect?: (chunk: Chunk) => void
  selectedChunk?: Chunk | null
}

const EmbeddingVisualization: React.FC<EmbeddingVisualizationProps> = ({
  chunks,
  embeddings,
  onChunkSelect,
  selectedChunk
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredChunk, setHoveredChunk] = useState<Chunk | null>(null)
  const [viewMode, setViewMode] = useState<'tsne' | 'similarity'>('tsne')

  useEffect(() => {
    if (!chunks.length || !embeddings || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 20, bottom: 40, left: 40 }
    const width = 600 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    if (viewMode === 'tsne' && embeddings.tsne_coordinates) {
      // t-SNE visualization
      const xExtent = d3.extent(embeddings.tsne_coordinates, d => d[0]) as [number, number]
      const yExtent = d3.extent(embeddings.tsne_coordinates, d => d[1]) as [number, number]
      
      const xScale = d3.scaleLinear()
        .domain(xExtent)
        .range([0, width])
      
      const yScale = d3.scaleLinear()
        .domain(yExtent)
        .range([height, 0])

      const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

      // Add axes
      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(5))

      g.append('g')
        .call(d3.axisLeft(yScale).ticks(5))

      // Add axis labels
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('t-SNE Dimension 2')

      g.append('text')
        .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 5})`)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('t-SNE Dimension 1')

      // Add points
      const circles = g.selectAll('.embedding-point')
        .data(chunks)
        .enter()
        .append('circle')
        .attr('class', 'embedding-point')
        .attr('cx', (d, i) => xScale(embeddings.tsne_coordinates[i][0]))
        .attr('cy', (d, i) => yScale(embeddings.tsne_coordinates[i][1]))
        .attr('r', (d) => Math.sqrt(d.word_count) * 0.3 + 4)
        .attr('fill', (d, i) => colorScale(i.toString()))
        .attr('opacity', 0.7)
        .attr('stroke', (d) => selectedChunk?.id === d.id ? '#000' : '#fff')
        .attr('stroke-width', (d) => selectedChunk?.id === d.id ? 3 : 1)
        .style('cursor', 'pointer')

      // Add interactions
      circles
        .on('mouseover', function(event, d) {
          setHoveredChunk(d)
          d3.select(this)
            .attr('opacity', 1)
            .attr('r', Math.sqrt(d.word_count) * 0.3 + 6)
        })
        .on('mouseout', function(event, d) {
          setHoveredChunk(null)
          d3.select(this)
            .attr('opacity', 0.7)
            .attr('r', Math.sqrt(d.word_count) * 0.3 + 4)
        })
        .on('click', function(event, d) {
          onChunkSelect?.(d)
        })

      // Add title
      g.append('text')
        .attr('x', width / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('t-SNE Embedding Visualization')

    } else if (viewMode === 'similarity') {
      // Similarity heatmap
      const n = chunks.length
      const cellSize = Math.min(width / n, height / n, 30)
      
      // Calculate similarity matrix
      const similarities: number[][] = []
      for (let i = 0; i < n; i++) {
        similarities[i] = []
        for (let j = 0; j < n; j++) {
          if (i === j) {
            similarities[i][j] = 1
          } else {
            // Calculate cosine similarity
            const vec1 = embeddings.embeddings[i]
            const vec2 = embeddings.embeddings[j]
            const dot = vec1.reduce((sum, a, idx) => sum + a * vec2[idx], 0)
            const norm1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0))
            const norm2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0))
            similarities[i][j] = dot / (norm1 * norm2)
          }
        }
      }

      const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, 1])

      // Create heatmap
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          g.append('rect')
            .attr('x', j * cellSize)
            .attr('y', i * cellSize)
            .attr('width', cellSize)
            .attr('height', cellSize)
            .attr('fill', colorScale(similarities[i][j]))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mouseover', function() {
              setHoveredChunk({
                ...chunks[i],
                content: `Similarity: ${similarities[i][j].toFixed(3)}\nChunk ${i} ↔ Chunk ${j}`
              })
            })
            .on('mouseout', function() {
              setHoveredChunk(null)
            })
        }
      }

      // Add labels
      g.append('text')
        .attr('x', width / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Chunk Similarity Matrix')
    }

  }, [chunks, embeddings, selectedChunk, viewMode])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Embedding Visualization
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('tsne')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'tsne'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              t-SNE Plot
            </button>
            <button
              onClick={() => setViewMode('similarity')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'similarity'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Similarity Matrix
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {viewMode === 'tsne' 
            ? 'Dimensionality reduction showing semantic relationships between chunks'
            : 'Heatmap showing pairwise similarities between all chunks'
          }
        </p>
      </div>
      
      <div className="relative">
        <svg ref={svgRef}></svg>
        
        {/* Tooltip */}
        {hoveredChunk && (
          <div className="absolute top-4 right-4 bg-black text-white p-3 rounded-lg shadow-lg max-w-xs z-10">
            <div className="text-sm">
              <div className="font-semibold mb-1">
                {viewMode === 'tsne' ? 'Chunk Details' : 'Similarity Info'}
              </div>
              {viewMode === 'tsne' ? (
                <>
                  <div>Words: {hoveredChunk.word_count}</div>
                  <div>Characters: {hoveredChunk.char_count}</div>
                  <div className="mt-2 text-xs opacity-75">
                    {hoveredChunk.content.substring(0, 100)}...
                  </div>
                </>
              ) : (
                <div className="whitespace-pre-line">
                  {hoveredChunk.content}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Statistics */}
      {embeddings && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium text-gray-900">Dimensions</div>
            <div className="text-gray-600">{embeddings.embeddings[0]?.length || 0}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium text-gray-900">Chunks</div>
            <div className="text-gray-600">{chunks.length}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium text-gray-900">Features</div>
            <div className="text-gray-600">{embeddings.feature_names.length}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium text-gray-900">View Mode</div>
            <div className="text-gray-600 capitalize">{viewMode}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmbeddingVisualization
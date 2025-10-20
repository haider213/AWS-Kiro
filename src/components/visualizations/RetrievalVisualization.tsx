import React, { useState, useRef, useEffect } from 'react'
import * as d3 from 'd3'

interface DocumentChunk {
  id: string
  content: string
  word_count: number
  char_count: number
  strategy: string
  similarity_score?: number
  rank?: number
}

interface EmbeddingData {
  embeddings: number[][]
  tsne_coordinates: number[][]
  feature_names: string[]
  method: string
  model_id: string
  dimensions: number
}

interface RetrievalVisualizationProps {
  chunks: DocumentChunk[]
  embeddings: EmbeddingData
  query: string
  retrievedChunks: DocumentChunk[]
  similarityMetric: 'cosine' | 'euclidean' | 'dot_product'
}

const RetrievalVisualization: React.FC<RetrievalVisualizationProps> = ({
  chunks,
  embeddings,
  query,
  retrievedChunks,
  similarityMetric
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredChunk, setHoveredChunk] = useState<DocumentChunk | null>(null)

  useEffect(() => {
    if (!chunks.length || !embeddings || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 20, bottom: 40, left: 40 }
    const width = 700 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Use t-SNE coordinates for visualization
    if (!embeddings.tsne_coordinates) return

    const xExtent = d3.extent(embeddings.tsne_coordinates, d => d[0]) as [number, number]
    const yExtent = d3.extent(embeddings.tsne_coordinates, d => d[1]) as [number, number]
    
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([0, width])
    
    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([height, 0])

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
      .text('Semantic Dimension 2')

    g.append('text')
      .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 5})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Semantic Dimension 1')

    // Create color scale for similarity scores
    const similarityScale = d3.scaleSequential(d3.interpolateRdYlGn)
      .domain([0, 1])

    // Add all chunks as circles
    const circles = g.selectAll('.chunk-point')
      .data(chunks)
      .enter()
      .append('circle')
      .attr('class', 'chunk-point')
      .attr('cx', (d, i) => xScale(embeddings.tsne_coordinates[i][0]))
      .attr('cy', (d, i) => yScale(embeddings.tsne_coordinates[i][1]))
      .attr('r', (d: any) => {
        const isRetrieved = retrievedChunks.some(rc => rc.id === d.id)
        return isRetrieved ? 8 : 5
      })
      .attr('fill', (d: any) => {
        const retrievedChunk = retrievedChunks.find(rc => rc.id === d.id)
        if (retrievedChunk && retrievedChunk.similarity_score) {
          return similarityScale(retrievedChunk.similarity_score)
        }
        return '#e5e7eb' // Gray for non-retrieved chunks
      })
      .attr('stroke', (d: any) => {
        const isRetrieved = retrievedChunks.some(rc => rc.id === d.id)
        return isRetrieved ? '#000' : '#9ca3af'
      })
      .attr('stroke-width', (d: any) => {
        const isRetrieved = retrievedChunks.some(rc => rc.id === d.id)
        return isRetrieved ? 2 : 1
      })
      .attr('opacity', 0.8)
      .style('cursor', 'pointer')

    // Add interactions
    circles
      .on('mouseover', function(event, d: any) {
        setHoveredChunk(d)
        d3.select(this)
          .attr('r', (d: any) => {
            const isRetrieved = retrievedChunks.some(rc => rc.id === d.id)
            return isRetrieved ? 10 : 7
          })
      })
      .on('mouseout', function(event, d: any) {
        setHoveredChunk(null)
        d3.select(this)
          .attr('r', (d: any) => {
            const isRetrieved = retrievedChunks.some(rc => rc.id === d.id)
            return isRetrieved ? 8 : 5
          })
      })

    // Add query point (if we had query embedding, we'd show it here)
    // For now, we'll add a legend instead

    // Add title
    g.append('text')
      .attr('x', width / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(`Retrieval Results - ${similarityMetric.toUpperCase()} Similarity`)

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${width - 120}, 20)`)

    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 8)
      .attr('fill', similarityScale(0.8))
      .attr('stroke', '#000')
      .attr('stroke-width', 2)

    legend.append('text')
      .attr('x', 15)
      .attr('y', 5)
      .style('font-size', '12px')
      .text('Retrieved')

    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 20)
      .attr('r', 5)
      .attr('fill', '#e5e7eb')
      .attr('stroke', '#9ca3af')

    legend.append('text')
      .attr('x', 15)
      .attr('y', 25)
      .style('font-size', '12px')
      .text('Not Retrieved')

  }, [chunks, embeddings, retrievedChunks, similarityMetric])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Retrieval Visualization
        </h3>
        <p className="text-sm text-gray-600">
          Semantic space showing retrieved chunks (larger, colored) vs non-retrieved chunks (smaller, gray)
        </p>
        <div className="mt-2 text-sm text-blue-600">
          <strong>Query:</strong> "{query}"
        </div>
      </div>
      
      <div className="relative">
        <svg ref={svgRef}></svg>
        
        {/* Tooltip */}
        {hoveredChunk && (
          <div className="absolute top-4 right-4 bg-black text-white p-3 rounded-lg shadow-lg max-w-xs z-10">
            <div className="text-sm">
              <div className="font-semibold mb-1">Chunk Details</div>
              <div>Words: {hoveredChunk.word_count}</div>
              <div>Characters: {hoveredChunk.char_count}</div>
              {hoveredChunk.similarity_score && (
                <div>Similarity: {(hoveredChunk.similarity_score * 100).toFixed(1)}%</div>
              )}
              {hoveredChunk.rank && (
                <div>Rank: #{hoveredChunk.rank}</div>
              )}
              <div className="mt-2 text-xs opacity-75">
                {hoveredChunk.content.substring(0, 100)}...
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Retrieval Statistics */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-purple-50 p-2 rounded">
          <div className="font-medium text-purple-900">Retrieved</div>
          <div className="text-purple-700">{retrievedChunks.length} chunks</div>
        </div>
        <div className="bg-green-50 p-2 rounded">
          <div className="font-medium text-green-900">Top Score</div>
          <div className="text-green-700">
            {retrievedChunks.length > 0 ? (retrievedChunks[0].similarity_score! * 100).toFixed(1) + '%' : 'N/A'}
          </div>
        </div>
        <div className="bg-blue-50 p-2 rounded">
          <div className="font-medium text-blue-900">Metric</div>
          <div className="text-blue-700">{similarityMetric}</div>
        </div>
        <div className="bg-orange-50 p-2 rounded">
          <div className="font-medium text-orange-900">Total Chunks</div>
          <div className="text-orange-700">{chunks.length}</div>
        </div>
      </div>
    </div>
  )
}

export default RetrievalVisualization
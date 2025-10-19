import React, { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface Chunk {
  id: string
  content: string
  word_count: number
  char_count: number
  strategy: string
  similarity_score?: number
  rank?: number
}

interface ChunkingVisualizationProps {
  chunks: Chunk[]
  strategy: string
  onChunkSelect?: (chunk: Chunk) => void
  selectedChunk?: Chunk | null
}

const ChunkingVisualization: React.FC<ChunkingVisualizationProps> = ({
  chunks,
  strategy,
  onChunkSelect,
  selectedChunk
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredChunk, setHoveredChunk] = useState<Chunk | null>(null)

  useEffect(() => {
    if (!chunks.length || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 20, bottom: 40, left: 60 }
    const width = 800 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Create scales based on strategy
    let xScale: d3.ScaleLinear<number, number>
    let yScale: d3.ScaleLinear<number, number>
    let xLabel = ''
    let yLabel = ''

    if (strategy === 'fixed_size') {
      xScale = d3.scaleLinear()
        .domain([0, chunks.length - 1])
        .range([0, width])
      
      yScale = d3.scaleLinear()
        .domain(d3.extent(chunks, d => d.char_count) as [number, number])
        .range([height, 0])
      
      xLabel = 'Chunk Index'
      yLabel = 'Character Count'
    } else if (strategy === 'sentence_based') {
      xScale = d3.scaleLinear()
        .domain([0, chunks.length - 1])
        .range([0, width])
      
      yScale = d3.scaleLinear()
        .domain(d3.extent(chunks, d => d.word_count) as [number, number])
        .range([height, 0])
      
      xLabel = 'Chunk Index'
      yLabel = 'Word Count'
    } else {
      // Default visualization
      xScale = d3.scaleLinear()
        .domain(d3.extent(chunks, d => d.char_count) as [number, number])
        .range([0, width])
      
      yScale = d3.scaleLinear()
        .domain(d3.extent(chunks, d => d.word_count) as [number, number])
        .range([height, 0])
      
      xLabel = 'Character Count'
      yLabel = 'Word Count'
    }

    // Color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))

    g.append('g')
      .call(d3.axisLeft(yScale))

    // Add axis labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(yLabel)

    g.append('text')
      .attr('transform', `translate(${width / 2}, ${height + margin.bottom})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(xLabel)

    // Add chunks as circles
    const circles = g.selectAll('.chunk')
      .data(chunks)
      .enter()
      .append('circle')
      .attr('class', 'chunk')
      .attr('cx', (d, i) => {
        if (strategy === 'fixed_size' || strategy === 'sentence_based') {
          return xScale(i)
        }
        return xScale(d.char_count)
      })
      .attr('cy', (d) => {
        if (strategy === 'fixed_size') {
          return yScale(d.char_count)
        }
        return yScale(d.word_count)
      })
      .attr('r', (d) => Math.sqrt(d.word_count) * 0.5 + 3)
      .attr('fill', (d, i) => colorScale(i.toString()))
      .attr('opacity', 0.7)
      .attr('stroke', (d) => selectedChunk?.id === d.id ? '#000' : 'none')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')

    // Add interactions
    circles
      .on('mouseover', function(event, d) {
        setHoveredChunk(d)
        d3.select(this)
          .attr('opacity', 1)
          .attr('r', Math.sqrt(d.word_count) * 0.5 + 5)
      })
      .on('mouseout', function(event, d) {
        setHoveredChunk(null)
        d3.select(this)
          .attr('opacity', 0.7)
          .attr('r', Math.sqrt(d.word_count) * 0.5 + 3)
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
      .text(`${strategy.replace('_', ' ').toUpperCase()} Chunking Visualization`)

  }, [chunks, strategy, selectedChunk])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Chunking Strategy Visualization
        </h3>
        <p className="text-sm text-gray-600">
          Interactive visualization showing chunk distribution and characteristics
        </p>
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
              <div className="mt-2 text-xs opacity-75">
                {hoveredChunk.content.substring(0, 100)}...
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="text-xs text-gray-600">
          Circle size represents word count • Click to select • Hover for details
        </div>
      </div>
    </div>
  )
}

export default ChunkingVisualization
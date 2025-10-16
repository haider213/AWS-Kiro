import React from 'react'
import { Chunk } from '../../../types'
import { Card } from '../../../components/UI/Card'

interface ChunkMetricsProps {
  chunks: Chunk[]
}

const ChunkMetrics: React.FC<ChunkMetricsProps> = ({ chunks }) => {
  const calculateMetrics = () => {
    if (chunks.length === 0) {
      return {
        totalChunks: 0,
        averageSize: 0,
        minSize: 0,
        maxSize: 0,
        totalOverlap: 0,
        averageOverlap: 0,
        totalWords: 0,
        totalSentences: 0
      }
    }

    const sizes = chunks.map(chunk => chunk.metadata.size)
    const wordCounts = chunks.map(chunk => chunk.metadata.wordCount || 0)
    const sentenceCounts = chunks.map(chunk => chunk.metadata.sentenceCount || 0)
    const overlaps = chunks.map(chunk => chunk.metadata.overlap || 0)

    return {
      totalChunks: chunks.length,
      averageSize: Math.round(sizes.reduce((sum, size) => sum + size, 0) / chunks.length),
      minSize: Math.min(...sizes),
      maxSize: Math.max(...sizes),
      totalOverlap: overlaps.reduce((sum, overlap) => sum + overlap, 0),
      averageOverlap: Math.round(overlaps.reduce((sum, overlap) => sum + overlap, 0) / chunks.length),
      totalWords: wordCounts.reduce((sum, count) => sum + count, 0),
      totalSentences: sentenceCounts.reduce((sum, count) => sum + count, 0)
    }
  }

  const metrics = calculateMetrics()

  const MetricCard: React.FC<{ 
    title: string
    value: number | string
    subtitle?: string
    color?: string 
  }> = ({ title, value, subtitle, color = 'blue' }) => (
    <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4`}>
      <div className={`text-2xl font-bold text-${color}-700`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className={`text-sm font-medium text-${color}-600`}>{title}</div>
      {subtitle && (
        <div className={`text-xs text-${color}-500 mt-1`}>{subtitle}</div>
      )}
    </div>
  )

  return (
    <Card title="Chunking Metrics" className="bg-white">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Chunks"
          value={metrics.totalChunks}
          color="blue"
        />
        <MetricCard
          title="Average Size"
          value={metrics.averageSize}
          subtitle="characters"
          color="green"
        />
        <MetricCard
          title="Total Words"
          value={metrics.totalWords}
          color="purple"
        />
        <MetricCard
          title="Total Sentences"
          value={metrics.totalSentences}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Size Distribution</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Minimum:</span>
              <span className="font-medium">{metrics.minSize} chars</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Maximum:</span>
              <span className="font-medium">{metrics.maxSize} chars</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average:</span>
              <span className="font-medium">{metrics.averageSize} chars</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Overlap Analysis</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Overlap:</span>
              <span className="font-medium">{metrics.totalOverlap} words</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Overlap:</span>
              <span className="font-medium">{metrics.averageOverlap} words</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Overlap Ratio:</span>
              <span className="font-medium">
                {metrics.totalWords > 0 
                  ? `${((metrics.totalOverlap / metrics.totalWords) * 100).toFixed(1)}%`
                  : '0%'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Content Analysis</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Words/Chunk:</span>
              <span className="font-medium">
                {metrics.totalChunks > 0 
                  ? Math.round(metrics.totalWords / metrics.totalChunks)
                  : 0
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Sentences/Chunk:</span>
              <span className="font-medium">
                {metrics.totalChunks > 0 
                  ? (metrics.totalSentences / metrics.totalChunks).toFixed(1)
                  : 0
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Density:</span>
              <span className="font-medium">
                {metrics.averageSize > 0 && metrics.totalWords > 0
                  ? `${((metrics.totalWords / metrics.totalChunks) / (metrics.averageSize / metrics.totalChunks) * 100).toFixed(0)}%`
                  : '0%'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {chunks.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Chunk Size Visualization</h4>
          <div className="space-y-2">
            {chunks.slice(0, 10).map((chunk, index) => {
              const maxSize = Math.max(...chunks.map(c => c.metadata.size))
              const widthPercentage = (chunk.metadata.size / maxSize) * 100
              
              return (
                <div key={chunk.id} className="flex items-center space-x-3">
                  <div className="w-12 text-xs text-gray-500 text-right">
                    #{index + 1}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${widthPercentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                      {chunk.metadata.size}
                    </div>
                  </div>
                  <div className="w-16 text-xs text-gray-500">
                    {chunk.metadata.wordCount} words
                  </div>
                </div>
              )
            })}
            {chunks.length > 10 && (
              <div className="text-xs text-gray-500 text-center mt-2">
                ... and {chunks.length - 10} more chunks
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

export default ChunkMetrics
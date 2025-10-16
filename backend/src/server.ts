import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

// Import routes
import embeddingsRouter from './routes/embeddings.js'
import generationRouter from './routes/generation.js'
import modelsRouter from './routes/models.js'

// Import middleware
import { apiKeyAuth, requestLogger } from './middleware/auth.js'
import { getCacheStats, clearCache } from './middleware/cache.js'
import { requestTracking, getMetrics, resetMetrics, monitoringService } from './middleware/monitoring.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Request logging and monitoring
app.use(requestLogger())
app.use(requestTracking)

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Authentication middleware
app.use(apiKeyAuth())

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/embeddings', embeddingsRouter)
app.use('/api/generation', generationRouter)
app.use('/api/models', modelsRouter)

// Cache management endpoints
app.get('/api/cache/stats', getCacheStats)
app.post('/api/cache/clear', clearCache)

// Monitoring endpoints
app.get('/api/metrics', getMetrics)
app.post('/api/metrics/reset', resetMetrics)

// API info endpoint
app.get('/api', (_req, res) => {
  res.json({ 
    message: 'RAG Pipeline Educator API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      embeddings: {
        generate: 'POST /api/embeddings/generate',
        similarity: 'POST /api/embeddings/similarity',
      },
      generation: {
        response: 'POST /api/generation/response',
        compare: 'POST /api/generation/compare',
      },
      models: {
        embedding: 'GET /api/models/embedding',
        generation: 'GET /api/models/generation',
      },
      cache: {
        stats: 'GET /api/cache/stats',
        clear: 'POST /api/cache/clear',
      },
    }
  })
})

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔗 API info: http://localhost:${PORT}/api`)
  console.log(`📈 Metrics: http://localhost:${PORT}/api/metrics`)
  
  // Start health monitoring
  monitoringService.startHealthLogging()
})
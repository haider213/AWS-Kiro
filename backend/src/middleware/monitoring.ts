import { Request, Response, NextFunction } from 'express'

interface PerformanceMetrics {
  requestCount: number
  averageResponseTime: number
  errorCount: number
  activeConnections: number
  memoryUsage: NodeJS.MemoryUsage
  uptime: number
}

class MonitoringService {
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    averageResponseTime: 0,
    errorCount: 0,
    activeConnections: 0,
    memoryUsage: process.memoryUsage(),
    uptime: 0
  }

  private responseTimes: number[] = []
  private startTime = Date.now()

  // Middleware to track request metrics
  trackRequest() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now()
      this.metrics.activeConnections++

      // Track response time
      res.on('finish', () => {
        const responseTime = Date.now() - startTime
        this.responseTimes.push(responseTime)
        
        // Keep only last 100 response times for average calculation
        if (this.responseTimes.length > 100) {
          this.responseTimes.shift()
        }

        this.metrics.requestCount++
        this.metrics.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
        this.metrics.activeConnections--

        // Track errors
        if (res.statusCode >= 400) {
          this.metrics.errorCount++
        }

        // Log request for hackathon monitoring
        if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
          console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${responseTime}ms`)
        }
      })

      next()
    }
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      memoryUsage: process.memoryUsage(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000)
    }
  }

  // Reset metrics (useful for hackathon sessions)
  resetMetrics() {
    this.metrics = {
      requestCount: 0,
      averageResponseTime: 0,
      errorCount: 0,
      activeConnections: 0,
      memoryUsage: process.memoryUsage(),
      uptime: 0
    }
    this.responseTimes = []
    this.startTime = Date.now()
  }

  // Log system health periodically
  startHealthLogging() {
    if (process.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
      setInterval(() => {
        const metrics = this.getMetrics()
        console.log('System Health:', {
          requests: metrics.requestCount,
          avgResponseTime: `${metrics.averageResponseTime.toFixed(2)}ms`,
          errors: metrics.errorCount,
          memoryUsage: `${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          uptime: `${metrics.uptime}s`
        })
      }, 60000) // Log every minute
    }
  }
}

export const monitoringService = new MonitoringService()

// Middleware export
export const requestTracking = monitoringService.trackRequest()

// Metrics endpoint handler
export const getMetrics = (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    metrics: monitoringService.getMetrics(),
    timestamp: new Date().toISOString()
  })
}

// Reset metrics endpoint (useful for hackathon sessions)
export const resetMetrics = (_req: Request, res: Response) => {
  monitoringService.resetMetrics()
  res.json({
    status: 'metrics reset',
    timestamp: new Date().toISOString()
  })
}
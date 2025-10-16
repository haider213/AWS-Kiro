import { Request, Response, NextFunction } from 'express';

// Simple API key authentication for hackathon environment
export function apiKeyAuth() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip auth for health check and API info endpoints
    if (req.path === '/health' || req.path === '/api') {
      return next();
    }

    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const validApiKey = process.env.API_KEY;

    // If no API key is configured, allow all requests (development mode)
    if (!validApiKey) {
      console.warn('No API_KEY configured - allowing all requests');
      return next();
    }

    if (!apiKey) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'API key is required. Provide it via x-api-key header or apiKey query parameter.',
      });
    }

    if (apiKey !== validApiKey) {
      return res.status(403).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid.',
      });
    }

    next();
  };
}

// Request logging middleware
export function requestLogger() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`[${timestamp}] ${method} ${url} - ${ip}`);
    
    // Log request body for POST requests (excluding sensitive data)
    if (method === 'POST' && req.body) {
      const logBody = { ...req.body };
      // Don't log the actual text content, just metadata
      if (logBody.texts) {
        logBody.texts = `[${logBody.texts.length} texts]`;
      }
      if (logBody.prompt) {
        logBody.prompt = `[${logBody.prompt.length} chars]`;
      }
      console.log(`  Body:`, logBody);
    }
    
    next();
  };
}
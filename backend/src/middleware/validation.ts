import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schemas
export const embeddingRequestSchema = z.object({
  texts: z.array(z.string().min(1).max(10000)).min(1).max(50), // Max 50 texts, each max 10k chars
  model: z.string().optional(),
});

export const generationRequestSchema = z.object({
  prompt: z.string().min(1).max(50000), // Max 50k chars for prompt
  model: z.string().optional(),
  parameters: z.object({
    maxContextLength: z.number().min(100).max(10000).optional(),
    contextSelectionStrategy: z.enum(['top-k', 'threshold', 'diverse']).optional(),
    temperature: z.number().min(0).max(2).optional(),
  }).optional(),
});

export const similarityRequestSchema = z.object({
  embedding1: z.object({
    vector: z.array(z.number()),
    model: z.string(),
    dimensions: z.number(),
  }),
  embedding2: z.object({
    vector: z.array(z.number()),
    model: z.string(),
    dimensions: z.number(),
  }),
});

// Generic validation middleware factory
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      
      return res.status(400).json({
        error: 'Invalid request data',
        message: error instanceof Error ? error.message : 'Unknown validation error',
      });
    }
  };
}

// Rate limiting for expensive operations
export function expensiveOperationLimit() {
  const requests = new Map<string, { count: number; resetTime: number }>();
  const maxRequests = 10; // Max 10 requests per minute
  const windowMs = 60 * 1000; // 1 minute

  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    const clientData = requests.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      requests.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded for expensive operations',
        message: 'Please wait before making more requests',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
    }
    
    clientData.count++;
    next();
  };
}
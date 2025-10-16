import { Router } from 'express';
import { BedrockService } from '../services/bedrockClient.js';
import { cacheMiddleware, cacheHeaders } from '../middleware/cache.js';

const router = Router();
const bedrockService = new BedrockService();

// Get available embedding models
router.get('/embedding',
  cacheHeaders(3600), // Cache for 1 hour
  cacheMiddleware(60 * 60 * 1000), // Cache for 1 hour
  (_req, res) => {
    try {
      const models = bedrockService.getAvailableEmbeddingModels();
      
      res.json({
        success: true,
        models,
        count: models.length,
      });
    } catch (error) {
      console.error('Error in models/embedding:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get embedding models',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Get available generation models
router.get('/generation',
  cacheHeaders(3600), // Cache for 1 hour
  cacheMiddleware(60 * 60 * 1000), // Cache for 1 hour
  (_req, res) => {
    try {
      const models = bedrockService.getAvailableGenerationModels();
      
      res.json({
        success: true,
        models,
        count: models.length,
      });
    } catch (error) {
      console.error('Error in models/generation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get generation models',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
import { Router } from 'express';
import { BedrockService } from '../services/bedrockClient.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { validateRequest, embeddingRequestSchema, similarityRequestSchema, expensiveOperationLimit } from '../middleware/validation.js';

const router = Router();
const bedrockService = new BedrockService();

// Generate embeddings for multiple texts
router.post('/generate', 
  expensiveOperationLimit(),
  validateRequest(embeddingRequestSchema),
  cacheMiddleware(10 * 60 * 1000), // Cache for 10 minutes
  async (req, res) => {
    try {
      const { texts, model } = req.body;
      
      console.log(`Generating embeddings for ${texts.length} texts using model: ${model || 'default'}`);
      
      const embeddings = await bedrockService.generateEmbeddings(texts, model);
      
      res.json({
        success: true,
        embeddings,
        count: embeddings.length,
        model: model || 'amazon.titan-embed-text-v1',
      });
    } catch (error) {
      console.error('Error in embeddings/generate:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate embeddings',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Calculate similarity between two embeddings
router.post('/similarity',
  validateRequest(similarityRequestSchema),
  cacheMiddleware(30 * 60 * 1000), // Cache for 30 minutes
  async (req, res) => {
    try {
      const { embedding1, embedding2 } = req.body;
      
      const similarity = bedrockService.calculateSimilarity(embedding1, embedding2);
      
      res.json({
        success: true,
        similarity,
        embedding1_model: embedding1.model,
        embedding2_model: embedding2.model,
      });
    } catch (error) {
      console.error('Error in embeddings/similarity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate similarity',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
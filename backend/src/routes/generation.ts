import { Router } from 'express';
import { BedrockService } from '../services/bedrockClient.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { validateRequest, generationRequestSchema, expensiveOperationLimit } from '../middleware/validation.js';

const router = Router();
const bedrockService = new BedrockService();

// Generate response using Bedrock
router.post('/response',
  expensiveOperationLimit(),
  validateRequest(generationRequestSchema),
  cacheMiddleware(15 * 60 * 1000), // Cache for 15 minutes
  async (req, res) => {
    try {
      const { prompt, model, parameters } = req.body;
      
      console.log(`Generating response using model: ${model || 'default'}`);
      
      const temperature = parameters?.temperature || 0.7;
      const result = await bedrockService.generateResponse(prompt, model, temperature);
      
      // Update result with provided parameters
      if (parameters) {
        result.parameters = { ...result.parameters, ...parameters };
      }
      
      res.json({
        success: true,
        result,
        model: model || 'anthropic.claude-3-haiku-20240307-v1:0',
      });
    } catch (error) {
      console.error('Error in generation/response:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate response',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Compare responses from multiple models
router.post('/compare',
  expensiveOperationLimit(),
  async (req, res) => {
    try {
      const { prompt, models = ['anthropic.claude-3-haiku-20240307-v1:0', 'amazon.titan-text-premier-v1:0'] } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Prompt is required and must be a string',
        });
      }
      
      console.log(`Comparing responses from ${models.length} models`);
      
      const results = await Promise.allSettled(
        models.map(async (model: string) => {
          const result = await bedrockService.generateResponse(prompt, model);
          return { model, result };
        })
      );
      
      const successful = results
        .filter((result): result is PromiseFulfilledResult<{ model: string; result: any }> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
      
      const failed = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason);
      
      res.json({
        success: true,
        results: successful,
        failed_count: failed.length,
        total_models: models.length,
      });
    } catch (error) {
      console.error('Error in generation/compare:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to compare responses',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
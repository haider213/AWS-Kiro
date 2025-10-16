import { setupServer } from 'msw/node'
import { rest } from 'msw'

const handlers = [
  // Mock embedding generation
  rest.post('/api/embeddings/generate', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          vector: Array.from({ length: 1536 }, () => Math.random()),
          model: 'amazon.titan-embed-text-v1',
          dimensions: 1536,
        },
      ])
    )
  }),

  // Mock similarity calculation
  rest.post('/api/embeddings/similarity', (req, res, ctx) => {
    return res(ctx.json(0.85))
  }),

  // Mock text generation
  rest.post('/api/generate/response', (req, res, ctx) => {
    return res(
      ctx.json({
        response: 'This is a mock generated response.',
        contextUsed: [],
        confidence: 0.9,
        parameters: {
          maxContextLength: 4000,
          contextSelectionStrategy: 'top-k',
          temperature: 0.7,
        },
      })
    )
  }),

  // Mock model information
  rest.get('/api/models/embedding', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          modelId: 'amazon.titan-embed-text-v1',
          dimensions: 1536,
        },
      ])
    )
  }),

  rest.get('/api/models/generation', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
          maxTokens: 4096,
          temperature: 0.7,
        },
      ])
    )
  }),
]

export const server = setupServer(...handlers)
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import embeddingsRouter from '../../routes/embeddings'
import generationRouter from '../../routes/generation'

describe('Bedrock API Integration', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/embeddings', embeddingsRouter)
    app.use('/api/generate', generationRouter)
  })

  describe('Embedding Generation', () => {
    it('should generate embeddings for text chunks', async () => {
      const chunks = [
        'This is the first chunk of text.',
        'This is the second chunk of text.',
      ]

      const response = await request(app)
        .post('/api/embeddings/generate')
        .send({ chunks, model: 'amazon.titan-embed-text-v1' })
        .expect(200)

      expect(response.body).toBeInstanceOf(Array)
      expect(response.body).toHaveLength(2)
      
      response.body.forEach((embedding: any) => {
        expect(embedding).toHaveProperty('vector')
        expect(embedding).toHaveProperty('model')
        expect(embedding).toHaveProperty('dimensions')
        expect(embedding.vector).toBeInstanceOf(Array)
        expect(embedding.vector.length).toBe(1536)
        expect(embedding.model).toBe('amazon.titan-embed-text-v1')
      })
    })

    it('should handle empty chunks array', async () => {
      const response = await request(app)
        .post('/api/embeddings/generate')
        .send({ chunks: [], model: 'amazon.titan-embed-text-v1' })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should validate model parameter', async () => {
      const chunks = ['Test chunk']

      const response = await request(app)
        .post('/api/embeddings/generate')
        .send({ chunks, model: 'invalid-model' })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should calculate similarity between embeddings', async () => {
      const embedding1 = {
        vector: Array.from({ length: 1536 }, () => Math.random()),
        model: 'amazon.titan-embed-text-v1',
        dimensions: 1536,
      }
      
      const embedding2 = {
        vector: Array.from({ length: 1536 }, () => Math.random()),
        model: 'amazon.titan-embed-text-v1',
        dimensions: 1536,
      }

      const response = await request(app)
        .post('/api/embeddings/similarity')
        .send({ embedding1, embedding2 })
        .expect(200)

      expect(typeof response.body).toBe('number')
      expect(response.body).toBeGreaterThanOrEqual(-1)
      expect(response.body).toBeLessThanOrEqual(1)
    })
  })

  describe('Text Generation', () => {
    it('should generate response from prompt', async () => {
      const prompt = 'What is the capital of France?'
      const model = 'anthropic.claude-3-sonnet-20240229-v1:0'

      const response = await request(app)
        .post('/api/generate/response')
        .send({ prompt, model, temperature: 0.7, maxTokens: 1000 })
        .expect(200)

      expect(response.body).toHaveProperty('response')
      expect(response.body).toHaveProperty('contextUsed')
      expect(response.body).toHaveProperty('confidence')
      expect(response.body).toHaveProperty('parameters')
      
      expect(typeof response.body.response).toBe('string')
      expect(response.body.response.length).toBeGreaterThan(0)
      expect(Array.isArray(response.body.contextUsed)).toBe(true)
      expect(typeof response.body.confidence).toBe('number')
    })

    it('should handle invalid model for generation', async () => {
      const prompt = 'Test prompt'

      const response = await request(app)
        .post('/api/generate/response')
        .send({ prompt, model: 'invalid-model' })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should validate temperature parameter', async () => {
      const prompt = 'Test prompt'
      const model = 'anthropic.claude-3-sonnet-20240229-v1:0'

      const response = await request(app)
        .post('/api/generate/response')
        .send({ prompt, model, temperature: 2.5 })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should compare multiple models', async () => {
      const prompt = 'Explain machine learning in simple terms.'
      const models = [
        'anthropic.claude-3-sonnet-20240229-v1:0',
        'anthropic.claude-3-haiku-20240307-v1:0',
      ]

      const response = await request(app)
        .post('/api/generate/compare')
        .send({ prompt, models, temperature: 0.7 })
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body).toHaveLength(2)
      
      response.body.forEach((result: any) => {
        expect(result).toHaveProperty('response')
        expect(result).toHaveProperty('model')
        expect(result).toHaveProperty('parameters')
      })
    })
  })

  describe('Model Information', () => {
    it('should return available embedding models', async () => {
      const response = await request(app)
        .get('/api/models/embedding')
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      
      response.body.forEach((model: any) => {
        expect(model).toHaveProperty('modelId')
        expect(model).toHaveProperty('dimensions')
      })
    })

    it('should return available generation models', async () => {
      const response = await request(app)
        .get('/api/models/generation')
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      
      response.body.forEach((model: any) => {
        expect(model).toHaveProperty('modelId')
        expect(model).toHaveProperty('maxTokens')
        expect(model).toHaveProperty('temperature')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/embeddings/generate')
        .send('invalid json')
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/embeddings/generate')
        .send({})
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should handle rate limiting', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/embeddings/generate')
          .send({ chunks: ['test'], model: 'amazon.titan-embed-text-v1' })
      )

      const responses = await Promise.all(requests)
      
      // At least some requests should succeed
      const successfulRequests = responses.filter(r => r.status === 200)
      expect(successfulRequests.length).toBeGreaterThan(0)
    })
  })
})
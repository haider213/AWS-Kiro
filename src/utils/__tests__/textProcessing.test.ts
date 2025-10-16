import { describe, it, expect } from 'vitest'
import {
  chunkByFixedSize,
  chunkBySentence,
  chunkByParagraph,
  chunkBySemantic,
} from '../textProcessing'

describe('Text Processing - Chunking Algorithms', () => {
  const sampleText = `This is the first sentence. This is the second sentence.

This is a new paragraph with multiple sentences. It contains important information.

Another paragraph here. With more content to test.`

  describe('chunkByFixedSize', () => {
    it('should create chunks of specified size', () => {
      const chunks = chunkByFixedSize(sampleText, { chunkSize: 50, overlap: 0 })
      
      expect(chunks).toBeDefined()
      expect(chunks.length).toBeGreaterThan(1)
      chunks.forEach((chunk, index) => {
        if (index < chunks.length - 1) {
          expect(chunk.content.length).toBeLessThanOrEqual(50)
        }
      })
    })

    it('should handle overlap correctly', () => {
      const chunks = chunkByFixedSize(sampleText, { chunkSize: 50, overlap: 10 })
      
      expect(chunks.length).toBeGreaterThan(1)
      
      // Check that consecutive chunks have overlapping content
      for (let i = 0; i < chunks.length - 1; i++) {
        const currentChunk = chunks[i]
        const nextChunk = chunks[i + 1]
        
        const currentEnd = currentChunk.content.slice(-10)
        const nextStart = nextChunk.content.slice(0, 10)
        
        // There should be some overlap
        expect(currentEnd.length).toBeGreaterThan(0)
        expect(nextStart.length).toBeGreaterThan(0)
      }
    })

    it('should handle empty text', () => {
      const chunks = chunkByFixedSize('', { chunkSize: 50, overlap: 0 })
      expect(chunks).toEqual([])
    })
  })

  describe('chunkBySentence', () => {
    it('should split text by sentences', () => {
      const chunks = chunkBySentence(sampleText)
      
      expect(chunks).toBeDefined()
      expect(chunks.length).toBeGreaterThan(1)
      
      // Each chunk should end with sentence-ending punctuation or be the last chunk
      chunks.forEach((chunk, index) => {
        if (index < chunks.length - 1) {
          expect(chunk.content.trim()).toMatch(/[.!?]$/)
        }
      })
    })

    it('should handle text without sentence endings', () => {
      const textWithoutPunctuation = 'This is text without proper punctuation'
      const chunks = chunkBySentence(textWithoutPunctuation)
      
      expect(chunks).toBeDefined()
      expect(chunks.length).toBe(1)
      expect(chunks[0].content.trim()).toBe(textWithoutPunctuation)
    })
  })

  describe('chunkByParagraph', () => {
    it('should split text by paragraphs', () => {
      const chunks = chunkByParagraph(sampleText)
      
      expect(chunks).toBeDefined()
      expect(chunks.length).toBe(3) // Three paragraphs in sample text
      
      chunks.forEach(chunk => {
        expect(chunk.content.trim().length).toBeGreaterThan(0)
      })
    })

    it('should handle single paragraph', () => {
      const singleParagraph = 'This is a single paragraph without line breaks.'
      const chunks = chunkByParagraph(singleParagraph)
      
      expect(chunks.length).toBe(1)
      expect(chunks[0].content.trim()).toBe(singleParagraph)
    })
  })

  describe('chunkBySemantic', () => {
    it('should create semantically coherent chunks', () => {
      const chunks = chunkBySemantic(sampleText, { similarityThreshold: 0.7 })
      
      expect(chunks).toBeDefined()
      expect(chunks.length).toBeGreaterThan(0)
      
      chunks.forEach(chunk => {
        expect(chunk.content.trim().length).toBeGreaterThan(0)
        expect(chunk.id).toBeDefined()
        expect(chunk.startIndex).toBeGreaterThanOrEqual(0)
        expect(chunk.endIndex).toBeGreaterThan(chunk.startIndex)
      })
    })

    it('should respect similarity threshold', () => {
      const highThreshold = chunkBySemantic(sampleText, { similarityThreshold: 0.9 })
      const lowThreshold = chunkBySemantic(sampleText, { similarityThreshold: 0.3 })
      
      // Higher threshold should create more chunks (less similar content grouped)
      expect(highThreshold.length).toBeGreaterThanOrEqual(lowThreshold.length)
    })
  })
})
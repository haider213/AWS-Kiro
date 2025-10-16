// Text processing utilities for RAG Pipeline Educator

import { Chunk, ChunkMetadata, ChunkingParameters, TextHighlight } from '../types';

// Text preprocessing utilities
export function preprocessText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
    .trim();
}

export function tokenizeText(text: string): string[] {
  // Simple tokenization - split on whitespace and punctuation
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0);
}

export function extractSentences(text: string): string[] {
  // Simple sentence boundary detection
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  return sentences;
}

export function extractParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

// Chunking utilities
export function createFixedSizeChunks(
  text: string, 
  chunkSize: number, 
  overlap: number = 0
): Chunk[] {
  const chunks: Chunk[] = [];
  const words = text.split(/\s+/);
  
  let startIndex = 0;
  let chunkId = 0;
  
  while (startIndex < words.length) {
    const endIndex = Math.min(startIndex + chunkSize, words.length);
    const chunkWords = words.slice(startIndex, endIndex);
    const chunkText = chunkWords.join(' ');
    
    // Calculate character positions
    const charStartIndex = words.slice(0, startIndex).join(' ').length + (startIndex > 0 ? 1 : 0);
    const charEndIndex = charStartIndex + chunkText.length;
    
    const metadata: ChunkMetadata = {
      strategy: 'fixed-size',
      size: chunkWords.length,
      overlap: startIndex > 0 ? overlap : 0,
      wordCount: chunkWords.length,
      sentenceCount: extractSentences(chunkText).length,
      createdAt: new Date()
    };
    
    chunks.push({
      id: `chunk-${chunkId++}`,
      content: chunkText,
      startIndex: charStartIndex,
      endIndex: charEndIndex,
      metadata
    });
    
    // Move to next chunk with overlap
    startIndex = endIndex - overlap;
    if (startIndex >= words.length) break;
  }
  
  return chunks;
}

export function createSentenceChunks(text: string): Chunk[] {
  const sentences = extractSentences(text);
  const chunks: Chunk[] = [];
  
  let currentIndex = 0;
  
  sentences.forEach((sentence, index) => {
    const startIndex = text.indexOf(sentence, currentIndex);
    const endIndex = startIndex + sentence.length;
    
    const metadata: ChunkMetadata = {
      strategy: 'sentence',
      size: sentence.length,
      wordCount: tokenizeText(sentence).length,
      sentenceCount: 1,
      createdAt: new Date()
    };
    
    chunks.push({
      id: `sentence-${index}`,
      content: sentence,
      startIndex,
      endIndex,
      metadata
    });
    
    currentIndex = endIndex;
  });
  
  return chunks;
}

export function createParagraphChunks(text: string): Chunk[] {
  const paragraphs = extractParagraphs(text);
  const chunks: Chunk[] = [];
  
  let currentIndex = 0;
  
  paragraphs.forEach((paragraph, index) => {
    const startIndex = text.indexOf(paragraph, currentIndex);
    const endIndex = startIndex + paragraph.length;
    
    const metadata: ChunkMetadata = {
      strategy: 'paragraph',
      size: paragraph.length,
      wordCount: tokenizeText(paragraph).length,
      sentenceCount: extractSentences(paragraph).length,
      createdAt: new Date()
    };
    
    chunks.push({
      id: `paragraph-${index}`,
      content: paragraph,
      startIndex,
      endIndex,
      metadata
    });
    
    currentIndex = endIndex;
  });
  
  return chunks;
}

// Semantic chunking (simplified version - would use embeddings in full implementation)
export function createSemanticChunks(
  text: string, 
  similarityThreshold: number = 0.7
): Chunk[] {
  const sentences = extractSentences(text);
  const chunks: Chunk[] = [];
  
  let currentChunk: string[] = [];
  let chunkId = 0;
  let currentIndex = 0;
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    currentChunk.push(sentence);
    
    // Simple heuristic: start new chunk if sentence is significantly different
    // In real implementation, this would use embedding similarity
    const shouldSplit = currentChunk.length > 3 && (
      sentence.length < 20 || // Very short sentence
      sentence.includes('\n') || // Paragraph break
      /^(Chapter|Section|\d+\.)/.test(sentence) // Heading-like
    );
    
    if (shouldSplit || i === sentences.length - 1) {
      const chunkText = currentChunk.join(' ');
      const startIndex = text.indexOf(currentChunk[0], currentIndex);
      const endIndex = startIndex + chunkText.length;
      
      const metadata: ChunkMetadata = {
        strategy: 'semantic',
        size: chunkText.length,
        wordCount: tokenizeText(chunkText).length,
        sentenceCount: currentChunk.length,
        similarityThreshold,
        createdAt: new Date()
      };
      
      chunks.push({
        id: `semantic-${chunkId++}`,
        content: chunkText,
        startIndex,
        endIndex,
        metadata
      });
      
      currentIndex = endIndex;
      currentChunk = [];
    }
  }
  
  return chunks;
}

// Main chunking function
export function chunkText(text: string, parameters: ChunkingParameters): Chunk[] {
  const processedText = preprocessText(text);
  
  switch (parameters.strategy) {
    case 'fixed-size':
      return createFixedSizeChunks(
        processedText, 
        parameters.chunkSize || 500, 
        parameters.overlap || 50
      );
    case 'sentence':
      return createSentenceChunks(processedText);
    case 'paragraph':
      return createParagraphChunks(processedText);
    case 'semantic':
      return createSemanticChunks(
        processedText, 
        parameters.similarityThreshold || 0.7
      );
    default:
      throw new Error(`Unsupported chunking strategy: ${parameters.strategy}`);
  }
}

// Text highlighting utilities
export function findKeywordMatches(text: string, keywords: string[]): TextHighlight[] {
  const highlights: TextHighlight[] = [];
  const lowerText = text.toLowerCase();
  
  keywords.forEach(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    let startIndex = 0;
    
    while (true) {
      const index = lowerText.indexOf(lowerKeyword, startIndex);
      if (index === -1) break;
      
      highlights.push({
        startIndex: index,
        endIndex: index + keyword.length,
        text: text.substring(index, index + keyword.length),
        type: 'exact'
      });
      
      startIndex = index + 1;
    }
  });
  
  return highlights.sort((a, b) => a.startIndex - b.startIndex);
}

export function mergeOverlappingHighlights(highlights: TextHighlight[]): TextHighlight[] {
  if (highlights.length === 0) return [];
  
  const sorted = [...highlights].sort((a, b) => a.startIndex - b.startIndex);
  const merged: TextHighlight[] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    
    if (current.startIndex <= last.endIndex) {
      // Merge overlapping highlights
      last.endIndex = Math.max(last.endIndex, current.endIndex);
      last.text = `${last.text}...${current.text}`;
      last.type = 'partial';
    } else {
      merged.push(current);
    }
  }
  
  return merged;
}

// Text statistics
export function calculateTextStatistics(text: string) {
  const words = tokenizeText(text);
  const sentences = extractSentences(text);
  const paragraphs = extractParagraphs(text);
  
  return {
    characterCount: text.length,
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    averageWordsPerSentence: words.length / sentences.length,
    averageSentencesPerParagraph: sentences.length / paragraphs.length,
    readabilityScore: calculateReadabilityScore(words, sentences)
  };
}

function calculateReadabilityScore(words: string[], sentences: string[]): number {
  // Simplified Flesch Reading Ease score
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = words.reduce((sum, word) => sum + countSyllables(word), 0) / words.length;
  
  return 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
}

function countSyllables(word: string): number {
  // Simple syllable counting heuristic
  const vowels = word.match(/[aeiouy]+/gi);
  return vowels ? Math.max(1, vowels.length) : 1;
}
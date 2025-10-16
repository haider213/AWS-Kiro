// Similarity calculation utilities for RAG Pipeline Educator

import { Embedding, Chunk, SearchResult } from '../types';

// Vector similarity calculations
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same dimensions');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

export function euclideanDistance(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same dimensions');
  }
  
  let sum = 0;
  for (let i = 0; i < vectorA.length; i++) {
    const diff = vectorA[i] - vectorB[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
}

export function manhattanDistance(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same dimensions');
  }
  
  let sum = 0;
  for (let i = 0; i < vectorA.length; i++) {
    sum += Math.abs(vectorA[i] - vectorB[i]);
  }
  
  return sum;
}

export function dotProduct(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same dimensions');
  }
  
  let product = 0;
  for (let i = 0; i < vectorA.length; i++) {
    product += vectorA[i] * vectorB[i];
  }
  
  return product;
}

// Text similarity calculations
export function jaccardSimilarity(textA: string, textB: string): number {
  const tokensA = new Set(textA.toLowerCase().split(/\s+/));
  const tokensB = new Set(textB.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...tokensA].filter(token => tokensB.has(token)));
  const union = new Set([...tokensA, ...tokensB]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

export function levenshteinDistance(textA: string, textB: string): number {
  const matrix = Array(textB.length + 1).fill(null).map(() => Array(textA.length + 1).fill(null));
  
  for (let i = 0; i <= textA.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= textB.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= textB.length; j++) {
    for (let i = 1; i <= textA.length; i++) {
      const indicator = textA[i - 1] === textB[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[textB.length][textA.length];
}

export function normalizedLevenshteinSimilarity(textA: string, textB: string): number {
  const maxLength = Math.max(textA.length, textB.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(textA, textB);
  return 1 - (distance / maxLength);
}

// TF-IDF calculations for keyword similarity
export function calculateTF(text: string): Map<string, number> {
  const tokens = text.toLowerCase().split(/\s+/).filter(token => token.length > 0);
  const tf = new Map<string, number>();
  
  tokens.forEach(token => {
    tf.set(token, (tf.get(token) || 0) + 1);
  });
  
  // Normalize by document length
  tokens.forEach(token => {
    tf.set(token, tf.get(token)! / tokens.length);
  });
  
  return tf;
}

export function calculateIDF(documents: string[]): Map<string, number> {
  const idf = new Map<string, number>();
  const totalDocs = documents.length;
  
  // Get all unique terms
  const allTerms = new Set<string>();
  documents.forEach(doc => {
    const tokens = doc.toLowerCase().split(/\s+/).filter(token => token.length > 0);
    tokens.forEach(token => allTerms.add(token));
  });
  
  // Calculate IDF for each term
  allTerms.forEach(term => {
    const docsWithTerm = documents.filter(doc => 
      doc.toLowerCase().includes(term)
    ).length;
    
    idf.set(term, Math.log(totalDocs / (docsWithTerm + 1)));
  });
  
  return idf;
}

export function calculateTFIDF(text: string, idfMap: Map<string, number>): Map<string, number> {
  const tf = calculateTF(text);
  const tfidf = new Map<string, number>();
  
  tf.forEach((tfValue, term) => {
    const idfValue = idfMap.get(term) || 0;
    tfidf.set(term, tfValue * idfValue);
  });
  
  return tfidf;
}

export function tfidfSimilarity(textA: string, textB: string, idfMap: Map<string, number>): number {
  const tfidfA = calculateTFIDF(textA, idfMap);
  const tfidfB = calculateTFIDF(textB, idfMap);
  
  // Convert to vectors for cosine similarity
  const allTerms = new Set([...tfidfA.keys(), ...tfidfB.keys()]);
  const vectorA: number[] = [];
  const vectorB: number[] = [];
  
  allTerms.forEach(term => {
    vectorA.push(tfidfA.get(term) || 0);
    vectorB.push(tfidfB.get(term) || 0);
  });
  
  return cosineSimilarity(vectorA, vectorB);
}

// Semantic similarity using embeddings
export function semanticSimilarity(embeddingA: Embedding, embeddingB: Embedding): number {
  if (embeddingA.model !== embeddingB.model) {
    console.warn('Comparing embeddings from different models may not be meaningful');
  }
  
  return cosineSimilarity(embeddingA.vector, embeddingB.vector);
}

// Hybrid similarity combining multiple approaches
export function hybridSimilarity(
  chunkA: Chunk,
  chunkB: Chunk,
  keywordWeight: number = 0.3,
  semanticWeight: number = 0.7,
  idfMap?: Map<string, number>
): number {
  let keywordScore = 0;
  let semanticScore = 0;
  
  // Calculate keyword similarity
  if (idfMap) {
    keywordScore = tfidfSimilarity(chunkA.content, chunkB.content, idfMap);
  } else {
    keywordScore = jaccardSimilarity(chunkA.content, chunkB.content);
  }
  
  // Calculate semantic similarity if embeddings are available
  if (chunkA.embedding && chunkB.embedding) {
    semanticScore = semanticSimilarity(chunkA.embedding, chunkB.embedding);
  } else {
    // Fallback to text-based similarity
    semanticScore = normalizedLevenshteinSimilarity(chunkA.content, chunkB.content);
  }
  
  return (keywordWeight * keywordScore) + (semanticWeight * semanticScore);
}

// Search result ranking
export function rankSearchResults(
  results: SearchResult[],
  query: string,
  boostRecency: boolean = false
): SearchResult[] {
  return results
    .map(result => {
      let adjustedScore = result.score;
      
      // Boost score based on query term frequency in chunk
      const queryTerms = query.toLowerCase().split(/\s+/);
      const chunkText = result.chunk.content.toLowerCase();
      const termMatches = queryTerms.filter(term => chunkText.includes(term)).length;
      const termBoost = termMatches / queryTerms.length * 0.1;
      adjustedScore += termBoost;
      
      // Boost recent chunks if requested
      if (boostRecency && result.chunk.metadata.createdAt) {
        const ageInHours = (Date.now() - result.chunk.metadata.createdAt.getTime()) / (1000 * 60 * 60);
        const recencyBoost = Math.max(0, 1 - (ageInHours / 24)) * 0.05;
        adjustedScore += recencyBoost;
      }
      
      // Boost shorter chunks slightly (they tend to be more focused)
      const lengthPenalty = Math.min(0.05, result.chunk.content.length / 10000);
      adjustedScore -= lengthPenalty;
      
      return {
        ...result,
        score: Math.max(0, Math.min(1, adjustedScore))
      };
    })
    .sort((a, b) => b.score - a.score);
}

// Clustering utilities
export function findSimilarChunks(
  targetChunk: Chunk,
  allChunks: Chunk[],
  threshold: number = 0.7,
  maxResults: number = 10
): Chunk[] {
  const similarities = allChunks
    .filter(chunk => chunk.id !== targetChunk.id)
    .map(chunk => ({
      chunk,
      similarity: hybridSimilarity(targetChunk, chunk)
    }))
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);
  
  return similarities.map(item => item.chunk);
}

export function clusterChunks(
  chunks: Chunk[],
  similarityThreshold: number = 0.7
): Chunk[][] {
  const clusters: Chunk[][] = [];
  const processed = new Set<string>();
  
  chunks.forEach(chunk => {
    if (processed.has(chunk.id)) return;
    
    const cluster = [chunk];
    processed.add(chunk.id);
    
    // Find similar chunks for this cluster
    chunks.forEach(otherChunk => {
      if (processed.has(otherChunk.id)) return;
      
      const similarity = hybridSimilarity(chunk, otherChunk);
      if (similarity >= similarityThreshold) {
        cluster.push(otherChunk);
        processed.add(otherChunk.id);
      }
    });
    
    clusters.push(cluster);
  });
  
  return clusters.sort((a, b) => b.length - a.length);
}

// Utility functions for visualization
export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude === 0 ? vector : vector.map(val => val / magnitude);
}

export function calculateCentroid(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  
  const dimensions = vectors[0].length;
  const centroid = new Array(dimensions).fill(0);
  
  vectors.forEach(vector => {
    vector.forEach((val, i) => {
      centroid[i] += val;
    });
  });
  
  return centroid.map(val => val / vectors.length);
}
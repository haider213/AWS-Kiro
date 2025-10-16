// Search service for RAG Pipeline Educator
// Implements keyword, semantic, and hybrid search capabilities

import { 
  Chunk, 
  SearchResult, 
  SearchParameters, 
  TextHighlight,
  Embedding 
} from '../types';
import { 
  jaccardSimilarity, 
  calculateIDF, 
  tfidfSimilarity,
  semanticSimilarity,
  rankSearchResults 
} from '../utils/similarity';

export class SearchService {
  private idfMap: Map<string, number> | null = null;

  // Initialize IDF map for keyword search optimization
  public initializeIDF(chunks: Chunk[]): void {
    const documents = chunks.map(chunk => chunk.content);
    this.idfMap = calculateIDF(documents);
  }

  // Keyword-based search using TF-IDF and text matching
  public keywordSearch(
    query: string, 
    chunks: Chunk[], 
    parameters: SearchParameters
  ): SearchResult[] {
    const queryLower = query.toLowerCase().trim();
    if (!queryLower) return [];

    const results: SearchResult[] = [];
    const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 0);

    chunks.forEach(chunk => {
      const chunkText = chunk.content.toLowerCase();
      let score = 0;
      const highlights: TextHighlight[] = [];

      // Calculate TF-IDF similarity if available
      if (this.idfMap) {
        score = tfidfSimilarity(query, chunk.content, this.idfMap);
      } else {
        // Fallback to Jaccard similarity
        score = jaccardSimilarity(query, chunk.content);
      }

      // Boost score for exact phrase matches
      if (chunkText.includes(queryLower)) {
        score += 0.3;
        
        // Find exact matches for highlighting
        const startIndex = chunkText.indexOf(queryLower);
        if (startIndex !== -1) {
          highlights.push({
            startIndex,
            endIndex: startIndex + queryLower.length,
            text: chunk.content.substring(startIndex, startIndex + queryLower.length),
            type: 'exact'
          });
        }
      }

      // Find individual term matches
      queryTerms.forEach(term => {
        const termRegex = new RegExp(`\\b${term}\\b`, 'gi');
        let match;
        while ((match = termRegex.exec(chunk.content)) !== null) {
          // Avoid duplicate highlights
          const overlaps = highlights.some(h => 
            match!.index >= h.startIndex && match!.index < h.endIndex
          );
          
          if (!overlaps) {
            highlights.push({
              startIndex: match.index,
              endIndex: match.index + term.length,
              text: match[0],
              type: 'partial'
            });
          }
          
          // Small boost for each term match
          score += 0.1;
        }
      });

      // Only include results above threshold
      if (score >= parameters.similarityThreshold) {
        results.push({
          chunk,
          score: Math.min(1, score), // Cap at 1.0
          matchType: 'keyword',
          highlights: parameters.enableHighlighting ? highlights : []
        });
      }
    });

    return rankSearchResults(results, query)
      .slice(0, parameters.resultLimit);
  }

  // Semantic search using embedding similarity
  public semanticSearch(
    _query: string,
    chunks: Chunk[],
    queryEmbedding: Embedding,
    parameters: SearchParameters
  ): SearchResult[] {
    if (!queryEmbedding) return [];

    const results: SearchResult[] = [];

    chunks.forEach(chunk => {
      if (!chunk.embedding) return;

      const similarity = semanticSimilarity(queryEmbedding, chunk.embedding);
      
      if (similarity >= parameters.similarityThreshold) {
        // For semantic search, highlights are based on conceptual similarity
        const highlights: TextHighlight[] = [];
        
        if (parameters.enableHighlighting) {
          // Simple heuristic: highlight the first sentence as semantically relevant
          const sentences = chunk.content.split(/[.!?]+/);
          if (sentences.length > 0 && sentences[0].trim()) {
            const firstSentence = sentences[0].trim();
            highlights.push({
              startIndex: 0,
              endIndex: firstSentence.length,
              text: firstSentence,
              type: 'semantic'
            });
          }
        }

        results.push({
          chunk,
          score: similarity,
          matchType: 'semantic',
          highlights
        });
      }
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, parameters.resultLimit);
  }

  // Hybrid search combining keyword and semantic approaches
  public hybridSearch(
    query: string,
    chunks: Chunk[],
    queryEmbedding: Embedding | null,
    parameters: SearchParameters
  ): SearchResult[] {
    const keywordResults = this.keywordSearch(query, chunks, {
      ...parameters,
      resultLimit: Math.ceil(parameters.resultLimit * 1.5) // Get more results for merging
    });

    const semanticResults = queryEmbedding 
      ? this.semanticSearch(query, chunks, queryEmbedding, {
          ...parameters,
          resultLimit: Math.ceil(parameters.resultLimit * 1.5)
        })
      : [];

    // Merge results with weighted scoring
    const mergedResults = new Map<string, SearchResult>();
    const keywordWeight = parameters.keywordWeight || 0.3;
    const semanticWeight = parameters.semanticWeight || 0.7;

    // Process keyword results
    keywordResults.forEach(result => {
      const weightedScore = result.score * keywordWeight;
      mergedResults.set(result.chunk.id, {
        ...result,
        score: weightedScore,
        matchType: 'hybrid'
      });
    });

    // Process semantic results and merge
    semanticResults.forEach(result => {
      const weightedScore = result.score * semanticWeight;
      const existing = mergedResults.get(result.chunk.id);
      
      if (existing) {
        // Combine scores and highlights
        existing.score += weightedScore;
        existing.highlights = [
          ...existing.highlights,
          ...result.highlights.filter(h => 
            !existing.highlights.some(eh => 
              Math.abs(eh.startIndex - h.startIndex) < 10
            )
          )
        ];
      } else {
        mergedResults.set(result.chunk.id, {
          ...result,
          score: weightedScore,
          matchType: 'hybrid'
        });
      }
    });

    // Convert to array and sort
    const finalResults = Array.from(mergedResults.values())
      .filter(result => result.score >= parameters.similarityThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, parameters.resultLimit);

    return rankSearchResults(finalResults, query);
  }

  // Main search method that delegates to appropriate search type
  public search(
    query: string,
    chunks: Chunk[],
    queryEmbedding: Embedding | null,
    parameters: SearchParameters
  ): SearchResult[] {
    if (!query.trim()) return [];

    // Initialize IDF if not already done
    if (!this.idfMap && chunks.length > 0) {
      this.initializeIDF(chunks);
    }

    switch (parameters.mode) {
      case 'keyword':
        return this.keywordSearch(query, chunks, parameters);
      
      case 'semantic':
        return queryEmbedding 
          ? this.semanticSearch(query, chunks, queryEmbedding, parameters)
          : this.keywordSearch(query, chunks, parameters); // Fallback
      
      case 'hybrid':
        return this.hybridSearch(query, chunks, queryEmbedding, parameters);
      
      default:
        return this.keywordSearch(query, chunks, parameters);
    }
  }

  // Get search suggestions based on chunk content
  public getSearchSuggestions(chunks: Chunk[], limit: number = 5): string[] {
    if (chunks.length === 0) return [];

    const termFrequency = new Map<string, number>();
    
    chunks.forEach(chunk => {
      const words = chunk.content
        .toLowerCase()
        .split(/\s+/)
        .filter(word => 
          word.length > 3 && 
          !/^\d+$/.test(word) && // Not just numbers
          !/^[^\w]+$/.test(word) // Not just punctuation
        );
      
      words.forEach(word => {
        termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
      });
    });

    return Array.from(termFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([term, _frequency]) => term);
  }

  // Clear cached data
  public clearCache(): void {
    this.idfMap = null;
  }
}

// Export singleton instance
export const searchService = new SearchService();
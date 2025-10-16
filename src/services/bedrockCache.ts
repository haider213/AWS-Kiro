/**
 * Bedrock API Cache Service
 * Implements efficient caching strategies for AWS Bedrock API responses
 */

import { memoryOptimizer, MemoryCache } from './memoryOptimizer';

export interface CacheConfig {
  embeddingTTL: number;
  generationTTL: number;
  maxCacheSize: number;
  enablePersistence: boolean;
  enableCompression: boolean;
  enableDeduplication: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hash: string;
  accessCount: number;
  size: number;
  compressed?: boolean;
}

export interface CacheStats {
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  totalSize: number;
  entryCount: number;
  compressionRatio: number;
}

export class BedrockCache {
  private static instance: BedrockCache;
  private config: CacheConfig;
  private embeddingCache: MemoryCache<any>;
  private generationCache: MemoryCache<any>;
  private similarityCache: MemoryCache<number>;
  private requestHashes: Map<string, string> = new Map();
  private stats: CacheStats;
  private persistenceEnabled: boolean = false;

  private constructor() {
    this.config = {
      embeddingTTL: 60 * 60 * 1000, // 1 hour
      generationTTL: 30 * 60 * 1000, // 30 minutes
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      enablePersistence: true,
      enableCompression: true,
      enableDeduplication: true
    };

    this.embeddingCache = memoryOptimizer.getCache<any>('bedrock-embeddings');
    this.generationCache = memoryOptimizer.getCache<any>('bedrock-generation');
    this.similarityCache = memoryOptimizer.getCache<number>('bedrock-similarity');

    this.stats = {
      hitRate: 0,
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalSize: 0,
      entryCount: 0,
      compressionRatio: 1
    };

    this.initializePersistence();
  }

  public static getInstance(): BedrockCache {
    if (!BedrockCache.instance) {
      BedrockCache.instance = new BedrockCache();
    }
    return BedrockCache.instance;
  }

  /**
   * Configure cache settings
   */
  public configure(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Cache embedding request/response
   */
  public async cacheEmbedding(
    texts: string[],
    model: string,
    embeddings: any[]
  ): Promise<void> {
    const key = this.generateEmbeddingKey(texts, model);
    const hash = await this.generateHash(key);
    
    // Check for deduplication
    if (this.config.enableDeduplication && this.requestHashes.has(hash)) {
      return; // Already cached
    }

    const data = {
      texts,
      model,
      embeddings,
      timestamp: Date.now()
    };

    const compressed = this.config.enableCompression 
      ? await this.compressData(data)
      : data;

    this.embeddingCache.set(key, compressed);
    this.requestHashes.set(hash, key);

    // Persist if enabled
    if (this.persistenceEnabled) {
      await this.persistToStorage('embedding', key, compressed);
    }

    this.updateStats('cache');
  }

  /**
   * Get cached embedding
   */
  public async getCachedEmbedding(
    texts: string[],
    model: string
  ): Promise<any[] | null> {
    this.stats.totalRequests++;
    
    const key = this.generateEmbeddingKey(texts, model);
    let cached = this.embeddingCache.get(key);

    // Try to load from persistence if not in memory
    if (!cached && this.persistenceEnabled) {
      cached = await this.loadFromStorage('embedding', key);
      if (cached) {
        this.embeddingCache.set(key, cached);
      }
    }

    if (cached) {
      // Check TTL
      if (Date.now() - cached.timestamp > this.config.embeddingTTL) {
        this.embeddingCache.delete(key);
        this.updateStats('miss');
        return null;
      }

      const decompressed = this.config.enableCompression 
        ? await this.decompressData(cached)
        : cached;

      this.updateStats('hit');
      return decompressed.embeddings;
    }

    this.updateStats('miss');
    return null;
  }

  /**
   * Cache generation request/response
   */
  public async cacheGeneration(
    prompt: string,
    model: string,
    parameters: any,
    response: any
  ): Promise<void> {
    const key = this.generateGenerationKey(prompt, model, parameters);
    const hash = await this.generateHash(key);
    
    // Check for deduplication
    if (this.config.enableDeduplication && this.requestHashes.has(hash)) {
      return; // Already cached
    }

    const data = {
      prompt,
      model,
      parameters,
      response,
      timestamp: Date.now()
    };

    const compressed = this.config.enableCompression 
      ? await this.compressData(data)
      : data;

    this.generationCache.set(key, compressed);
    this.requestHashes.set(hash, key);

    // Persist if enabled
    if (this.persistenceEnabled) {
      await this.persistToStorage('generation', key, compressed);
    }

    this.updateStats('cache');
  }

  /**
   * Get cached generation response
   */
  public async getCachedGeneration(
    prompt: string,
    model: string,
    parameters: any
  ): Promise<any | null> {
    this.stats.totalRequests++;
    
    const key = this.generateGenerationKey(prompt, model, parameters);
    let cached = this.generationCache.get(key);

    // Try to load from persistence if not in memory
    if (!cached && this.persistenceEnabled) {
      cached = await this.loadFromStorage('generation', key);
      if (cached) {
        this.generationCache.set(key, cached);
      }
    }

    if (cached) {
      // Check TTL
      if (Date.now() - cached.timestamp > this.config.generationTTL) {
        this.generationCache.delete(key);
        this.updateStats('miss');
        return null;
      }

      const decompressed = this.config.enableCompression 
        ? await this.decompressData(cached)
        : cached;

      this.updateStats('hit');
      return decompressed.response;
    }

    this.updateStats('miss');
    return null;
  }

  /**
   * Cache similarity calculation
   */
  public async cacheSimilarity(
    embedding1: number[],
    embedding2: number[],
    similarity: number
  ): Promise<void> {
    const key = this.generateSimilarityKey(embedding1, embedding2);
    this.similarityCache.set(key, similarity);
    this.updateStats('cache');
  }

  /**
   * Get cached similarity
   */
  public getCachedSimilarity(
    embedding1: number[],
    embedding2: number[]
  ): number | null {
    this.stats.totalRequests++;
    
    const key = this.generateSimilarityKey(embedding1, embedding2);
    const cached = this.similarityCache.get(key);

    if (cached !== undefined) {
      this.updateStats('hit');
      return cached;
    }

    this.updateStats('miss');
    return null;
  }

  /**
   * Batch cache embeddings for efficiency
   */
  public async batchCacheEmbeddings(
    requests: Array<{ texts: string[]; model: string; embeddings: any[] }>
  ): Promise<void> {
    const promises = requests.map(req => 
      this.cacheEmbedding(req.texts, req.model, req.embeddings)
    );
    
    await Promise.all(promises);
  }

  /**
   * Preload frequently used embeddings
   */
  public async preloadEmbeddings(
    commonTexts: string[],
    models: string[]
  ): Promise<void> {
    const preloadPromises: Promise<void>[] = [];

    for (const model of models) {
      for (let i = 0; i < commonTexts.length; i += 10) {
        const batch = commonTexts.slice(i, i + 10);
        const key = this.generateEmbeddingKey(batch, model);
        
        // Check if already cached
        if (!this.embeddingCache.has(key)) {
          // Generate mock embeddings for preloading
          const mockEmbeddings = batch.map(() => 
            Array.from({ length: 1536 }, () => Math.random())
          );
          
          preloadPromises.push(
            this.cacheEmbedding(batch, model, mockEmbeddings)
          );
        }
      }
    }

    await Promise.all(preloadPromises);
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.cacheHits / this.stats.totalRequests) * 100 
      : 0;
    
    this.stats.entryCount = 
      this.embeddingCache.size() + 
      this.generationCache.size() + 
      this.similarityCache.size();

    return { ...this.stats };
  }

  /**
   * Clear all caches
   */
  public clearAll(): void {
    this.embeddingCache.clear();
    this.generationCache.clear();
    this.similarityCache.clear();
    this.requestHashes.clear();
    
    // Clear persistence
    if (this.persistenceEnabled) {
      this.clearPersistentStorage();
    }

    // Reset stats
    this.stats = {
      hitRate: 0,
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalSize: 0,
      entryCount: 0,
      compressionRatio: 1
    };
  }

  /**
   * Optimize cache by removing least recently used entries
   */
  public optimizeCache(): void {
    // This would require implementing LRU logic in the MemoryCache
    // For now, we'll trigger the memory optimizer's cleanup
    if (memoryOptimizer.isMemoryPressureHigh()) {
      memoryOptimizer.performAggressiveCleanup();
    }
  }

  // Private methods

  private generateEmbeddingKey(texts: string[], model: string): string {
    const textHash = this.hashArray(texts);
    return `embedding:${model}:${textHash}`;
  }

  private generateGenerationKey(prompt: string, model: string, parameters: any): string {
    const paramHash = this.hashObject(parameters);
    const promptHash = this.hashString(prompt);
    return `generation:${model}:${promptHash}:${paramHash}`;
  }

  private generateSimilarityKey(embedding1: number[], embedding2: number[]): string {
    const hash1 = this.hashArray(embedding1);
    const hash2 = this.hashArray(embedding2);
    // Ensure consistent ordering for symmetric similarity
    return hash1 < hash2 ? `similarity:${hash1}:${hash2}` : `similarity:${hash2}:${hash1}`;
  }

  private async generateHash(input: string): Promise<string> {
    if (crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for environments without crypto.subtle
      return this.hashString(input);
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private hashArray(arr: any[]): string {
    return this.hashString(JSON.stringify(arr));
  }

  private hashObject(obj: any): string {
    return this.hashString(JSON.stringify(obj, Object.keys(obj).sort()));
  }

  private async compressData(data: any): Promise<any> {
    if (!this.config.enableCompression) {
      return data;
    }

    try {
      // Simple compression using JSON stringify + compression
      const jsonString = JSON.stringify(data);
      
      // Use CompressionStream if available (modern browsers)
      if ('CompressionStream' in window) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(jsonString));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            chunks.push(value);
          }
        }
        
        // Combine chunks
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const compressed = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return {
          ...data,
          _compressed: true,
          _compressedData: Array.from(compressed),
          _originalSize: jsonString.length
        };
      }
      
      // Fallback: no compression
      return data;
    } catch (error) {
      console.warn('Compression failed, storing uncompressed:', error);
      return data;
    }
  }

  private async decompressData(data: any): Promise<any> {
    if (!data._compressed) {
      return data;
    }

    try {
      // Use DecompressionStream if available
      if ('DecompressionStream' in window) {
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new Uint8Array(data._compressedData));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            chunks.push(value);
          }
        }
        
        // Combine chunks and decode
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const decompressed = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        const jsonString = new TextDecoder().decode(decompressed);
        return JSON.parse(jsonString);
      }
      
      // Fallback: return as-is
      return data;
    } catch (error) {
      console.warn('Decompression failed:', error);
      return data;
    }
  }

  private async initializePersistence(): Promise<void> {
    if (!this.config.enablePersistence) {
      return;
    }

    try {
      // Check if IndexedDB is available
      if ('indexedDB' in window) {
        this.persistenceEnabled = true;
        console.log('Bedrock cache persistence enabled');
      }
    } catch (error) {
      console.warn('Failed to initialize cache persistence:', error);
      this.persistenceEnabled = false;
    }
  }

  private async persistToStorage(type: string, key: string, data: any): Promise<void> {
    if (!this.persistenceEnabled) return;

    try {
      // Simple localStorage fallback for now
      // In production, would use IndexedDB for better performance
      const storageKey = `bedrock-cache:${type}:${key}`;
      localStorage.setItem(storageKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to persist cache entry:', error);
    }
  }

  private async loadFromStorage(type: string, key: string): Promise<any | null> {
    if (!this.persistenceEnabled) return null;

    try {
      const storageKey = `bedrock-cache:${type}:${key}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Check if still valid based on TTL
        const ttl = type === 'embedding' ? this.config.embeddingTTL : this.config.generationTTL;
        if (Date.now() - parsed.timestamp < ttl) {
          return parsed.data;
        } else {
          // Remove expired entry
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.warn('Failed to load cache entry from storage:', error);
    }

    return null;
  }

  private clearPersistentStorage(): void {
    if (!this.persistenceEnabled) return;

    try {
      // Clear all bedrock cache entries from localStorage
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('bedrock-cache:')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear persistent storage:', error);
    }
  }

  private updateStats(type: 'hit' | 'miss' | 'cache'): void {
    if (type === 'hit') {
      this.stats.cacheHits++;
    } else if (type === 'miss') {
      this.stats.cacheMisses++;
    }
    // 'cache' type doesn't affect hit/miss stats
  }
}

// Export singleton instance
export const bedrockCache = BedrockCache.getInstance();
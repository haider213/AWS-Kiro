import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  accessCount: number;
  size: number;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly maxCacheSize = 100 * 1024 * 1024; // 100MB
  private readonly maxEntries = 10000; // Maximum number of cache entries
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  private compressionEnabled = true;
  private performanceMetrics = {
    averageSetTime: 0,
    averageGetTime: 0,
    totalSetTime: 0,
    totalGetTime: 0,
    setOperations: 0,
    getOperations: 0
  };

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    const startTime = Date.now();
    
    // Compress data if enabled and beneficial
    const processedData = this.compressionEnabled ? this.compressIfBeneficial(data) : data;
    const size = this.estimateSize(processedData);
    
    // Check cache limits
    if (this.cache.size >= this.maxEntries || this.stats.totalSize + size > this.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      data: processedData,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      size
    });

    this.updateStats();
    this.updatePerformanceMetrics('set', Date.now() - startTime);
  }

  get(key: string): any | null {
    const startTime = Date.now();
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.cacheMisses++;
      this.updateHitRate();
      this.updatePerformanceMetrics('get', Date.now() - startTime);
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.cacheMisses++;
      this.updateStats();
      this.updatePerformanceMetrics('get', Date.now() - startTime);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.timestamp = now; // Update for LRU

    this.stats.cacheHits++;
    this.updateHitRate();
    
    // Decompress data if needed
    const data = this.decompressIfNeeded(entry.data);
    
    this.updatePerformanceMetrics('get', Date.now() - startTime);
    return data;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      totalRequests: this.stats.totalRequests,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses
    };
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    }
    
    toDelete.forEach(key => this.cache.delete(key));
    
    if (toDelete.length > 0) {
      this.updateStats();
    }
  }

  // Evict least recently used entries to make space
  private evictLeastRecentlyUsed(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by timestamp (oldest first) and access count (least accessed first)
    entries.sort((a, b) => {
      const timestampDiff = a[1].timestamp - b[1].timestamp;
      if (timestampDiff !== 0) return timestampDiff;
      return a[1].accessCount - b[1].accessCount;
    });

    // Remove oldest 10% of entries
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }

    console.log(`Evicted ${toRemove} cache entries to free up space`);
    this.updateStats();
  }

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate: 2 bytes per character
    } catch {
      return 1024; // Default 1KB if can't stringify
    }
  }

  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.cacheHits / this.stats.totalRequests) * 100 
      : 0;
  }

  private compressIfBeneficial(data: any): any {
    try {
      const jsonString = JSON.stringify(data);
      
      // Only compress if data is large enough to benefit
      if (jsonString.length < 1000) {
        return data;
      }

      // Simple compression simulation (in real implementation, use actual compression)
      const compressed = {
        _compressed: true,
        _originalSize: jsonString.length,
        _data: jsonString // In real implementation, this would be compressed
      };

      return compressed;
    } catch (error) {
      console.warn('Compression failed:', error);
      return data;
    }
  }

  private decompressIfNeeded(data: any): any {
    if (data && data._compressed) {
      try {
        // In real implementation, decompress the data
        return JSON.parse(data._data);
      } catch (error) {
        console.warn('Decompression failed:', error);
        return data;
      }
    }
    return data;
  }

  private updatePerformanceMetrics(operation: 'set' | 'get', duration: number): void {
    if (operation === 'set') {
      this.performanceMetrics.setOperations++;
      this.performanceMetrics.totalSetTime += duration;
      this.performanceMetrics.averageSetTime = 
        this.performanceMetrics.totalSetTime / this.performanceMetrics.setOperations;
    } else {
      this.performanceMetrics.getOperations++;
      this.performanceMetrics.totalGetTime += duration;
      this.performanceMetrics.averageGetTime = 
        this.performanceMetrics.totalGetTime / this.performanceMetrics.getOperations;
    }
  }

  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }



  // Batch operations for better performance
  setBatch(entries: Array<{ key: string; data: any; ttl?: number }>): void {
    const startTime = Date.now();
    
    for (const entry of entries) {
      this.set(entry.key, entry.data, entry.ttl);
    }
    
    console.log(`Batch set ${entries.length} entries in ${Date.now() - startTime}ms`);
  }

  getBatch(keys: string[]): Map<string, any> {
    const startTime = Date.now();
    const results = new Map<string, any>();
    
    for (const key of keys) {
      const value = this.get(key);
      if (value !== null) {
        results.set(key, value);
      }
    }
    
    console.log(`Batch get ${keys.length} keys in ${Date.now() - startTime}ms`);
    return results;
  }
}

const cacheService = new CacheService();

// Run cleanup every 10 minutes
setInterval(() => {
  cacheService.cleanup();
}, 10 * 60 * 1000);

export { cacheService };

// Middleware for caching responses
export function cacheMiddleware(ttl: number = 5 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Create cache key from method, URL, and body
    const cacheKey = `${req.method}:${req.originalUrl}:${JSON.stringify(req.body)}`;
    
    // Try to get cached response
    const cachedResponse = cacheService.get(cacheKey);
    if (cachedResponse) {
      console.log(`Cache hit for key: ${cacheKey}`);
      return res.json(cachedResponse);
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache the response
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`Caching response for key: ${cacheKey}`);
        cacheService.set(cacheKey, data, ttl);
      }
      return originalJson(data);
    };

    next();
  };
}

// Middleware to add cache headers
export function cacheHeaders(maxAge: number = 300) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', `public, max-age=${maxAge}`);
    next();
  };
}

// Endpoint to get cache statistics
export function getCacheStats(_req: Request, res: Response) {
  const stats = cacheService.getStats();
  res.json({
    success: true,
    stats
  });
}

// Endpoint to clear cache
export function clearCache(_req: Request, res: Response) {
  cacheService.clear();
  res.json({
    success: true,
    message: 'Cache cleared successfully'
  });
}
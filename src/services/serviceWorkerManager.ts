/**
 * Service Worker Manager
 * Handles registration, updates, and communication with the service worker
 */

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  isOffline: boolean;
  cacheSize: number;
  lastUpdate: Date | null;
}

export interface CacheStats {
  totalEntries: number;
  staticCacheSize: number;
  dynamicCacheSize: number;
  apiCacheSize: number;
}

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private statusCallbacks: Array<(status: ServiceWorkerStatus) => void> = [];
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyStatusChange();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatusChange();
    });
  }

  public static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  /**
   * Register the service worker
   */
  public async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      console.log('Registering service worker...');
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully');

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
        this.handleUpdate();
      });

      // Check if there's an active service worker
      if (this.registration.active) {
        console.log('Service Worker is active');
      }

      // Listen for controller changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
        this.notifyStatusChange();
      });

      this.notifyStatusChange();
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Unregister the service worker
   */
  public async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      this.registration = null;
      this.notifyStatusChange();
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Update the service worker
   */
  public async update(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      await this.registration.update();
      return true;
    } catch (error) {
      console.error('Service Worker update failed:', error);
      return false;
    }
  }

  /**
   * Skip waiting for new service worker
   */
  public async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      return;
    }

    // Send message to service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * Clear all caches
   */
  public async clearCache(): Promise<boolean> {
    if (!navigator.serviceWorker.controller) {
      return false;
    }

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  public async getCacheStats(): Promise<CacheStats | null> {
    if (!navigator.serviceWorker.controller) {
      return null;
    }

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        // Add timeout to prevent hanging
        const timeout = setTimeout(() => {
          console.warn('Service worker cache stats request timed out');
          resolve({
            totalEntries: 0,
            staticCacheSize: 0,
            dynamicCacheSize: 0,
            apiCacheSize: 0
          });
        }, 2000); // 2 second timeout

        messageChannel.port1.onmessage = (event) => {
          clearTimeout(timeout);
          resolve({
            totalEntries: event.data.size || 0,
            staticCacheSize: 0, // Would need separate tracking
            dynamicCacheSize: 0,
            apiCacheSize: 0
          });
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'CACHE_SIZE' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }

  /**
   * Preload content for offline usage
   */
  public async preloadContent(urls: string[]): Promise<boolean> {
    if (!navigator.serviceWorker.controller) {
      return false;
    }

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'PRELOAD_CONTENT', payload: { urls } },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('Failed to preload content:', error);
      return false;
    }
  }

  /**
   * Get current service worker status
   */
  public async getStatus(): Promise<ServiceWorkerStatus> {
    const cacheStats = await this.getCacheStats();
    
    return {
      isSupported: 'serviceWorker' in navigator,
      isRegistered: this.registration !== null,
      isActive: this.registration?.active !== null,
      isOffline: !this.isOnline,
      cacheSize: cacheStats?.totalEntries || 0,
      lastUpdate: this.registration?.active ? new Date() : null
    };
  }

  /**
   * Subscribe to status changes
   */
  public onStatusChange(callback: (status: ServiceWorkerStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Check if the app is running offline
   */
  public isOffline(): boolean {
    return !this.isOnline;
  }

  /**
   * Check if service worker is active
   */
  public isActive(): boolean {
    return this.registration?.active !== null;
  }

  // Private methods

  private handleUpdate(): void {
    if (!this.registration) return;

    const newWorker = this.registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker is available
        console.log('New service worker available');
        this.notifyUpdate();
      }
    });
  }

  private notifyUpdate(): void {
    // Dispatch custom event for update notification
    window.dispatchEvent(new CustomEvent('sw-update-available', {
      detail: { registration: this.registration }
    }));
  }

  private async notifyStatusChange(): Promise<void> {
    const status = await this.getStatus();
    this.statusCallbacks.forEach(callback => callback(status));
  }
}

// Create and export singleton instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance();

// Auto-register service worker when module loads - DISABLED FOR DEBUGGING
// if (typeof window !== 'undefined') {
//   serviceWorkerManager.register().catch(console.error);
// }
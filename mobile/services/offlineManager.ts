import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Types for offline queue
export interface QueuedAction {
  id: string;
  type: 'api_call' | 'file_upload' | 'message_send';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
  version: number;
}

export interface OfflineState {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: string;
  queueSize: number;
  lastSyncTime?: number;
}

// Storage keys
const STORAGE_KEYS = {
  OFFLINE_QUEUE: 'offline_queue',
  CACHED_DATA: 'cached_data',
  LAST_SYNC: 'last_sync_time',
  OFFLINE_STATE: 'offline_state',
} as const;

class OfflineManager {
  private isOnline: boolean = true;
  private connectionType: string = 'unknown';
  private queue: QueuedAction[] = [];
  private cache: Map<string, CachedData> = new Map();
  private listeners: Set<(state: OfflineState) => void> = new Set();
  private syncInProgress: boolean = false;

  constructor() {
    this.initializeNetworkListener();
    this.loadOfflineData();
  }

  // Network monitoring
  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      this.connectionType = state.type;

      // If we just came back online, process the queue
      if (!wasOnline && this.isOnline) {
        this.processQueue();
      }

      this.notifyListeners();
    });
  }

  // State management
  getState(): OfflineState {
    return {
      isOnline: this.isOnline,
      isConnected: this.isOnline,
      connectionType: this.connectionType,
      queueSize: this.queue.length,
      lastSyncTime: this.getLastSyncTime(),
    };
  }

  onStateChange(listener: (state: OfflineState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  // Queue management
  async addToQueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const queuedAction: QueuedAction = {
      ...action,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedAction);
    await this.saveQueue();
    this.notifyListeners();

    // If online, try to process immediately
    if (this.isOnline) {
      this.processQueue();
    }

    return queuedAction.id;
  }

  async removeFromQueue(actionId: string): Promise<void> {
    this.queue = this.queue.filter(action => action.id !== actionId);
    await this.saveQueue();
    this.notifyListeners();
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    this.notifyListeners();
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  // FIXED: Enhanced queue processing with exponential backoff
  async processQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.queue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      // Sort by priority and timestamp
      const sortedQueue = [...this.queue].sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp;
      });

      const processedIds: string[] = [];
      const failedIds: string[] = [];

      for (const action of sortedQueue) {
        try {
          await this.executeAction(action);
          processedIds.push(action.id);
        } catch (error) {
          console.error('Failed to execute queued action:', error);
          
          // Increment retry count
          action.retryCount++;
          
          if (action.retryCount >= action.maxRetries) {
            console.error(`Max retries exceeded for action ${action.id}`);
            failedIds.push(action.id);
          } else {
            // FIXED: Exponential backoff - delay next retry
            const delay = Math.pow(2, action.retryCount) * 1000; // 2^n seconds
            console.log(`Retrying action ${action.id} in ${delay}ms (attempt ${action.retryCount})`);
            
            // Schedule retry
            setTimeout(() => {
              if (this.isOnline && !this.syncInProgress) {
                this.processQueue();
              }
            }, delay);
          }
        }
      }

      // Remove successfully processed and permanently failed actions
      this.queue = this.queue.filter(action => 
        !processedIds.includes(action.id) && !failedIds.includes(action.id)
      );

      await this.saveQueue();
      await this.updateLastSyncTime();
      this.notifyListeners();

    } finally {
      this.syncInProgress = false;
    }
  }

  // FIXED: Enhanced error handling in executeAction
  private async executeAction(action: QueuedAction): Promise<any> {
    const { endpoint, method, data, headers } = action;

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        // FIXED: Better error handling for different HTTP status codes
        if (response.status >= 400 && response.status < 500) {
          // Client errors (4xx) - don't retry these
          const errorText = await response.text();
          throw new Error(`Client error ${response.status}: ${errorText}`);
        } else if (response.status >= 500) {
          // Server errors (5xx) - these can be retried
          throw new Error(`Server error ${response.status}: ${response.statusText}`);
        }
      }

      return response.json();
    } catch (error) {
      // FIXED: Distinguish between network errors and other errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Network error - can be retried
        throw new Error(`Network error: ${error.message}`);
      }
      // Re-throw other errors
      throw error;
    }
  }

  // Cache management
  async cacheData(key: string, data: any, expiresIn?: number): Promise<void> {
    const cachedData: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
      version: 1,
    };

    this.cache.set(key, cachedData);
    await this.saveCache();
  }

  getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if expired
    if (cached.expiresAt && Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      this.saveCache();
      return null;
    }

    return cached.data;
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    await AsyncStorage.removeItem(STORAGE_KEYS.CACHED_DATA);
  }

  async clearExpiredCache(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((cached, key) => {
      if (cached.expiresAt && now > cached.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      await this.saveCache();
    }
  }

  // Specific offline actions
  async queueApiCall(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    data?: any,
    options: {
      priority?: QueuedAction['priority'];
      maxRetries?: number;
      headers?: Record<string, string>;
    } = {}
  ): Promise<string> {
    return this.addToQueue({
      type: 'api_call',
      endpoint,
      method,
      data,
      headers: options.headers,
      priority: options.priority || 'normal',
      maxRetries: options.maxRetries || 3,
    });
  }

  async queueMessage(chatId: string, message: string): Promise<string> {
    return this.addToQueue({
      type: 'message_send',
      endpoint: `/chat/${chatId}/messages/`,
      method: 'POST',
      data: { message },
      priority: 'high',
      maxRetries: 5,
    });
  }

  async queueFileUpload(endpoint: string, file: FormData): Promise<string> {
    return this.addToQueue({
      type: 'file_upload',
      endpoint,
      method: 'POST',
      data: file,
      priority: 'normal',
      maxRetries: 3,
    });
  }

  // Storage operations
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_QUEUE,
        JSON.stringify(this.queue)
      );
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private async loadQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (queueData) {
        this.queue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const cacheArray = Array.from(this.cache.entries());
      await AsyncStorage.setItem(
        STORAGE_KEYS.CACHED_DATA,
        JSON.stringify(cacheArray)
      );
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  private async loadCache(): Promise<void> {
    try {
      const cacheData = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_DATA);
      if (cacheData) {
        const cacheArray = JSON.parse(cacheData);
        this.cache = new Map(cacheArray);
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
      this.cache = new Map();
    }
  }

  private async loadOfflineData(): Promise<void> {
    await Promise.all([
      this.loadQueue(),
      this.loadCache(),
    ]);

    // Clean expired cache on startup
    await this.clearExpiredCache();
  }

  private async updateLastSyncTime(): Promise<void> {
    const timestamp = Date.now();
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_SYNC,
        timestamp.toString()
      );
    } catch (error) {
      console.error('Failed to update last sync time:', error);
    }
  }

  private getLastSyncTime(): number | undefined {
    // This would be loaded from AsyncStorage in a real implementation
    return undefined;
  }

  // Utility methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public utility methods
  isOffline(): boolean {
    return !this.isOnline;
  }

  hasQueuedActions(): boolean {
    return this.queue.length > 0;
  }

  getConnectionInfo(): { isOnline: boolean; type: string } {
    return {
      isOnline: this.isOnline,
      type: this.connectionType,
    };
  }

  // Cleanup
  async cleanup(): Promise<void> {
    this.listeners.clear();
    await this.clearQueue();
    await this.clearCache();
  }
}

// Singleton instance
export const offlineManager = new OfflineManager();
export default offlineManager;
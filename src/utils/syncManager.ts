export type SyncEvent = 'file-updated' | 'file-uploaded' | 'file-deleted';

export interface SyncBroadcastMessage {
  event: SyncEvent;
  timestamp: number;
  sourceId: string;
  data?: any;
}

type SyncCallback = (message: SyncBroadcastMessage) => void;
type SyncStatusCallback = (isSyncing: boolean) => void;

class SyncManager {
  private channel: BroadcastChannel | null = null;
  private readonly sourceId: string;
  private listeners: Set<SyncCallback> = new Set();
  private statusListeners: Set<SyncStatusCallback> = new Set();
  private isCurrentlySyncing: boolean = false;

  constructor() {
    this.sourceId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('teacher_resource_hub_sync_channel');
        this.channel.onmessage = (event: MessageEvent<SyncBroadcastMessage>) => {
          if (event.data && event.data.sourceId !== this.sourceId) {
            this.listeners.forEach((callback) => {
              try {
                callback(event.data);
              } catch (err) {
                console.error('[syncManager] Listener error:', err);
              }
            });
          }
        };
      } catch (e) {
        console.warn('[syncManager] BroadcastChannel could not be created:', e);
      }
    }

    // Storage event fallback for cross-tab notifications
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'trh_sync_event' && e.newValue) {
          try {
            const parsed: SyncBroadcastMessage = JSON.parse(e.newValue);
            if (parsed && parsed.sourceId !== this.sourceId) {
              this.listeners.forEach((callback) => callback(parsed));
            }
          } catch {
            // Ignore parse errors
          }
        }
      });
    }
  }

  /**
   * Emit an event (default 'file-updated') across all open browser tabs and windows
   */
  public emit(event: SyncEvent = 'file-updated', data?: any): void {
    const payload: SyncBroadcastMessage = {
      event,
      timestamp: Date.now(),
      sourceId: this.sourceId,
      data,
    };

    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (err) {
        console.warn('[syncManager] Broadcast error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('trh_sync_event', JSON.stringify(payload));
      } catch {
        // Ignore quota error
      }
    }
  }

  /**
   * Subscribe to sync events
   */
  public subscribe(callback: SyncCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Update sync state ('Syncing...' vs idle)
   */
  public setSyncing(syncing: boolean): void {
    this.isCurrentlySyncing = syncing;
    this.statusListeners.forEach((callback) => {
      try {
        callback(syncing);
      } catch (err) {
        console.error('[syncManager] Status listener error:', err);
      }
    });
  }

  /**
   * Subscribe to syncing status changes
   */
  public subscribeStatus(callback: SyncStatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.isCurrentlySyncing);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public getIsSyncing(): boolean {
    return this.isCurrentlySyncing;
  }

  public getSourceId(): string {
    return this.sourceId;
  }
}

export const syncManager = new SyncManager();

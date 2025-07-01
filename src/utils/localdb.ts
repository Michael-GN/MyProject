import type { AttendanceRecord, SyncStatus } from '../types';

export class LocalDBService {
  private static readonly STORAGE_KEYS = {
    ATTENDANCE_QUEUE: 'rollcall_attendance_queue',
    SYNC_STATUS: 'rollcall_sync_status',
    THEME: 'rollcall_theme',
    CACHE_SESSION: 'rollcall_cached_session',
    CACHE_TIMETABLE: 'rollcall_cached_timetable',
  } as const;

  // Attendance Queue Management
  static saveAttendanceToQueue(record: AttendanceRecord): void {
    try {
      const queue = this.getAttendanceQueue();
      queue.push(record);
      localStorage.setItem(this.STORAGE_KEYS.ATTENDANCE_QUEUE, JSON.stringify(queue));
      this.updateSyncStatus({ pendingCount: queue.length });
    } catch (error) {
      console.error('LocalDB Error - saveAttendanceToQueue:', error);
    }
  }

  static getAttendanceQueue(): AttendanceRecord[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.ATTENDANCE_QUEUE);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('LocalDB Error - getAttendanceQueue:', error);
      return [];
    }
  }

  static clearAttendanceQueue(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.ATTENDANCE_QUEUE);
      this.updateSyncStatus({ pendingCount: 0, lastSync: new Date().toISOString() });
    } catch (error) {
      console.error('LocalDB Error - clearAttendanceQueue:', error);
    }
  }

  static removeFromQueue(recordId: string): void {
    try {
      const queue = this.getAttendanceQueue();
      const filtered = queue.filter(record => 
        `${record.sessionId}-${record.studentId}-${record.timestamp}` !== recordId
      );
      localStorage.setItem(this.STORAGE_KEYS.ATTENDANCE_QUEUE, JSON.stringify(filtered));
      this.updateSyncStatus({ pendingCount: filtered.length });
    } catch (error) {
      console.error('LocalDB Error - removeFromQueue:', error);
    }
  }

  // Sync Status Management
  static getSyncStatus(): SyncStatus {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.SYNC_STATUS);
      const defaultStatus: SyncStatus = {
        lastSync: null,
        pendingCount: 0,
        isOnline: navigator.onLine,
        isSyncing: false,
      };
      return stored ? { ...defaultStatus, ...JSON.parse(stored) } : defaultStatus;
    } catch (error) {
      console.error('LocalDB Error - getSyncStatus:', error);
      return {
        lastSync: null,
        pendingCount: 0,
        isOnline: navigator.onLine,
        isSyncing: false,
      };
    }
  }

  static updateSyncStatus(updates: Partial<SyncStatus>): void {
    try {
      const current = this.getSyncStatus();
      const updated = { ...current, ...updates };
      localStorage.setItem(this.STORAGE_KEYS.SYNC_STATUS, JSON.stringify(updated));
    } catch (error) {
      console.error('LocalDB Error - updateSyncStatus:', error);
    }
  }

  // Theme Management
  static getTheme(): 'light' | 'dark' {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.THEME);
      return (stored as 'light' | 'dark') || 'light';
    } catch (error) {
      console.error('LocalDB Error - getTheme:', error);
      return 'light';
    }
  }

  static setTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('LocalDB Error - setTheme:', error);
    }
  }

  // Cache Management
  static cacheData(key: string, data: any): void {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expires: Date.now() + (30 * 60 * 1000), // 30 minutes
      };
      localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('LocalDB Error - cacheData:', error);
    }
  }

  static getCachedData(key: string): any | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const cacheItem = JSON.parse(stored);
      if (Date.now() > cacheItem.expires) {
        localStorage.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('LocalDB Error - getCachedData:', error);
      return null;
    }
  }

  static clearCache(): void {
    try {
      const keys = Object.values(this.STORAGE_KEYS);
      keys.forEach(key => {
        if (key.startsWith('rollcall_cached_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('LocalDB Error - clearCache:', error);
    }
  }
}
import { APIService } from './api';
import { LocalDBService } from './localdb';
import type { AttendanceRecord } from '../types';

export class SyncService {
  private static isInitialized = false;
  private static syncTimeout: NodeJS.Timeout | null = null;

  static initialize(): void {
    if (this.isInitialized) return;

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Initial sync if online
    if (navigator.onLine) {
      this.syncPendingAttendance();
    }

    this.isInitialized = true;
  }

  private static handleOnline(): void {
    LocalDBService.updateSyncStatus({ isOnline: true });
    this.syncPendingAttendance();
  }

  private static handleOffline(): void {
    LocalDBService.updateSyncStatus({ isOnline: false, isSyncing: false });
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
  }

  static async syncPendingAttendance(): Promise<boolean> {
    if (!navigator.onLine) {
      console.log('Offline - skipping sync');
      return false;
    }

    const queue = LocalDBService.getAttendanceQueue();
    if (queue.length === 0) {
      console.log('No pending attendance records to sync');
      return true;
    }

    LocalDBService.updateSyncStatus({ isSyncing: true });

    try {
      console.log(`Syncing ${queue.length} attendance records...`);
      
      for (const record of queue) {
        try {
          await APIService.submitAttendance({
            session_id: record.sessionId,
            student_id: record.studentId,
            is_present: record.isPresent,
            timestamp: record.timestamp,
          });

          // Remove successfully synced record
          const recordId = `${record.sessionId}-${record.studentId}-${record.timestamp}`;
          LocalDBService.removeFromQueue(recordId);
        } catch (error) {
          console.error('Failed to sync individual record:', error);
          // Continue with other records
        }
      }

      // Check if all records were synced
      const remainingQueue = LocalDBService.getAttendanceQueue();
      const success = remainingQueue.length === 0;

      LocalDBService.updateSyncStatus({
        isSyncing: false,
        lastSync: success ? new Date().toISOString() : null,
        pendingCount: remainingQueue.length,
      });

      console.log(`Sync completed. ${remainingQueue.length} records remaining.`);
      return success;

    } catch (error) {
      console.error('Sync failed:', error);
      LocalDBService.updateSyncStatus({ isSyncing: false });
      return false;
    }
  }

  static async manualSync(): Promise<boolean> {
    console.log('Manual sync triggered');
    return await this.syncPendingAttendance();
  }

  // Schedule background sync attempts
  static scheduleBackgroundSync(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    // Try to sync every 2 minutes if there are pending records
    this.syncTimeout = setTimeout(() => {
      const queue = LocalDBService.getAttendanceQueue();
      if (queue.length > 0 && navigator.onLine) {
        this.syncPendingAttendance();
      }
      this.scheduleBackgroundSync(); // Schedule next attempt
    }, 2 * 60 * 1000);
  }
}
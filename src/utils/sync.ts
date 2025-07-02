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
      setTimeout(() => {
        this.syncPendingAttendance();
      }, 2000); // Wait 2 seconds before initial sync
    }

    this.isInitialized = true;
  }

  private static handleOnline(): void {
    console.log('Device came online - attempting sync');
    LocalDBService.updateSyncStatus({ isOnline: true });
    setTimeout(() => {
      this.syncPendingAttendance();
    }, 1000);
  }

  private static handleOffline(): void {
    console.log('Device went offline');
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
      LocalDBService.updateSyncStatus({ 
        isSyncing: false,
        pendingCount: 0,
        lastSync: new Date().toISOString()
      });
      return true;
    }

    console.log(`Starting sync of ${queue.length} attendance records...`);
    LocalDBService.updateSyncStatus({ isSyncing: true });

    let successCount = 0;
    let failureCount = 0;

    try {
      for (const record of queue) {
        try {
          console.log('Syncing record:', record);
          
          const attendancePayload = {
            session_id: record.sessionId,
            student_id: record.studentId,
            is_present: record.isPresent ? 1 : 0, // Convert boolean to integer
            timestamp: record.timestamp,
          };

          console.log('Sending payload:', attendancePayload);
          
          const result = await APIService.submitAttendance(attendancePayload);
          console.log('Sync result:', result);

          if (result && (result.success || result.message)) {
            // Remove successfully synced record
            const recordId = `${record.sessionId}-${record.studentId}-${record.timestamp}`;
            LocalDBService.removeFromQueue(recordId);
            successCount++;
            console.log(`Successfully synced record ${successCount}`);
          } else {
            console.error('Unexpected API response:', result);
            failureCount++;
          }
        } catch (recordError) {
          console.error('Failed to sync individual record:', recordError);
          failureCount++;
          // Continue with other records instead of stopping
        }
      }

      // Check remaining queue after sync attempts
      const remainingQueue = LocalDBService.getAttendanceQueue();
      const allSynced = remainingQueue.length === 0;

      LocalDBService.updateSyncStatus({
        isSyncing: false,
        lastSync: allSynced ? new Date().toISOString() : null,
        pendingCount: remainingQueue.length,
      });

      console.log(`Sync completed. Success: ${successCount}, Failures: ${failureCount}, Remaining: ${remainingQueue.length}`);
      
      if (successCount > 0) {
        // Trigger a refresh of dashboard and reports data
        window.dispatchEvent(new CustomEvent('attendanceDataUpdated'));
      }

      return allSynced;

    } catch (error) {
      console.error('Sync process failed:', error);
      LocalDBService.updateSyncStatus({ 
        isSyncing: false,
        pendingCount: queue.length 
      });
      return false;
    }
  }

  static async manualSync(): Promise<boolean> {
    console.log('Manual sync triggered by user');
    return await this.syncPendingAttendance();
  }

  // Schedule background sync attempts
  static scheduleBackgroundSync(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    // Try to sync every 30 seconds if there are pending records
    this.syncTimeout = setTimeout(() => {
      const queue = LocalDBService.getAttendanceQueue();
      if (queue.length > 0 && navigator.onLine) {
        console.log('Background sync attempt...');
        this.syncPendingAttendance();
      }
      this.scheduleBackgroundSync(); // Schedule next attempt
    }, 30 * 1000); // 30 seconds
  }

  static async testConnection(): Promise<boolean> {
    try {
      console.log('Testing API connection...');
      await APIService.getDashboardStats();
      console.log('API connection test successful');
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}
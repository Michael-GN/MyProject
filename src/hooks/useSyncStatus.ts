import { useState, useEffect } from 'react';
import { LocalDBService } from '../utils/localdb';
import type { SyncStatus } from '../types';

export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => 
    LocalDBService.getSyncStatus()
  );

  useEffect(() => {
    // Update online status
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      LocalDBService.updateSyncStatus({ isOnline: true });
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false, isSyncing: false }));
      LocalDBService.updateSyncStatus({ isOnline: false, isSyncing: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll for sync status changes
    const interval = setInterval(() => {
      const currentStatus = LocalDBService.getSyncStatus();
      setSyncStatus(currentStatus);
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return syncStatus;
}
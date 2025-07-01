import React from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useSyncStatus } from '../hooks/useSyncStatus';

interface SyncStatusProps {
  onManualSync: () => Promise<void>;
  isManualSyncing: boolean;
}

export default function SyncStatus({ onManualSync, isManualSyncing }: SyncStatusProps) {
  const syncStatus = useSyncStatus();

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const getSyncStatusIcon = () => {
    if (syncStatus.isSyncing || isManualSyncing) {
      return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
    }
    if (syncStatus.pendingCount > 0) {
      return <Clock className="w-5 h-5 text-red-600" />;
    }
    if (!syncStatus.isOnline) {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    return <CheckCircle className="w-5 h-5 text-blue-600" />;
  };

  const getSyncStatusText = () => {
    if (syncStatus.isSyncing || isManualSyncing) {
      return 'Syncing...';
    }
    if (syncStatus.pendingCount > 0) {
      return `${syncStatus.pendingCount} records pending`;
    }
    if (!syncStatus.isOnline) {
      return 'Offline';
    }
    return 'All synced';
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-black">
      <h3 className="text-lg font-medium text-black mb-4">
        Sync Status
      </h3>

      <div className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getSyncStatusIcon()}
            <div>
              <p className="text-sm font-medium text-black">
                {getSyncStatusText()}
              </p>
              <p className="text-xs text-black">
                Last sync: {formatLastSync(syncStatus.lastSync)}
              </p>
            </div>
          </div>

          <button
            onClick={onManualSync}
            disabled={isManualSyncing || syncStatus.isSyncing || !syncStatus.isOnline}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-black disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isManualSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Now</span>
          </button>
        </div>

        {/* Connection Status */}
        <div className="pt-4 border-t-2 border-black">
          <div className="flex items-center justify-between text-sm">
            <span className="text-black">Connection:</span>
            <span className={`font-medium ${
              syncStatus.isOnline 
                ? 'text-blue-600' 
                : 'text-red-600'
            }`}>
              {syncStatus.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {syncStatus.pendingCount > 0 && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-black">Pending records:</span>
              <span className="font-medium text-red-600">
                {syncStatus.pendingCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
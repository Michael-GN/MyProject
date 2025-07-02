import React, { useState, useEffect } from 'react';
import { Moon, Sun, Smartphone, Trash2, Download, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';
import SyncStatus from '../components/SyncStatus';
import { useTheme } from '../hooks/useTheme';
import { SyncService } from '../utils/sync';
import { LocalDBService } from '../utils/localdb';
import { APIService } from '../utils/api';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    testing: boolean;
    success: boolean | null;
    message: string;
  }>({
    testing: false,
    success: null,
    message: ''
  });

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await SyncService.manualSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus({ testing: true, success: null, message: 'Testing connection...' });
    
    try {
      const result = await APIService.testConnection();
      setConnectionStatus({
        testing: false,
        success: result.success,
        message: result.message
      });
    } catch (error) {
      setConnectionStatus({
        testing: false,
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      });
    }
  };

  const handleClearData = async () => {
    setClearingData(true);
    try {
      LocalDBService.clearCache();
      LocalDBService.clearAttendanceQueue();
      LocalDBService.updateSyncStatus({
        lastSync: null,
        pendingCount: 0,
        isOnline: navigator.onLine,
        isSyncing: false,
      });
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Failed to clear data:', error);
    } finally {
      setClearingData(false);
    }
  };

  const installPWA = () => {
    alert('To install this app:\n\n1. Open the browser menu\n2. Look for "Add to Home Screen" or "Install App"\n3. Follow the prompts');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your app preferences and data
        </p>
      </div>

      {/* Connection Test */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          API Connection
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {connectionStatus.testing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
              ) : connectionStatus.success === true ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : connectionStatus.success === false ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <Wifi className="w-5 h-5 text-gray-500" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Test API Connection
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {connectionStatus.message || 'Check if the backend server is accessible'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleTestConnection}
              disabled={connectionStatus.testing}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {connectionStatus.testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {connectionStatus.success === false && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Connection Failed
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                Make sure your PHP server is running and accessible. Common solutions:
              </p>
              <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                <li>• Check if XAMPP/WAMP is running</li>
                <li>• Verify the API URL in the code matches your server setup</li>
                <li>• Ensure your PHP files are in the correct www/htdocs directory</li>
                <li>• Check for CORS issues in browser console</li>
              </ul>
            </div>
          )}

          {connectionStatus.success === true && (
            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ API connection successful! Your attendance data should sync properly.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sync Status */}
      <SyncStatus 
        onManualSync={handleManualSync}
        isManualSyncing={isManualSyncing}
      />

      {/* Theme Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Appearance
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {theme === 'light' ? (
              <Sun className="w-5 h-5 text-blue-600" />
            ) : (
              <Moon className="w-5 h-5 text-blue-600" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Choose your preferred color scheme
              </p>
            </div>
          </div>
          
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
              theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* App Installation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          App Installation
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Install as App
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Add to home screen for better experience
              </p>
            </div>
          </div>
          
          <button
            onClick={installPWA}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Install
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Data Management
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trash2 className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Clear All Data
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Remove all cached data and reset the app
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={clearingData}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {clearingData ? 'Clearing...' : 'Clear Data'}
            </button>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          App Information
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Version:</span>
            <span className="font-medium text-gray-900 dark:text-white">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Built for:</span>
            <span className="font-medium text-gray-900 dark:text-white">IME University</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Platform:</span>
            <span className="font-medium text-gray-900 dark:text-white">Progressive Web App</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">API URL:</span>
            <span className="font-medium text-gray-900 dark:text-white text-xs">http://localhost/api</span>
          </div>
        </div>
      </div>

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Confirm Clear Data
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              This will remove all cached data, including any pending attendance records that haven't been synced. 
              Are you sure you want to continue?
            </p>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleClearData}
                disabled={clearingData}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {clearingData ? 'Clearing...' : 'Yes, Clear Data'}
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
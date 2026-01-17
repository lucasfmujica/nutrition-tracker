import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatRelativeTime } from '../../utils/dateUtils';

/**
 * SyncStatusIndicator - Visual feedback for cloud sync status
 *
 * States:
 * - 'idle': Green cloud (all synced)
 * - 'syncing': Yellow cloud with animation (syncing in progress)
 * - 'success': Green cloud with checkmark (briefly shown after sync)
 * - 'error': Red cloud with X (sync failed)
 *
 * Props:
 * - syncStatus: Current sync status from useSupabase
 * - syncError: Error message if sync failed
 * - lastSyncTime: Date object of last successful sync
 */
export const SyncStatusIndicator = ({ syncStatus, syncError, lastSyncTime }) => {
  const [relativeTime, setRelativeTime] = useState('');

  // Update relative time every 30 seconds
  useEffect(() => {
    const updateTime = () => {
      setRelativeTime(formatRelativeTime(lastSyncTime));
    };

    updateTime(); // Initial update
    const interval = setInterval(updateTime, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, [lastSyncTime]);

  // Determine icon and color based on status
  const getStatusConfig = () => {
    switch (syncStatus) {
      case 'syncing':
        return {
          Icon: RefreshCw,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          label: 'Sincronizando...',
          animate: true
        };
      case 'success':
        return {
          Icon: Cloud,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          label: relativeTime || 'Sincronizado',
          animate: false
        };
      case 'error':
        return {
          Icon: CloudOff,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          label: syncError || 'Error de sincronización',
          animate: false
        };
      case 'idle':
      default:
        return {
          Icon: Cloud,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          label: relativeTime || 'Sincronizado',
          animate: false
        };
    }
  };

  const { Icon, color, bgColor, label, animate } = getStatusConfig();

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm">
      <div className={`${bgColor} rounded-full p-1`}>
        <Icon
          className={`w-4 h-4 ${color} ${animate ? 'animate-spin' : ''}`}
          strokeWidth={2}
        />
      </div>
      <span className="text-xs font-medium text-gray-600">
        {label}
      </span>
    </div>
  );
};

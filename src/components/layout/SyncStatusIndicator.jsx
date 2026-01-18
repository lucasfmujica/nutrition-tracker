import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatRelativeTime } from '../../utils/dateUtils';

/**
 * SyncStatusIndicator - Visual feedback for cloud sync status
 *
 * States:
 * - 'stale': Amber cloud with animation (cache > 5 min old, revalidating)
 * - 'idle': Green cloud (all synced)
 * - 'syncing': Yellow cloud with animation (syncing in progress)
 * - 'success': Green cloud with checkmark (briefly shown after sync)
 * - 'error': Red cloud with X (sync failed)
 *
 * Props:
 * - syncStatus: Current sync status from useSupabase
 * - syncError: Error message if sync failed
 * - lastSyncTime: Date object of last successful sync
 * - cacheStale: Boolean indicating if cache is > 5 min old (SWR pattern)
 */
export const SyncStatusIndicator = ({ syncStatus, syncError, lastSyncTime, cacheStale = false }) => {
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
    // SWR PATTERN: Prioritize stale state - shows when cache is > 5 min old
    // This gives user clear feedback that fresh data is being loaded
    if (cacheStale) {
      return {
        Icon: RefreshCw,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50',
        label: 'Actualizando...',
        animate: true
      };
    }

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
    <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm max-w-[140px] sm:max-w-none transition-all">
      <div className={`${bgColor} rounded-full p-1 flex-shrink-0`}>
        <Icon
          className={`w-4 h-4 ${color} ${animate ? 'animate-spin' : ''}`}
          strokeWidth={2}
        />
      </div>
      <span className="text-[10px] sm:text-xs font-medium text-gray-600 truncate">
        {label}
      </span>
    </div>
  );
};

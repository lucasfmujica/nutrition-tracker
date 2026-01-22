import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { formatRelativeTime } from '../../utils/dateUtils';

interface SyncStatusIndicatorProps {
    syncStatus: string;
    syncError?: string | null;
    lastSyncTime: Date | null | string;
    cacheStale?: boolean;
}

/**
 * SyncStatusIndicator - Visual feedback for cloud sync status
 */
export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
    syncStatus,
    syncError,
    lastSyncTime,
    cacheStale = false,
}) => {
    const [relativeTime, setRelativeTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            setRelativeTime(formatRelativeTime(lastSyncTime as any));
        };

        updateTime();
        const interval = setInterval(updateTime, 30000);

        return () => clearInterval(interval);
    }, [lastSyncTime]);

    const getStatusConfig = () => {
        if (cacheStale) {
            return {
                Icon: RefreshCw,
                color: 'text-amber-500',
                bgColor: 'bg-amber-50',
                label: 'Actualizando...',
                animate: true,
            };
        }

        switch (syncStatus) {
            case 'syncing':
                return {
                    Icon: RefreshCw,
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-50',
                    label: 'Sincronizando...',
                    animate: true,
                };
            case 'success':
                return {
                    Icon: Cloud,
                    color: 'text-green-500',
                    bgColor: 'bg-green-50',
                    label: relativeTime || 'Sincronizado',
                    animate: false,
                };
            case 'error':
                return {
                    Icon: CloudOff,
                    color: 'text-red-500',
                    bgColor: 'bg-red-50',
                    label: syncError || 'Error de sincronización',
                    animate: false,
                };
            case 'idle':
            default:
                return {
                    Icon: Cloud,
                    color: 'text-green-500',
                    bgColor: 'bg-green-50',
                    label: relativeTime || 'Sincronizado',
                    animate: false,
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

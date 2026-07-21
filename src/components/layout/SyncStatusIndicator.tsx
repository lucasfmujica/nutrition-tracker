import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { formatRelativeTime } from '../../utils/dateUtils';

interface SyncStatusIndicatorProps {
    syncStatus: string;
    syncError?: string | null;
    lastSyncTime: Date | null | string;
    cacheStale?: boolean;
    /** Escrituras encoladas en The Vault; > 0 muestra el badge ámbar. */
    pendingCount?: number;
}

/**
 * SyncStatusIndicator - Visual feedback for cloud sync status
 */
export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
    syncStatus,
    syncError,
    lastSyncTime,
    cacheStale = false,
    pendingCount = 0,
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
        switch (syncStatus) {
            case 'syncing':
                return {
                    Icon: RefreshCw,
                    color: 'text-warning',
                    bgColor: 'bg-warning-soft',
                    label: 'Sincronizando...',
                    animate: true,
                    visible: true,
                };
            case 'error':
                return {
                    Icon: CloudOff,
                    color: 'text-danger',
                    bgColor: 'bg-danger-soft',
                    label: syncError || 'Error de sincronización',
                    animate: false,
                    visible: true,
                };
            case 'success':
            case 'idle':
            default:
                // The Vault con items encolados: badge persistente hasta drenar
                if (pendingCount > 0) {
                    return {
                        Icon: CloudOff,
                        color: 'text-warning',
                        bgColor: 'bg-warning-soft',
                        label: `${pendingCount} ${pendingCount === 1 ? 'pendiente' : 'pendientes'}`,
                        animate: false,
                        visible: true,
                    };
                }
                return {
                    Icon: Cloud,
                    color: 'text-success',
                    bgColor: 'bg-success-soft',
                    label: relativeTime || 'Sincronizado',
                    animate: false,
                    visible: false,
                };
        }
    };

    const { Icon, color, bgColor, label, animate, visible } = getStatusConfig();

    if (!visible) return null;

    return (
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-surface border border-border shadow-sm max-w-[140px] sm:max-w-none transition-all">
            <div className={`${bgColor} rounded-full p-1 flex-shrink-0`}>
                <Icon
                    className={`w-4 h-4 ${color} ${animate ? 'animate-spin' : ''}`}
                    strokeWidth={2}
                />
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-text-secondary truncate">
                {label}
            </span>
        </div>
    );
};

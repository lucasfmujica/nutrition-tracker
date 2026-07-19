import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
    className?: string;
}

/** Bloque de carga base. Dimensionar con className (w-*, h-*). */
export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
    <div
        aria-hidden="true"
        className={cn(
            'animate-pulse bg-progress-track rounded-control',
            className,
        )}
    />
);

/** Card de carga con el mismo shape que .card (radio 20px). */
export const SkeletonCard: React.FC<SkeletonProps & { lines?: number }> = ({
    className,
    lines = 3,
}) => (
    <div
        aria-hidden="true"
        className={cn(
            'bg-surface border border-border rounded-card p-5 space-y-3',
            className,
        )}>
        <Skeleton className="h-4 w-1/3" />
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} className={cn('h-3', i % 2 ? 'w-2/3' : 'w-full')} />
        ))}
    </div>
);

/** Fila de lista de carga (avatar + dos líneas). */
export const SkeletonRow: React.FC<SkeletonProps> = ({ className }) => (
    <div
        aria-hidden="true"
        className={cn('flex items-center gap-3 py-2', className)}>
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
        </div>
    </div>
);

import React, { useRef, useState } from 'react';

// =====================================================
// PULL TO REFRESH COMPONENT
// =====================================================

interface PullToRefreshProps {
    children: React.ReactNode;
    onRefresh: () => Promise<void>;
    isRefreshing: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
    children,
    onRefresh,
    isRefreshing,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pullDistance, setPullDistance] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const startYRef = useRef(0);
    const PULL_THRESHOLD = 80;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (containerRef.current?.scrollTop === 0) {
            startYRef.current = e.touches[0].clientY;
            setIsPulling(true);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (
            !isPulling ||
            (containerRef.current && containerRef.current.scrollTop > 0)
        )
            return;
        const diff = e.touches[0].clientY - startYRef.current;
        if (diff > 0) {
            setPullDistance(Math.min(diff * 0.5, 100));
        }
    };

    const handleTouchEnd = async () => {
        if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
            await onRefresh();
        }
        setPullDistance(0);
        setIsPulling(false);
    };

    return (
        <div
            ref={containerRef}
            className="relative overflow-auto"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}>
            {/* Pull indicator */}
            {(pullDistance > 0 || isRefreshing) && (
                <div
                    className="pull-indicator absolute top-0 left-0 right-0 flex items-center justify-center bg-surface/90 shadow-md z-10"
                    style={{ height: isRefreshing ? 50 : pullDistance }}>
                    {isRefreshing ? (
                        <svg
                            className="animate-spin h-5 w-5 text-primary"
                            viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                    ) : (
                        <span
                            className={`text-sm ${pullDistance >= PULL_THRESHOLD ? 'text-primary' : 'text-text-tertiary'}`}>
                            {pullDistance >= PULL_THRESHOLD
                                ? '↑ Soltar para actualizar'
                                : '↓ Arrastra para actualizar'}
                        </span>
                    )}
                </div>
            )}

            <div
                style={{
                    transform: `translateY(${isRefreshing ? 50 : pullDistance}px)`,
                    transition: isPulling ? 'none' : 'transform 0.2s ease',
                }}>
                {children}
            </div>
        </div>
    );
};

import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Trash2 } from 'lucide-react';

// =====================================================
// SWIPEABLE ITEM COMPONENT - Bidirectional swipe actions
// Left swipe: Delete | Right swipe: Duplicate
// =====================================================

interface SwipeableItemProps {
    children: React.ReactNode;
    onDelete: () => void;
    onDuplicate?: () => void;
    deleteLabel?: string;
    duplicateLabel?: string;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
    children,
    onDelete,
    onDuplicate,
    deleteLabel,
    duplicateLabel,
}) => {
    const { t } = useTranslation();
    const resolvedDeleteLabel = deleteLabel || t('common.delete');
    const resolvedDuplicateLabel = duplicateLabel || t('common.logAgain');
    const itemRef = useRef<HTMLDivElement>(null);
    const [translateX, setTranslateX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);
    const DELETE_THRESHOLD = -80;
    const DUPLICATE_THRESHOLD = 80;

    const handleTouchStart = (e: React.TouchEvent) => {
        startXRef.current = e.touches[0].clientX;
        currentXRef.current = translateX;
        setIsSwiping(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping) return;
        const diff = e.touches[0].clientX - startXRef.current;

        // Allow both left (-120) and right (+120) swipes
        const maxLeft = -120;
        const maxRight = onDuplicate ? 120 : 0;
        const newX = Math.min(maxRight, Math.max(maxLeft, currentXRef.current + diff));
        setTranslateX(newX);
    };

    const handleTouchEnd = () => {
        setIsSwiping(false);

        // Left swipe - delete
        if (translateX < DELETE_THRESHOLD) {
            setTranslateX(-120);
        }
        // Right swipe - duplicate (only if handler exists)
        else if (translateX > DUPLICATE_THRESHOLD && onDuplicate) {
            setTranslateX(120);
        }
        // Reset if not past threshold
        else {
            setTranslateX(0);
        }
    };

    const handleDelete = () => {
        setTranslateX(-300);
        setTimeout(() => onDelete(), 200);
    };

    const handleDuplicate = () => {
        if (!onDuplicate) return;
        setTranslateX(300);
        setTimeout(() => {
            onDuplicate();
            setTranslateX(0);
        }, 200);
    };

    const resetSwipe = () => setTranslateX(0);

    return (
        <div className="relative overflow-hidden rounded-lg">
            {/* Delete background (left swipe) */}
            <div
                className="absolute inset-y-0 right-0 flex items-center bg-red-600 transition-all rounded-r-2xl"
                style={{
                    width: translateX < 0 ? Math.abs(translateX) + 'px' : '0px',
                    opacity: translateX < 0 ? 1 : 0,
                }}>
                <button
                    onClick={handleDelete}
                    className="w-full h-full flex items-center justify-center text-white font-bold px-4">
                    {translateX < -60 && (
                        <span className="flex items-center gap-2">
                            <Trash2 size={16} />
                            <span className="text-sm">{resolvedDeleteLabel}</span>
                        </span>
                    )}
                </button>
            </div>

            {/* Duplicate background (right swipe) */}
            {onDuplicate && (
                <div
                    className="absolute inset-y-0 left-0 flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 transition-all rounded-l-2xl"
                    style={{
                        width: translateX > 0 ? translateX + 'px' : '0px',
                        opacity: translateX > 0 ? 1 : 0,
                    }}>
                    <button
                        onClick={handleDuplicate}
                        className="w-full h-full flex items-center justify-center text-white font-bold px-4">
                        {translateX > 60 && (
                            <span className="flex items-center gap-2">
                                <Copy size={16} />
                                <span className="text-sm">{resolvedDuplicateLabel}</span>
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* Main content */}
            <div
                ref={itemRef}
                className={`swipe-item relative bg-surface ${isSwiping ? 'swiping' : ''}`}
                style={{ transform: `translateX(${translateX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={translateX !== 0 ? resetSwipe : undefined}>
                {children}
            </div>
        </div>
    );
};

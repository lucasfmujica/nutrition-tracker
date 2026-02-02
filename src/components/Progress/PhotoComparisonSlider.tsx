/**
 * PhotoComparisonSlider - Interactive before/after photo comparison
 * Features drag-to-reveal slider with stats display
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Share2, MoveHorizontal } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ProgressPhoto } from '../../types/domain';

interface PhotoComparisonSliderProps {
    beforePhoto: ProgressPhoto;
    afterPhoto: ProgressPhoto;
    onPhotoChange: (type: 'before' | 'after') => void;
    onShare?: () => void;
}

export const PhotoComparisonSlider: React.FC<PhotoComparisonSliderProps> = ({
    beforePhoto,
    afterPhoto,
    onPhotoChange,
    onShare,
}) => {
    const [sliderPosition, setSliderPosition] = useState(50); // 0-100%
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate stats
    const weightDelta = (afterPhoto.weight || 0) - (beforePhoto.weight || 0);
    const daysDiff = differenceInDays(parseISO(afterPhoto.date), parseISO(beforePhoto.date));
    const hasWeightData = !!(beforePhoto.weight && afterPhoto.weight);

    // Handle drag movement
    const handleMove = (clientX: number) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const percentage = ((clientX - rect.left) / rect.width) * 100;
        setSliderPosition(Math.max(0, Math.min(100, percentage)));
    };

    // Mouse events
    const handleMouseDown = () => {
        setIsDragging(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        handleMove(e.clientX);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Touch events
    const handleTouchStart = () => {
        setIsDragging(true);
        // Vibrate on mobile
        if (window.navigator.vibrate) {
            window.navigator.vibrate(30);
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging || !e.touches[0]) return;
        handleMove(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Event listeners
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleTouchEnd);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [isDragging]);

    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Camera size={20} className="text-purple-500" />
                    Transformación
                </h3>
                {onShare && (
                    <button
                        onClick={onShare}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl flex items-center gap-2 transition-colors"
                    >
                        <Share2 size={16} />
                        Compartir
                    </button>
                )}
            </div>

            {/* Comparison Container */}
            <div
                ref={containerRef}
                className="relative aspect-[3/4] rounded-xl overflow-hidden touch-none select-none cursor-ew-resize"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                {/* After Photo (Background) */}
                <img
                    src={afterPhoto.photoUrl}
                    alt="After"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Before Photo (Clipped) */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                    <img
                        src={beforePhoto.photoUrl}
                        alt="Before"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Slider Handle */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
                    style={{ left: `${sliderPosition}%` }}
                >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center">
                        <MoveHorizontal size={20} className="text-slate-600" />
                    </div>
                </div>

                {/* Metadata Overlays */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 pointer-events-none">
                    <p className="text-white text-xs font-bold">ANTES</p>
                    <p className="text-white text-sm">
                        {format(parseISO(beforePhoto.date), 'd MMM', { locale: es })}
                    </p>
                    {beforePhoto.weight && (
                        <p className="text-white text-xs">{beforePhoto.weight} kg</p>
                    )}
                </div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 pointer-events-none">
                    <p className="text-white text-xs font-bold">DESPUÉS</p>
                    <p className="text-white text-sm">
                        {format(parseISO(afterPhoto.date), 'd MMM', { locale: es })}
                    </p>
                    {afterPhoto.weight && (
                        <p className="text-white text-xs">{afterPhoto.weight} kg</p>
                    )}
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100">
                    <p className="text-xs text-green-600 font-medium">Cambio de Peso</p>
                    {hasWeightData ? (
                        <p className="text-2xl font-bold text-green-700">
                            {weightDelta > 0 ? '+' : ''}
                            {weightDelta.toFixed(1)} kg
                        </p>
                    ) : (
                        <p className="text-sm text-green-600">Sin datos</p>
                    )}
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium">Tiempo</p>
                    <p className="text-2xl font-bold text-blue-700">{daysDiff} días</p>
                </div>
            </div>

            {/* Photo Selection */}
            <div className="flex gap-2 mt-4">
                <button
                    onClick={() => onPhotoChange('before')}
                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                >
                    Cambiar Antes
                </button>
                <button
                    onClick={() => onPhotoChange('after')}
                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                >
                    Cambiar Después
                </button>
            </div>
        </div>
    );
};

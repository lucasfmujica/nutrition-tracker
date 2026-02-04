import { Clock, Target } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

export interface ProteinSlot {
    id: string;
    name: string;
    status: 'complete' | 'active' | 'partial' | 'missed' | 'pending';
    progress: number;
    consumedGrams: number;
    targetGrams: number;
}

interface ProteinTimelineProps {
    slots: ProteinSlot[];
    remaining: number;
    targetProtein: number;
}

/**
 * ProteinTimeline - Visual protein pacing timeline
 */
export const ProteinTimeline: React.FC<ProteinTimelineProps> = ({
    slots,
    remaining,
}) => {
    const { t } = useTranslation();

    if (!slots || slots.length === 0) return null;

    const getStatusStyles = (status: ProteinSlot['status']) => {
        switch (status) {
            case 'complete':
                return {
                    bg: 'bg-green-500',
                    border: 'border-green-400',
                    text: 'text-green-700',
                    ring: '',
                };
            case 'active':
                return {
                    bg: 'bg-blue-500',
                    border: 'border-blue-400',
                    text: 'text-blue-700',
                    ring: 'ring-2 ring-blue-300 ring-offset-2',
                };
            case 'partial':
                return {
                    bg: 'bg-amber-400',
                    border: 'border-amber-300',
                    text: 'text-amber-700',
                    ring: '',
                };
            case 'missed':
                return {
                    bg: 'bg-red-400',
                    border: 'border-red-300',
                    text: 'text-red-600',
                    ring: 'animate-pulse',
                };
            default:
                return {
                    bg: 'bg-gray-200',
                    border: 'border-gray-200',
                    text: 'text-gray-400',
                    ring: '',
                };
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-50 rounded-lg">
                        <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">
                            {t('proteinPacing.title')}
                        </h3>
                        <p className="text-[10px] text-gray-500">
                            {t('proteinPacing.subtitle')}
                        </p>
                    </div>
                </div>

                {/* Remaining Counter */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-full">
                    <Target className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-xs font-bold text-purple-700">
                        {t('proteinPacing.remaining', { amount: remaining })}
                    </span>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Connection Line */}
                <div className="absolute top-5 left-6 right-6 h-0.5 bg-gray-100" />

                {/* Slots */}
                <div className="relative flex justify-between">
                    {slots.map((slot) => {
                        const styles = getStatusStyles(slot.status);

                        return (
                            <div
                                key={slot.id}
                                className="flex flex-col items-center">
                                {/* Circle Progress */}
                                <div
                                    className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white ${styles.border} ${styles.ring}`}>
                                    <div
                                        className={`absolute inset-1 rounded-full ${styles.bg} transition-all duration-300`}
                                        style={{
                                            clipPath: `polygon(0 ${100 - slot.progress * 100}%, 100% ${100 - slot.progress * 100}%, 100% 100%, 0 100%)`,
                                        }}
                                    />
                                    <span
                                        className={`relative text-[10px] font-bold ${slot.progress > 0.5 ? 'text-white' : styles.text}`}>
                                        {Math.round(slot.progress * 100)}%
                                    </span>
                                </div>

                                {/* Label */}
                                <span className="mt-2 text-[10px] font-medium text-gray-500 text-center">
                                    {t(slot.name)}
                                </span>

                                {/* Protein Amount */}
                                <span className={`text-[10px] ${styles.text}`}>
                                    {slot.consumedGrams}/{slot.targetGrams}g
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[9px] text-gray-500">
                        {t('proteinPacing.complete')}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[9px] text-gray-500">
                        {t('proteinPacing.active')}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-[9px] text-gray-500">
                        {t('proteinPacing.missed')}
                    </span>
                </div>
            </div>
        </div>
    );
};

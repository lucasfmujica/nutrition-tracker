/**
 * ProgressTab - Progress photos and body measurements tracking
 * Main orchestrator for progress tracking features
 */

import { BarChart3, Calendar, Camera, Ruler, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { ProgressAnalyticsView } from '../Progress/ProgressAnalyticsView';
import { ProgressComparisonView } from '../Progress/ProgressComparisonView';
import { ProgressMeasurementsView } from '../Progress/ProgressMeasurementsView';
import { ProgressPhotosView } from '../Progress/ProgressPhotosView';
import { ProgressTimelineView } from '../Progress/ProgressTimelineView';

type TabMode = 'photos' | 'measurements' | 'compare' | 'timeline' | 'analytics';

export const ProgressTab: React.FC = () => {
    const { profile } = useTracker() as any;
    const userId = profile?.userId || null;
    const currentWeight = profile?.currentWeight;
    const targetWeight = profile?.targetWeight;

    const [activeMode, setActiveMode] = useState<TabMode>('photos');

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Progreso</h1>
                    <p className="text-sm text-gray-500">
                        Fotos, medidas y análisis
                    </p>
                </div>
            </div>

            {/* Mode Toggle - 5 tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto">
                <TabButton
                    icon={Camera}
                    label="Fotos"
                    isActive={activeMode === 'photos'}
                    onClick={() => setActiveMode('photos')}
                />
                <TabButton
                    icon={Ruler}
                    label="Medidas"
                    isActive={activeMode === 'measurements'}
                    onClick={() => setActiveMode('measurements')}
                />
                <TabButton
                    icon={TrendingUp}
                    label="Comparar"
                    isActive={activeMode === 'compare'}
                    onClick={() => setActiveMode('compare')}
                />
                <TabButton
                    icon={Calendar}
                    label="Timeline"
                    isActive={activeMode === 'timeline'}
                    onClick={() => setActiveMode('timeline')}
                />
                <TabButton
                    icon={BarChart3}
                    label="Análisis"
                    isActive={activeMode === 'analytics'}
                    onClick={() => setActiveMode('analytics')}
                />
            </div>

            {/* Content */}
            {activeMode === 'photos' && <ProgressPhotosView userId={userId} />}
            {activeMode === 'measurements' && (
                <ProgressMeasurementsView userId={userId} />
            )}
            {activeMode === 'compare' && <ProgressComparisonView userId={userId} />}
            {activeMode === 'timeline' && <ProgressTimelineView userId={userId} />}
            {activeMode === 'analytics' && (
                <ProgressAnalyticsView
                    userId={userId}
                    currentWeight={currentWeight}
                    targetWeight={targetWeight}
                />
            )}
        </div>
    );
};

// Helper Components

const TabButton: React.FC<{
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
}> = ({ icon: Icon, label, isActive, onClick, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
            isActive
                ? 'bg-white text-purple-600 shadow-sm'
                : disabled
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-500 hover:text-slate-700'
        }`}>
        <Icon size={18} />
        {label}
    </button>
);

const ComingSoonView: React.FC<{ feature: string }> = ({ feature }) => (
    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={28} className="text-purple-400" />
        </div>
        <h3 className="font-bold text-slate-900 mb-2">{feature}</h3>
        <p className="text-sm text-slate-500">Próximamente disponible</p>
    </div>
);

import { Droplets, Footprints, LucideIcon, Minus, Plus } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface ActivityCardProps {
    title: string;
    value: number;
    target: number;
    unit: string;
    icon: LucideIcon;
    color: string;
    onAdd?: () => void;
    onDecrease?: () => void;
    subtext?: string;
}

const ActivityCard: React.FC<ActivityCardProps> = React.memo(
    ({ value, target, unit, icon: Icon, color, onAdd, onDecrease, subtext }) => {
        const percentage = Math.min((value / target) * 100, 100);

        return (
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden flex-1 group hover:border-primary/20 transition-colors">
                <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-full ${color}`}>
                        <Icon size={20} className="text-white" />
                    </div>
                    <div className="flex gap-1">
                        {onDecrease && (
                            <button
                                onClick={onDecrease}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors">
                                <Minus size={16} />
                            </button>
                        )}
                        {onAdd && (
                            <button
                                onClick={onAdd}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                                <Plus size={18} />
                            </button>
                        )}
                    </div>
                </div>

                <div>
                    <span className="text-2xl font-bold text-gray-900 block">
                        {value}
                    </span>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                        {unit}
                    </span>
                </div>

                <div className="mt-3">
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${color}`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    {subtext && (
                        <p className="text-[10px] text-gray-400 mt-1.5 text-right">
                            {subtext}
                        </p>
                    )}
                </div>
            </div>
        );
    },
);

interface ActivityCardsProps {
    steps: number;
    stepsTarget: number;
    water: number;
    waterTarget: number;
    onAddWater: () => void;
    onRemoveWater: () => void;
}

export const ActivityCards: React.FC<ActivityCardsProps> = React.memo(
    ({ steps, stepsTarget, water, waterTarget, onAddWater, onRemoveWater }) => {
        const { t } = useTranslation();
        return (
            <div className="flex gap-3 mb-6">
                {/* Steps Card */}
                <div data-tutorial="steps-card" className="flex-1">
                    <ActivityCard
                        title={t('dashboard.activity.steps')}
                        value={steps}
                        target={stepsTarget}
                        unit={t('dashboard.activity.steps')}
                        icon={Footprints}
                        color="bg-orange-500"
                        subtext={`${t('dashboard.activity.stepsGoal')}: ${stepsTarget}`}
                    />
                </div>

                {/* Water Card */}
                <ActivityCard
                    title={t('dashboard.activity.water')}
                    value={water}
                    target={waterTarget}
                    unit={t('dashboard.activity.waterGlasses')}
                    icon={Droplets}
                    color="bg-blue-400"
                    onAdd={onAddWater}
                    onDecrease={onRemoveWater}
                    subtext={`${water}/${waterTarget}`}
                />
            </div>
        );
    },
);

import { AlertCircle, Brain, LucideIcon, Moon, Shield, Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CoachInsight as ICoachInsight } from '../../types/domain';

interface CoachInsightProps {
    insight: ICoachInsight | null;
}

const CoachInsight: React.FC<CoachInsightProps> = ({ insight }) => {
    const { t } = useTranslation();
    if (!insight) return null;

    // Determine Icon
    const getIcon = (): LucideIcon => {
        switch (insight.icon) {
            case 'Sleep':
                return Moon;
            case 'Brain':
                return Brain;
            case 'Warning':
                return AlertCircle;
            case 'Shield':
                return Shield;
            default:
                return Zap;
        }
    };

    const Icon = getIcon();

    return (
        <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-indigo-500/20 shadow-lg shadow-indigo-900/10">
                {/* Abstract Background Gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

                <div className="relative p-5 flex items-start gap-4">
                    <div className="flex-shrink-0 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <Icon className="w-5 h-5 text-indigo-400" strokeWidth={2} />
                    </div>

                    <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-indigo-300 tracking-wide uppercase text-[11px]">
                            {t('dashboard.coach.insight')}
                        </h4>
                        <p className="text-text-tertiary font-medium leading-relaxed text-sm">
                            {insight.message}
                        </p>
                        {insight.description && (
                            <p className="text-zinc-500 text-xs mt-1">
                                {insight.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoachInsight;

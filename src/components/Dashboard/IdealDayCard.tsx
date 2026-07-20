import { BatteryCharging, Droplet, Moon, Utensils, Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { IdealDayPilot } from '../../hooks/useIdealDayPilot';

interface IdealDayCardProps {
    pilot: IdealDayPilot;
}

/**
 * IdealDayCard - Displays the personalized "Ideal Routine" for the user.
 */
export const IdealDayCard: React.FC<IdealDayCardProps> = ({ pilot }) => {
    const { t } = useTranslation();

    if (!pilot.hasData) {
        return (
            <div className="bg-surface rounded-card p-6 shadow-card border border-border">
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="text-text-secondary" size={20} />
                    <h3 className="text-text-primary font-bold text-lg">
                        {t('dashboard.idealDay.title')}
                    </h3>
                </div>
                <div className="text-center py-8">
                    <Zap size={48} className="mx-auto mb-3 text-text-tertiary" />
                    <p className="text-text-tertiary text-sm">
                        {t('dashboard.idealDay.empty')}
                    </p>
                </div>
            </div>
        );
    }

    const { suggestions, optimalWindow } = pilot;

    const getIcon = (iconName: string, color: string) => {
        switch (iconName) {
            case 'Moon':
                return <Moon size={18} className={color} />;
            case 'Utensils':
                return <Utensils size={18} className={color} />;
            case 'Zap':
                return <Zap size={18} className={color} />;
            case 'BatteryCharging':
                return <BatteryCharging size={18} className={color} />;
            case 'Droplet':
                return <Droplet size={18} className={color} />;
            default:
                return <Zap size={18} className={color} />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'sleep':
                return {
                    bg: 'bg-primary-soft',
                    text: 'text-primary',
                    icon: 'text-primary',
                };
            case 'nutrition':
                return {
                    bg: 'bg-success-soft',
                    text: 'text-success',
                    icon: 'text-success',
                };
            case 'training':
                return {
                    bg: 'bg-warning-soft',
                    text: 'text-warning',
                    icon: 'text-warning',
                };
            case 'habit':
                return {
                    bg: 'bg-info-soft',
                    text: 'text-info',
                    icon: 'text-info',
                };
            default:
                return {
                    bg: 'bg-background',
                    text: 'text-text-secondary',
                    icon: 'text-text-tertiary',
                };
        }
    };

    return (
        <div className="bg-surface rounded-card p-6 shadow-card border border-border overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-warning-soft/50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-warning-soft rounded-control">
                        <Zap className="text-warning" size={20} />
                    </div>
                    <div>
                        <h3 className="text-text-primary font-bold text-lg">
                            {t('dashboard.idealDay.title')}
                        </h3>
                        <p className="text-[10px] text-warning font-bold tracking-widest uppercase">
                            {t('dashboard.idealDay.beta')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Optimal Window Summary */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-background rounded-control border border-border min-w-0">
                    <p className="text-[10px] text-text-tertiary font-bold uppercase mb-1 truncate">
                        {t('dashboard.idealDay.optimalSleep')}
                    </p>
                    <p className="text-base lg:text-lg font-black text-text-primary truncate">
                        {optimalWindow.bedtime}{' '}
                        <span className="text-xs font-normal text-text-tertiary">→</span>{' '}
                        {optimalWindow.wakeTime}
                    </p>
                </div>
                <div className="p-3 bg-background rounded-control border border-border min-w-0">
                    <p className="text-[10px] text-text-tertiary font-bold uppercase mb-1 truncate">
                        {t('dashboard.idealDay.metabolicWindow')}
                    </p>
                    <p className="text-base lg:text-lg font-black text-text-primary truncate">
                        {optimalWindow.eatingWindow.start}{' '}
                        <span className="text-xs font-normal text-text-tertiary">→</span>{' '}
                        {optimalWindow.eatingWindow.end}
                    </p>
                </div>
            </div>

            {/* Dynamic Suggestions */}
            <div className="space-y-3">
                {suggestions.map((item) => {
                    const colors = getTypeColor(item.type);
                    return (
                        <div
                            key={item.id}
                            className={`flex gap-3 p-3 rounded-control border border-transparent hover:border-border transition-colors`}>
                            <div
                                className={`mt-1 p-2 h-fit rounded-control ${colors.bg}`}>
                                {getIcon(item.icon, colors.icon)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-0.5">
                                    <h4 className="text-sm font-bold text-text-primary">
                                        {item.title}
                                    </h4>
                                    {item.time && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-surface-lighter text-text-tertiary rounded uppercase">
                                            {item.time}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-text-tertiary leading-relaxed">
                                    {item.suggestion}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
                <p className="text-[10px] text-text-tertiary italic text-center">
                    {t('dashboard.idealDay.disclaimer')}
                </p>
            </div>
        </div>
    );
};

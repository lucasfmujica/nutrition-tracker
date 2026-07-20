import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../../context/TrackerContext';

export const TrackerNavigation: React.FC = () => {
    const { t } = useTranslation();
    const { activeTab, setActiveTab, profile } = useTracker() as any;
    const tabs = profile?.hasOuraRing ? ['pasos', 'oura'] : ['pasos'];

    if (!tabs.includes(activeTab)) return null;

    return (
        <nav className="bg-surface border-b border-border px-4 shadow-sm">
            <div className="max-w-6xl mx-auto flex gap-1">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 text-sm font-bold transition-all ${
                            activeTab === tab
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-text-tertiary hover:text-text-primary hover:bg-background'
                        }`}>
                        {tab === 'oura'
                            ? `💍 ${t('tabs.oura')}`
                            : `👟 ${t('tabs.steps')}`}
                    </button>
                ))}
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className="ml-auto text-text-tertiary text-xs px-2">
                    ← {t('navigation.back')}
                </button>
            </div>
        </nav>
    );
};

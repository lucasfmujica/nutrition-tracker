import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * PreferencesSection - Unit system, language and appearance (theme) toggles.
 * Rendered inside the profile card in ConfigTab.
 */
export const PreferencesSection: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { unitSystem, updateUnitSystem } = useTracker();
    const { theme, setTheme } = useTheme();

    return (
        <div className="mb-8">
            <h2 className="text-xs font-black text-text-tertiary mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                {t('config.preferences.title')}
            </h2>

            <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                {t('config.preferences.unitSystem')}
            </label>
            <div className="flex gap-2">
                <button
                    onClick={() => updateUnitSystem('metric')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                        unitSystem === 'metric'
                            ? 'bg-primary text-white shadow-glow'
                            : 'bg-background text-text-tertiary hover:bg-surface-lighter'
                    }`}>
                    {t('config.preferences.metric')}
                </button>
                <button
                    onClick={() => updateUnitSystem('imperial')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                        unitSystem === 'imperial'
                            ? 'bg-primary text-white shadow-glow'
                            : 'bg-background text-text-tertiary hover:bg-surface-lighter'
                    }`}>
                    {t('config.preferences.imperial')}
                </button>
            </div>

            <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1 mt-4">
                {t('config.preferences.language')}
            </label>
            <div className="flex gap-2">
                <button
                    onClick={() => i18n.changeLanguage('es')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                        i18n.language === 'es'
                            ? 'bg-primary text-white shadow-glow'
                            : 'bg-background text-text-tertiary hover:bg-surface-lighter'
                    }`}>
                    {t('config.preferences.spanish')}
                </button>
                <button
                    onClick={() => i18n.changeLanguage('en')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                        i18n.language === 'en'
                            ? 'bg-primary text-white shadow-glow'
                            : 'bg-background text-text-tertiary hover:bg-surface-lighter'
                    }`}>
                    {t('config.preferences.english')}
                </button>
            </div>

            {/* Preferences Section: Appearance */}
            <div className="mb-8">
                <h2 className="text-xs font-black text-text-tertiary mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                    {t('config.preferences.appearance')}
                </h2>

                <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-1">
                    {t('config.preferences.theme')}
                </label>
                <div className="flex gap-2">
                    <button
                        onClick={() => setTheme('light')}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                            theme === 'light'
                                ? 'bg-primary text-white shadow-glow'
                                : 'bg-background text-text-tertiary hover:bg-surface-lighter'
                        }`}>
                        {t('config.preferences.light')}
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                            theme === 'dark'
                                ? 'bg-primary text-white shadow-glow'
                                : 'bg-background text-text-tertiary hover:bg-surface-lighter'
                        }`}>
                        {t('config.preferences.dark')}
                    </button>
                    <button
                        onClick={() => setTheme('system')}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                            theme === 'system'
                                ? 'bg-primary text-white shadow-glow'
                                : 'bg-background text-text-tertiary hover:bg-surface-lighter'
                        }`}>
                        {t('config.preferences.system')}
                    </button>
                </div>
            </div>
        </div>
    );
};

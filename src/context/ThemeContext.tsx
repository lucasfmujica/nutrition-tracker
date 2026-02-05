import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTracker } from './TrackerContext';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { profile, updateConfig, customTargets } = useTracker();

    // Initialize from localStorage to avoid flash of wrong theme
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved === 'light' || saved === 'dark' || saved === 'system') {
                return saved;
            }
        }
        return 'system';
    });

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    // Sync from Supabase profile when it loads
    useEffect(() => {
        if (profile?.theme && profile.theme !== theme) {
            setThemeState(profile.theme);
        }
    }, [profile?.theme]);

    // Handle system preference changes and theme updates
    useEffect(() => {
        const root = window.document.documentElement;
        let targetTheme = theme;

        if (targetTheme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
                .matches
                ? 'dark'
                : 'light';
            targetTheme = systemTheme;
        }

        root.classList.remove('light', 'dark');
        root.classList.add(targetTheme);
        setResolvedTheme(targetTheme as 'light' | 'dark');

        // Save to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        // Persist to Supabase if we have a profile to update
        if (profile && updateConfig && customTargets) {
            // We use a small delay or debounce in real apps, but here direct update is fine
            // provided updateConfig handles it well.
            // Note: We need to cast profile to any because we just added theme to the type
            // and types might not be fully propagated in this file's scope yet if strictly checked,
            // but effectively we just updated domain.ts so it should be fine.
            updateConfig({ ...profile, theme: newTheme }, customTargets);
        }
    };

    // Listen for system changes if mode is system
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            const root = window.document.documentElement;
            const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
            root.classList.remove('light', 'dark');
            root.classList.add(newSystemTheme);
            setResolvedTheme(newSystemTheme);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

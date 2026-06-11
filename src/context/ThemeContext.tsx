import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
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

    // Debounce the Supabase profile write so rapid theme toggles don't rewrite the
    // entire profile on every click. The theme itself applies instantly via the DOM
    // class + localStorage (effect above); only the cloud persistence is delayed.
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        if (!profile || !updateConfig || !customTargets) return;

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            updateConfig({ ...profile, theme: newTheme }, customTargets);
        }, 800);
    };

    // Flush/cleanup the pending theme save on unmount.
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

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

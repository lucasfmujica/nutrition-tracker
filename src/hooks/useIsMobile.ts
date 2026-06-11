import { useEffect, useState } from 'react';

const MOBILE_QUERY = '(max-width: 639px)';

/**
 * useIsMobile - Shared hook to detect mobile viewports (< 640px, Tailwind `sm` breakpoint).
 * Uses matchMedia and stays in sync on resize/orientation change.
 */
export function useIsMobile(query: string = MOBILE_QUERY): boolean {
    const [isMobile, setIsMobile] = useState<boolean>(() =>
        typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia(query).matches
            : false,
    );

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
            return;
        const mql = window.matchMedia(query);
        const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        setIsMobile(mql.matches);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [query]);

    return isMobile;
}

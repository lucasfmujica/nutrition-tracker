import React from 'react';
import ReactDOM from 'react-dom/client';
import NutritionTracker from './NutritionTracker';
import './i18n/config';
import './index.css';

// Global error handlers to suppress browser extension errors
window.addEventListener('unhandledrejection', (event) => {
    // @ts-ignore
    if (event.reason?.message?.includes('message channel closed')) {
        event.preventDefault();
        // @ts-ignore
        console.debug('[Suppressed] Browser extension error:', event.reason.message);
        return;
    }
});

// Suppress harmless Recharts width/height warnings during initial render
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
    const message = args[0];

    if (
        typeof message === 'string' &&
        message.includes('width(-1) and height(-1)')
    ) {
        return;
    }

    originalWarn.apply(console, args);
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <NutritionTracker />
    </React.StrictMode>,
);

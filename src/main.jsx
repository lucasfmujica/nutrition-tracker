import React from 'react';
import ReactDOM from 'react-dom/client';
import NutritionTracker from './NutritionTracker.jsx';
import './index.css';

// Global error handlers to suppress browser extension errors
window.addEventListener('unhandledrejection', (event) => {
  // Suppress "message channel closed" errors from browser extensions
  if (event.reason?.message?.includes('message channel closed')) {
    event.preventDefault();
    console.debug('[Suppressed] Browser extension error:', event.reason.message);
    return;
  }
  // Let other errors through
});

// Suppress harmless Recharts width/height warnings during initial render
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];

  // Filter out Recharts dimension warnings (harmless, occur during initial render)
  if (typeof message === 'string' && message.includes('width(-1) and height(-1)')) {
    return;
  }

  // Let all other warnings through
  originalWarn.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NutritionTracker />
  </React.StrictMode>,
)

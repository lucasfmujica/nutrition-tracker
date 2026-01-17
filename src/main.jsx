import React from 'react'
import ReactDOM from 'react-dom/client'
import NutritionTracker from './NutritionTracker.jsx'
import './index.css'

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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NutritionTracker />
  </React.StrictMode>,
)

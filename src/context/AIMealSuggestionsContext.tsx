import React, { createContext, ReactNode, useContext } from 'react';
import { useAIMealSuggestions } from '../hooks/useAIMealSuggestions';

/**
 * AI Meal Suggestions Context
 *
 * Extracted from TrackerContext so its high-frequency state — notably the
 * once-a-minute `currentHour` tick — only re-renders the handful of AI Chef
 * components, instead of every `useTracker()` consumer in the app.
 */
type AIMealSuggestionsValue = ReturnType<typeof useAIMealSuggestions>;

const AIMealSuggestionsContext = createContext<AIMealSuggestionsValue | null>(null);

export const AIMealSuggestionsProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const value = useAIMealSuggestions();
    return (
        <AIMealSuggestionsContext.Provider value={value}>
            {children}
        </AIMealSuggestionsContext.Provider>
    );
};

export const useAIMeals = (): AIMealSuggestionsValue => {
    const context = useContext(AIMealSuggestionsContext);
    if (!context) {
        throw new Error(
            'useAIMeals must be used within an AIMealSuggestionsProvider',
        );
    }
    return context;
};

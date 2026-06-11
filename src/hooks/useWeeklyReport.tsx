import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { retryWithBackoff } from '../utils/retryWithBackoff';

/**
 * Weekly Stats Response Type
 */
export interface WeeklyStats {
    // Activity
    workouts: number;
    gymCount: number;
    tennisCount: number;

    // Nutrition
    proteinAvg: number;
    avgDeficit: number;
    consistencyStreak: number;
    daysTracked: number;

    // Weight
    weightDelta: number | null;
    totalLost: number | null;
    percentToGoal: number | null;
    currentWeight: number | null;

    // Meta
    weekRange: string;
}

/**
 * useWeeklyReport - Hook for fetching weekly stats for Social Accountability Reports
 *
 * Manages API calls, loading states, and error handling for the weekly report feature.
 * Gets user ID directly from Supabase auth to ensure availability.
 * Implements retry logic with exponential backoff for resilience.
 *
 * @returns {Object} { stats, isLoading, error, fetchStats }
 */
export const useWeeklyReport = () => {
    const [stats, setStats] = useState<WeeklyStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (!supabase) throw new Error('Supabase no configurado');

            // Get user directly from Supabase auth (more reliable than hook state)
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user?.id) {
                const timestamp = new Date().toISOString();
                console.error(`[useWeeklyReport ${timestamp}] No userId available from auth`);
                setError('No se pudo obtener el usuario');
                setIsLoading(false);
                return null;
            }

            const timestamp = new Date().toISOString();
            console.log(`[useWeeklyReport ${timestamp}] Fetching stats for user: ${user.id}`);

            // Determine API URL based on environment
            const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:3000';

            // Get the current access token to authenticate the request.
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const accessToken = session?.access_token;
            if (!accessToken) {
                setError('Sesión expirada. Iniciá sesión nuevamente.');
                setIsLoading(false);
                return null;
            }

            // Wrap fetch in retryWithBackoff for resilience
            const data = await retryWithBackoff(async () => {
                const response = await fetch(`${baseUrl}/api/get-weekly-stats`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al obtener estadísticas');
                }

                return response.json();
            }, 3, 1000);

            setStats(data);
            return data;
        } catch (err: any) {
            const timestamp = new Date().toISOString();
            console.error(`[useWeeklyReport ${timestamp}] Fetch error:`, err);
            setError(err.message || 'Error de conexión');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        stats,
        isLoading,
        error,
        fetchStats,
    };
};

import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useWeeklyReport - Hook for fetching weekly stats for Social Accountability Reports
 *
 * Manages API calls, loading states, and error handling for the weekly report feature.
 * Gets user ID directly from Supabase auth to ensure availability.
 *
 * @returns {Object} { stats, isLoading, error, fetchStats }
 */
export const useWeeklyReport = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get user directly from Supabase auth (more reliable than hook state)
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.id) {
        console.error('[useWeeklyReport] No userId available from auth');
        setError('No se pudo obtener el usuario');
        setIsLoading(false);
        return null;
      }

      console.log('[useWeeklyReport] Fetching stats for user:', user.id);

      // Determine API URL based on environment
      const baseUrl = import.meta.env.PROD
        ? ''
        : 'http://localhost:3000';

      const response = await fetch(`${baseUrl}/api/get-weekly-stats?userId=${user.id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener estadísticas');
      }

      const data = await response.json();
      console.log('[useWeeklyReport] Stats received:', data);

      setStats(data);
      return data;
    } catch (err) {
      console.error('[useWeeklyReport] Fetch error:', err);
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
    fetchStats
  };
};

import { useState, useEffect, useCallback } from 'react';
import * as dashboardService from '../services/dashboardService';

export const useDashboardStats = (periode = 'week', { enabled = true } = {}) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.fetchDashboardStats(periode);
      setStats(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [periode, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { stats, loading, error, reload };
};

export default useDashboardStats;

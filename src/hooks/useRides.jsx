import { useState, useEffect, useCallback } from 'react';
import * as rideService from '../services/rideService';

export const useRides = (input = {}, { enabled = true } = {}) => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await rideService.fetchRidesAsCourses(input);
      setRides(data);
    } catch (e) {
      setError(e.message);
      setRides([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, JSON.stringify(input)]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { rides, loading, error, reload, setRides };
};

export default useRides;

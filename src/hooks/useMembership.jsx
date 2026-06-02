import { useState, useEffect, useCallback } from 'react';
import * as membershipService from '../services/membershipService';

export const useMembership = ({ enabled = true } = {}) => {
  const [membership, setMembership] = useState(null);
  const [plan, setPlan] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const sub = await membershipService.getMySubscription();
      setMembership(sub.data);
      setPlan(sub.data?.plan || 'basic');
    } catch (e) {
      setError(e.message);
      setPlan('basic');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { membership, plan, loading, error, reload };
};

export default useMembership;

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserCredits } from '@/services/supabaseService';

export function useCredits() {
  const { user } = useUser();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const userCredits = await getUserCredits(user.id);
      setCredits(userCredits);
    } catch (err) {
      console.error('Error refreshing credits:', err);
      setError('Failed to refresh credits');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Only fetch on mount and when user changes
  useEffect(() => {
    fetchCredits();
  }, [user?.id]); // Only depend on user.id, not the entire fetchCredits function

  const refreshCredits = useCallback(async () => {
    await fetchCredits();
  }, [fetchCredits]);

  return {
    credits,
    loading,
    error,
    refreshCredits
  };
} 
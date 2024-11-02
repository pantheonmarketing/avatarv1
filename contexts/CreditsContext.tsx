'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserCredits, deductCredits } from '@/services/supabaseService';

interface CreditsContextType {
  credits: number;
  loading: boolean;
  error: string | null;
  refreshCredits: () => Promise<void>;
  useCredits: (amount: number) => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType>({
  credits: 0,
  loading: false,
  error: null,
  refreshCredits: async () => {},
  useCredits: async () => {},
});

export function useCreditsContext() {
  return useContext(CreditsContext);
}

// Export the useCredits hook
export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCredits = async () => {
    if (!isLoaded || !user) return;

    try {
      setLoading(true);
      setError(null);
      const userCredits = await getUserCredits(user.id);
      setCredits(userCredits);
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError('Failed to load credits');
    } finally {
      setLoading(false);
    }
  };

  const useCredits = async (amount: number) => {
    if (!user) throw new Error('No user found');

    try {
      setLoading(true);
      setError(null);
      await deductCredits(user.id, amount);
      await refreshCredits();
    } catch (err) {
      console.error('Error using credits:', err);
      setError('Failed to use credits');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCredits();
  }, [isLoaded, user]);

  return (
    <CreditsContext.Provider value={{ credits, loading, error, refreshCredits, useCredits }}>
      {children}
    </CreditsContext.Provider>
  );
} 
'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { setupUser } from '@/services/supabaseService';

export function useInitializeUser() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      const initUser = async () => {
        try {
          await setupUser(user.id, user.primaryEmailAddress?.emailAddress || '');
        } catch (error) {
          console.error('Error initializing user:', error);
        }
      };

      initUser();
    }
  }, [isLoaded, user]);
} 
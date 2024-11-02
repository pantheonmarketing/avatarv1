'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { setupUser, initializeSupabase } from '@/services/supabaseService';
import { debug } from '@/utils/debug';

export function UserInitializer() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Initialize Supabase when component mounts
    initializeSupabase().catch(error => {
      debug.error(error, 'Failed to initialize Supabase');
    });

    if (isLoaded && user) {
      const initUser = async () => {
        try {
          await setupUser(user.id, user.primaryEmailAddress?.emailAddress || '');
        } catch (error) {
          debug.error(error, 'Error initializing user');
        }
      };

      initUser();
    }
  }, [isLoaded, user]);

  return null;
} 
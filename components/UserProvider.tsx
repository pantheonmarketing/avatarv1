'use client';

import React, { useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/services/supabaseService';
import toast from 'react-hot-toast';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, user } = useUser();

  const syncUser = useCallback(async () => {
    if (!isLoaded || !user) return;

    try {
      console.log('Syncing user:', user.id);
      
      // First check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('p_user_id', user.id)
        .single();

      console.log('Existing user check:', { existingUser, checkError });

      // If no user found or error is "no rows", create new user
      if (!existingUser || (checkError && checkError.code === 'PGRST116')) {
        console.log('Creating new user...');
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([
            {
              p_user_id: user.id,
              email: user.emailAddresses[0].emailAddress,
              username: user.username || user.firstName || 'user',
              credits: 5, // Default credits
              is_authenticated: true,
              updated_by: user.emailAddresses[0].emailAddress,
              last_updated: new Date().toISOString(),
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          throw createError;
        }

        console.log('Created new user:', newUser);
        toast.success('Welcome! You have been given 5 credits to start.');
      } else {
        console.log('User already exists:', existingUser);
      }
    } catch (error) {
      console.error('Error syncing user:', error);
      toast.error('Error syncing user data');
    }
  }, [isLoaded, user]);

  useEffect(() => {
    syncUser();
  }, [syncUser]);

  return children;
} 
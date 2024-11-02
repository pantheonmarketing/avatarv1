import { createClient } from '@supabase/supabase-js';
import { useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

// Initialize Supabase client with error handling
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
};

// Create supabase instance only when environment variables are available
const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null;

export async function createOrGetUser(clerkUser: any) {
  if (!clerkUser) {
    throw new Error('No user data provided');
  }

  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', clerkUser.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!existingUser) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            user_id: clerkUser.id,
            username: clerkUser.username || clerkUser.firstName || 'user',
            email: clerkUser.emailAddresses[0].emailAddress,
            password_hash: 'clerk_managed'
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      return newUser;
    }

    return existingUser;
  } catch (error) {
    console.error('Error in createOrGetUser:', error);
    throw error;
  }
}

export function useSyncUser() {
  const { user } = useUser();

  const syncUser = useCallback(async () => {
    if (user) {
      try {
        await createOrGetUser(user);
      } catch (error) {
        console.error('Error syncing user:', error);
      }
    }
  }, [user]);

  return { syncUser };
} 
import { supabase } from './supabaseService';
import type { UserManagement, BulkUserImport, CreditLog } from '@/types/admin';
import { debug } from '@/utils/debug';
import { PostgrestError } from '@supabase/supabase-js';

export async function fetchAllUsers(): Promise<UserManagement[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchUserCreditLogs(userId: string): Promise<CreditLog[]> {
  const { data, error } = await supabase
    .from('credits_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateUserCredits(userId: string, amount: number) {
  try {
    debug.log('Updating user credits:', { userId, amount });

    // First get current credits
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (fetchError) {
      debug.error('Error fetching user credits:', fetchError.message);
      throw new Error(`Failed to fetch user credits: ${fetchError.message}`);
    }

    // Calculate new credits (allow negative adjustments for admin)
    const newCredits = (userData.credits || 0) + amount;
    
    // No need to check for insufficient credits in admin dashboard
    const { data, error: updateError } = await supabase
      .from('users')
      .update({ credits: newCredits })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      debug.error('Error updating credits:', updateError.message);
      throw new Error(`Failed to update credits: ${updateError.message}`);
    }

    debug.log('Credits updated successfully:', {
      oldCredits: userData.credits,
      adjustment: amount,
      newCredits
    });

    return data;
  } catch (error) {
    debug.error('Error in updateUserCredits:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function importUsersFromCSV(fileContent: string): Promise<BulkUserImport> {
  try {
    const emails = fileContent
      .split('\n')
      .map(line => line.trim())
      .filter(email => email.includes('@'));

    const result = await addBulkUsers(emails);
    return {
      emails,
      success: true,
      error: undefined
    };
  } catch (error: any) {
    return {
      emails: [],
      success: false,
      error: error.message
    };
  }
}

export async function addBulkUsers(emails: string[], defaultCredits: number = 5) {
  try {
    debug.log('Adding bulk users:', { emails, defaultCredits });
    
    // Generate temporary clerk_user_ids for bulk imports
    const usersToInsert = emails.map(email => {
      const tempId = crypto.randomUUID();
      return {
        id: crypto.randomUUID(),
        clerk_user_id: `temp_${tempId}`, // Prefix with temp_ to identify bulk imported users
        email: email,
        credits: defaultCredits,
        is_active: true
      };
    });

    debug.log('Inserting users:', usersToInsert);

    const { data, error } = await supabase
      .from('users')
      .insert(usersToInsert)
      .select();

    if (error) {
      debug.error('Error inserting bulk users:', error.message || JSON.stringify(error));
      throw error;
    }

    debug.log('Successfully added bulk users:', data?.length);
    return data;
  } catch (error) {
    debug.error('Error adding bulk users:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  try {
    debug.log('Toggling user status:', { userId, isActive });
    
    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_active: isActive,
        is_authenticated: isActive // Update both flags together
      })
      .eq('id', userId)
      .select();

    if (error) {
      debug.error('Error toggling user status:', error.message || JSON.stringify(error));
      throw error;
    }

    debug.log('User status updated:', data);
    return data;
  } catch (error) {
    debug.error('Error in toggleUserStatus:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function deleteUser(userId: string) {
  try {
    // Delete user's avatars first
    await supabase
      .from('avatars')
      .delete()
      .eq('user_id', userId);

    // Delete user's credit logs
    await supabase
      .from('credits_log')
      .delete()
      .eq('user_id', userId);

    // Finally delete the user
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) {
      debug.error('Error deleting user:', userError.message || JSON.stringify(userError));
      throw userError;
    }

    return true;
  } catch (error) {
    debug.error('Error in deleteUser:', error instanceof Error ? error.message : String(error));
    throw error;
  }
} 
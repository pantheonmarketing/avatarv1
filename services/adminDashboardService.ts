import { supabase } from './supabaseService';
import type { UserManagement, BulkUserImport, CreditLog } from '@/types/admin';
import { debug } from '@/utils/debug';

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

export async function updateUserCredits(userId: string, amount: number, isAdd: boolean = true) {
  try {
    debug.log('Starting credit update:', { userId, amount, isAdd });
    
    // Get current credits
    debug.log('Fetching current user credits...');
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*') // Select all to get both id and clerk_user_id
      .eq('id', userId)
      .single();

    if (fetchError) {
      debug.error('Error fetching user:', fetchError);
      throw fetchError;
    }
    if (!user) {
      debug.error('User not found:', userId);
      throw new Error('User not found');
    }

    debug.log('Current user data:', user);

    // Calculate new amount - FIX: Swap the operation based on isAdd
    const newCredits = isAdd 
      ? user.credits + amount  // If isAdd is true, we add
      : user.credits - amount; // If isAdd is false, we subtract

    // Check for negative balance only when removing credits
    if (!isAdd && newCredits < 0) {
      debug.error('Insufficient credits:', { current: user.credits, requested: amount });
      throw new Error('Insufficient credits');
    }

    debug.log('Updating credits to:', newCredits);

    // Update credits
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ credits: newCredits })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      debug.error('Error updating credits:', updateError);
      throw updateError;
    }

    debug.log('Credits updated successfully:', updatedUser);

    // Log the transaction - FIX: amount should be positive for add, negative for remove
    debug.log('Creating credit log entry...');
    const { error: logError } = await supabase
      .from('credits_log')
      .insert({
        user_id: userId,
        clerk_user_id: user.clerk_user_id,
        amount: isAdd ? amount : -amount, // Positive for add, negative for remove
        action_type: isAdd ? 'admin_add' : 'admin_remove',
        description: `Admin ${isAdd ? 'added' : 'removed'} ${amount} credits`
      });

    if (logError) {
      debug.error('Error creating credit log:', logError);
      throw logError;
    }

    debug.log('Credit log created successfully');
    return updatedUser;
  } catch (error) {
    debug.error('Failed to update credits:', error);
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
      debug.error('Error inserting bulk users:', error);
      throw error;
    }

    debug.log('Successfully added bulk users:', data?.length);
    return data;
  } catch (error) {
    debug.error('Error adding bulk users:', error);
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
      debug.error('Error toggling user status:', error);
      throw error;
    }

    debug.log('User status updated:', data);
    return data;
  } catch (error) {
    debug.error('Error toggling user status:', error);
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

    if (userError) throw userError;

    return true;
  } catch (error) {
    debug.error(error, 'Error deleting user');
    throw error;
  }
} 
import { supabase } from './supabaseService.js';

export async function addUserCredits(userId: string, amount: number) {
  try {
    // First get current credits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Calculate new credit amount
    const newCredits = (user?.credits || 0) + amount;

    // Update user credits
    const { data, error: updateError } = await supabase
      .from('users')
      .update({ credits: newCredits })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log the transaction
    const { error: logError } = await supabase
      .from('credits_log')
      .insert({
        user_id: userId,
        amount: amount,
        action_type: 'admin_add',
        description: `Admin added ${amount} credits`
      });

    if (logError) throw logError;

    return data;
  } catch (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
}

export async function addBulkUsers(emails: string[], defaultCredits: number = 5) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert(
        emails.map(email => ({
          id: crypto.randomUUID(), // Generate UUID for each user
          email: email,
          credits: defaultCredits,
          is_active: true
        }))
      )
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding bulk users:', error);
    throw error;
  }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error toggling user status:', error);
    throw error;
  }
}

export async function deleteUser(userId: string) {
  try {
    // Delete user's avatars first
    const { error: avatarsError } = await supabase
      .from('avatars')
      .delete()
      .eq('user_id', userId);

    if (avatarsError) throw avatarsError;

    // Delete user's credit logs
    const { error: logsError } = await supabase
      .from('credits_log')
      .delete()
      .eq('user_id', userId);

    if (logsError) throw logsError;

    // Finally delete the user
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) throw userError;

    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

export async function removeUserCredits(userId: string, amount: number) {
  try {
    const { data, error } = await supabase.rpc('deduct_credits', {
      user_id: userId,
      amount: amount
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error removing credits:', error);
    throw error;
  }
} 
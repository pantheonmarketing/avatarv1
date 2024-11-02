import { createClient, PostgrestError } from '@supabase/supabase-js';
import type { Database } from '../types/supabase.js';
import environment from '@/config/environment';
import { debug } from '@/utils/debug';

const { url: supabaseUrl, key: supabaseKey } = environment.supabase;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Initialize function instead of top-level await
export async function initializeSupabase() {
  try {
    const { error } = await supabase.rpc('set_environment', {
      env: 'test'
    });
    
    if (error) {
      debug.error(error, 'Error setting test environment');
    }
  } catch (error) {
    debug.error(error, 'Error initializing Supabase');
  }
}

// Helper function to format error messages
const formatError = (error: PostgrestError | Error | unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return String(error);
};

const ADMIN_EMAILS = [
  'yoniwe@gmail.com',
  'jonnypantheonmarketing@gmail.com'
];

export async function setupUser(userId: string, email: string) {
  try {
    debug.log('Setting up user:', { userId, email });

    // Check if user is admin
    const isAdmin = ADMIN_EMAILS.includes(email);
    debug.log('Admin check:', { isAdmin, email });

    // First check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    if (fetchError) {
      debug.error('Error fetching user:', formatError(fetchError));
      throw fetchError;
    }

    if (existingUser) {
      debug.log('Existing user found:', existingUser);
      // Update email and authentication status if needed
      if (existingUser.email !== email || (isAdmin && !existingUser.is_authenticated)) {
        debug.log('Updating user data');
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ 
            email,
            is_authenticated: isAdmin ? true : existingUser.is_authenticated // Auto-authenticate admins
          })
          .eq('clerk_user_id', userId)
          .select()
          .single();

        if (updateError) {
          debug.error('Error updating user:', formatError(updateError));
          return existingUser;
        }
        debug.log('User updated:', updatedUser);
        return updatedUser;
      }
      return existingUser;
    }

    debug.log('Creating new user');
    const newUserId = crypto.randomUUID();
    
    try {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: newUserId,
          clerk_user_id: userId,
          email: email,
          credits: 5,
          is_active: isAdmin ? true : false, // Auto-activate admins
          is_authenticated: isAdmin ? true : false // Auto-authenticate admins
        })
        .select()
        .single();

      if (insertError) {
        debug.error('Error creating user:', formatError(insertError));
        
        if (insertError.code === '23505') {
          debug.log('User already exists, fetching existing user');
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('clerk_user_id', userId)
            .single();

          if (fetchError) {
            debug.error('Error fetching existing user:', formatError(fetchError));
            throw fetchError;
          }

          return existingUser;
        }
        throw insertError;
      }

      debug.log('New user created:', newUser);
      return newUser;
    } catch (insertError) {
      // One final attempt to fetch existing user if creation failed
      debug.log('Attempting to fetch user after creation error');
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', userId)
        .single();
      
      if (fetchError) {
        debug.error('Error fetching user after creation error:', formatError(fetchError));
        throw insertError; // Throw original error if we can't fetch existing user
      }

      if (existingUser) {
        debug.log('Found existing user after creation error:', existingUser);
        return existingUser;
      }

      throw insertError;
    }
  } catch (error) {
    debug.error('Error in user setup:', formatError(error));
    throw error;
  }
}

export async function getUserCredits(userId: string): Promise<number> {
  try {
    debug.log('Fetching credits for user:', userId);
    const { data, error } = await supabase
      .from('users')
      .select('credits')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    if (error) {
      debug.error(error, 'Error fetching credits');
      throw error;
    }

    debug.log('Credits fetched:', data?.credits);
    return data?.credits ?? 0;
  } catch (error) {
    debug.error(error, 'Error checking credits');
    throw error;
  }
}

export async function deductCredit(userId: string, amount: number) {
  try {
    debug.log('Deducting credits:', { userId, amount });
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, credits')
      .eq('clerk_user_id', userId)
      .single();

    if (fetchError) throw fetchError;
    if (!user || user.credits < amount) {
      throw new Error('Insufficient credits');
    }

    const { data, error: updateError } = await supabase
      .from('users')
      .update({ credits: user.credits - amount })
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log the transaction
    const { error: logError } = await supabase
      .from('credits_log')
      .insert({
        user_id: user.id, // Use the Supabase user ID for the foreign key
        clerk_user_id: userId,
        amount: -amount,
        action_type: 'deduct',
        description: 'Credits used for avatar generation'
      });

    if (logError) throw logError;

    debug.log('Credits deducted successfully');
    return data;
  } catch (error) {
    debug.error(error, 'Error deducting credits');
    throw error;
  }
}

export const deductCredits = deductCredit;

export async function saveAvatar(userId: string, avatarData: any) {
  try {
    // First get the Supabase user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError) {
      const errorMessage = formatError(userError);
      debug.error(errorMessage, 'saveAvatar:fetchUser');
      throw userError;
    }

    if (!userData) {
      const errorMessage = `User not found for ID: ${userId}`;
      debug.error(errorMessage, 'saveAvatar:userNotFound');
      throw new Error('User not found');
    }

    // Get the name and career from details
    let name = '';
    let career = '';

    debug.log('Extracting name and career from:', avatarData.details);

    if (typeof avatarData.details === 'object') {
      name = avatarData.details.name || '';
      career = avatarData.details.career || avatarData.details.profession || '';
    } else if (typeof avatarData.details === 'string') {
      const nameMatch = avatarData.details.match(/Name:\s*([^•\n,]+)/);
      const careerMatch = avatarData.details.match(/Career:\s*([^•\n,]+)/);
      
      name = nameMatch ? nameMatch[1].trim() : '';
      career = careerMatch ? careerMatch[1].trim() : '';
    }

    // Clean up the values
    name = name.replace(/[^\w\s-]/g, '').trim();
    career = career.replace(/[^\w\s-]/g, '').trim();

    // Create the avatar name
    const avatarName = name && career ? `${name} - ${career}` : 'Unnamed Avatar';

    debug.log('Generated avatar name:', avatarName);

    // Prepare the avatar data for saving
    const avatarToSave = {
      user_id: userData.id,
      name: avatarName, // Use the properly formatted name
      details: avatarData.details,
      story: avatarData.story,
      current_wants: avatarData.currentWants,
      pain_points: avatarData.painPoints,
      desires: avatarData.desires,
      offer_results: avatarData.offerResults,
      biggest_problem: avatarData.biggestProblem,
      humiliation: avatarData.humiliation,
      frustrations: avatarData.frustrations,
      complaints: avatarData.complaints,
      cost_of_not_buying: avatarData.costOfNotBuying,
      biggest_want: avatarData.biggestWant,
      target_audience: avatarData.targetAudience,
      help_description: avatarData.helpDescription,
      image_url: avatarData.imageUrl,
      clerk_user_id: userId,
      user_email: avatarData.user_email
    };

    // Save to Supabase
    const { data, error } = await supabase
      .from('avatars')
      .insert([avatarToSave])
      .select()
      .single();

    if (error) {
      const errorMessage = formatError(error);
      debug.error(errorMessage, 'saveAvatar:insert');
      throw error;
    }

    debug.log('Avatar saved successfully:', data);
    return data;
  } catch (error) {
    const errorMessage = formatError(error);
    debug.error(errorMessage, 'saveAvatar');
    throw error;
  }
}

export async function checkUserAuthentication(userId: string): Promise<boolean> {
  try {
    debug.log('Checking user authentication status:', userId);
    const { data, error } = await supabase
      .from('users')
      .select('is_authenticated, is_active')
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      debug.error('Error checking user authentication:', formatError(error));
      throw error;
    }

    debug.log('User authentication data:', data);
    
    // User is considered authenticated if both flags are true
    const isAuthenticated = data?.is_authenticated && data?.is_active;
    debug.log('Authentication result:', { 
      isAuthenticated,
      is_authenticated: data?.is_authenticated,
      is_active: data?.is_active 
    });

    return isAuthenticated;
  } catch (error) {
    debug.error('Error checking user authentication:', formatError(error));
    return false;
  }
}

// Add this new function to update existing avatar
export async function updateAvatar(avatarId: string, avatarData: any) {
  try {
    // Prepare the avatar data for updating
    const avatarToUpdate = {
      name: avatarData.name,
      details: avatarData.details,
      story: avatarData.story,
      current_wants: avatarData.currentWants,
      pain_points: avatarData.painPoints,
      desires: avatarData.desires,
      offer_results: avatarData.offerResults,
      biggest_problem: avatarData.biggestProblem,
      humiliation: avatarData.humiliation,
      frustrations: avatarData.frustrations,
      complaints: avatarData.complaints,
      cost_of_not_buying: avatarData.costOfNotBuying,
      biggest_want: avatarData.biggestWant,
      target_audience: avatarData.targetAudience,
      help_description: avatarData.helpDescription,
      image_url: avatarData.imageUrl,
      user_email: avatarData.user_email
    };

    const { data, error } = await supabase
      .from('avatars')
      .update(avatarToUpdate)
      .eq('id', avatarId)
      .select()
      .single();

    if (error) {
      const errorMessage = formatError(error);
      debug.error(errorMessage, 'updateAvatar:update');
      throw error;
    }

    debug.log('Avatar updated successfully:', data);
    return data;
  } catch (error) {
    const errorMessage = formatError(error);
    debug.error(errorMessage, 'updateAvatar');
    throw error;
  }
}

export const refundCredits = async (userId: string, amount: number) => {
  try {
    const { data, error } = await supabase.rpc('refund_credits', {
      p_user_id: userId,
      p_amount: amount
    });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error refunding credits:', error);
    return { success: false, error };
  }
};

export async function deleteAvatar(avatarId: string) {
  try {
    debug.log('🗑️ AVATAR DELETE OPERATION STARTED', {
      function: 'deleteAvatar',
      avatarId,
      timestamp: new Date().toISOString()
    });

    const { error } = await supabase
      .from('avatars')
      .delete()
      .eq('id', avatarId);

    if (error) {
      debug.error(`Error deleting avatar: ${formatError(error)}`, 'deleteAvatar:error');
      throw error;
    }

    debug.log('✅ Avatar deleted successfully', {
      function: 'deleteAvatar',
      avatarId,
      timestamp: new Date().toISOString()
    });

    return true;
  } catch (error) {
    debug.error(`Failed to delete avatar: ${formatError(error)}`, 'deleteAvatar:criticalError');
    throw error;
  }
}
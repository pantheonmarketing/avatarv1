import { supabase } from '../services/supabaseService.js';

async function cleanupTestData() {
  try {
    // Delete test users and related data
    await supabase
      .from('users')
      .delete()
      .like('email', '%@example.com');

    console.log('Test data cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

cleanupTestData(); 
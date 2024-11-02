import { webcrypto } from 'crypto';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables first
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Then import services that use these environment variables
import { setupUser, getUserCredits, deductCredits, saveAvatar } from '../services/supabaseService.js';
import { addUserCredits, toggleUserStatus } from '../services/adminService.js';

// Polyfill for crypto.randomUUID() in Node.js
const crypto = webcrypto as any;

// Log environment variables for debugging
console.log('Environment variables loaded:', {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'not set',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'not set'
});

async function testSupabaseSetup() {
  try {
    // Create test user
    console.log('Testing user setup...');
    const userId = crypto.randomUUID();
    const user = await setupUser(userId, 'test@example.com');
    console.log('User created:', user);

    // Test credit management
    console.log('\nTesting credit management...');
    const initialCredits = await getUserCredits(userId);
    console.log('Initial credits:', initialCredits);

    // Test insufficient credits
    console.log('\nTesting insufficient credits...');
    try {
      await deductCredits(userId, 100);
      console.error('Should have thrown insufficient credits error');
    } catch (error: any) {
      console.log('Successfully caught insufficient credits:', error.message);
    }

    // Test bulk operations
    console.log('\nTesting bulk user creation...');
    const bulkUsers = await addBulkUsers(['test1@example.com', 'test2@example.com']);
    console.log('Bulk users created:', bulkUsers.length);

    // Test user deletion
    console.log('\nTesting user deletion...');
    await deleteUser(userId);
    try {
      await getUserCredits(userId);
      console.error('Should have thrown user not found error');
    } catch (error: any) {
      console.log('Successfully verified user deletion');
    }

    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1); // Exit with error code
  }
}

testSupabaseSetup(); 
'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { setupUser, checkUserAuthentication } from '@/services/supabaseService';
import { debug } from '@/utils/debug';
import { AuthStatusScreen } from './auth-status-screen';
import { useAdmin } from '@/contexts/AdminContext';
import { toast } from 'react-hot-toast';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoaded } = useUser();
  const { isAdmin } = useAdmin();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      if (isLoaded && user) {
        try {
          debug.log('Initializing user:', { 
            userId: user.id, 
            email: user.primaryEmailAddress?.emailAddress,
            isAdmin 
          });

          // Setup user in Supabase
          const userData = await setupUser(user.id, user.primaryEmailAddress?.emailAddress || '');
          debug.log('User data from setup:', userData);
          setIsInitialized(true);

          // Skip auth check for admins
          if (isAdmin) {
            debug.log('User is admin, skipping authentication check');
            setIsAuthenticated(true);
            setIsChecking(false);
            return;
          }

          // Check authentication status
          const authStatus = await checkUserAuthentication(user.id);
          debug.log('Authentication status:', { 
            userId: user.id, 
            isAuthenticated: authStatus,
            isActive: userData.is_active,
            isAuthenticatedFlag: userData.is_authenticated
          });

          setIsAuthenticated(authStatus);
          
          // Only show toast for non-authenticated users
          if (!authStatus) {
            debug.log('User not authenticated, showing toast');
            toast.error('Your account is pending approval. Please wait for admin authorization.');
          }
        } catch (error) {
          debug.error('Error in user initialization:', error instanceof Error ? error.message : String(error));
          toast.error('There was an error setting up your account. Please try again later.');
        } finally {
          setIsChecking(false);
        }
      }
    };

    initializeUser();
  }, [isLoaded, user, isAdmin]);

  if (!isLoaded || !isInitialized || isChecking) {
    debug.log('Loading state:', { isLoaded, isInitialized, isChecking });
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
    </div>;
  }

  // Show pending approval screen for non-authenticated, non-admin users
  if (!isAuthenticated && !isAdmin) {
    debug.log('Showing auth status screen:', { isAuthenticated, isAdmin });
    return <AuthStatusScreen />;
  }

  debug.log('Rendering protected content:', { isAuthenticated, isAdmin });
  return <>{children}</>;
} 
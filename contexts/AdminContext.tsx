'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { debug } from '@/utils/debug';
import { useRouter } from 'next/navigation';

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType>({ 
  isAdmin: false,
  isLoading: true
});

const ADMIN_EMAILS = [
  'yoniwe@gmail.com',
  'jonnypantheonmarketing@gmail.com'
];

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      debug.log('User email:', userEmail);
      debug.log('Admin emails:', ADMIN_EMAILS);
      debug.log('Is admin email?', userEmail && ADMIN_EMAILS.includes(userEmail));
      
      const adminStatus = userEmail ? ADMIN_EMAILS.includes(userEmail) : false;
      setIsAdmin(adminStatus);
      setIsLoading(false);

      // If on admin page but not admin, redirect
      if (window.location.pathname.startsWith('/admin') && !adminStatus) {
        debug.log('Non-admin on admin page, redirecting');
        router.push('/');
      }
    }
  }, [isLoaded, user, router]);

  return (
    <AdminContext.Provider value={{ isAdmin, isLoading }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
} 
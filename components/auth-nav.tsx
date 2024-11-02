'use client';

import { UserButton, useUser } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAdmin } from "@/contexts/AdminContext";
import { usePathname, useRouter } from "next/navigation";
import { debug } from '@/utils/debug';
import { Credits } from "@/components/Credits";
import { Settings, LogOut, User } from 'lucide-react';

export function AuthNav() {
  const { isAdmin, isLoading } = useAdmin();
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const isAdminPage = pathname.startsWith('/admin');

  debug.log('AuthNav render:', { isAdmin, isLoading, pathname, isAdminPage });

  const handleAdminClick = async () => {
    debug.log('Admin link clicked, attempting navigation', { isAdmin, pathname });
    try {
      await router.push('/admin');
      debug.log('Navigation to /admin initiated');
    } catch (error) {
      debug.error('Navigation failed:', error);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
        <Credits />
      </div>

      {!isLoading && isAdmin && !isAdminPage && (
        <button 
          onClick={handleAdminClick}
          className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100"
        >
          Admin Dashboard
        </button>
      )}
      {!isLoading && isAdmin && isAdminPage && (
        <button 
          onClick={() => {
            debug.log('Back to app clicked');
            router.push('/');
          }}
          className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100"
        >
          Back to App
        </button>
      )}
      <ThemeToggle />
      <UserButton 
        appearance={{
          elements: {
            rootBox: "relative",
            userButtonBox: "flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
            userButtonTrigger: "flex items-center gap-2",
            userButtonPopoverCard: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl p-1",
            userButtonPopoverActions: "p-2",
            userButtonPopoverActionButton: "flex items-center gap-2 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm",
            userButtonPopoverActionButtonText: "text-gray-700 dark:text-gray-200",
            userButtonPopoverActionButtonIcon: "text-gray-500 dark:text-gray-400",
            userButtonAvatarBox: "w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700",
            userButtonAvatarImage: "w-full h-full object-cover",
            userButtonOuterIdentifier: "text-sm font-medium text-gray-700 dark:text-gray-200",
          },
          signIn: {
            elements: {
              card: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
              headerTitle: "text-2xl font-bold text-gray-900 dark:text-gray-100",
              headerSubtitle: "text-gray-600 dark:text-gray-400",
              socialButtonsBlockButton: "border border-gray-300 dark:border-gray-600",
              formFieldLabel: "text-gray-700 dark:text-gray-300",
              formFieldInput: "bg-gray-50 dark:bg-gray-700",
              formButtonPrimary: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
            },
          },
        }}
        userProfileMode="navigation"
        userProfileUrl="/profile"
        afterSignOutUrl="/"
        showName={true}
        afterMultiSessionSingleSignOutUrl="/"
      />
    </div>
  );
} 
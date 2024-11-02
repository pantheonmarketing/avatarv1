import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { NextThemeProvider } from './theme-provider'
import { ThemeScript } from './theme-script'
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/nextjs';
import { AuthNav } from '@/components/auth-nav';
import { CreditsProvider } from '@/contexts/CreditsContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { UserInitializer } from '@/components/user-initializer';

export const metadata: Metadata = {
  title: "AI Avatar Creator",
  description: "Create AI-powered avatars for your target audience",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          card: "bg-white dark:bg-gray-800",
          navbar: "bg-white dark:bg-gray-800",
          headerTitle: "text-gray-900 dark:text-white",
          headerSubtitle: "text-gray-600 dark:text-gray-300",
          socialButtonsBlockButton: "text-gray-600 dark:text-gray-300",
          formFieldLabel: "text-gray-700 dark:text-gray-200",
          formFieldInput: "bg-gray-50 dark:bg-gray-700",
          footerAction: "text-gray-600 dark:text-gray-300"
        }
      }}
    >
      <AdminProvider>
        <CreditsProvider>
          <html lang="en" suppressHydrationWarning>
            <head>
              <ThemeScript />
            </head>
            <body className="font-sans antialiased">
              <UserInitializer />
              <NextThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
                  <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <SignedIn>
                      <AuthNav />
                    </SignedIn>
                    <SignedOut>
                      <AuthNav />
                    </SignedOut>
                  </nav>
                </header>
                <div className="pt-16">
                  {children}
                </div>
              </NextThemeProvider>
              <Toaster />
            </body>
          </html>
        </CreditsProvider>
      </AdminProvider>
    </ClerkProvider>
  );
}

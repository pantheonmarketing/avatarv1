'use client';

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-8">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white dark:bg-gray-800 shadow-xl rounded-xl",
              headerTitle: "text-2xl font-bold text-center text-gray-900 dark:text-white",
              headerSubtitle: "text-gray-600 dark:text-gray-300 text-center",
              formButtonPrimary: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
              socialButtonsBlockButton: "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700",
              formFieldInput: "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600",
              footer: "text-center",
              footerAction: "text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
            },
          }}
        />
      </div>
    </div>
  );
} 
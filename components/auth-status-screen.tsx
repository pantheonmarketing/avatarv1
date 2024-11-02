import { Button } from "@/components/ui/button";
import { useUser, SignOutButton } from "@clerk/nextjs";

export function AuthStatusScreen() {
  const { user } = useUser();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-6 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Account Pending Approval
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Hi {user?.firstName || 'there'}! 👋
          </p>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Your account is currently pending administrator approval. This usually takes 1-2 business days.
          </p>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            We'll notify you at {user?.primaryEmailAddress?.emailAddress} once your account is approved.
          </p>
        </div>
        <div className="space-y-4">
          <SignOutButton>
            <Button
              variant="outline"
              className="w-full"
            >
              Sign Out
            </Button>
          </SignOutButton>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Need help? Contact support at support@example.com
          </p>
        </div>
      </div>
    </div>
  );
} 
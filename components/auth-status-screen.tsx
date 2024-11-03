import { Button } from "@/components/ui/button";
import { useUser, SignOutButton } from "@clerk/nextjs";

// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars */

export function AuthStatusScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">
          Account Verification Required
        </h1>
        <p className="mb-4">
          We&apos;re currently reviewing your account. This helps us maintain a high-quality experience for all users.
        </p>
        <p className="text-gray-600">
          You&apos;ll receive an email once your account is verified. This usually takes less than 24 hours.
        </p>
      </div>
    </div>
  );
} 
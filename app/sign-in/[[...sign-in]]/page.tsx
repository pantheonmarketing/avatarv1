'use client';

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import { useState } from 'react';
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const [imageError, setImageError] = useState(false);
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push('/'); // Redirect to home if already signed in
    }
  }, [isSignedIn, router]);

  if (isSignedIn) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Animated background with gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-gray-800 to-gray-900">
        {/* Animated circles */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl w-full mx-4 flex flex-col lg:flex-row gap-8 p-4">
        {/* Left side - Hero Section */}
        <div className="flex-1 hidden lg:block">
          <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-gray-700/50">
            <div className="mb-8">
              {!imageError ? (
                <Image 
                  src="/logo.png"
                  alt="Logo"
                  width={200}
                  height={200}
                  className="mx-auto"
                  onError={() => setImageError(true)}
                  priority
                />
              ) : (
                <div className="w-[200px] h-[200px] mx-auto flex items-center justify-center bg-gray-800 rounded-lg">
                  <span className="text-gray-400">Logo</span>
                </div>
              )}
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
              Welcome to AI Avatar Creator
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              Create personalized AI-powered avatars for your target audience
            </p>
            <div className="space-y-4 mb-8">
              {[
                "Generate detailed audience personas",
                "Create custom avatar profiles",
                "Export professional PDFs",
                "Save and manage multiple avatars",
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 text-gray-300">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Sign In Form */}
        <div className="flex-1">
          <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-gray-700/50">
            <SignIn 
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "bg-transparent shadow-none",
                  headerTitle: "text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent",
                  headerSubtitle: "text-gray-300",
                  socialButtonsBlockButton: "bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 text-gray-200",
                  formFieldLabel: "text-gray-300",
                  formFieldInput: "bg-gray-800/50 border-gray-700 text-gray-200",
                  footerAction: "text-gray-400",
                  formButtonPrimary: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 
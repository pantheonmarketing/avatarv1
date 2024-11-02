'use client';

import { useEffect } from 'react';
import { Coins } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';

export function UserCredits() {
  const { credits, loading, error } = useCredits();

  if (loading) {
    return (
      <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-full">
        <div className="animate-pulse h-4 w-16 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 bg-red-900/50 px-4 py-2 rounded-full">
        <Coins className="h-4 w-4 text-red-500" />
        <span className="text-sm font-medium text-red-200">Error loading credits</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-full">
      <Coins className="h-4 w-4 text-yellow-500" />
      <span className="text-sm font-medium text-gray-200">
        {credits !== null ? `${credits} Credits` : '0 Credits'}
      </span>
    </div>
  );
} 
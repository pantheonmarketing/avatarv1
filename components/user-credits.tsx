'use client';

import { useState } from 'react';
import { useCredits } from '@/contexts/CreditsContext';
import { Badge } from "@/components/ui/badge"
import { Coins } from 'lucide-react';

// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars */

export function UserCredits() {
  const { credits } = useCredits();

  return (
    <div className="flex items-center gap-2">
      <Coins className="h-4 w-4 text-yellow-500" />
      <Badge variant="outline" className="bg-white/10">
        {credits} credits
      </Badge>
    </div>
  );
} 
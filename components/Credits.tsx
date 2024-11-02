'use client';

import { useCreditsContext } from '@/contexts/CreditsContext';
import { Coins } from 'lucide-react';
import { motion } from 'framer-motion';

export function Credits() {
  const { credits, loading, error } = useCreditsContext();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full shadow-inner">
        <Coins className="h-5 w-5 text-yellow-500" />
        <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900 rounded-full">
        <Coins className="h-5 w-5 text-red-500" />
        <span className="text-red-600 dark:text-red-300 font-medium">Error</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-full shadow-md hover:shadow-lg transition-shadow duration-200"
    >
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: [0, -15, 15, -15, 0] }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Coins className="h-5 w-5 text-yellow-500" />
      </motion.div>
      <motion.span 
        className="font-bold text-lg bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 text-transparent bg-clip-text"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {credits}
      </motion.span>
      <motion.span 
        className="text-sm text-gray-500 dark:text-gray-400"
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        credits
      </motion.span>
    </motion.div>
  );
} 
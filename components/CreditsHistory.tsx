'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { fetchUserCreditLogs } from '@/services/adminDashboardService';
import type { CreditLog } from '@/types/admin';

export function CreditsHistory() {
  const { user } = useUser();
  const [history, setHistory] = useState<CreditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  async function loadHistory() {
    try {
      setLoading(true);
      const logs = await fetchUserCreditLogs(user!.id);
      setHistory(logs);
    } catch (err) {
      console.error('Error loading credit history:', err);
      setError('Failed to load credit history');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading history...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-4">
      {history.map((log) => (
        <div 
          key={log.id}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{log.action_type}</p>
              <p className="text-sm text-gray-500">{log.description}</p>
              <p className="text-xs text-gray-400">
                {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
            <span className={`font-bold ${log.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {log.amount > 0 ? '+' : ''}{log.amount}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/services/supabaseService';

interface CreditLog {
  id: string;
  amount: number;
  action_type: string;
  description: string;
  created_at: string;
}

export function CreditsHistory() {
  const { user } = useUser();
  const [creditLogs, setCreditLogs] = useState<CreditLog[]>([]);

  useEffect(() => {
    const fetchCreditHistory = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('credits_log')
          .select('*')
          .eq('clerk_user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCreditLogs(data || []);
      } catch (error) {
        console.error('Error fetching credit history:', error);
      }
    };

    fetchCreditHistory();
  }, [user]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Credits History</h2>
      {creditLogs.map((log) => (
        <div key={log.id} className="p-4 bg-white rounded shadow">
          <div className="flex justify-between">
            <span>{log.description}</span>
            <span className={log.amount > 0 ? 'text-green-600' : 'text-red-600'}>
              {log.amount > 0 ? '+' : ''}{log.amount} credits
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {new Date(log.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
      {creditLogs.length === 0 && (
        <div className="text-gray-500 text-center">No credit history available</div>
      )}
    </div>
  );
} 
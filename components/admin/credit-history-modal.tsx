import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchUserCreditLogs } from '@/services/adminDashboardService';
import type { CreditLog } from '@/types/admin';

interface CreditHistoryModalProps {
  userId: string;
  userEmail: string;
}

export function CreditHistoryModal({ userId, userEmail }: CreditHistoryModalProps) {
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCreditHistory = async () => {
    setLoading(true);
    try {
      const history = await fetchUserCreditLogs(userId);
      setLogs(history);
    } catch (error) {
      console.error('Error loading credit history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={(open) => open && loadCreditHistory()}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">View History</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Credit History - {userEmail}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center p-4">Loading...</div>
        ) : (
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="space-y-4">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
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
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
} 
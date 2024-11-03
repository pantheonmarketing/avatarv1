import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus } from 'lucide-react';
import { debug } from '@/utils/debug';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CreditAdjustmentModalProps {
  onAdjust: (amount: number, isAdd: boolean) => Promise<void>;
  currentCredits: number;
}

const PRESET_AMOUNTS = [5, 10, 20, 50, 100];

export function CreditAdjustmentModal({ onAdjust, currentCredits }: CreditAdjustmentModalProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(true);

  const handleAdjust = async () => {
    if (!amount || isNaN(Number(amount))) return;
    
    setIsLoading(true);
    try {
      await onAdjust(Number(amount), isAdd);
      setIsOpen(false);
      setAmount('');
    } catch (error) {
      debug.error('Failed to adjust credits:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (presetAmount: number) => {
    setAmount(presetAmount.toString());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-[140px]">
          Adjust Credits
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Credits</DialogTitle>
          <DialogDescription>
            Current balance: {currentCredits} credits
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Operation Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant={!isAdd ? "default" : "outline"}
              onClick={() => setIsAdd(false)}
              className="flex items-center justify-center gap-2 h-20"
            >
              <Plus className="h-6 w-6" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Add Credits</span>
                <span className="text-xs opacity-70">Increase balance</span>
              </div>
            </Button>
            <Button 
              variant={isAdd ? "default" : "outline"}
              onClick={() => setIsAdd(true)}
              className="flex items-center justify-center gap-2 h-20"
            >
              <Minus className="h-6 w-6" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Remove Credits</span>
                <span className="text-xs opacity-70">Decrease balance</span>
              </div>
            </Button>
          </div>

          {/* Quick Amount Selection */}
          <div className="space-y-2">
            <Label>Quick Select Amount</Label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Custom Amount</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount..."
              className="text-lg"
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">Preview</div>
            <div className="text-lg font-semibold mt-1">
              {currentCredits} {!isAdd ? '+' : '-'} {amount || '0'} = {
                amount 
                  ? !isAdd 
                    ? currentCredits + parseInt(amount || '0')
                    : currentCredits - parseInt(amount || '0')
                  : currentCredits
              } credits
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAdjust}
            disabled={!amount || parseInt(amount) <= 0 || isLoading}
            className={!isAdd ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
          >
            {isLoading ? 'Processing...' : !isAdd ? 'Add Credits' : 'Remove Credits'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
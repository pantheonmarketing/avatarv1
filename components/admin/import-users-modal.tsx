import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addBulkUsers } from '@/services/adminDashboardService';
import { toast } from 'react-hot-toast';
import { debug } from '@/utils/debug';

interface ImportUsersModalProps {
  onImportComplete: () => void;
}

export function ImportUsersModal({ onImportComplete }: ImportUsersModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [importMethod, setImportMethod] = useState<'csv' | 'text'>('csv');
  const [textContent, setTextContent] = useState('');
  const [defaultCredits, setDefaultCredits] = useState('5');
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    try {
      setIsLoading(true);
      debug.log('Starting bulk import');

      // Parse emails from text content
      const emails = textContent
        .split('\n')
        .map(line => line.trim())
        .filter(email => email.includes('@'));

      debug.log('Parsed emails:', emails);

      if (emails.length === 0) {
        toast.error('No valid email addresses found');
        return;
      }

      const result = await addBulkUsers(emails, parseInt(defaultCredits));
      debug.log('Import result:', result);

      toast.success(`Successfully imported ${result.length} users`);
      setIsOpen(false);
      setTextContent('');
      onImportComplete();
    } catch (error: any) {
      debug.error('Import failed:', error);
      toast.error(error.message || 'Failed to import users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setTextContent(e.target?.result as string);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Import Users</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Users</DialogTitle>
          <DialogDescription>
            Import multiple users at once. Each user will be created with {defaultCredits} credits.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant={importMethod === 'csv' ? 'default' : 'outline'}
              onClick={() => setImportMethod('csv')}
            >
              CSV File
            </Button>
            <Button
              variant={importMethod === 'text' ? 'default' : 'outline'}
              onClick={() => setImportMethod('text')}
            >
              Text Input
            </Button>
          </div>

          {importMethod === 'csv' ? (
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="csv">Upload CSV</Label>
              <Input
                id="csv"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
              />
              <p className="text-sm text-gray-500">
                CSV format: one email per line
              </p>
            </div>
          ) : (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="emails">Email Addresses</Label>
              <Textarea
                id="emails"
                placeholder="Enter email addresses (one per line)"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="h-[200px]"
              />
            </div>
          )}

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="credits">Default Credits</Label>
            <Input
              id="credits"
              type="number"
              value={defaultCredits}
              onChange={(e) => setDefaultCredits(e.target.value)}
              min="0"
            />
          </div>

          <Button 
            onClick={handleImport} 
            disabled={isLoading || !textContent.trim()}
          >
            {isLoading ? 'Importing...' : 'Import Users'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
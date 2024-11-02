import { AuthGuard } from '@/components/AuthGuard';

export default function ProtectedPage() {
  return (
    <AuthGuard>
      <div>
        This is a protected page
      </div>
    </AuthGuard>
  );
} 
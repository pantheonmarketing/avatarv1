import { auth } from "@clerk/nextjs/server";
import { redirect } from 'next/navigation';
import { AvatarCreatorComponent } from '@/components/avatar-creator';
import { AuthGuard } from '@/components/AuthGuard';

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <main className="min-h-screen p-4">
      <AuthGuard>
        <AvatarCreatorComponent />
      </AuthGuard>
    </main>
  );
}
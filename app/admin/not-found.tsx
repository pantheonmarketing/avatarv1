import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
      <p className="mb-4">You don't have permission to access this page.</p>
      <Link 
        href="/"
        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        Return to Home
      </Link>
    </div>
  );
} 
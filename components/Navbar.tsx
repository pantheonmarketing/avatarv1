import { useUser } from '@clerk/nextjs';
import { Credits } from './Credits';

export function Navbar() {
  const { user } = useUser();

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-white text-xl font-bold">
              Headline Generator
            </span>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <Credits /> {/* This will show the credits count */}
              <div className="text-white">
                {user.firstName || user.emailAddresses[0].emailAddress}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 
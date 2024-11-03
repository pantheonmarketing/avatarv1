'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { 
  fetchAllUsers, 
  updateUserCredits,
  toggleUserStatus
} from '@/services/adminDashboardService';
import type { UserManagement } from '@/types/admin';
import { ImportUsersModal } from '@/components/admin/import-users-modal';
import { CreditHistoryModal } from '@/components/admin/credit-history-modal';
import { CreditAdjustmentModal } from '@/components/admin/credit-adjustment-modal';
import { UserFilters } from '@/components/admin/user-filters';
import { toast } from 'react-hot-toast';
import { debug } from '@/utils/debug';
import { useRouter } from 'next/navigation';
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/services/supabaseService';
import { useCreditsContext } from '@/contexts/CreditsContext';
import Image from 'next/image';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars */

export default function AdminDashboard() {
  debug.log('AdminDashboard mounting');
  
  const { isLoaded, userId } = useAuth();
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const router = useRouter();
  const { refreshCredits } = useCreditsContext();
  const { user: currentUser } = useUser();
  const isSuperAdmin = currentUser?.primaryEmailAddress?.emailAddress === 'yoniwe@gmail.com';
  const [selectedUserAvatars, setSelectedUserAvatars] = useState<any[]>([]);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');

  useEffect(() => {
    debug.log('AdminDashboard useEffect - initial load');
    if (!isLoaded) return;
    
    if (!userId) {
      debug.log('No user ID found, redirecting to home');
      router.push('/');
      return;
    }

    loadUsers();
  }, [isLoaded, userId, router]);

  async function loadUsers() {
    try {
      debug.log('Loading users...');
      setLoading(true);
      const data = await fetchAllUsers();
      debug.log('Users loaded:', data.length);
      setUsers(data);
    } catch (err: any) {
      debug.error('Failed to load users:', err);
      setError(err.message);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  const handleCreditUpdate = async (userId: string, amount: number) => {
    try {
      setLoading(true);
      await updateUserCredits(userId, amount);
      
      // Change fetchUsers to loadUsers
      await loadUsers();
      toast.success('Credits updated successfully');
    } catch (error) {
      console.error('Failed to update credits:', error);
      toast.error('Failed to update credits');
    } finally {
      setLoading(false);
    }
  };

  async function handleStatusToggle(userId: string, currentStatus: boolean) {
    try {
      debug.log('Status toggle requested:', { userId, currentStatus });
      setLoading(true);
      await toggleUserStatus(userId, !currentStatus);
      await loadUsers();
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      debug.error('Failed to toggle user status:', err);
      toast.error('Failed to update user status');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminToggle(userId: string, currentStatus: boolean) {
    try {
      if (!isSuperAdmin) {
        toast.error('Only the super admin can modify admin privileges');
        return;
      }

      setLoading(true);
      debug.log('Admin status toggle requested:', { userId, currentStatus });
      
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          is_admin: !currentStatus 
        })
        .eq('id', userId);

      if (userError) throw userError;

      await loadUsers();
      toast.success(`Admin status ${!currentStatus ? 'granted' : 'revoked'} successfully`);
    } catch (err: any) {
      debug.error('Failed to toggle admin status:', err);
      toast.error('Failed to update admin status');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(userId: string, userEmail: string) {
    try {
      debug.log('Deleting user:', { userId, userEmail });
      setLoading(true);
      await supabase
        .from('credits_log')
        .delete()
        .eq('user_id', userId);

      await supabase
        .from('avatars')
        .delete()
        .eq('user_id', userId);

      await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      await loadUsers();
      toast.success('User deleted successfully');
    } catch (err: any) {
      debug.error('Failed to delete user:', err);
      toast.error('Failed to delete user');
    } finally {
      setLoading(false);
    }
  }

  const fetchUserAvatars = async (userId: string, userEmail: string) => {
    try {
      setLoading(true);
      setSelectedUserEmail(userEmail);
      const { data: avatars, error } = await supabase
        .from('avatars')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSelectedUserAvatars(avatars || []);
      setIsAvatarModalOpen(true);
    } catch (err) {
      console.error('Error fetching avatars:', err);
      toast.error('Failed to load avatars');
    } finally {
      setLoading(false);
    }
  };

  const AvatarViewerModal = ({ userEmail }: { userEmail: string }) => (
    <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>Avatars for {userEmail}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-1 gap-6">
            {selectedUserAvatars.map((avatar, index) => (
              <div 
                key={avatar.id} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
              >
                <div className="flex items-center gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
                  {avatar.data.imageUrl && (
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={avatar.data.imageUrl}
                        alt="Avatar"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-xl">
                      {typeof avatar.data.name === 'string' ? avatar.data.name : `Avatar ${index + 1}`}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(avatar.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Tabs defaultValue="details" className="p-6">
                  <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="story">Story</TabsTrigger>
                    <TabsTrigger value="wants">Current Wants</TabsTrigger>
                    <TabsTrigger value="pain">Pain Points</TabsTrigger>
                    <TabsTrigger value="desires">Desires</TabsTrigger>
                    <TabsTrigger value="results">Offer Results</TabsTrigger>
                    <TabsTrigger value="problems">Biggest Problem</TabsTrigger>
                    <TabsTrigger value="humiliation">Humiliation</TabsTrigger>
                    <TabsTrigger value="frustrations">Frustrations</TabsTrigger>
                    <TabsTrigger value="complaints">Complaints</TabsTrigger>
                    <TabsTrigger value="cost">Cost of Not Buying</TabsTrigger>
                    <TabsTrigger value="biggestWant">Biggest Want</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      {formatContent(avatar.data.details)}
                    </div>
                  </TabsContent>

                  <TabsContent value="story" className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      {formatContent(avatar.data.story)}
                    </div>
                  </TabsContent>

                  <TabsContent value="wants" className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      {formatContent(avatar.data.currentWants)}
                    </div>
                  </TabsContent>

                  <TabsContent value="pain" className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      {formatContent(avatar.data.painPoints)}
                    </div>
                  </TabsContent>

                  <TabsContent value="desires" className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      {formatContent(avatar.data.desires)}
                    </div>
                  </TabsContent>

                  <TabsContent value="results" className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      {formatContent(avatar.data.offerResults)}
                    </div>
                  </TabsContent>

                  <TabsContent value="problems" className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      {formatContent(avatar.data.biggestProblem)}
                    </div>
                  </TabsContent>

                  <TabsContent value="humiliation" className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      {formatContent(avatar.data.humiliation)}
                    </div>
                  </TabsContent>

                  <TabsContent value="frustrations" className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      {formatContent(avatar.data.frustrations)}
                    </div>
                  </TabsContent>

                  <TabsContent value="complaints" className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      {formatContent(avatar.data.complaints)}
                    </div>
                  </TabsContent>

                  <TabsContent value="cost" className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      {formatContent(avatar.data.costOfNotBuying)}
                    </div>
                  </TabsContent>

                  <TabsContent value="biggestWant" className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none">
                      {formatContent(avatar.data.biggestWant)}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ))}
            {selectedUserAvatars.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No avatars found for this user
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  // Helper function to format content with proper styling
  const formatContent = (content: any): JSX.Element => {
    if (!content) return <p className="text-gray-500">No content available</p>;

    if (typeof content === 'string') {
      return (
        <div className="space-y-4">
          {content.split('\n').map((line, index) => {
            if (line.startsWith('- ')) {
              return (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>{line.replace('- ', '')}</span>
                </div>
              );
            }
            return <p key={index}>{line}</p>;
          })}
        </div>
      );
    }

    return <pre>{JSON.stringify(content, null, 2)}</pre>;
  };

  if (!isLoaded) {
    debug.log('Admin page - Loading state');
    return <div className="p-8 text-center">Loading admin dashboard...</div>;
  }

  debug.log('Admin page - Rendering dashboard');
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <ImportUsersModal onImportComplete={loadUsers} />
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {loading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 shadow-sm rounded-lg">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
                {isSuperAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Admin Status
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {users
                .filter(user => {
                  const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesStatus = statusFilter === 'all' 
                    ? true 
                    : statusFilter === 'active' ? user.is_active : !user.is_active;
                  return matchesSearch && matchesStatus;
                })
                .map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {user.credits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="border border-gray-200 dark:border-gray-700 rounded-full p-0.5">
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={() => handleStatusToggle(user.id, user.is_active)}
                          className={`
                            data-[state=checked]:bg-green-500 
                            data-[state=unchecked]:bg-gray-200 
                            dark:data-[state=unchecked]:bg-gray-700
                            relative inline-flex h-6 w-11 items-center rounded-full
                            transition-colors focus:outline-none focus:ring-2 
                            focus:ring-green-500 focus:ring-offset-2
                            dark:focus:ring-offset-gray-900
                          `}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <CreditAdjustmentModal 
                        onAdjust={(amount) => handleCreditUpdate(user.id, amount)}
                        currentCredits={user.credits}
                      />
                      <CreditHistoryModal 
                        userId={user.id}
                        userEmail={user.email}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchUserAvatars(user.id, user.email)}
                        className="inline-flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Avatars
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {user.email}? This action cannot be undone.
                              All user data including credits and avatars will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={user.is_admin || false}
                            onCheckedChange={() => handleAdminToggle(user.id, user.is_admin || false)}
                            disabled={user.email === 'yoniwe@gmail.com'}
                            className={`
                              relative inline-flex h-7 w-14 items-center rounded-full
                              transition-colors focus-visible:outline-none 
                              focus-visible:ring-2 focus-visible:ring-offset-2
                              disabled:cursor-not-allowed
                              ${user.is_admin 
                                ? 'bg-purple-600 hover:bg-purple-700' 
                                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'}
                            `}
                          >
                            <span
                              className={`
                                ${user.is_admin ? 'translate-x-8' : 'translate-x-1'}
                                inline-block h-5 w-5 transform rounded-full
                                bg-white shadow-lg ring-0 transition duration-200
                              `}
                            />
                          </Switch>
                          <span className={`font-medium ${
                            user.is_admin 
                              ? 'text-purple-600 dark:text-purple-400' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {user.is_admin ? 'Admin' : 'User'}
                          </span>
                          {user.email === 'yoniwe@gmail.com' && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                              (Super Admin)
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    <AvatarViewerModal userEmail={selectedUserEmail} />
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 
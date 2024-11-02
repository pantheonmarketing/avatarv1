export interface UserManagement {
  id: string;
  email: string;
  credits: number;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditLog {
  id: string;
  user_id: string;
  amount: number;
  action_type: string;
  description: string;
  created_at: string;
}

export interface BulkUserImport {
  emails: string[];
  defaultCredits?: number;
  success: boolean;
  error?: string;
} 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_user_id: string
          email: string | null
          credits: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_user_id: string
          email?: string | null
          credits?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_user_id?: string
          email?: string | null
          credits?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      credits_log: {
        Row: {
          id: string
          user_id: string
          amount: number
          action_type: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          action_type: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          action_type?: string
          description?: string | null
          created_at?: string
        }
      }
      avatars: {
        Row: {
          id: string
          user_id: string
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          data: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          data?: Json
          created_at?: string
        }
      }
    }
  }
} 
// This file will be replaced by generated types from Supabase
// For now, we'll define basic types to get started

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          credits: number | null
          total_purchased: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          credits?: number | null
          total_purchased?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          credits?: number | null
          total_purchased?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      adventures: {
        Row: {
          id: string
          user_id: string | null
          guest_email: string | null
          guest_token: string | null
          title: string
          frame: string
          focus: string
          state: 'draft' | 'finalized' | 'exported'
          config: Json
          movements: Json[]
          metadata: Json
          created_at: string
          updated_at: string
          exported_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_email?: string | null
          guest_token?: string
          title: string
          frame: string
          focus: string
          state?: 'draft' | 'finalized' | 'exported'
          config?: Json
          movements?: Json[]
          metadata?: Json
          created_at?: string
          updated_at?: string
          exported_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_email?: string | null
          guest_token?: string
          title?: string
          frame?: string
          focus?: string
          state?: 'draft' | 'finalized' | 'exported'
          config?: Json
          movements?: Json[]
          metadata?: Json
          created_at?: string
          updated_at?: string
          exported_at?: string | null
        }
      }
      game_content: {
        Row: {
          id: string
          content_type: string
          frame: string | null
          source_book: string
          game_element: Json
          searchable_text: string
          embedding: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          content_type: string
          frame?: string | null
          source_book: string
          game_element: Json
          searchable_text: string
          embedding?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          content_type?: string
          frame?: string | null
          source_book?: string
          game_element?: Json
          searchable_text?: string
          embedding?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      llm_cache: {
        Row: {
          id: string
          prompt_hash: string
          prompt_params: Json
          response: string
          response_metadata: Json
          model: string
          temperature: number | null
          token_count: number | null
          created_at: string
          accessed_at: string
          access_count: number
        }
        Insert: {
          id?: string
          prompt_hash: string
          prompt_params: Json
          response: string
          response_metadata?: Json
          model: string
          temperature?: number | null
          token_count?: number | null
          created_at?: string
          accessed_at?: string
          access_count?: number
        }
        Update: {
          id?: string
          prompt_hash?: string
          prompt_params?: Json
          response?: string
          response_metadata?: Json
          model?: string
          temperature?: number | null
          token_count?: number | null
          created_at?: string
          accessed_at?: string
          access_count?: number
        }
      }
      purchases: {
        Row: {
          id: string
          user_id: string | null
          guest_email: string | null
          stripe_payment_intent_id: string
          amount: number
          credits: number
          status: 'pending' | 'succeeded' | 'failed'
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_email?: string | null
          stripe_payment_intent_id: string
          amount: number
          credits: number
          status: 'pending' | 'succeeded' | 'failed'
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_email?: string | null
          stripe_payment_intent_id?: string
          amount?: number
          credits?: number
          status?: 'pending' | 'succeeded' | 'failed'
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_adventure_credit: {
        Args: {
          p_user_id: string
          p_adventure_id: string
        }
        Returns: boolean
      }
      add_user_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_source: string
        }
        Returns: void
      }
      search_game_content: {
        Args: {
          query_embedding: string
          match_frame?: string
          match_types?: string[]
          match_count?: number
        }
        Returns: {
          id: string
          content_type: string
          frame: string
          game_element: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

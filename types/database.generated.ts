/* eslint-disable max-lines */
// Auto-generated file - exceeds line limit due to comprehensive database types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.4'
  }
  public: {
    Tables: {
      adventures: {
        Row: {
          config: Json
          created_at: string | null
          expansion_regenerations_used: number | null
          exported_at: string | null
          focus: string
          frame: string
          guest_email: string | null
          guest_token: string | null
          id: string
          metadata: Json | null
          movements: Json[] | null
          scaffold_regenerations_used: number | null
          state: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          expansion_regenerations_used?: number | null
          exported_at?: string | null
          focus: string
          frame: string
          guest_email?: string | null
          guest_token?: string | null
          id?: string
          metadata?: Json | null
          movements?: Json[] | null
          scaffold_regenerations_used?: number | null
          state?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          expansion_regenerations_used?: number | null
          exported_at?: string | null
          focus?: string
          frame?: string
          guest_email?: string | null
          guest_token?: string | null
          id?: string
          metadata?: Json | null
          movements?: Json[] | null
          scaffold_regenerations_used?: number | null
          state?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      archon_code_examples: {
        Row: {
          chunk_number: number
          content: string
          created_at: string
          embedding: string | null
          id: number
          metadata: Json
          source_id: string
          summary: string
          url: string
        }
        Insert: {
          chunk_number: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          source_id: string
          summary: string
          url: string
        }
        Update: {
          chunk_number?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          source_id?: string
          summary?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'archon_code_examples_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'archon_sources'
            referencedColumns: ['source_id']
          },
        ]
      }
      archon_crawled_pages: {
        Row: {
          chunk_number: number
          content: string
          created_at: string
          embedding: string | null
          id: number
          metadata: Json
          source_id: string
          url: string
        }
        Insert: {
          chunk_number: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          source_id: string
          url: string
        }
        Update: {
          chunk_number?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          source_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'archon_crawled_pages_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'archon_sources'
            referencedColumns: ['source_id']
          },
        ]
      }
      archon_document_versions: {
        Row: {
          change_summary: string | null
          change_type: string | null
          content: Json
          created_at: string | null
          created_by: string | null
          document_id: string | null
          field_name: string
          id: string
          project_id: string | null
          task_id: string | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          change_type?: string | null
          content: Json
          created_at?: string | null
          created_by?: string | null
          document_id?: string | null
          field_name: string
          id?: string
          project_id?: string | null
          task_id?: string | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          change_type?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          document_id?: string | null
          field_name?: string
          id?: string
          project_id?: string | null
          task_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: 'archon_document_versions_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'archon_projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'archon_document_versions_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'archon_tasks'
            referencedColumns: ['id']
          },
        ]
      }
      archon_project_sources: {
        Row: {
          created_by: string | null
          id: string
          linked_at: string | null
          notes: string | null
          project_id: string | null
          source_id: string
        }
        Insert: {
          created_by?: string | null
          id?: string
          linked_at?: string | null
          notes?: string | null
          project_id?: string | null
          source_id: string
        }
        Update: {
          created_by?: string | null
          id?: string
          linked_at?: string | null
          notes?: string | null
          project_id?: string | null
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'archon_project_sources_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'archon_projects'
            referencedColumns: ['id']
          },
        ]
      }
      archon_projects: {
        Row: {
          created_at: string | null
          data: Json | null
          description: string | null
          docs: Json | null
          features: Json | null
          github_repo: string | null
          id: string
          pinned: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          docs?: Json | null
          features?: Json | null
          github_repo?: string | null
          id?: string
          pinned?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          docs?: Json | null
          features?: Json | null
          github_repo?: string | null
          id?: string
          pinned?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      archon_prompts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          prompt: string
          prompt_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          prompt: string
          prompt_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          prompt?: string
          prompt_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      archon_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          encrypted_value: string | null
          id: string
          is_encrypted: boolean | null
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          encrypted_value?: string | null
          id?: string
          is_encrypted?: boolean | null
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          encrypted_value?: string | null
          id?: string
          is_encrypted?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      archon_sources: {
        Row: {
          created_at: string
          metadata: Json | null
          source_id: string
          summary: string | null
          title: string | null
          total_word_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          metadata?: Json | null
          source_id: string
          summary?: string | null
          title?: string | null
          total_word_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          metadata?: Json | null
          source_id?: string
          summary?: string | null
          title?: string | null
          total_word_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      archon_tasks: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          archived_by: string | null
          assignee: string | null
          code_examples: Json | null
          created_at: string | null
          description: string | null
          feature: string | null
          id: string
          parent_task_id: string | null
          project_id: string | null
          sources: Json | null
          status: Database['public']['Enums']['task_status'] | null
          task_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          assignee?: string | null
          code_examples?: Json | null
          created_at?: string | null
          description?: string | null
          feature?: string | null
          id?: string
          parent_task_id?: string | null
          project_id?: string | null
          sources?: Json | null
          status?: Database['public']['Enums']['task_status'] | null
          task_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          assignee?: string | null
          code_examples?: Json | null
          created_at?: string | null
          description?: string | null
          feature?: string | null
          id?: string
          parent_task_id?: string | null
          project_id?: string | null
          sources?: Json | null
          status?: Database['public']['Enums']['task_status'] | null
          task_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'archon_tasks_parent_task_id_fkey'
            columns: ['parent_task_id']
            isOneToOne: false
            referencedRelation: 'archon_tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'archon_tasks_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'archon_projects'
            referencedColumns: ['id']
          },
        ]
      }
      content_chunks: {
        Row: {
          associated_images: string[] | null
          content_text: string
          created_at: string | null
          embedding: string | null
          feature_category: string | null
          functionality_level: string | null
          id: number
          page_reference: string | null
          section_type: string | null
          source_file: string | null
          title: string
        }
        Insert: {
          associated_images?: string[] | null
          content_text: string
          created_at?: string | null
          embedding?: string | null
          feature_category?: string | null
          functionality_level?: string | null
          id?: number
          page_reference?: string | null
          section_type?: string | null
          source_file?: string | null
          title: string
        }
        Update: {
          associated_images?: string[] | null
          content_text?: string
          created_at?: string | null
          embedding?: string | null
          feature_category?: string | null
          functionality_level?: string | null
          id?: number
          page_reference?: string | null
          section_type?: string | null
          source_file?: string | null
          title?: string
        }
        Relationships: []
      }
      daggerheart_abilities: {
        Row: {
          ability_type: string
          created_at: string | null
          description: string
          domain: string | null
          id: string
          level_requirement: number | null
          name: string
          parent_class: string | null
          parent_subclass: string | null
          prerequisites: string[] | null
          searchable_text: string | null
          source_book: string | null
        }
        Insert: {
          ability_type: string
          created_at?: string | null
          description: string
          domain?: string | null
          id?: string
          level_requirement?: number | null
          name: string
          parent_class?: string | null
          parent_subclass?: string | null
          prerequisites?: string[] | null
          searchable_text?: string | null
          source_book?: string | null
        }
        Update: {
          ability_type?: string
          created_at?: string | null
          description?: string
          domain?: string | null
          id?: string
          level_requirement?: number | null
          name?: string
          parent_class?: string | null
          parent_subclass?: string | null
          prerequisites?: string[] | null
          searchable_text?: string | null
          source_book?: string | null
        }
        Relationships: []
      }
      daggerheart_adversaries: {
        Row: {
          atk: string
          created_at: string | null
          description: string
          difficulty: number
          dmg: string
          embedding: string | null
          experiences: Json | null
          features: Json[] | null
          hp: number
          id: string
          motives_tactics: string[] | null
          name: string
          range: string
          searchable_text: string | null
          source_book: string | null
          stress: number
          thresholds: string | null
          tier: number
          type: string
          weapon: string
        }
        Insert: {
          atk: string
          created_at?: string | null
          description: string
          difficulty: number
          dmg: string
          embedding?: string | null
          experiences?: Json | null
          features?: Json[] | null
          hp: number
          id?: string
          motives_tactics?: string[] | null
          name: string
          range: string
          searchable_text?: string | null
          source_book?: string | null
          stress: number
          thresholds?: string | null
          tier: number
          type: string
          weapon: string
        }
        Update: {
          atk?: string
          created_at?: string | null
          description?: string
          difficulty?: number
          dmg?: string
          embedding?: string | null
          experiences?: Json | null
          features?: Json[] | null
          hp?: number
          id?: string
          motives_tactics?: string[] | null
          name?: string
          range?: string
          searchable_text?: string | null
          source_book?: string | null
          stress?: number
          thresholds?: string | null
          tier?: number
          type?: string
          weapon?: string
        }
        Relationships: []
      }
      daggerheart_ancestries: {
        Row: {
          created_at: string | null
          description: string
          features: Json[] | null
          id: string
          name: string
          source_book: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          features?: Json[] | null
          id?: string
          name: string
          source_book?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          features?: Json[] | null
          id?: string
          name?: string
          source_book?: string | null
        }
        Relationships: []
      }
      daggerheart_armor: {
        Row: {
          base_score: number
          base_thresholds: string
          created_at: string | null
          embedding: string | null
          feature: string | null
          id: string
          name: string
          searchable_text: string | null
          source_book: string | null
          tier: number
        }
        Insert: {
          base_score: number
          base_thresholds: string
          created_at?: string | null
          embedding?: string | null
          feature?: string | null
          id?: string
          name: string
          searchable_text?: string | null
          source_book?: string | null
          tier: number
        }
        Update: {
          base_score?: number
          base_thresholds?: string
          created_at?: string | null
          embedding?: string | null
          feature?: string | null
          id?: string
          name?: string
          searchable_text?: string | null
          source_book?: string | null
          tier?: number
        }
        Relationships: []
      }
      daggerheart_classes: {
        Row: {
          background_questions: string[] | null
          class_feature: Json | null
          class_items: string[] | null
          connection_questions: string[] | null
          created_at: string | null
          description: string
          domains: string[] | null
          hope_feature: Json | null
          id: string
          name: string
          source_book: string | null
          starting_evasion: number
          starting_hp: number
        }
        Insert: {
          background_questions?: string[] | null
          class_feature?: Json | null
          class_items?: string[] | null
          connection_questions?: string[] | null
          created_at?: string | null
          description: string
          domains?: string[] | null
          hope_feature?: Json | null
          id?: string
          name: string
          source_book?: string | null
          starting_evasion: number
          starting_hp: number
        }
        Update: {
          background_questions?: string[] | null
          class_feature?: Json | null
          class_items?: string[] | null
          connection_questions?: string[] | null
          created_at?: string | null
          description?: string
          domains?: string[] | null
          hope_feature?: Json | null
          id?: string
          name?: string
          source_book?: string | null
          starting_evasion?: number
          starting_hp?: number
        }
        Relationships: []
      }
      daggerheart_communities: {
        Row: {
          community_moves: string[] | null
          created_at: string | null
          description: string
          id: string
          name: string
          source_book: string | null
        }
        Insert: {
          community_moves?: string[] | null
          created_at?: string | null
          description: string
          id?: string
          name: string
          source_book?: string | null
        }
        Update: {
          community_moves?: string[] | null
          created_at?: string | null
          description?: string
          id?: string
          name?: string
          source_book?: string | null
        }
        Relationships: []
      }
      daggerheart_consumables: {
        Row: {
          created_at: string | null
          description: string
          embedding: string | null
          id: string
          name: string
          searchable_text: string | null
          source_book: string | null
          uses: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          embedding?: string | null
          id?: string
          name: string
          searchable_text?: string | null
          source_book?: string | null
          uses?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          embedding?: string | null
          id?: string
          name?: string
          searchable_text?: string | null
          source_book?: string | null
          uses?: number | null
        }
        Relationships: []
      }
      daggerheart_domains: {
        Row: {
          created_at: string | null
          description: string
          id: string
          name: string
          source_book: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          name: string
          source_book?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          name?: string
          source_book?: string | null
        }
        Relationships: []
      }
      daggerheart_environments: {
        Row: {
          created_at: string | null
          description: string
          difficulty: number | null
          embedding: string | null
          features: Json[] | null
          id: string
          impulses: string[] | null
          name: string
          potential_adversaries: string[] | null
          searchable_text: string | null
          source_book: string | null
          tier: number
          type: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          difficulty?: number | null
          embedding?: string | null
          features?: Json[] | null
          id?: string
          impulses?: string[] | null
          name: string
          potential_adversaries?: string[] | null
          searchable_text?: string | null
          source_book?: string | null
          tier: number
          type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          difficulty?: number | null
          embedding?: string | null
          features?: Json[] | null
          id?: string
          impulses?: string[] | null
          name?: string
          potential_adversaries?: string[] | null
          searchable_text?: string | null
          source_book?: string | null
          tier?: number
          type?: string | null
        }
        Relationships: []
      }
      daggerheart_frames: {
        Row: {
          created_at: string | null
          description: string
          embedding: string | null
          id: string
          lore: string | null
          name: string
          source_book: string | null
          themes: string[] | null
          typical_adversaries: string[] | null
        }
        Insert: {
          created_at?: string | null
          description: string
          embedding?: string | null
          id?: string
          lore?: string | null
          name: string
          source_book?: string | null
          themes?: string[] | null
          typical_adversaries?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string
          embedding?: string | null
          id?: string
          lore?: string | null
          name?: string
          source_book?: string | null
          themes?: string[] | null
          typical_adversaries?: string[] | null
        }
        Relationships: []
      }
      daggerheart_items: {
        Row: {
          created_at: string | null
          description: string
          embedding: string | null
          id: string
          item_type: string | null
          name: string
          searchable_text: string | null
          source_book: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          embedding?: string | null
          id?: string
          item_type?: string | null
          name: string
          searchable_text?: string | null
          source_book?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          embedding?: string | null
          id?: string
          item_type?: string | null
          name?: string
          searchable_text?: string | null
          source_book?: string | null
        }
        Relationships: []
      }
      daggerheart_subclasses: {
        Row: {
          created_at: string | null
          description: string
          features: Json[] | null
          id: string
          name: string
          parent_class: string
          source_book: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          features?: Json[] | null
          id?: string
          name: string
          parent_class: string
          source_book?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          features?: Json[] | null
          id?: string
          name?: string
          parent_class?: string
          source_book?: string | null
        }
        Relationships: []
      }
      daggerheart_weapons: {
        Row: {
          burden: string | null
          created_at: string | null
          damage: string
          embedding: string | null
          feature: string | null
          id: string
          name: string
          range: string
          searchable_text: string | null
          source_book: string | null
          tier: number
          trait: string
          weapon_category: string
        }
        Insert: {
          burden?: string | null
          created_at?: string | null
          damage: string
          embedding?: string | null
          feature?: string | null
          id?: string
          name: string
          range: string
          searchable_text?: string | null
          source_book?: string | null
          tier: number
          trait: string
          weapon_category: string
        }
        Update: {
          burden?: string | null
          created_at?: string | null
          damage?: string
          embedding?: string | null
          feature?: string | null
          id?: string
          name?: string
          range?: string
          searchable_text?: string | null
          source_book?: string | null
          tier?: number
          trait?: string
          weapon_category?: string
        }
        Relationships: []
      }
      game_content: {
        Row: {
          content_type: string
          created_at: string | null
          embedding: string | null
          frame: string | null
          game_element: Json
          id: string
          metadata: Json | null
          searchable_text: string
          source_book: string
        }
        Insert: {
          content_type: string
          created_at?: string | null
          embedding?: string | null
          frame?: string | null
          game_element: Json
          id?: string
          metadata?: Json | null
          searchable_text: string
          source_book: string
        }
        Update: {
          content_type?: string
          created_at?: string | null
          embedding?: string | null
          frame?: string | null
          game_element?: Json
          id?: string
          metadata?: Json | null
          searchable_text?: string
          source_book?: string
        }
        Relationships: []
      }
      image_ocr_data: {
        Row: {
          avg_confidence: number | null
          created_at: string | null
          element_count: number | null
          embedding: string | null
          extracted_text: string | null
          file_name: string
          file_path: string
          id: number
          image_type: string | null
          relative_path: string
          text_length: number | null
          ui_elements: Json | null
        }
        Insert: {
          avg_confidence?: number | null
          created_at?: string | null
          element_count?: number | null
          embedding?: string | null
          extracted_text?: string | null
          file_name: string
          file_path: string
          id?: number
          image_type?: string | null
          relative_path: string
          text_length?: number | null
          ui_elements?: Json | null
        }
        Update: {
          avg_confidence?: number | null
          created_at?: string | null
          element_count?: number | null
          embedding?: string | null
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          id?: number
          image_type?: string | null
          relative_path?: string
          text_length?: number | null
          ui_elements?: Json | null
        }
        Relationships: []
      }
      llm_cache: {
        Row: {
          access_count: number | null
          accessed_at: string | null
          created_at: string | null
          id: string
          model: string
          prompt_hash: string
          prompt_params: Json
          response: string
          response_metadata: Json | null
          temperature: number | null
          token_count: number | null
        }
        Insert: {
          access_count?: number | null
          accessed_at?: string | null
          created_at?: string | null
          id?: string
          model: string
          prompt_hash: string
          prompt_params: Json
          response: string
          response_metadata?: Json | null
          temperature?: number | null
          token_count?: number | null
        }
        Update: {
          access_count?: number | null
          accessed_at?: string | null
          created_at?: string | null
          id?: string
          model?: string
          prompt_hash?: string
          prompt_params?: Json
          response?: string
          response_metadata?: Json | null
          temperature?: number | null
          token_count?: number | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          created_at: string | null
          credits: number
          guest_email: string | null
          id: string
          metadata: Json | null
          status: string
          stripe_payment_intent_id: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          credits: number
          guest_email?: string | null
          id?: string
          metadata?: Json | null
          status: string
          stripe_payment_intent_id: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          credits?: number
          guest_email?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_payment_intent_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          credits: number | null
          email: string
          id: string
          total_purchased: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits?: number | null
          email: string
          id: string
          total_purchased?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number | null
          email?: string
          id?: string
          total_purchased?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_credits: {
        Args: { p_amount: number; p_source: string; p_user_id: string }
        Returns: undefined
      }
      archive_task: {
        Args: { archived_by_param?: string; task_id_param: string }
        Returns: boolean
      }
      consume_adventure_credit: {
        Args: { p_adventure_id: string; p_user_id: string }
        Returns: boolean
      }
      get_tier_appropriate_loot: {
        Args: { item_type?: string; limit_count?: number; party_level: number }
        Returns: {
          id: string
          item_table: string
          name: string
          tier: number
        }[]
      }
      match_adversaries: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          description: string
          id: string
          name: string
          similarity: number
          tier: number
        }[]
      }
      match_archon_code_examples: {
        Args: {
          filter?: Json
          match_count?: number
          query_embedding: string
          source_filter?: string
        }
        Returns: {
          chunk_number: number
          content: string
          id: number
          metadata: Json
          similarity: number
          source_id: string
          summary: string
          url: string
        }[]
      }
      match_archon_crawled_pages: {
        Args: {
          filter?: Json
          match_count?: number
          query_embedding: string
          source_filter?: string
        }
        Returns: {
          chunk_number: number
          content: string
          id: number
          metadata: Json
          similarity: number
          source_id: string
          url: string
        }[]
      }
      match_environments: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          description: string
          id: string
          name: string
          similarity: number
          tier: number
        }[]
      }
      match_items: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          description: string
          id: string
          name: string
          similarity: number
          tier: number
        }[]
      }
      match_weapons: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          description: string
          id: string
          name: string
          similarity: number
          tier: number
        }[]
      }
      search_adversaries: {
        Args: {
          limit_count?: number
          party_level: number
          search_query: string
        }
        Returns: {
          description: string
          difficulty: number
          id: string
          name: string
          similarity: number
          tier: number
          type: string
        }[]
      }
      search_content_chunks: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
          query_text: string
        }
        Returns: {
          content_text: string
          feature_category: string
          functionality_level: string
          id: number
          section_type: string
          similarity: number
          title: string
        }[]
      }
      search_environments: {
        Args: { limit_count?: number; search_query: string }
        Returns: {
          description: string
          id: string
          name: string
          similarity: number
        }[]
      }
      search_game_content: {
        Args: {
          match_count?: number
          match_frame?: string
          match_types?: string[]
          query_embedding: string
        }
        Returns: {
          content_type: string
          frame: string
          game_element: Json
          id: string
          similarity: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { '': string }; Returns: string[] }
    }
    Enums: {
      task_status: 'todo' | 'doing' | 'review' | 'done'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      task_status: ['todo', 'doing', 'review', 'done'],
    },
  },
} as const

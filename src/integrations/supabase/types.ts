export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          actor_label: string | null
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          summary: string | null
          title: string
        }
        Insert: {
          actor_label?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          summary?: string | null
          title: string
        }
        Update: {
          actor_label?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      admin_finance_actions: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      admin_partner_notes: {
        Row: {
          admin_user_id: string
          created_at: string
          id: string
          note: string
          partner_id: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          id?: string
          note: string
          partner_id: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          id?: string
          note?: string
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_partner_notes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_permission_overrides: {
        Row: {
          allowed: boolean
          created_at: string
          created_by: string | null
          id: string
          permission_key: string
          user_id: string
        }
        Insert: {
          allowed: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          permission_key: string
          user_id: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          permission_key?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_role_permissions: {
        Row: {
          admin_role: Database["public"]["Enums"]["admin_role_type"]
          created_at: string
          id: string
          permission_key: string
        }
        Insert: {
          admin_role: Database["public"]["Enums"]["admin_role_type"]
          created_at?: string
          id?: string
          permission_key: string
        }
        Update: {
          admin_role?: Database["public"]["Enums"]["admin_role_type"]
          created_at?: string
          id?: string
          permission_key?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          account_status: Database["public"]["Enums"]["admin_account_status"]
          admin_code: string
          admin_role: Database["public"]["Enums"]["admin_role_type"]
          created_at: string
          created_by: string | null
          email: string
          full_name: string
          last_login_at: string | null
          mobile: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["admin_account_status"]
          admin_code: string
          admin_role: Database["public"]["Enums"]["admin_role_type"]
          created_at?: string
          created_by?: string | null
          email: string
          full_name: string
          last_login_at?: string | null
          mobile?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["admin_account_status"]
          admin_code?: string
          admin_role?: Database["public"]["Enums"]["admin_role_type"]
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string
          last_login_at?: string | null
          mobile?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_agent_runs: {
        Row: {
          agent_id: string | null
          agent_slug: string
          completion_tokens: number | null
          conversation_id: string | null
          cost_credits: number | null
          created_at: string
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          fallback_used: boolean
          id: string
          message_id: string | null
          metadata: Json
          model: string
          prompt_tokens: number | null
          retry_count: number
          status: string
          total_tokens: number | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          agent_id?: string | null
          agent_slug: string
          completion_tokens?: number | null
          conversation_id?: string | null
          cost_credits?: number | null
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          fallback_used?: boolean
          id?: string
          message_id?: string | null
          metadata?: Json
          model: string
          prompt_tokens?: number | null
          retry_count?: number
          status?: string
          total_tokens?: number | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          agent_id?: string | null
          agent_slug?: string
          completion_tokens?: number | null
          conversation_id?: string | null
          cost_credits?: number | null
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          fallback_used?: boolean
          id?: string
          message_id?: string | null
          metadata?: Json
          model?: string
          prompt_tokens?: number | null
          retry_count?: number
          status?: string
          total_tokens?: number | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          allowed_roles: string[]
          created_at: string
          description: string
          fallback_model: string | null
          id: string
          is_active: boolean
          max_output_tokens: number | null
          model_preference: string
          name: string
          slug: string
          system_prompt: string
          tags: string[]
          temperature: number | null
          updated_at: string
          version: number
        }
        Insert: {
          allowed_roles?: string[]
          created_at?: string
          description?: string
          fallback_model?: string | null
          id?: string
          is_active?: boolean
          max_output_tokens?: number | null
          model_preference?: string
          name: string
          slug: string
          system_prompt: string
          tags?: string[]
          temperature?: number | null
          updated_at?: string
          version?: number
        }
        Update: {
          allowed_roles?: string[]
          created_at?: string
          description?: string
          fallback_model?: string | null
          id?: string
          is_active?: boolean
          max_output_tokens?: number | null
          model_preference?: string
          name?: string
          slug?: string
          system_prompt?: string
          tags?: string[]
          temperature?: number | null
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      ai_career_coach_conversations: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          last_activity_at: string
          message_count: number
          metadata: Json
          mode: string
          student_user_id: string
          target_industry: string | null
          target_location: string | null
          target_role: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          last_activity_at?: string
          message_count?: number
          metadata?: Json
          mode?: string
          student_user_id: string
          target_industry?: string | null
          target_location?: string | null
          target_role?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          last_activity_at?: string
          message_count?: number
          metadata?: Json
          mode?: string
          student_user_id?: string
          target_industry?: string | null
          target_location?: string | null
          target_role?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_career_coach_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          error_reason: string | null
          id: string
          metadata: Json
          role: string
          status: string
          student_user_id: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          error_reason?: string | null
          id?: string
          metadata?: Json
          role: string
          status?: string
          student_user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          error_reason?: string | null
          id?: string
          metadata?: Json
          role?: string
          status?: string
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_career_coach_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_career_coach_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_marketing_conversations: {
        Row: {
          archived_at: string | null
          asset_type: string
          brand_voice: string | null
          created_at: string
          id: string
          last_activity_at: string
          message_count: number
          metadata: Json
          owner_user_id: string
          product_or_topic: string | null
          target_audience: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          asset_type?: string
          brand_voice?: string | null
          created_at?: string
          id?: string
          last_activity_at?: string
          message_count?: number
          metadata?: Json
          owner_user_id: string
          product_or_topic?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          asset_type?: string
          brand_voice?: string | null
          created_at?: string
          id?: string
          last_activity_at?: string
          message_count?: number
          metadata?: Json
          owner_user_id?: string
          product_or_topic?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_marketing_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          error_reason: string | null
          id: string
          metadata: Json
          owner_user_id: string
          role: string
          status: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          error_reason?: string | null
          id?: string
          metadata?: Json
          owner_user_id: string
          role: string
          status?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          error_reason?: string | null
          id?: string
          metadata?: Json
          owner_user_id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_marketing_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_marketing_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_mentor_activity: {
        Row: {
          conversation_id: string | null
          created_at: string
          event_type: string
          id: string
          meta: Json
          student_user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          meta?: Json
          student_user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_mentor_activity_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_mentor_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_mentor_conversations: {
        Row: {
          archived_at: string | null
          context_record_id: string | null
          context_type: Database["public"]["Enums"]["ai_mentor_context_type"]
          created_at: string
          id: string
          include_draft: boolean
          include_notes: boolean
          include_submission: boolean
          last_activity_at: string
          message_count: number
          program_id: string | null
          student_user_id: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          context_record_id?: string | null
          context_type?: Database["public"]["Enums"]["ai_mentor_context_type"]
          created_at?: string
          id?: string
          include_draft?: boolean
          include_notes?: boolean
          include_submission?: boolean
          last_activity_at?: string
          message_count?: number
          program_id?: string | null
          student_user_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          context_record_id?: string | null
          context_type?: Database["public"]["Enums"]["ai_mentor_context_type"]
          created_at?: string
          id?: string
          include_draft?: boolean
          include_notes?: boolean
          include_submission?: boolean
          last_activity_at?: string
          message_count?: number
          program_id?: string | null
          student_user_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_mentor_conversations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_mentor_feedback: {
        Row: {
          conversation_id: string
          created_at: string
          feedback_type: Database["public"]["Enums"]["ai_mentor_feedback_type"]
          id: string
          message_id: string
          student_user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          feedback_type: Database["public"]["Enums"]["ai_mentor_feedback_type"]
          id?: string
          message_id: string
          student_user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          feedback_type?: Database["public"]["Enums"]["ai_mentor_feedback_type"]
          id?: string
          message_id?: string
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_mentor_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_mentor_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_mentor_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_mentor_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_mentor_messages: {
        Row: {
          content: string
          context_snapshot: Json | null
          conversation_id: string
          created_at: string
          error_reason: string | null
          id: string
          role: Database["public"]["Enums"]["ai_mentor_message_role"]
          status: Database["public"]["Enums"]["ai_mentor_message_status"]
          student_user_id: string
        }
        Insert: {
          content?: string
          context_snapshot?: Json | null
          conversation_id: string
          created_at?: string
          error_reason?: string | null
          id?: string
          role: Database["public"]["Enums"]["ai_mentor_message_role"]
          status?: Database["public"]["Enums"]["ai_mentor_message_status"]
          student_user_id: string
        }
        Update: {
          content?: string
          context_snapshot?: Json | null
          conversation_id?: string
          created_at?: string
          error_reason?: string | null
          id?: string
          role?: Database["public"]["Enums"]["ai_mentor_message_role"]
          status?: Database["public"]["Enums"]["ai_mentor_message_status"]
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_mentor_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_mentor_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_mentor_usage: {
        Row: {
          ai_service_status: string | null
          conversation_id: string | null
          duration_ms: number | null
          id: string
          message_id: string | null
          model: string | null
          requested_at: string
          student_user_id: string
          tokens_completion: number | null
          tokens_prompt: number | null
        }
        Insert: {
          ai_service_status?: string | null
          conversation_id?: string | null
          duration_ms?: number | null
          id?: string
          message_id?: string | null
          model?: string | null
          requested_at?: string
          student_user_id: string
          tokens_completion?: number | null
          tokens_prompt?: number | null
        }
        Update: {
          ai_service_status?: string | null
          conversation_id?: string | null
          duration_ms?: number | null
          id?: string
          message_id?: string | null
          model?: string | null
          requested_at?: string
          student_user_id?: string
          tokens_completion?: number | null
          tokens_prompt?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_mentor_usage_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_mentor_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_mentor_usage_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_mentor_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_policies: {
        Row: {
          action: string
          config: Json
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          patterns: Json
          rule_type: string
          scope: string
          severity: string
          updated_at: string
        }
        Insert: {
          action?: string
          config?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          patterns?: Json
          rule_type: string
          scope?: string
          severity?: string
          updated_at?: string
        }
        Update: {
          action?: string
          config?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          patterns?: Json
          rule_type?: string
          scope?: string
          severity?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_policy_violations: {
        Row: {
          action_taken: string
          created_at: string
          id: string
          matched_text_hash: string | null
          metadata: Json
          policy_id: string | null
          policy_name: string
          request_id: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          action_taken: string
          created_at?: string
          id?: string
          matched_text_hash?: string | null
          metadata?: Json
          policy_id?: string | null
          policy_name: string
          request_id?: string | null
          severity: string
          user_id?: string | null
        }
        Update: {
          action_taken?: string
          created_at?: string
          id?: string
          matched_text_hash?: string | null
          metadata?: Json
          policy_id?: string | null
          policy_name?: string
          request_id?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_policy_violations_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "ai_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_provider_events: {
        Row: {
          cost_credits: number | null
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          latency_ms: number | null
          model: string | null
          provider: string
          success: boolean
          task: string | null
          tokens_in: number | null
          tokens_out: number | null
          user_id: string | null
        }
        Insert: {
          cost_credits?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          model?: string | null
          provider: string
          success: boolean
          task?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string | null
        }
        Update: {
          cost_credits?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          model?: string | null
          provider?: string
          success?: boolean
          task?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_provider_health: {
        Row: {
          created_at: string
          error_rate: number | null
          errors_today: number
          id: string
          last_checked_at: string
          last_error: string | null
          latency_ms_p50: number | null
          latency_ms_p95: number | null
          provider: string
          requests_today: number
          status: string
          success_rate: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_rate?: number | null
          errors_today?: number
          id?: string
          last_checked_at?: string
          last_error?: string | null
          latency_ms_p50?: number | null
          latency_ms_p95?: number | null
          provider: string
          requests_today?: number
          status?: string
          success_rate?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_rate?: number | null
          errors_today?: number
          id?: string
          last_checked_at?: string
          last_error?: string | null
          latency_ms_p50?: number | null
          latency_ms_p95?: number | null
          provider?: string
          requests_today?: number
          status?: string
          success_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_sales_conversations: {
        Row: {
          channel: string
          contact_city: string | null
          contact_country: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          external_id: string | null
          handover_reason: string | null
          handover_requested: boolean | null
          id: string
          intent_summary: string | null
          language: string | null
          last_message_at: string | null
          lead_score: string | null
          metadata: Json | null
          provider: string | null
          qualification: Json | null
          recommended_course_ids: string[] | null
          session_token: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          channel?: string
          contact_city?: string | null
          contact_country?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          external_id?: string | null
          handover_reason?: string | null
          handover_requested?: boolean | null
          id?: string
          intent_summary?: string | null
          language?: string | null
          last_message_at?: string | null
          lead_score?: string | null
          metadata?: Json | null
          provider?: string | null
          qualification?: Json | null
          recommended_course_ids?: string[] | null
          session_token: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          contact_city?: string | null
          contact_country?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          external_id?: string | null
          handover_reason?: string | null
          handover_requested?: boolean | null
          id?: string
          intent_summary?: string | null
          language?: string | null
          last_message_at?: string | null
          lead_score?: string | null
          metadata?: Json | null
          provider?: string | null
          qualification?: Json | null
          recommended_course_ids?: string[] | null
          session_token?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_sales_events: {
        Row: {
          conversation_id: string | null
          created_at: string
          data: Json | null
          event_type: string
          id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          data?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          data?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sales_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_sales_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sales_followups: {
        Row: {
          channel: string
          conversation_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          message_template: string | null
          metadata: Json | null
          scheduled_for: string
          sent_at: string | null
          status: string
        }
        Insert: {
          channel?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          message_template?: string | null
          metadata?: Json | null
          scheduled_for: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          channel?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          message_template?: string | null
          metadata?: Json | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sales_followups_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_sales_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_sales_followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "ai_sales_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sales_knowledge: {
        Row: {
          active: boolean
          answer: string
          created_at: string
          created_by: string | null
          id: string
          keywords: string[] | null
          language: string | null
          priority: number
          question: string
          topic: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer: string
          created_at?: string
          created_by?: string | null
          id?: string
          keywords?: string[] | null
          language?: string | null
          priority?: number
          question: string
          topic: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer?: string
          created_at?: string
          created_by?: string | null
          id?: string
          keywords?: string[] | null
          language?: string | null
          priority?: number
          question?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_sales_leads: {
        Row: {
          assigned_partner_id: string | null
          availability: string | null
          branch: string | null
          budget: string | null
          career_goal: string | null
          city: string | null
          conversation_id: string
          country: string | null
          created_at: string
          email: string | null
          expected_joining: string | null
          experience: string | null
          graduation_year: string | null
          id: string
          interest_level: string | null
          learning_mode: string | null
          metadata: Json | null
          name: string | null
          phone: string | null
          preferred_tech: string | null
          qualification: string | null
          score: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_partner_id?: string | null
          availability?: string | null
          branch?: string | null
          budget?: string | null
          career_goal?: string | null
          city?: string | null
          conversation_id: string
          country?: string | null
          created_at?: string
          email?: string | null
          expected_joining?: string | null
          experience?: string | null
          graduation_year?: string | null
          id?: string
          interest_level?: string | null
          learning_mode?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          preferred_tech?: string | null
          qualification?: string | null
          score?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_partner_id?: string | null
          availability?: string | null
          branch?: string | null
          budget?: string | null
          career_goal?: string | null
          city?: string | null
          conversation_id?: string
          country?: string | null
          created_at?: string
          email?: string | null
          expected_joining?: string | null
          experience?: string | null
          graduation_year?: string | null
          id?: string
          interest_level?: string | null
          learning_mode?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          preferred_tech?: string | null
          qualification?: string | null
          score?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sales_leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_sales_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sales_messages: {
        Row: {
          cards: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          quick_replies: Json | null
          role: string
        }
        Insert: {
          cards?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          quick_replies?: Json | null
          role: string
        }
        Update: {
          cards?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          quick_replies?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sales_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_sales_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sales_unanswered: {
        Row: {
          admin_answer: string | null
          ai_response: string | null
          answered_at: string | null
          answered_by: string | null
          conversation_id: string | null
          created_at: string
          id: string
          question: string
          status: string
        }
        Insert: {
          admin_answer?: string | null
          ai_response?: string | null
          answered_at?: string | null
          answered_by?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          question: string
          status?: string
        }
        Update: {
          admin_answer?: string | null
          ai_response?: string | null
          answered_at?: string | null
          answered_by?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          question?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sales_unanswered_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_sales_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_seo_suggestions: {
        Row: {
          applied_at: string | null
          created_at: string
          created_by: string | null
          id: string
          input_snapshot: Json
          kind: string
          model: string | null
          priority: number
          rationale: string | null
          review_notes: string | null
          reviewer_id: string | null
          score: number | null
          status: string
          suggestion: Json
          target_id: string | null
          target_type: string | null
          target_url: string | null
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          input_snapshot?: Json
          kind: string
          model?: string | null
          priority?: number
          rationale?: string | null
          review_notes?: string | null
          reviewer_id?: string | null
          score?: number | null
          status?: string
          suggestion: Json
          target_id?: string | null
          target_type?: string | null
          target_url?: string | null
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          input_snapshot?: Json
          kind?: string
          model?: string | null
          priority?: number
          rationale?: string | null
          review_notes?: string | null
          reviewer_id?: string | null
          score?: number | null
          status?: string
          suggestion?: Json
          target_id?: string | null
          target_type?: string | null
          target_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ambassador_badge_achievements: {
        Row: {
          achieved_at: string
          ambassador_id: string
          badge_id: string
          created_at: string
          id: string
          metadata: Json
          related_entity_id: string | null
          related_entity_type: string | null
          status: string
        }
        Insert: {
          achieved_at?: string
          ambassador_id: string
          badge_id: string
          created_at?: string
          id?: string
          metadata?: Json
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
        }
        Update: {
          achieved_at?: string
          ambassador_id?: string
          badge_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_badge_achievements_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_badge_achievements_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "ambassador_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_badges: {
        Row: {
          badge_key: string
          category: string
          created_at: string
          description: string | null
          display_order: number
          gradient_from: string | null
          gradient_to: string | null
          icon: string | null
          id: string
          is_published: boolean
          name: string
          rule_threshold: number
          rule_type: string
          updated_at: string
          visibility: string
        }
        Insert: {
          badge_key: string
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          gradient_from?: string | null
          gradient_to?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          name: string
          rule_threshold?: number
          rule_type: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          badge_key?: string
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          gradient_from?: string | null
          gradient_to?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          name?: string
          rule_threshold?: number
          rule_type?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      ambassador_bonus_campaigns: {
        Row: {
          banner_text: string | null
          bonus_percentage: number | null
          campaign_code: string | null
          campaign_type: string
          campus_scope: string | null
          created_at: string
          description: string | null
          ending_reminder_days: number
          ends_at: string | null
          fixed_bonus_amount: number | null
          id: string
          leaderboard_enabled: boolean
          max_commission_pct: number | null
          name: string
          pricing_plan: string | null
          program_id: string | null
          ranking_finalised_at: string | null
          ranking_metric: string
          starts_at: string
          status: string
          terms: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          banner_text?: string | null
          bonus_percentage?: number | null
          campaign_code?: string | null
          campaign_type: string
          campus_scope?: string | null
          created_at?: string
          description?: string | null
          ending_reminder_days?: number
          ends_at?: string | null
          fixed_bonus_amount?: number | null
          id?: string
          leaderboard_enabled?: boolean
          max_commission_pct?: number | null
          name: string
          pricing_plan?: string | null
          program_id?: string | null
          ranking_finalised_at?: string | null
          ranking_metric?: string
          starts_at?: string
          status?: string
          terms?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          banner_text?: string | null
          bonus_percentage?: number | null
          campaign_code?: string | null
          campaign_type?: string
          campus_scope?: string | null
          created_at?: string
          description?: string | null
          ending_reminder_days?: number
          ends_at?: string | null
          fixed_bonus_amount?: number | null
          id?: string
          leaderboard_enabled?: boolean
          max_commission_pct?: number | null
          name?: string
          pricing_plan?: string | null
          program_id?: string | null
          ranking_finalised_at?: string | null
          ranking_metric?: string
          starts_at?: string
          status?: string
          terms?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      ambassador_campaign_leaderboard_snapshots: {
        Row: {
          ambassador_id: string
          campaign_id: string
          finalised_at: string
          id: string
          metric_value: number
          progress_pct: number | null
          rank_position: number
        }
        Insert: {
          ambassador_id: string
          campaign_id: string
          finalised_at?: string
          id?: string
          metric_value?: number
          progress_pct?: number | null
          rank_position: number
        }
        Update: {
          ambassador_id?: string
          campaign_id?: string
          finalised_at?: string
          id?: string
          metric_value?: number
          progress_pct?: number | null
          rank_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_campaign_leaderboard_snapshots_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_campaign_leaderboard_snapshots_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ambassador_bonus_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_campaign_milestone_achievements: {
        Row: {
          achieved_at: string
          ambassador_id: string
          bonus_commission_id: string | null
          campaign_id: string
          created_at: string
          eligibility_status: string
          id: string
          metadata: Json
          milestone_id: string
        }
        Insert: {
          achieved_at?: string
          ambassador_id: string
          bonus_commission_id?: string | null
          campaign_id: string
          created_at?: string
          eligibility_status?: string
          id?: string
          metadata?: Json
          milestone_id: string
        }
        Update: {
          achieved_at?: string
          ambassador_id?: string
          bonus_commission_id?: string | null
          campaign_id?: string
          created_at?: string
          eligibility_status?: string
          id?: string
          metadata?: Json
          milestone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_campaign_milestone_achievem_bonus_commission_id_fkey"
            columns: ["bonus_commission_id"]
            isOneToOne: false
            referencedRelation: "ambassador_commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_campaign_milestone_achievements_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_campaign_milestone_achievements_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ambassador_bonus_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_campaign_milestone_achievements_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "ambassador_campaign_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_campaign_milestones: {
        Row: {
          bonus_amount: number
          campaign_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          milestone_code: string | null
          name: string
          threshold_type: string
          threshold_value: number
          updated_at: string
        }
        Insert: {
          bonus_amount?: number
          campaign_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          milestone_code?: string | null
          name: string
          threshold_type?: string
          threshold_value: number
          updated_at?: string
        }
        Update: {
          bonus_amount?: number
          campaign_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          milestone_code?: string | null
          name?: string
          threshold_type?: string
          threshold_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_campaign_milestones_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ambassador_bonus_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_college_change_requests: {
        Row: {
          admin_note: string | null
          ambassador_id: string
          cancelled_at: string | null
          change_reason: string | null
          created_at: string
          current_college_name: string
          id: string
          requested_city: string | null
          requested_college_name: string
          requested_state: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          ambassador_id: string
          cancelled_at?: string | null
          change_reason?: string | null
          created_at?: string
          current_college_name: string
          id?: string
          requested_city?: string | null
          requested_college_name: string
          requested_state?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          ambassador_id?: string
          cancelled_at?: string | null
          change_reason?: string | null
          created_at?: string
          current_college_name?: string
          id?: string
          requested_city?: string | null
          requested_college_name?: string
          requested_state?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_college_change_requests_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_commission_rules: {
        Row: {
          base_definition: string
          campaign_id: string | null
          commission_percentage: number
          commission_type: string
          created_at: string
          description: string | null
          effective_from: string
          effective_to: string | null
          eligibility_notes: string | null
          fixed_amount: number | null
          id: string
          is_active: boolean
          max_commission_pct: number | null
          name: string
          pricing_plan: string | null
          program_id: string | null
          rule_code: string | null
          rule_priority: number
          updated_at: string
          version: number
          visibility: string
        }
        Insert: {
          base_definition?: string
          campaign_id?: string | null
          commission_percentage: number
          commission_type?: string
          created_at?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          eligibility_notes?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          max_commission_pct?: number | null
          name: string
          pricing_plan?: string | null
          program_id?: string | null
          rule_code?: string | null
          rule_priority?: number
          updated_at?: string
          version?: number
          visibility?: string
        }
        Update: {
          base_definition?: string
          campaign_id?: string | null
          commission_percentage?: number
          commission_type?: string
          created_at?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          eligibility_notes?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          max_commission_pct?: number | null
          name?: string
          pricing_plan?: string | null
          program_id?: string | null
          rule_code?: string | null
          rule_priority?: number
          updated_at?: string
          version?: number
          visibility?: string
        }
        Relationships: []
      }
      ambassador_commission_status_history: {
        Row: {
          ambassador_id: string
          commission_id: string
          created_at: string
          event_type: string
          from_status:
            | Database["public"]["Enums"]["ambassador_commission_status"]
            | null
          id: string
          public_note: string | null
          to_status: Database["public"]["Enums"]["ambassador_commission_status"]
        }
        Insert: {
          ambassador_id: string
          commission_id: string
          created_at?: string
          event_type: string
          from_status?:
            | Database["public"]["Enums"]["ambassador_commission_status"]
            | null
          id?: string
          public_note?: string | null
          to_status: Database["public"]["Enums"]["ambassador_commission_status"]
        }
        Update: {
          ambassador_id?: string
          commission_id?: string
          created_at?: string
          event_type?: string
          from_status?:
            | Database["public"]["Enums"]["ambassador_commission_status"]
            | null
          id?: string
          public_note?: string | null
          to_status?: Database["public"]["Enums"]["ambassador_commission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_commission_status_history_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "ambassador_commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_commissions: {
        Row: {
          adjustment_public_note: string | null
          ambassador_id: string
          approved_at: string | null
          available_at: string | null
          calculated_commission: number
          campaign_id: string | null
          commission_percentage: number
          commission_rule_id: string | null
          commission_rule_version: number | null
          created_at: string
          eligibility_checked_at: string | null
          eligibility_public_reason: string | null
          eligibility_rule_version: number | null
          eligibility_status: string
          eligible_base_amount: number
          enrollment_id: string | null
          id: string
          paid_at: string | null
          payout_processing_at: string | null
          payout_reference: string | null
          pricing_plan: string | null
          program_id: string | null
          public_reason: string | null
          reversal_reason: string | null
          reversal_reference: string | null
          reversed_at: string | null
          status: Database["public"]["Enums"]["ambassador_commission_status"]
          student_user_id: string | null
          transaction_code: string | null
          transaction_type: Database["public"]["Enums"]["ambassador_commission_txn_type"]
          updated_at: string
        }
        Insert: {
          adjustment_public_note?: string | null
          ambassador_id: string
          approved_at?: string | null
          available_at?: string | null
          calculated_commission?: number
          campaign_id?: string | null
          commission_percentage?: number
          commission_rule_id?: string | null
          commission_rule_version?: number | null
          created_at?: string
          eligibility_checked_at?: string | null
          eligibility_public_reason?: string | null
          eligibility_rule_version?: number | null
          eligibility_status?: string
          eligible_base_amount?: number
          enrollment_id?: string | null
          id?: string
          paid_at?: string | null
          payout_processing_at?: string | null
          payout_reference?: string | null
          pricing_plan?: string | null
          program_id?: string | null
          public_reason?: string | null
          reversal_reason?: string | null
          reversal_reference?: string | null
          reversed_at?: string | null
          status?: Database["public"]["Enums"]["ambassador_commission_status"]
          student_user_id?: string | null
          transaction_code?: string | null
          transaction_type?: Database["public"]["Enums"]["ambassador_commission_txn_type"]
          updated_at?: string
        }
        Update: {
          adjustment_public_note?: string | null
          ambassador_id?: string
          approved_at?: string | null
          available_at?: string | null
          calculated_commission?: number
          campaign_id?: string | null
          commission_percentage?: number
          commission_rule_id?: string | null
          commission_rule_version?: number | null
          created_at?: string
          eligibility_checked_at?: string | null
          eligibility_public_reason?: string | null
          eligibility_rule_version?: number | null
          eligibility_status?: string
          eligible_base_amount?: number
          enrollment_id?: string | null
          id?: string
          paid_at?: string | null
          payout_processing_at?: string | null
          payout_reference?: string | null
          pricing_plan?: string | null
          program_id?: string | null
          public_reason?: string | null
          reversal_reason?: string | null
          reversal_reference?: string | null
          reversed_at?: string | null
          status?: Database["public"]["Enums"]["ambassador_commission_status"]
          student_user_id?: string | null
          transaction_code?: string | null
          transaction_type?: Database["public"]["Enums"]["ambassador_commission_txn_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_commissions_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_commissions_commission_rule_id_fkey"
            columns: ["commission_rule_id"]
            isOneToOne: false
            referencedRelation: "ambassador_commission_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_commissions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_institution_suggestions: {
        Row: {
          admin_note: string | null
          ambassador_id: string
          city: string | null
          country: string | null
          created_at: string
          id: string
          official_website: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          state: string | null
          status: string
          suggested_name: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          ambassador_id: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          official_website?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string
          suggested_name: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          ambassador_id?: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          official_website?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string
          suggested_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_institution_suggestions_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_leaderboard_corrections: {
        Row: {
          admin_notes: string | null
          affected_ambassador_id: string | null
          applied_at: string | null
          campaign_id: string | null
          correction_code: string | null
          created_at: string
          created_by: string | null
          id: string
          leaderboard_type: Database["public"]["Enums"]["amb_leaderboard_type"]
          period_key: string | null
          program_id: string | null
          reason: string
          reason_type: string
          status: string
        }
        Insert: {
          admin_notes?: string | null
          affected_ambassador_id?: string | null
          applied_at?: string | null
          campaign_id?: string | null
          correction_code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          leaderboard_type: Database["public"]["Enums"]["amb_leaderboard_type"]
          period_key?: string | null
          program_id?: string | null
          reason: string
          reason_type: string
          status?: string
        }
        Update: {
          admin_notes?: string | null
          affected_ambassador_id?: string | null
          applied_at?: string | null
          campaign_id?: string | null
          correction_code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          leaderboard_type?: Database["public"]["Enums"]["amb_leaderboard_type"]
          period_key?: string | null
          program_id?: string | null
          reason?: string
          reason_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_leaderboard_corrections_affected_ambassador_id_fkey"
            columns: ["affected_ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_leaderboard_corrections_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ambassador_bonus_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_leaderboard_snapshots: {
        Row: {
          ambassador_id: string
          college_key: string | null
          created_at: string
          finalised_at: string
          id: string
          leaderboard_type: string
          metric_value: number
          period_key: string
          primary_metric: string
          program_id: string | null
          rank_position: number
          rule_id: string | null
          rule_version: number | null
        }
        Insert: {
          ambassador_id: string
          college_key?: string | null
          created_at?: string
          finalised_at?: string
          id?: string
          leaderboard_type: string
          metric_value?: number
          period_key: string
          primary_metric: string
          program_id?: string | null
          rank_position: number
          rule_id?: string | null
          rule_version?: number | null
        }
        Update: {
          ambassador_id?: string
          college_key?: string | null
          created_at?: string
          finalised_at?: string
          id?: string
          leaderboard_type?: string
          metric_value?: number
          period_key?: string
          primary_metric?: string
          program_id?: string | null
          rank_position?: number
          rule_id?: string | null
          rule_version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_leaderboard_snapshots_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_leaderboard_snapshots_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "ambassador_ranking_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_level_assignments: {
        Row: {
          achieved_at: string
          ambassador_id: string
          created_at: string
          evaluation_reference: string | null
          id: string
          level_id: string
          previous_level_id: string | null
          status: string
        }
        Insert: {
          achieved_at?: string
          ambassador_id: string
          created_at?: string
          evaluation_reference?: string | null
          id?: string
          level_id: string
          previous_level_id?: string | null
          status?: string
        }
        Update: {
          achieved_at?: string
          ambassador_id?: string
          created_at?: string
          evaluation_reference?: string | null
          id?: string
          level_id?: string
          previous_level_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_level_assignments_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_level_assignments_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "ambassador_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_level_assignments_previous_level_id_fkey"
            columns: ["previous_level_id"]
            isOneToOne: false
            referencedRelation: "ambassador_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_levels: {
        Row: {
          created_at: string
          description: string | null
          gradient_from: string | null
          gradient_to: string | null
          icon: string | null
          id: string
          is_published: boolean
          level_key: string
          level_order: number
          min_campaign_milestones: number
          min_commission_earned: number
          min_conversion_rate: number
          min_profile_completion: number
          min_referral_leads: number
          min_verified_enrollments: number
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          gradient_from?: string | null
          gradient_to?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          level_key: string
          level_order: number
          min_campaign_milestones?: number
          min_commission_earned?: number
          min_conversion_rate?: number
          min_profile_completion?: number
          min_referral_leads?: number
          min_verified_enrollments?: number
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          gradient_from?: string | null
          gradient_to?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          level_key?: string
          level_order?: number
          min_campaign_milestones?: number
          min_commission_earned?: number
          min_conversion_rate?: number
          min_profile_completion?: number
          min_referral_leads?: number
          min_verified_enrollments?: number
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ambassador_notification_categories: {
        Row: {
          category_key: string
          created_at: string
          description: string | null
          display_order: number
          in_app_default: boolean
          is_optional: boolean
          label: string
          pref_column: string | null
          updated_at: string
        }
        Insert: {
          category_key: string
          created_at?: string
          description?: string | null
          display_order?: number
          in_app_default?: boolean
          is_optional?: boolean
          label: string
          pref_column?: string | null
          updated_at?: string
        }
        Update: {
          category_key?: string
          created_at?: string
          description?: string | null
          display_order?: number
          in_app_default?: boolean
          is_optional?: boolean
          label?: string
          pref_column?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ambassador_notification_preferences: {
        Row: {
          ambassador_id: string
          badge_updates: boolean
          campaign_updates: boolean
          channel_email: boolean
          channel_in_app: boolean
          commission_updates: boolean
          created_at: string
          earnings_updates: boolean
          enrollment_updates: boolean
          id: string
          leaderboard_updates: boolean
          level_badge_updates: boolean
          level_updates: boolean
          marketing_updates: boolean
          milestone_updates: boolean
          payout_updates: boolean
          recognition_updates: boolean
          referral_updates: boolean
          updated_at: string
        }
        Insert: {
          ambassador_id: string
          badge_updates?: boolean
          campaign_updates?: boolean
          channel_email?: boolean
          channel_in_app?: boolean
          commission_updates?: boolean
          created_at?: string
          earnings_updates?: boolean
          enrollment_updates?: boolean
          id?: string
          leaderboard_updates?: boolean
          level_badge_updates?: boolean
          level_updates?: boolean
          marketing_updates?: boolean
          milestone_updates?: boolean
          payout_updates?: boolean
          recognition_updates?: boolean
          referral_updates?: boolean
          updated_at?: string
        }
        Update: {
          ambassador_id?: string
          badge_updates?: boolean
          campaign_updates?: boolean
          channel_email?: boolean
          channel_in_app?: boolean
          commission_updates?: boolean
          created_at?: string
          earnings_updates?: boolean
          enrollment_updates?: boolean
          id?: string
          leaderboard_updates?: boolean
          level_badge_updates?: boolean
          level_updates?: boolean
          marketing_updates?: boolean
          milestone_updates?: boolean
          payout_updates?: boolean
          recognition_updates?: boolean
          referral_updates?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_notification_preferences_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: true
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_notifications: {
        Row: {
          action_route: string | null
          action_type: string | null
          ambassador_id: string | null
          archived_at: string | null
          category: string
          created_at: string
          dedupe_key: string
          id: string
          message: string
          notif_type: string
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_route?: string | null
          action_type?: string | null
          ambassador_id?: string | null
          archived_at?: string | null
          category: string
          created_at?: string
          dedupe_key?: string
          id?: string
          message: string
          notif_type?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_route?: string | null
          action_type?: string | null
          ambassador_id?: string | null
          archived_at?: string | null
          category?: string
          created_at?: string
          dedupe_key?: string
          id?: string
          message?: string
          notif_type?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_notifications_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_payout_activity: {
        Row: {
          ambassador_id: string
          created_at: string
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          payout_id: string | null
          profile_id: string | null
        }
        Insert: {
          ambassador_id: string
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          payout_id?: string | null
          profile_id?: string | null
        }
        Update: {
          ambassador_id?: string
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          payout_id?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_payout_activity_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_payout_activity_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "ambassador_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_payout_activity_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "ambassador_payout_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_payout_allocations: {
        Row: {
          allocated_amount: number
          commission_id: string
          created_at: string
          id: string
          payout_id: string
        }
        Insert: {
          allocated_amount: number
          commission_id: string
          created_at?: string
          id?: string
          payout_id: string
        }
        Update: {
          allocated_amount?: number
          commission_id?: string
          created_at?: string
          id?: string
          payout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_payout_allocations_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "ambassador_commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_payout_allocations_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "ambassador_payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_payout_profile_versions: {
        Row: {
          account_holder_name: string | null
          account_number_masked: string | null
          account_type:
            | Database["public"]["Enums"]["ambassador_bank_account_type"]
            | null
          ambassador_id: string
          bank_name: string | null
          beneficiary_name: string | null
          created_at: string
          id: string
          ifsc_code: string | null
          payout_method:
            | Database["public"]["Enums"]["ambassador_payout_method"]
            | null
          profile_id: string
          status: Database["public"]["Enums"]["ambassador_payout_profile_status"]
          submitted_at: string | null
          upi_id_masked: string | null
          verified_at: string | null
          version_number: number
        }
        Insert: {
          account_holder_name?: string | null
          account_number_masked?: string | null
          account_type?:
            | Database["public"]["Enums"]["ambassador_bank_account_type"]
            | null
          ambassador_id: string
          bank_name?: string | null
          beneficiary_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string | null
          payout_method?:
            | Database["public"]["Enums"]["ambassador_payout_method"]
            | null
          profile_id: string
          status: Database["public"]["Enums"]["ambassador_payout_profile_status"]
          submitted_at?: string | null
          upi_id_masked?: string | null
          verified_at?: string | null
          version_number: number
        }
        Update: {
          account_holder_name?: string | null
          account_number_masked?: string | null
          account_type?:
            | Database["public"]["Enums"]["ambassador_bank_account_type"]
            | null
          ambassador_id?: string
          bank_name?: string | null
          beneficiary_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string | null
          payout_method?:
            | Database["public"]["Enums"]["ambassador_payout_method"]
            | null
          profile_id?: string
          status?: Database["public"]["Enums"]["ambassador_payout_profile_status"]
          submitted_at?: string | null
          upi_id_masked?: string | null
          verified_at?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_payout_profile_versions_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_payout_profile_versions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "ambassador_payout_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_payout_profiles: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          account_number_masked: string | null
          account_type:
            | Database["public"]["Enums"]["ambassador_bank_account_type"]
            | null
          admin_public_message: string | null
          ambassador_id: string
          bank_name: string | null
          beneficiary_name: string | null
          created_at: string
          id: string
          ifsc_code: string | null
          payout_method:
            | Database["public"]["Enums"]["ambassador_payout_method"]
            | null
          profile_code: string | null
          rejected_at: string | null
          status: Database["public"]["Enums"]["ambassador_payout_profile_status"]
          submitted_at: string | null
          under_review_at: string | null
          updated_at: string
          upi_id: string | null
          upi_id_masked: string | null
          user_id: string
          verification_reference: string | null
          verified_at: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          account_number_masked?: string | null
          account_type?:
            | Database["public"]["Enums"]["ambassador_bank_account_type"]
            | null
          admin_public_message?: string | null
          ambassador_id: string
          bank_name?: string | null
          beneficiary_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string | null
          payout_method?:
            | Database["public"]["Enums"]["ambassador_payout_method"]
            | null
          profile_code?: string | null
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["ambassador_payout_profile_status"]
          submitted_at?: string | null
          under_review_at?: string | null
          updated_at?: string
          upi_id?: string | null
          upi_id_masked?: string | null
          user_id: string
          verification_reference?: string | null
          verified_at?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          account_number_masked?: string | null
          account_type?:
            | Database["public"]["Enums"]["ambassador_bank_account_type"]
            | null
          admin_public_message?: string | null
          ambassador_id?: string
          bank_name?: string | null
          beneficiary_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string | null
          payout_method?:
            | Database["public"]["Enums"]["ambassador_payout_method"]
            | null
          profile_code?: string | null
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["ambassador_payout_profile_status"]
          submitted_at?: string | null
          under_review_at?: string | null
          updated_at?: string
          upi_id?: string | null
          upi_id_masked?: string | null
          user_id?: string
          verification_reference?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_payout_profiles_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: true
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_payouts: {
        Row: {
          ambassador_id: string
          amount: number
          approved_at: string | null
          cancelled_at: string | null
          created_at: string
          currency: string
          failed_at: string | null
          id: string
          idempotency_key: string | null
          masked_destination: string | null
          mode: string
          on_hold_at: string | null
          paid_at: string | null
          payout_code: string | null
          payout_method:
            | Database["public"]["Enums"]["ambassador_payout_method"]
            | null
          payout_profile_id: string | null
          payout_profile_version_id: string | null
          processing_at: string | null
          provider_reference: string | null
          public_failure_reason: string | null
          public_hold_reason: string | null
          public_reversal_reason: string | null
          requested_at: string
          reversed_at: string | null
          status: Database["public"]["Enums"]["ambassador_payout_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ambassador_id: string
          amount: number
          approved_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          failed_at?: string | null
          id?: string
          idempotency_key?: string | null
          masked_destination?: string | null
          mode?: string
          on_hold_at?: string | null
          paid_at?: string | null
          payout_code?: string | null
          payout_method?:
            | Database["public"]["Enums"]["ambassador_payout_method"]
            | null
          payout_profile_id?: string | null
          payout_profile_version_id?: string | null
          processing_at?: string | null
          provider_reference?: string | null
          public_failure_reason?: string | null
          public_hold_reason?: string | null
          public_reversal_reason?: string | null
          requested_at?: string
          reversed_at?: string | null
          status?: Database["public"]["Enums"]["ambassador_payout_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ambassador_id?: string
          amount?: number
          approved_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          failed_at?: string | null
          id?: string
          idempotency_key?: string | null
          masked_destination?: string | null
          mode?: string
          on_hold_at?: string | null
          paid_at?: string | null
          payout_code?: string | null
          payout_method?:
            | Database["public"]["Enums"]["ambassador_payout_method"]
            | null
          payout_profile_id?: string | null
          payout_profile_version_id?: string | null
          processing_at?: string | null
          provider_reference?: string | null
          public_failure_reason?: string | null
          public_hold_reason?: string | null
          public_reversal_reason?: string | null
          requested_at?: string
          reversed_at?: string | null
          status?: Database["public"]["Enums"]["ambassador_payout_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_payouts_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_payouts_payout_profile_id_fkey"
            columns: ["payout_profile_id"]
            isOneToOne: false
            referencedRelation: "ambassador_payout_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_payouts_payout_profile_version_id_fkey"
            columns: ["payout_profile_version_id"]
            isOneToOne: false
            referencedRelation: "ambassador_payout_profile_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_performance_scores: {
        Row: {
          ambassador_id: string
          calculated_at: string
          campaign_component: number
          campaign_id: string | null
          conversion_component: number
          final_score: number
          id: string
          is_eligible: boolean
          marketing_component: number
          period_key: string | null
          program_id: string | null
          referral_lead_component: number
          rule_id: string
          rule_version: number
          verified_enrollment_component: number
        }
        Insert: {
          ambassador_id: string
          calculated_at?: string
          campaign_component?: number
          campaign_id?: string | null
          conversion_component?: number
          final_score?: number
          id?: string
          is_eligible?: boolean
          marketing_component?: number
          period_key?: string | null
          program_id?: string | null
          referral_lead_component?: number
          rule_id: string
          rule_version: number
          verified_enrollment_component?: number
        }
        Update: {
          ambassador_id?: string
          calculated_at?: string
          campaign_component?: number
          campaign_id?: string | null
          conversion_component?: number
          final_score?: number
          id?: string
          is_eligible?: boolean
          marketing_component?: number
          period_key?: string | null
          program_id?: string | null
          referral_lead_component?: number
          rule_id?: string
          rule_version?: number
          verified_enrollment_component?: number
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_performance_scores_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_performance_scores_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ambassador_bonus_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_performance_scores_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "ambassador_ranking_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_profile_activity: {
        Row: {
          ambassador_id: string
          created_at: string
          description: string | null
          event_type: string
          id: string
          metadata: Json
        }
        Insert: {
          ambassador_id: string
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          ambassador_id?: string
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_profile_activity_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_rank_movements: {
        Row: {
          ambassador_id: string
          calculated_at: string
          campaign_id: string | null
          current_rank: number
          id: string
          is_new: boolean
          leaderboard_type: Database["public"]["Enums"]["amb_leaderboard_type"]
          period_key: string | null
          previous_rank: number | null
          program_id: string | null
          rank_difference: number | null
        }
        Insert: {
          ambassador_id: string
          calculated_at?: string
          campaign_id?: string | null
          current_rank: number
          id?: string
          is_new?: boolean
          leaderboard_type: Database["public"]["Enums"]["amb_leaderboard_type"]
          period_key?: string | null
          previous_rank?: number | null
          program_id?: string | null
          rank_difference?: number | null
        }
        Update: {
          ambassador_id?: string
          calculated_at?: string
          campaign_id?: string | null
          current_rank?: number
          id?: string
          is_new?: boolean
          leaderboard_type?: Database["public"]["Enums"]["amb_leaderboard_type"]
          period_key?: string | null
          previous_rank?: number | null
          program_id?: string | null
          rank_difference?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_rank_movements_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_rank_movements_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ambassador_bonus_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_ranking_rule_components: {
        Row: {
          component: Database["public"]["Enums"]["amb_weighted_component"]
          created_at: string
          id: string
          is_active: boolean
          rule_id: string
          weight_percentage: number
        }
        Insert: {
          component: Database["public"]["Enums"]["amb_weighted_component"]
          created_at?: string
          id?: string
          is_active?: boolean
          rule_id: string
          weight_percentage: number
        }
        Update: {
          component?: Database["public"]["Enums"]["amb_weighted_component"]
          created_at?: string
          id?: string
          is_active?: boolean
          rule_id?: string
          weight_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_ranking_rule_components_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "ambassador_ranking_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_ranking_rules: {
        Row: {
          ambassador_explanation: string | null
          created_at: string
          created_by: string | null
          effective_from: string
          effective_until: string | null
          final_tie_policy: Database["public"]["Enums"]["amb_final_tie_policy"]
          id: string
          is_published: boolean
          leaderboard_type: Database["public"]["Enums"]["amb_leaderboard_type"]
          minimum_activity_metric:
            | Database["public"]["Enums"]["amb_ranking_metric"]
            | null
          minimum_activity_threshold: number
          parent_rule_id: string | null
          ranking_metric: Database["public"]["Enums"]["amb_ranking_metric"]
          ranking_period_type: Database["public"]["Enums"]["amb_ranking_period_type"]
          rule_code: string | null
          rule_name: string
          rule_version: number
          status: string
          tie_breaker_1:
            | Database["public"]["Enums"]["amb_tie_breaker_type"]
            | null
          tie_breaker_2:
            | Database["public"]["Enums"]["amb_tie_breaker_type"]
            | null
          tie_breaker_3:
            | Database["public"]["Enums"]["amb_tie_breaker_type"]
            | null
          updated_at: string
        }
        Insert: {
          ambassador_explanation?: string | null
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_until?: string | null
          final_tie_policy?: Database["public"]["Enums"]["amb_final_tie_policy"]
          id?: string
          is_published?: boolean
          leaderboard_type: Database["public"]["Enums"]["amb_leaderboard_type"]
          minimum_activity_metric?:
            | Database["public"]["Enums"]["amb_ranking_metric"]
            | null
          minimum_activity_threshold?: number
          parent_rule_id?: string | null
          ranking_metric: Database["public"]["Enums"]["amb_ranking_metric"]
          ranking_period_type?: Database["public"]["Enums"]["amb_ranking_period_type"]
          rule_code?: string | null
          rule_name: string
          rule_version?: number
          status?: string
          tie_breaker_1?:
            | Database["public"]["Enums"]["amb_tie_breaker_type"]
            | null
          tie_breaker_2?:
            | Database["public"]["Enums"]["amb_tie_breaker_type"]
            | null
          tie_breaker_3?:
            | Database["public"]["Enums"]["amb_tie_breaker_type"]
            | null
          updated_at?: string
        }
        Update: {
          ambassador_explanation?: string | null
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_until?: string | null
          final_tie_policy?: Database["public"]["Enums"]["amb_final_tie_policy"]
          id?: string
          is_published?: boolean
          leaderboard_type?: Database["public"]["Enums"]["amb_leaderboard_type"]
          minimum_activity_metric?:
            | Database["public"]["Enums"]["amb_ranking_metric"]
            | null
          minimum_activity_threshold?: number
          parent_rule_id?: string | null
          ranking_metric?: Database["public"]["Enums"]["amb_ranking_metric"]
          ranking_period_type?: Database["public"]["Enums"]["amb_ranking_period_type"]
          rule_code?: string | null
          rule_name?: string
          rule_version?: number
          status?: string
          tie_breaker_1?:
            | Database["public"]["Enums"]["amb_tie_breaker_type"]
            | null
          tie_breaker_2?:
            | Database["public"]["Enums"]["amb_tie_breaker_type"]
            | null
          tie_breaker_3?:
            | Database["public"]["Enums"]["amb_tie_breaker_type"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_ranking_rules_parent_rule_id_fkey"
            columns: ["parent_rule_id"]
            isOneToOne: false
            referencedRelation: "ambassador_ranking_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_recognition_achievements: {
        Row: {
          achieved_at: string
          ambassador_id: string
          badge_id: string | null
          campaign_id: string | null
          campaign_snapshot_id: string | null
          college_key: string | null
          created_at: string
          final_rank: number
          id: string
          leaderboard_snapshot_id: string | null
          program_id: string | null
          ranking_period_key: string
          recognition_description: string | null
          recognition_rule_id: string
          recognition_rule_version: number
          recognition_title: string
          status: string
        }
        Insert: {
          achieved_at?: string
          ambassador_id: string
          badge_id?: string | null
          campaign_id?: string | null
          campaign_snapshot_id?: string | null
          college_key?: string | null
          created_at?: string
          final_rank: number
          id?: string
          leaderboard_snapshot_id?: string | null
          program_id?: string | null
          ranking_period_key: string
          recognition_description?: string | null
          recognition_rule_id: string
          recognition_rule_version: number
          recognition_title: string
          status?: string
        }
        Update: {
          achieved_at?: string
          ambassador_id?: string
          badge_id?: string | null
          campaign_id?: string | null
          campaign_snapshot_id?: string | null
          college_key?: string | null
          created_at?: string
          final_rank?: number
          id?: string
          leaderboard_snapshot_id?: string | null
          program_id?: string | null
          ranking_period_key?: string
          recognition_description?: string | null
          recognition_rule_id?: string
          recognition_rule_version?: number
          recognition_title?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_recognition_achievements_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_recognition_achievements_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "ambassador_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_recognition_achievements_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ambassador_bonus_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_recognition_achievements_recognition_rule_id_fkey"
            columns: ["recognition_rule_id"]
            isOneToOne: false
            referencedRelation: "ambassador_recognition_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_recognition_rules: {
        Row: {
          badge_id: string | null
          created_at: string
          effective_from: string
          effective_until: string | null
          eligible_positions: number[]
          id: string
          is_published: boolean
          leaderboard_type: string
          ranking_period_type: string
          recognition_description: string | null
          recognition_name: string
          recognition_title: string
          recognition_type: string
          rule_code: string
          rule_version: number
          status: string
          updated_at: string
        }
        Insert: {
          badge_id?: string | null
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          eligible_positions?: number[]
          id?: string
          is_published?: boolean
          leaderboard_type: string
          ranking_period_type: string
          recognition_description?: string | null
          recognition_name: string
          recognition_title: string
          recognition_type: string
          rule_code: string
          rule_version?: number
          status?: string
          updated_at?: string
        }
        Update: {
          badge_id?: string | null
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          eligible_positions?: number[]
          id?: string
          is_published?: boolean
          leaderboard_type?: string
          ranking_period_type?: string
          recognition_description?: string | null
          recognition_name?: string
          recognition_title?: string
          recognition_type?: string
          rule_code?: string
          rule_version?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_recognition_rules_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "ambassador_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_referral_events: {
        Row: {
          ambassador_id: string
          commission_id: string | null
          created_at: string
          enrollment_id: string | null
          event_label: string
          event_source: string
          event_type: string
          id: string
          metadata: Json
          referral_lead_id: string | null
          related_entity_id: string | null
          related_entity_type: string | null
        }
        Insert: {
          ambassador_id: string
          commission_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          event_label: string
          event_source?: string
          event_type: string
          id?: string
          metadata?: Json
          referral_lead_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
        }
        Update: {
          ambassador_id?: string
          commission_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          event_label?: string
          event_source?: string
          event_type?: string
          id?: string
          metadata?: Json
          referral_lead_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_referral_events_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_referral_events_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "ambassador_commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_referral_events_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_referral_events_referral_lead_id_fkey"
            columns: ["referral_lead_id"]
            isOneToOne: false
            referencedRelation: "ambassador_referral_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_referral_leads: {
        Row: {
          ambassador_id: string
          attribution_model: string
          attribution_public_reason: string | null
          attribution_status: Database["public"]["Enums"]["ambassador_attribution_status"]
          campaign_id: string | null
          created_at: string
          display_name: string | null
          enrollment_id: string | null
          id: string
          lead_code: string | null
          lead_reference: string | null
          lead_source: string | null
          pricing_plan: string | null
          program_id: string | null
          referral_code: string
          session_id: string | null
          status: string
          student_user_id: string | null
          updated_at: string
        }
        Insert: {
          ambassador_id: string
          attribution_model?: string
          attribution_public_reason?: string | null
          attribution_status?: Database["public"]["Enums"]["ambassador_attribution_status"]
          campaign_id?: string | null
          created_at?: string
          display_name?: string | null
          enrollment_id?: string | null
          id?: string
          lead_code?: string | null
          lead_reference?: string | null
          lead_source?: string | null
          pricing_plan?: string | null
          program_id?: string | null
          referral_code: string
          session_id?: string | null
          status?: string
          student_user_id?: string | null
          updated_at?: string
        }
        Update: {
          ambassador_id?: string
          attribution_model?: string
          attribution_public_reason?: string | null
          attribution_status?: Database["public"]["Enums"]["ambassador_attribution_status"]
          campaign_id?: string | null
          created_at?: string
          display_name?: string | null
          enrollment_id?: string | null
          id?: string
          lead_code?: string | null
          lead_reference?: string | null
          lead_source?: string | null
          pricing_plan?: string | null
          program_id?: string | null
          referral_code?: string
          session_id?: string | null
          status?: string
          student_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_referral_leads_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_referral_leads_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_referral_leads_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ambassador_referral_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_referral_sessions: {
        Row: {
          ambassador_id: string
          campaign_id: string | null
          created_at: string
          expires_at: string
          id: string
          ip_hash: string | null
          landing_page: string | null
          program_id: string | null
          referral_code: string
          user_agent: string | null
          visitor_hash: string | null
        }
        Insert: {
          ambassador_id: string
          campaign_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          ip_hash?: string | null
          landing_page?: string | null
          program_id?: string | null
          referral_code: string
          user_agent?: string | null
          visitor_hash?: string | null
        }
        Update: {
          ambassador_id?: string
          campaign_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_hash?: string | null
          landing_page?: string | null
          program_id?: string | null
          referral_code?: string
          user_agent?: string | null
          visitor_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_referral_sessions_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_referral_visits: {
        Row: {
          ambassador_id: string
          campaign_id: string | null
          created_at: string
          id: string
          landing_page: string | null
          program_id: string | null
          referral_code: string
          session_id: string | null
          visitor_hash: string | null
        }
        Insert: {
          ambassador_id: string
          campaign_id?: string | null
          created_at?: string
          id?: string
          landing_page?: string | null
          program_id?: string | null
          referral_code: string
          session_id?: string | null
          visitor_hash?: string | null
        }
        Update: {
          ambassador_id?: string
          campaign_id?: string | null
          created_at?: string
          id?: string
          landing_page?: string | null
          program_id?: string | null
          referral_code?: string
          session_id?: string | null
          visitor_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_referral_visits_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_referral_visits_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ambassador_referral_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_attempts: {
        Row: {
          answers: Json
          assessment_id: string
          course_id: string
          created_at: string
          enrollment_id: string | null
          id: string
          max_score: number | null
          passed: boolean | null
          percentage: number | null
          score: number | null
          started_at: string
          status: string
          student_user_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          answers?: Json
          assessment_id: string
          course_id: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          max_score?: number | null
          passed?: boolean | null
          percentage?: number | null
          score?: number | null
          started_at?: string
          status?: string
          student_user_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          answers?: Json
          assessment_id?: string
          course_id?: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          max_score?: number | null
          passed?: boolean | null
          percentage?: number | null
          score?: number | null
          started_at?: string
          status?: string
          student_user_id?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "course_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          assessment_id: string
          correct_answers: Json
          created_at: string
          display_order: number
          id: string
          options: Json
          points: number
          question_text: string
          question_type: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          correct_answers?: Json
          created_at?: string
          display_order?: number
          id?: string
          options?: Json
          points?: number
          question_text: string
          question_type: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          correct_answers?: Json
          created_at?: string
          display_order?: number
          id?: string
          options?: Json
          points?: number
          question_text?: string
          question_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "course_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          course_id: string
          created_at: string
          enrollment_id: string | null
          file_url: string | null
          files: Json
          id: string
          is_draft: boolean
          is_late: boolean
          repository_link: string | null
          result: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_feedback: string | null
          revision_notes: string | null
          score: number | null
          status: string
          student_user_id: string
          submission_link: string | null
          submission_notes: string | null
          submission_text: string | null
          submitted_at: string
          updated_at: string
          version: number
        }
        Insert: {
          assignment_id: string
          course_id: string
          created_at?: string
          enrollment_id?: string | null
          file_url?: string | null
          files?: Json
          id?: string
          is_draft?: boolean
          is_late?: boolean
          repository_link?: string | null
          result?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_feedback?: string | null
          revision_notes?: string | null
          score?: number | null
          status?: string
          student_user_id: string
          submission_link?: string | null
          submission_notes?: string | null
          submission_text?: string | null
          submitted_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          assignment_id?: string
          course_id?: string
          created_at?: string
          enrollment_id?: string | null
          file_url?: string | null
          files?: Json
          id?: string
          is_draft?: boolean
          is_late?: boolean
          repository_link?: string | null
          result?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_feedback?: string | null
          revision_notes?: string | null
          score?: number | null
          status?: string
          student_user_id?: string
          submission_link?: string | null
          submission_notes?: string | null
          submission_text?: string | null
          submitted_at?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "course_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_settings: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          late_mark_time: string
          min_hours_full_day: number
          min_hours_half_day: number
          timezone: string
          updated_at: string
          updated_by: string | null
          weekly_off_days: number[]
          work_start_time: string
          working_days: number[]
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          late_mark_time?: string
          min_hours_full_day?: number
          min_hours_half_day?: number
          timezone?: string
          updated_at?: string
          updated_by?: string | null
          weekly_off_days?: number[]
          work_start_time?: string
          working_days?: number[]
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          late_mark_time?: string
          min_hours_full_day?: number
          min_hours_half_day?: number
          timezone?: string
          updated_at?: string
          updated_by?: string | null
          weekly_off_days?: number[]
          work_start_time?: string
          working_days?: number[]
        }
        Relationships: []
      }
      auth_otp_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          mobile: string
          purpose: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          mobile: string
          purpose?: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          mobile?: string
          purpose?: string
        }
        Relationships: []
      }
      automation_approvals: {
        Row: {
          approver_id: string | null
          approver_role: string | null
          created_at: string
          decided_at: string | null
          expires_at: string | null
          handler: string
          id: string
          job_id: string | null
          payload: Json
          reason: string | null
          requested_by: string | null
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          approver_id?: string | null
          approver_role?: string | null
          created_at?: string
          decided_at?: string | null
          expires_at?: string | null
          handler: string
          id?: string
          job_id?: string | null
          payload?: Json
          reason?: string | null
          requested_by?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          approver_id?: string | null
          approver_role?: string | null
          created_at?: string
          decided_at?: string | null
          expires_at?: string | null
          handler?: string
          id?: string
          job_id?: string | null
          payload?: Json
          reason?: string | null
          requested_by?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_approvals_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "automation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_attribution: {
        Row: {
          brand_id: string | null
          campaign_id: string | null
          created_at: string
          event_id: string | null
          event_type: string
          id: string
          revenue: number
          user_id: string | null
          workflow_id: string | null
          workflow_run_id: string | null
        }
        Insert: {
          brand_id?: string | null
          campaign_id?: string | null
          created_at?: string
          event_id?: string | null
          event_type: string
          id?: string
          revenue?: number
          user_id?: string | null
          workflow_id?: string | null
          workflow_run_id?: string | null
        }
        Update: {
          brand_id?: string | null
          campaign_id?: string | null
          created_at?: string
          event_id?: string | null
          event_type?: string
          id?: string
          revenue?: number
          user_id?: string | null
          workflow_id?: string | null
          workflow_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_attribution_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "automation_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_attribution_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_attribution_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "automation_workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_channel_messages: {
        Row: {
          body: string | null
          brand_id: string | null
          channel: string
          created_at: string
          error: string | null
          id: string
          provider: string | null
          provider_message_id: string | null
          recipient: string
          sent_at: string | null
          status: string
          subject: string | null
          user_id: string | null
          workflow_run_id: string | null
        }
        Insert: {
          body?: string | null
          brand_id?: string | null
          channel: string
          created_at?: string
          error?: string | null
          id?: string
          provider?: string | null
          provider_message_id?: string | null
          recipient: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          user_id?: string | null
          workflow_run_id?: string | null
        }
        Update: {
          body?: string | null
          brand_id?: string | null
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          provider?: string | null
          provider_message_id?: string | null
          recipient?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          user_id?: string | null
          workflow_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_channel_messages_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "automation_workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_events: {
        Row: {
          brand_id: string | null
          created_at: string
          device: string | null
          event_name: string
          id: string
          location: string | null
          occurred_at: string
          properties: Json
          session_id: string | null
          user_id: string | null
          utm: Json
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          device?: string | null
          event_name: string
          id?: string
          location?: string | null
          occurred_at?: string
          properties?: Json
          session_id?: string | null
          user_id?: string | null
          utm?: Json
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          device?: string | null
          event_name?: string
          id?: string
          location?: string | null
          occurred_at?: string
          properties?: Json
          session_id?: string | null
          user_id?: string | null
          utm?: Json
        }
        Relationships: []
      }
      automation_events_queue: {
        Row: {
          created_at: string
          error: string | null
          event_name: string
          id: string
          jobs_created: number | null
          payload: Json
          processed_at: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_name: string
          id?: string
          jobs_created?: number | null
          payload?: Json
          processed_at?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_name?: string
          id?: string
          jobs_created?: number | null
          payload?: Json
          processed_at?: string | null
          source?: string | null
        }
        Relationships: []
      }
      automation_handlers: {
        Row: {
          category: string
          code: string
          config: Json
          created_at: string
          default_max_attempts: number
          default_priority: number
          default_timeout_seconds: number
          description: string | null
          is_enabled: boolean
          requires_approval: boolean
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          config?: Json
          created_at?: string
          default_max_attempts?: number
          default_priority?: number
          default_timeout_seconds?: number
          description?: string | null
          is_enabled?: boolean
          requires_approval?: boolean
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          config?: Json
          created_at?: string
          default_max_attempts?: number
          default_priority?: number
          default_timeout_seconds?: number
          description?: string | null
          is_enabled?: boolean
          requires_approval?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      automation_jobs: {
        Row: {
          approval_id: string | null
          attempts: number
          backoff_seconds: number
          completed_at: string | null
          correlation_id: string | null
          created_at: string
          handler: string
          id: string
          idempotency_key: string | null
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          owner_id: string | null
          parent_job_id: string | null
          payload: Json
          priority: number
          result: Json | null
          run_at: string
          started_at: string | null
          status: string
          timeout_seconds: number
          updated_at: string
        }
        Insert: {
          approval_id?: string | null
          attempts?: number
          backoff_seconds?: number
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          handler: string
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          owner_id?: string | null
          parent_job_id?: string | null
          payload?: Json
          priority?: number
          result?: Json | null
          run_at?: string
          started_at?: string | null
          status?: string
          timeout_seconds?: number
          updated_at?: string
        }
        Update: {
          approval_id?: string | null
          attempts?: number
          backoff_seconds?: number
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          handler?: string
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          owner_id?: string | null
          parent_job_id?: string | null
          payload?: Json
          priority?: number
          result?: Json | null
          run_at?: string
          started_at?: string | null
          status?: string
          timeout_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_jobs_approval_fk"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "automation_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_jobs_handler_fkey"
            columns: ["handler"]
            isOneToOne: false
            referencedRelation: "automation_handlers"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "automation_jobs_parent_job_id_fkey"
            columns: ["parent_job_id"]
            isOneToOne: false
            referencedRelation: "automation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_metrics_daily: {
        Row: {
          avg_duration_ms: number
          created_at: string
          day: string
          handler: string
          jobs_dead_letter: number
          jobs_failed: number
          jobs_succeeded: number
          jobs_total: number
          p95_duration_ms: number
          retries: number
          updated_at: string
        }
        Insert: {
          avg_duration_ms?: number
          created_at?: string
          day: string
          handler: string
          jobs_dead_letter?: number
          jobs_failed?: number
          jobs_succeeded?: number
          jobs_total?: number
          p95_duration_ms?: number
          retries?: number
          updated_at?: string
        }
        Update: {
          avg_duration_ms?: number
          created_at?: string
          day?: string
          handler?: string
          jobs_dead_letter?: number
          jobs_failed?: number
          jobs_succeeded?: number
          jobs_total?: number
          p95_duration_ms?: number
          retries?: number
          updated_at?: string
        }
        Relationships: []
      }
      automation_notifications: {
        Row: {
          body: string | null
          channel: string
          created_at: string
          data: Json
          delivered_at: string | null
          id: string
          job_id: string | null
          read_at: string | null
          recipient_role: string | null
          recipient_user_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          channel: string
          created_at?: string
          data?: Json
          delivered_at?: string | null
          id?: string
          job_id?: string | null
          read_at?: string | null
          recipient_role?: string | null
          recipient_user_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string
          data?: Json
          delivered_at?: string | null
          id?: string
          job_id?: string | null
          read_at?: string | null
          recipient_role?: string | null
          recipient_user_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "automation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_recommendations: {
        Row: {
          brand_id: string | null
          created_at: string
          dismissed_at: string | null
          expires_at: string | null
          id: string
          kind: string
          reason: string | null
          score: number
          target_id: string | null
          target_slug: string | null
          title: string
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          kind: string
          reason?: string | null
          score?: number
          target_id?: string | null
          target_slug?: string | null
          title: string
          user_id: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          kind?: string
          reason?: string | null
          score?: number
          target_id?: string | null
          target_slug?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_triggers: {
        Row: {
          created_at: string
          cron_expression: string | null
          event_name: string | null
          handler: string
          id: string
          is_enabled: boolean
          kind: string
          last_run_at: string | null
          last_status: string | null
          match: Json
          name: string
          next_run_at: string | null
          owner_id: string | null
          payload_template: Json
          priority: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          cron_expression?: string | null
          event_name?: string | null
          handler: string
          id?: string
          is_enabled?: boolean
          kind: string
          last_run_at?: string | null
          last_status?: string | null
          match?: Json
          name: string
          next_run_at?: string | null
          owner_id?: string | null
          payload_template?: Json
          priority?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          cron_expression?: string | null
          event_name?: string | null
          handler?: string
          id?: string
          is_enabled?: boolean
          kind?: string
          last_run_at?: string | null
          last_status?: string | null
          match?: Json
          name?: string
          next_run_at?: string | null
          owner_id?: string | null
          payload_template?: Json
          priority?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_triggers_handler_fkey"
            columns: ["handler"]
            isOneToOne: false
            referencedRelation: "automation_handlers"
            referencedColumns: ["code"]
          },
        ]
      }
      automation_user_profiles: {
        Row: {
          ai_segment_labels: string[]
          brand_id: string | null
          created_at: string
          engagement_score: number
          last_active_at: string | null
          lead_source: string | null
          lifetime_revenue: number
          next_best_action: Json | null
          referral_source: string | null
          top_interests: Json
          total_course_views: number
          total_logins: number
          total_page_views: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_segment_labels?: string[]
          brand_id?: string | null
          created_at?: string
          engagement_score?: number
          last_active_at?: string | null
          lead_source?: string | null
          lifetime_revenue?: number
          next_best_action?: Json | null
          referral_source?: string | null
          top_interests?: Json
          total_course_views?: number
          total_logins?: number
          total_page_views?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_segment_labels?: string[]
          brand_id?: string | null
          created_at?: string
          engagement_score?: number
          last_active_at?: string | null
          lead_source?: string | null
          lifetime_revenue?: number
          next_best_action?: Json | null
          referral_source?: string | null
          top_interests?: Json
          total_course_views?: number
          total_logins?: number
          total_page_views?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_workflow_runs: {
        Row: {
          brand_id: string | null
          completed_at: string | null
          context: Json
          created_at: string
          current_node_id: string | null
          history: Json
          id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string | null
          wait_until: string | null
          workflow_id: string
        }
        Insert: {
          brand_id?: string | null
          completed_at?: string | null
          context?: Json
          created_at?: string
          current_node_id?: string | null
          history?: Json
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          wait_until?: string | null
          workflow_id: string
        }
        Update: {
          brand_id?: string | null
          completed_at?: string | null
          context?: Json
          created_at?: string
          current_node_id?: string | null
          history?: Json
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          wait_until?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_workflows: {
        Row: {
          brand_id: string | null
          created_at: string
          description: string | null
          goal: Json | null
          graph: Json
          id: string
          name: string
          owner_id: string | null
          stats: Json
          status: string
          trigger: Json
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          description?: string | null
          goal?: Json | null
          graph?: Json
          id?: string
          name: string
          owner_id?: string | null
          stats?: Json
          status?: string
          trigger?: Json
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          description?: string | null
          goal?: Json | null
          graph?: Json
          id?: string
          name?: string
          owner_id?: string | null
          stats?: Json
          status?: string
          trigger?: Json
          updated_at?: string
        }
        Relationships: []
      }
      batch_enrollments: {
        Row: {
          active: boolean
          batch_id: string
          enrolled_at: string
          id: string
          student_user_id: string
        }
        Insert: {
          active?: boolean
          batch_id: string
          enrolled_at?: string
          id?: string
          student_user_id: string
        }
        Update: {
          active?: boolean
          batch_id?: string
          enrolled_at?: string
          id?: string
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_enrollments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          capacity: number | null
          cohort_end_date: string | null
          cohort_start_date: string | null
          course_id: string | null
          created_at: string
          created_by: string | null
          id: string
          metadata: Json
          name: string
          schedule_summary: string | null
          slug: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          cohort_end_date?: string | null
          cohort_start_date?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          name: string
          schedule_summary?: string | null
          slug: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          cohort_end_date?: string | null
          cohort_start_date?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          name?: string
          schedule_summary?: string | null
          slug?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      benefit_types: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_analytics_daily: {
        Row: {
          avg_position: number | null
          blog_post_id: string
          bounce_rate: number | null
          clicks: number
          conversions: number
          created_at: string
          ctr: number | null
          day: string
          id: string
          impressions: number
          revenue_generated: number | null
          top_keywords: Json | null
          top_referrers: Json | null
          views: number
        }
        Insert: {
          avg_position?: number | null
          blog_post_id: string
          bounce_rate?: number | null
          clicks?: number
          conversions?: number
          created_at?: string
          ctr?: number | null
          day: string
          id?: string
          impressions?: number
          revenue_generated?: number | null
          top_keywords?: Json | null
          top_referrers?: Json | null
          views?: number
        }
        Update: {
          avg_position?: number | null
          blog_post_id?: string
          bounce_rate?: number | null
          clicks?: number
          conversions?: number
          created_at?: string
          ctr?: number | null
          day?: string
          id?: string
          impressions?: number
          revenue_generated?: number | null
          top_keywords?: Json | null
          top_referrers?: Json | null
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_analytics_daily_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_generation_jobs: {
        Row: {
          ai_model: string | null
          ai_provider: string | null
          brand_id: string | null
          completed_at: string | null
          completed_items: number
          created_at: string
          created_by: string | null
          error_log: Json
          failed_items: number
          id: string
          input_payload: Json
          job_type: string
          output_blog_ids: string[]
          started_at: string | null
          status: string
          title: string
          total_items: number
          updated_at: string
        }
        Insert: {
          ai_model?: string | null
          ai_provider?: string | null
          brand_id?: string | null
          completed_at?: string | null
          completed_items?: number
          created_at?: string
          created_by?: string | null
          error_log?: Json
          failed_items?: number
          id?: string
          input_payload?: Json
          job_type: string
          output_blog_ids?: string[]
          started_at?: string | null
          status?: string
          title: string
          total_items?: number
          updated_at?: string
        }
        Update: {
          ai_model?: string | null
          ai_provider?: string | null
          brand_id?: string | null
          completed_at?: string | null
          completed_items?: number
          created_at?: string
          created_by?: string | null
          error_log?: Json
          failed_items?: number
          id?: string
          input_payload?: Json
          job_type?: string
          output_blog_ids?: string[]
          started_at?: string | null
          status?: string
          title?: string
          total_items?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_bio: string | null
          author_display_name: string
          author_display_role: string | null
          category_id: string | null
          content_markdown: string
          created_at: string
          display_order: number
          editorial_updated_at: string | null
          faqs: Json
          featured_image_url: string | null
          hero_image_url: string | null
          id: string
          intro: string | null
          is_featured: boolean
          is_published: boolean
          is_trending: boolean
          keywords: string[]
          program_category_slug: string | null
          published_at: string | null
          reading_time_minutes: number | null
          related_blog_slugs: string[]
          related_course_category_slug: string | null
          related_course_slug: string | null
          related_course_slugs: string[]
          reviewer_display_name: string | null
          reviewer_display_role: string | null
          schema_jsonld: Json | null
          seo_description: string | null
          seo_title: string | null
          short_summary: string
          skill_level: string | null
          slug: string
          social_image_url: string | null
          status: string
          subtitle: string | null
          thumbnail_url: string | null
          title: string
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          author_bio?: string | null
          author_display_name?: string
          author_display_role?: string | null
          category_id?: string | null
          content_markdown: string
          created_at?: string
          display_order?: number
          editorial_updated_at?: string | null
          faqs?: Json
          featured_image_url?: string | null
          hero_image_url?: string | null
          id?: string
          intro?: string | null
          is_featured?: boolean
          is_published?: boolean
          is_trending?: boolean
          keywords?: string[]
          program_category_slug?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          related_blog_slugs?: string[]
          related_course_category_slug?: string | null
          related_course_slug?: string | null
          related_course_slugs?: string[]
          reviewer_display_name?: string | null
          reviewer_display_role?: string | null
          schema_jsonld?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          short_summary: string
          skill_level?: string | null
          slug: string
          social_image_url?: string | null
          status?: string
          subtitle?: string | null
          thumbnail_url?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          author_bio?: string | null
          author_display_name?: string
          author_display_role?: string | null
          category_id?: string | null
          content_markdown?: string
          created_at?: string
          display_order?: number
          editorial_updated_at?: string | null
          faqs?: Json
          featured_image_url?: string | null
          hero_image_url?: string | null
          id?: string
          intro?: string | null
          is_featured?: boolean
          is_published?: boolean
          is_trending?: boolean
          keywords?: string[]
          program_category_slug?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          related_blog_slugs?: string[]
          related_course_category_slug?: string | null
          related_course_slug?: string | null
          related_course_slugs?: string[]
          reviewer_display_name?: string | null
          reviewer_display_role?: string | null
          schema_jsonld?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          short_summary?: string
          skill_level?: string | null
          slug?: string
          social_image_url?: string | null
          status?: string
          subtitle?: string | null
          thumbnail_url?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "blog_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_revisions: {
        Row: {
          blog_post_id: string
          content_markdown: string | null
          created_at: string
          edit_note: string | null
          edited_by: string | null
          id: string
          revision_number: number
          seo_description: string | null
          seo_title: string | null
          snapshot: Json
          title: string | null
        }
        Insert: {
          blog_post_id: string
          content_markdown?: string | null
          created_at?: string
          edit_note?: string | null
          edited_by?: string | null
          id?: string
          revision_number: number
          seo_description?: string | null
          seo_title?: string | null
          snapshot?: Json
          title?: string | null
        }
        Update: {
          blog_post_id?: string
          content_markdown?: string | null
          created_at?: string
          edit_note?: string | null
          edited_by?: string | null
          id?: string
          revision_number?: number
          seo_description?: string | null
          seo_title?: string | null
          snapshot?: Json
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_revisions_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_schedules: {
        Row: {
          blog_post_id: string
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          published_at: string | null
          recurrence: string | null
          scheduled_for: string
          status: string
          updated_at: string
        }
        Insert: {
          blog_post_id: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          published_at?: string | null
          recurrence?: string | null
          scheduled_for: string
          status?: string
          updated_at?: string
        }
        Update: {
          blog_post_id?: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          published_at?: string | null
          recurrence?: string | null
          scheduled_for?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_schedules_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_seo_scores: {
        Row: {
          blog_post_id: string
          created_at: string
          headings_score: number | null
          id: string
          images_score: number | null
          keyword_score: number | null
          links_score: number | null
          meta_score: number | null
          overall_score: number
          readability_score: number | null
          schema_score: number | null
          scored_by: string | null
          suggestions: Json
          word_count: number | null
        }
        Insert: {
          blog_post_id: string
          created_at?: string
          headings_score?: number | null
          id?: string
          images_score?: number | null
          keyword_score?: number | null
          links_score?: number | null
          meta_score?: number | null
          overall_score?: number
          readability_score?: number | null
          schema_score?: number | null
          scored_by?: string | null
          suggestions?: Json
          word_count?: number | null
        }
        Update: {
          blog_post_id?: string
          created_at?: string
          headings_score?: number | null
          id?: string
          images_score?: number | null
          keyword_score?: number | null
          links_score?: number | null
          meta_score?: number | null
          overall_score?: number
          readability_score?: number | null
          schema_score?: number | null
          scored_by?: string | null
          suggestions?: Json
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_seo_scores_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_topics: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          short_description: string | null
          slug: string
          updated_at: string
          visual_style: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          short_description?: string | null
          slug: string
          updated_at?: string
          visual_style?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          short_description?: string | null
          slug?: string
          updated_at?: string
          visual_style?: string | null
        }
        Relationships: []
      }
      brain_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          id: string
          lead_id: string | null
          message: string | null
          metadata: Json | null
          severity: string
          title: string
          type: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          message?: string | null
          metadata?: Json | null
          severity?: string
          title: string
          type: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          message?: string | null
          metadata?: Json | null
          severity?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_alerts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_decisions: {
        Row: {
          assigned_counsellor_id: string | null
          assignment_reason: string | null
          best_channel: string | null
          best_time_reason: string | null
          best_time_window: string | null
          buying_intent: string | null
          computed_at: string
          drop_off_reason: string | null
          engagement_score: number | null
          expected_close_date: string | null
          expected_revenue: number | null
          health_score: number | null
          lead_id: string
          model: string | null
          needs_parent_mode: boolean | null
          priority: string
          probability_pct: number | null
          reasoning: string | null
          recommended_course: string | null
          scholarship_pct: number | null
          scholarship_reason: string | null
          scholarship_type: string | null
          secondary_course: string | null
          updated_at: string
          urgency: string
        }
        Insert: {
          assigned_counsellor_id?: string | null
          assignment_reason?: string | null
          best_channel?: string | null
          best_time_reason?: string | null
          best_time_window?: string | null
          buying_intent?: string | null
          computed_at?: string
          drop_off_reason?: string | null
          engagement_score?: number | null
          expected_close_date?: string | null
          expected_revenue?: number | null
          health_score?: number | null
          lead_id: string
          model?: string | null
          needs_parent_mode?: boolean | null
          priority?: string
          probability_pct?: number | null
          reasoning?: string | null
          recommended_course?: string | null
          scholarship_pct?: number | null
          scholarship_reason?: string | null
          scholarship_type?: string | null
          secondary_course?: string | null
          updated_at?: string
          urgency?: string
        }
        Update: {
          assigned_counsellor_id?: string | null
          assignment_reason?: string | null
          best_channel?: string | null
          best_time_reason?: string | null
          best_time_window?: string | null
          buying_intent?: string | null
          computed_at?: string
          drop_off_reason?: string | null
          engagement_score?: number | null
          expected_close_date?: string | null
          expected_revenue?: number | null
          health_score?: number | null
          lead_id?: string
          model?: string | null
          needs_parent_mode?: boolean | null
          priority?: string
          probability_pct?: number | null
          reasoning?: string | null
          recommended_course?: string | null
          scholarship_pct?: number | null
          scholarship_reason?: string | null
          scholarship_type?: string | null
          secondary_course?: string | null
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_decisions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_dropoffs: {
        Row: {
          detected_at: string
          evidence: string | null
          id: string
          lead_id: string | null
          page_path: string | null
          reason: string
        }
        Insert: {
          detected_at?: string
          evidence?: string | null
          id?: string
          lead_id?: string | null
          page_path?: string | null
          reason: string
        }
        Update: {
          detected_at?: string
          evidence?: string | null
          id?: string
          lead_id?: string | null
          page_path?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_dropoffs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_forecasts: {
        Row: {
          avg_ticket_size: number | null
          breakdown: Json | null
          conversion_rate: number | null
          expected_admissions: number | null
          expected_revenue: number | null
          generated_at: string
          hot_leads: number | null
          id: string
          scope: string
          warm_leads: number | null
        }
        Insert: {
          avg_ticket_size?: number | null
          breakdown?: Json | null
          conversion_rate?: number | null
          expected_admissions?: number | null
          expected_revenue?: number | null
          generated_at?: string
          hot_leads?: number | null
          id?: string
          scope: string
          warm_leads?: number | null
        }
        Update: {
          avg_ticket_size?: number | null
          breakdown?: Json | null
          conversion_rate?: number | null
          expected_admissions?: number | null
          expected_revenue?: number | null
          generated_at?: string
          hot_leads?: number | null
          id?: string
          scope?: string
          warm_leads?: number | null
        }
        Relationships: []
      }
      brain_nurture_deliveries: {
        Row: {
          body: string | null
          campaign: string
          channel: string
          created_at: string
          id: string
          lead_id: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          body?: string | null
          campaign: string
          channel: string
          created_at?: string
          id?: string
          lead_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          body?: string | null
          campaign?: string
          channel?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brain_nurture_deliveries_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_applications: {
        Row: {
          admin_notes: string | null
          alternative_name_1: string | null
          alternative_name_2: string | null
          brand_colors: Json | null
          brand_personality: string[] | null
          brand_type: string | null
          brand_vision: string | null
          business_email: string | null
          business_mobile: string | null
          business_type: string | null
          city: string | null
          consent_confirmed: boolean
          country: string | null
          created_at: string
          current_step: number
          domain_name: string | null
          has_domain: string | null
          id: string
          logo_url: string | null
          name_availability_checked: boolean
          needs_logo_help: boolean
          preferred_brand_name: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selected_category_slugs: string[] | null
          selected_program_ids: string[] | null
          selected_services: string[] | null
          setup_type: string | null
          social_profiles: Json | null
          state: string | null
          status: Database["public"]["Enums"]["brand_application_status"]
          submitted_at: string | null
          tagline: string | null
          target_audience: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          alternative_name_1?: string | null
          alternative_name_2?: string | null
          brand_colors?: Json | null
          brand_personality?: string[] | null
          brand_type?: string | null
          brand_vision?: string | null
          business_email?: string | null
          business_mobile?: string | null
          business_type?: string | null
          city?: string | null
          consent_confirmed?: boolean
          country?: string | null
          created_at?: string
          current_step?: number
          domain_name?: string | null
          has_domain?: string | null
          id?: string
          logo_url?: string | null
          name_availability_checked?: boolean
          needs_logo_help?: boolean
          preferred_brand_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selected_category_slugs?: string[] | null
          selected_program_ids?: string[] | null
          selected_services?: string[] | null
          setup_type?: string | null
          social_profiles?: Json | null
          state?: string | null
          status?: Database["public"]["Enums"]["brand_application_status"]
          submitted_at?: string | null
          tagline?: string | null
          target_audience?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          alternative_name_1?: string | null
          alternative_name_2?: string | null
          brand_colors?: Json | null
          brand_personality?: string[] | null
          brand_type?: string | null
          brand_vision?: string | null
          business_email?: string | null
          business_mobile?: string | null
          business_type?: string | null
          city?: string | null
          consent_confirmed?: boolean
          country?: string | null
          created_at?: string
          current_step?: number
          domain_name?: string | null
          has_domain?: string | null
          id?: string
          logo_url?: string | null
          name_availability_checked?: boolean
          needs_logo_help?: boolean
          preferred_brand_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selected_category_slugs?: string[] | null
          selected_program_ids?: string[] | null
          selected_services?: string[] | null
          setup_type?: string | null
          social_profiles?: Json | null
          state?: string | null
          status?: Database["public"]["Enums"]["brand_application_status"]
          submitted_at?: string | null
          tagline?: string | null
          target_audience?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brand_consultations: {
        Row: {
          created_at: string
          current_role_title: string | null
          email: string
          full_name: string
          has_leads: string | null
          id: string
          launch_timeline: string | null
          lead_network_size: string | null
          mobile: string
          notes: string | null
          preferred_brand_name: string | null
          programs_interested: string[] | null
          sales_experience: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_role_title?: string | null
          email: string
          full_name: string
          has_leads?: string | null
          id?: string
          launch_timeline?: string | null
          lead_network_size?: string | null
          mobile: string
          notes?: string | null
          preferred_brand_name?: string | null
          programs_interested?: string[] | null
          sales_experience?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_role_title?: string | null
          email?: string
          full_name?: string
          has_leads?: string | null
          id?: string
          launch_timeline?: string | null
          lead_network_size?: string | null
          mobile?: string
          notes?: string | null
          preferred_brand_name?: string | null
          programs_interested?: string[] | null
          sales_experience?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      brand_launch_tasks: {
        Row: {
          application_id: string | null
          assigned_to: string | null
          brand_id: string | null
          completion_date: string | null
          created_at: string
          department: string | null
          display_order: number
          due_date: string | null
          id: string
          internal_notes: string | null
          priority: Database["public"]["Enums"]["brand_task_priority"]
          status: Database["public"]["Enums"]["brand_task_status"]
          task_name: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          assigned_to?: string | null
          brand_id?: string | null
          completion_date?: string | null
          created_at?: string
          department?: string | null
          display_order?: number
          due_date?: string | null
          id?: string
          internal_notes?: string | null
          priority?: Database["public"]["Enums"]["brand_task_priority"]
          status?: Database["public"]["Enums"]["brand_task_status"]
          task_name: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          assigned_to?: string | null
          brand_id?: string | null
          completion_date?: string | null
          created_at?: string
          department?: string | null
          display_order?: number
          due_date?: string | null
          id?: string
          internal_notes?: string | null
          priority?: Database["public"]["Enums"]["brand_task_priority"]
          status?: Database["public"]["Enums"]["brand_task_status"]
          task_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_launch_tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "brand_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_launch_tasks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_packages: {
        Row: {
          active: boolean
          annual_fee: number | null
          created_at: string
          description: string | null
          display_order: number
          features: Json | null
          id: string
          included_programs: number | null
          includes_crm: boolean
          includes_custom_domain: boolean
          includes_lms: boolean
          includes_marketing_support: boolean
          includes_social_setup: boolean
          includes_website: boolean
          monthly_fee: number | null
          name: string
          public_listed: boolean
          revenue_share_percent: number | null
          setup_fee: number | null
          slug: string
          storage_limit_gb: number | null
          student_limit: number | null
          support_level: string | null
          team_member_limit: number | null
          tier: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          annual_fee?: number | null
          created_at?: string
          description?: string | null
          display_order?: number
          features?: Json | null
          id?: string
          included_programs?: number | null
          includes_crm?: boolean
          includes_custom_domain?: boolean
          includes_lms?: boolean
          includes_marketing_support?: boolean
          includes_social_setup?: boolean
          includes_website?: boolean
          monthly_fee?: number | null
          name: string
          public_listed?: boolean
          revenue_share_percent?: number | null
          setup_fee?: number | null
          slug: string
          storage_limit_gb?: number | null
          student_limit?: number | null
          support_level?: string | null
          team_member_limit?: number | null
          tier: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          annual_fee?: number | null
          created_at?: string
          description?: string | null
          display_order?: number
          features?: Json | null
          id?: string
          included_programs?: number | null
          includes_crm?: boolean
          includes_custom_domain?: boolean
          includes_lms?: boolean
          includes_marketing_support?: boolean
          includes_social_setup?: boolean
          includes_website?: boolean
          monthly_fee?: number | null
          name?: string
          public_listed?: boolean
          revenue_share_percent?: number | null
          setup_fee?: number | null
          slug?: string
          storage_limit_gb?: number | null
          student_limit?: number | null
          support_level?: string | null
          team_member_limit?: number | null
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      brand_programs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          brand_id: string
          category_slug: string | null
          created_at: string
          display_price: number | null
          enrollment_status: string
          id: string
          offer_price: number | null
          program_id: string
          program_title: string | null
          revenue_model: string | null
          status: Database["public"]["Enums"]["brand_program_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          brand_id: string
          category_slug?: string | null
          created_at?: string
          display_price?: number | null
          enrollment_status?: string
          id?: string
          offer_price?: number | null
          program_id: string
          program_title?: string | null
          revenue_model?: string | null
          status?: Database["public"]["Enums"]["brand_program_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          brand_id?: string
          category_slug?: string | null
          created_at?: string
          display_price?: number | null
          enrollment_status?: string
          id?: string
          offer_price?: number | null
          program_id?: string
          program_title?: string | null
          revenue_model?: string | null
          status?: Database["public"]["Enums"]["brand_program_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_programs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_team_members: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          invited_email: string | null
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          invited_email?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          invited_email?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_team_members_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          about: string | null
          accent_color: string | null
          application_id: string | null
          brand_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          custom_domain_status: string
          domain: string | null
          favicon_url: string | null
          footer_content: Json | null
          hero_content: Json | null
          id: string
          launched_at: string | null
          lms_status: string
          logo_url: string | null
          owner_user_id: string
          package_id: string | null
          primary_color: string | null
          secondary_color: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          social_links: Json | null
          stage: Database["public"]["Enums"]["brand_stage"]
          tagline: string | null
          tenant_id: string
          updated_at: string
          website_status: string
          whatsapp: string | null
        }
        Insert: {
          about?: string | null
          accent_color?: string | null
          application_id?: string | null
          brand_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          custom_domain_status?: string
          domain?: string | null
          favicon_url?: string | null
          footer_content?: Json | null
          hero_content?: Json | null
          id?: string
          launched_at?: string | null
          lms_status?: string
          logo_url?: string | null
          owner_user_id: string
          package_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          social_links?: Json | null
          stage?: Database["public"]["Enums"]["brand_stage"]
          tagline?: string | null
          tenant_id?: string
          updated_at?: string
          website_status?: string
          whatsapp?: string | null
        }
        Update: {
          about?: string | null
          accent_color?: string | null
          application_id?: string | null
          brand_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          custom_domain_status?: string
          domain?: string | null
          favicon_url?: string | null
          footer_content?: Json | null
          hero_content?: Json | null
          id?: string
          launched_at?: string | null
          lms_status?: string
          logo_url?: string | null
          owner_user_id?: string
          package_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          social_links?: Json | null
          stage?: Database["public"]["Enums"]["brand_stage"]
          tagline?: string | null
          tenant_id?: string
          updated_at?: string
          website_status?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "brand_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brands_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "brand_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      brochure_leads: {
        Row: {
          course_id: string
          created_at: string
          email: string | null
          id: string
          mobile: string | null
          name: string
          partner_ref: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string | null
          name: string
          partner_ref?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string | null
          name?: string
          partner_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brochure_leads_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_events: {
        Row: {
          budget_id: string | null
          created_at: string
          credits: number
          id: string
          period_start: string
          request_id: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          budget_id?: string | null
          created_at?: string
          credits: number
          id?: string
          period_start: string
          request_id?: string | null
          source: string
          user_id?: string | null
        }
        Update: {
          budget_id?: string | null
          created_at?: string
          credits?: number
          id?: string
          period_start?: string
          request_id?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_events_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          alert_threshold: number
          created_at: string
          enabled: boolean
          hard_stop: boolean
          id: string
          limit_credits: number
          period: string
          subject_id: string | null
          subject_role: string | null
          subject_type: string
          updated_at: string
        }
        Insert: {
          alert_threshold?: number
          created_at?: string
          enabled?: boolean
          hard_stop?: boolean
          id?: string
          limit_credits: number
          period: string
          subject_id?: string | null
          subject_role?: string | null
          subject_type: string
          updated_at?: string
        }
        Update: {
          alert_threshold?: number
          created_at?: string
          enabled?: boolean
          hard_stop?: boolean
          id?: string
          limit_credits?: number
          period?: string
          subject_id?: string | null
          subject_role?: string | null
          subject_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      campus_ambassador_activity: {
        Row: {
          actor_role: string | null
          ambassador_profile_id: string | null
          application_id: string | null
          created_at: string
          detail: string | null
          event: string
          id: string
          meta: Json
          user_id: string | null
        }
        Insert: {
          actor_role?: string | null
          ambassador_profile_id?: string | null
          application_id?: string | null
          created_at?: string
          detail?: string | null
          event: string
          id?: string
          meta?: Json
          user_id?: string | null
        }
        Update: {
          actor_role?: string | null
          ambassador_profile_id?: string | null
          application_id?: string | null
          created_at?: string
          detail?: string | null
          event?: string
          id?: string
          meta?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campus_ambassador_activity_ambassador_profile_id_fkey"
            columns: ["ambassador_profile_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campus_ambassador_activity_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_ambassador_applications: {
        Row: {
          acknowledged_commission_program: boolean
          admin_message: string | null
          applicant_reply: string | null
          applicant_reply_at: string | null
          application_code: string | null
          approved_at: string | null
          campus_city: string
          campus_network_size: string | null
          college_name: string
          confirmed_information_accuracy: boolean
          created_at: string
          current_year_of_study: string
          degree_course: string
          email: string
          email_normalized: string | null
          expected_graduation_year: number | null
          full_name: string
          id: string
          instagram_url: string | null
          introduction_plan: string | null
          linkedin_url: string | null
          mobile: string
          mobile_normalized: string | null
          motivation: string
          other_social_url: string | null
          previous_ambassador: boolean
          previous_brand: string | null
          rejected_at: string | null
          rejection_reason_public: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specialisation: string | null
          state: string
          status: Database["public"]["Enums"]["ca_application_status"]
          submitted_at: string
          updated_at: string
          user_id: string | null
          withdrawn_at: string | null
        }
        Insert: {
          acknowledged_commission_program?: boolean
          admin_message?: string | null
          applicant_reply?: string | null
          applicant_reply_at?: string | null
          application_code?: string | null
          approved_at?: string | null
          campus_city: string
          campus_network_size?: string | null
          college_name: string
          confirmed_information_accuracy?: boolean
          created_at?: string
          current_year_of_study: string
          degree_course: string
          email: string
          email_normalized?: string | null
          expected_graduation_year?: number | null
          full_name: string
          id?: string
          instagram_url?: string | null
          introduction_plan?: string | null
          linkedin_url?: string | null
          mobile: string
          mobile_normalized?: string | null
          motivation: string
          other_social_url?: string | null
          previous_ambassador?: boolean
          previous_brand?: string | null
          rejected_at?: string | null
          rejection_reason_public?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialisation?: string | null
          state: string
          status?: Database["public"]["Enums"]["ca_application_status"]
          submitted_at?: string
          updated_at?: string
          user_id?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          acknowledged_commission_program?: boolean
          admin_message?: string | null
          applicant_reply?: string | null
          applicant_reply_at?: string | null
          application_code?: string | null
          approved_at?: string | null
          campus_city?: string
          campus_network_size?: string | null
          college_name?: string
          confirmed_information_accuracy?: boolean
          created_at?: string
          current_year_of_study?: string
          degree_course?: string
          email?: string
          email_normalized?: string | null
          expected_graduation_year?: number | null
          full_name?: string
          id?: string
          instagram_url?: string | null
          introduction_plan?: string | null
          linkedin_url?: string | null
          mobile?: string
          mobile_normalized?: string | null
          motivation?: string
          other_social_url?: string | null
          previous_ambassador?: boolean
          previous_brand?: string | null
          rejected_at?: string | null
          rejection_reason_public?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialisation?: string | null
          state?: string
          status?: Database["public"]["Enums"]["ca_application_status"]
          submitted_at?: string
          updated_at?: string
          user_id?: string | null
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      campus_ambassador_profiles: {
        Row: {
          ambassador_code: string | null
          application_id: string | null
          approved_at: string
          bio: string | null
          campus_city: string
          city: string | null
          college_name: string
          commission_ack_at: string | null
          commission_ack_version: string | null
          commission_rule_id: string | null
          country: string | null
          created_at: string
          current_level_id: string | null
          current_year_of_study: string
          degree_course: string
          display_name: string | null
          email: string
          expected_graduation_year: number | null
          first_name: string | null
          full_name: string
          id: string
          instagram_url: string | null
          last_name: string | null
          leaderboard_display_name: string | null
          leaderboard_show_college: boolean
          leaderboard_show_first_name: boolean
          leaderboard_show_photo: boolean
          linkedin_url: string | null
          mobile: string
          other_profile_url: string | null
          profile_completion_percentage: number
          profile_photo_url: string | null
          referral_code: string | null
          referral_link: string | null
          specialisation: string | null
          state: string
          status: Database["public"]["Enums"]["ca_ambassador_status"]
          updated_at: string
          user_id: string
          youtube_url: string | null
        }
        Insert: {
          ambassador_code?: string | null
          application_id?: string | null
          approved_at?: string
          bio?: string | null
          campus_city: string
          city?: string | null
          college_name: string
          commission_ack_at?: string | null
          commission_ack_version?: string | null
          commission_rule_id?: string | null
          country?: string | null
          created_at?: string
          current_level_id?: string | null
          current_year_of_study: string
          degree_course: string
          display_name?: string | null
          email: string
          expected_graduation_year?: number | null
          first_name?: string | null
          full_name: string
          id?: string
          instagram_url?: string | null
          last_name?: string | null
          leaderboard_display_name?: string | null
          leaderboard_show_college?: boolean
          leaderboard_show_first_name?: boolean
          leaderboard_show_photo?: boolean
          linkedin_url?: string | null
          mobile: string
          other_profile_url?: string | null
          profile_completion_percentage?: number
          profile_photo_url?: string | null
          referral_code?: string | null
          referral_link?: string | null
          specialisation?: string | null
          state: string
          status?: Database["public"]["Enums"]["ca_ambassador_status"]
          updated_at?: string
          user_id: string
          youtube_url?: string | null
        }
        Update: {
          ambassador_code?: string | null
          application_id?: string | null
          approved_at?: string
          bio?: string | null
          campus_city?: string
          city?: string | null
          college_name?: string
          commission_ack_at?: string | null
          commission_ack_version?: string | null
          commission_rule_id?: string | null
          country?: string | null
          created_at?: string
          current_level_id?: string | null
          current_year_of_study?: string
          degree_course?: string
          display_name?: string | null
          email?: string
          expected_graduation_year?: number | null
          first_name?: string | null
          full_name?: string
          id?: string
          instagram_url?: string | null
          last_name?: string | null
          leaderboard_display_name?: string | null
          leaderboard_show_college?: boolean
          leaderboard_show_first_name?: boolean
          leaderboard_show_photo?: boolean
          linkedin_url?: string | null
          mobile?: string
          other_profile_url?: string | null
          profile_completion_percentage?: number
          profile_photo_url?: string | null
          referral_code?: string | null
          referral_link?: string | null
          specialisation?: string | null
          state?: string
          status?: Database["public"]["Enums"]["ca_ambassador_status"]
          updated_at?: string
          user_id?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campus_ambassador_profiles_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      career_activity: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          student_user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          student_user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          student_user_id?: string
        }
        Relationships: []
      }
      career_hub_generation_jobs: {
        Row: {
          created_at: string
          created_by: string | null
          errors: Json
          failed: number
          id: string
          page_type: string
          processed: number
          results: Json
          seeds: Json
          status: string
          succeeded: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          errors?: Json
          failed?: number
          id?: string
          page_type: string
          processed?: number
          results?: Json
          seeds?: Json
          status?: string
          succeeded?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          errors?: Json
          failed?: number
          id?: string
          page_type?: string
          processed?: number
          results?: Json
          seeds?: Json
          status?: string
          succeeded?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      career_hub_pages: {
        Row: {
          ai_generated_at: string | null
          ai_model: string | null
          category: string | null
          certifications: Json
          content: Json
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          faqs: Json
          featured: boolean
          hero_emoji: string | null
          hero_image_url: string | null
          id: string
          internal_links: Json
          json_ld: Json | null
          learning_path: Json
          page_type: string
          projects: Json
          published: boolean
          recommended_courses: Json
          related_blogs: Json
          related_slugs: Json
          roadmap: Json
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          subtitle: string | null
          summary: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          ai_generated_at?: string | null
          ai_model?: string | null
          category?: string | null
          certifications?: Json
          content?: Json
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          faqs?: Json
          featured?: boolean
          hero_emoji?: string | null
          hero_image_url?: string | null
          id?: string
          internal_links?: Json
          json_ld?: Json | null
          learning_path?: Json
          page_type: string
          projects?: Json
          published?: boolean
          recommended_courses?: Json
          related_blogs?: Json
          related_slugs?: Json
          roadmap?: Json
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          subtitle?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          ai_generated_at?: string | null
          ai_model?: string | null
          category?: string | null
          certifications?: Json
          content?: Json
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          faqs?: Json
          featured?: boolean
          hero_emoji?: string | null
          hero_image_url?: string | null
          id?: string
          internal_links?: Json
          json_ld?: Json | null
          learning_path?: Json
          page_type?: string
          projects?: Json
          published?: boolean
          recommended_courses?: Json
          related_blogs?: Json
          related_slugs?: Json
          roadmap?: Json
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          subtitle?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      career_profiles: {
        Row: {
          city: string | null
          college: string | null
          created_at: string
          current_student_status: string | null
          degree: string | null
          education_level: string | null
          full_name: string | null
          graduation_year: number | null
          headline: string | null
          id: string
          is_public: boolean
          objective: string | null
          specialisation: string | null
          state: string | null
          student_user_id: string
          updated_at: string
          years_of_experience: number | null
        }
        Insert: {
          city?: string | null
          college?: string | null
          created_at?: string
          current_student_status?: string | null
          degree?: string | null
          education_level?: string | null
          full_name?: string | null
          graduation_year?: number | null
          headline?: string | null
          id?: string
          is_public?: boolean
          objective?: string | null
          specialisation?: string | null
          state?: string | null
          student_user_id: string
          updated_at?: string
          years_of_experience?: number | null
        }
        Update: {
          city?: string | null
          college?: string | null
          created_at?: string
          current_student_status?: string | null
          degree?: string | null
          education_level?: string | null
          full_name?: string | null
          graduation_year?: number | null
          headline?: string | null
          id?: string
          is_public?: boolean
          objective?: string | null
          specialisation?: string | null
          state?: string | null
          student_user_id?: string
          updated_at?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
      career_roles: {
        Row: {
          created_at: string
          currency: string | null
          description: string | null
          experience_level: string | null
          id: string
          is_visible: boolean
          region: string | null
          salary_date: string | null
          salary_max: number | null
          salary_min: number | null
          salary_period: string | null
          salary_source: string | null
          salary_source_url: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          description?: string | null
          experience_level?: string | null
          id?: string
          is_visible?: boolean
          region?: string | null
          salary_date?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          salary_source?: string | null
          salary_source_url?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          description?: string | null
          experience_level?: string | null
          id?: string
          is_visible?: boolean
          region?: string | null
          salary_date?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          salary_source?: string | null
          salary_source_url?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ce_campaigns: {
        Row: {
          audience: string | null
          brand_id: string | null
          created_at: string
          description: string | null
          goal: string | null
          id: string
          language: string
          meta: Json
          owner_id: string
          platforms: string[]
          scheduled_at: string | null
          status: string
          title: string
          tone: string | null
          updated_at: string
        }
        Insert: {
          audience?: string | null
          brand_id?: string | null
          created_at?: string
          description?: string | null
          goal?: string | null
          id?: string
          language?: string
          meta?: Json
          owner_id: string
          platforms?: string[]
          scheduled_at?: string | null
          status?: string
          title: string
          tone?: string | null
          updated_at?: string
        }
        Update: {
          audience?: string | null
          brand_id?: string | null
          created_at?: string
          description?: string | null
          goal?: string | null
          id?: string
          language?: string
          meta?: Json
          owner_id?: string
          platforms?: string[]
          scheduled_at?: string | null
          status?: string
          title?: string
          tone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ce_campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "mkt_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      ce_generations: {
        Row: {
          asset_type: string
          campaign_id: string
          content: string
          created_at: string
          edited: boolean
          id: string
          meta: Json
          model_used: string | null
          owner_id: string
          parent_generation_id: string | null
          prompt_version_id: string | null
          provider: string | null
          published_at: string | null
          scheduled_at: string | null
          status: string
          updated_at: string
          usage: Json
        }
        Insert: {
          asset_type: string
          campaign_id: string
          content?: string
          created_at?: string
          edited?: boolean
          id?: string
          meta?: Json
          model_used?: string | null
          owner_id: string
          parent_generation_id?: string | null
          prompt_version_id?: string | null
          provider?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          usage?: Json
        }
        Update: {
          asset_type?: string
          campaign_id?: string
          content?: string
          created_at?: string
          edited?: boolean
          id?: string
          meta?: Json
          model_used?: string | null
          owner_id?: string
          parent_generation_id?: string | null
          prompt_version_id?: string | null
          provider?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          usage?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ce_generations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ce_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ce_generations_parent_generation_id_fkey"
            columns: ["parent_generation_id"]
            isOneToOne: false
            referencedRelation: "ce_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ce_generations_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "ce_prompt_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      ce_prompt_registry: {
        Row: {
          active_version_id: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          active_version_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          active_version_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ce_prompt_registry_active_version_fkey"
            columns: ["active_version_id"]
            isOneToOne: false
            referencedRelation: "ce_prompt_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      ce_prompt_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          model_preference: Json
          notes: string | null
          registry_id: string
          template: string
          variables: Json
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          model_preference?: Json
          notes?: string | null
          registry_id: string
          template: string
          variables?: Json
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          model_preference?: Json
          notes?: string | null
          registry_id?: string
          template?: string
          variables?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ce_prompt_versions_registry_id_fkey"
            columns: ["registry_id"]
            isOneToOne: false
            referencedRelation: "ce_prompt_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      ce_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          owner_id: string | null
          payload: Json
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          owner_id?: string | null
          payload?: Json
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          owner_id?: string | null
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_number: string
          certificate_type: string
          completion_date: string
          course_id: string
          course_name: string
          created_at: string
          enrollment_id: string | null
          id: string
          issued_at: string
          revoked_at: string | null
          student_name: string
          student_user_id: string
          updated_at: string
          verification_code: string
        }
        Insert: {
          certificate_number: string
          certificate_type?: string
          completion_date?: string
          course_id: string
          course_name: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          issued_at?: string
          revoked_at?: string | null
          student_name: string
          student_user_id: string
          updated_at?: string
          verification_code: string
        }
        Update: {
          certificate_number?: string
          certificate_type?: string
          completion_date?: string
          course_id?: string
          course_name?: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          issued_at?: string
          revoked_at?: string | null
          student_name?: string
          student_user_id?: string
          updated_at?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      co_ab_tests: {
        Row: {
          campaign_id: string
          concluded_at: string | null
          hypothesis: string | null
          id: string
          metric: string
          results: Json
          started_at: string
          status: string
          variant_asset_ids: string[]
          winner_asset_id: string | null
        }
        Insert: {
          campaign_id: string
          concluded_at?: string | null
          hypothesis?: string | null
          id?: string
          metric?: string
          results?: Json
          started_at?: string
          status?: string
          variant_asset_ids?: string[]
          winner_asset_id?: string | null
        }
        Update: {
          campaign_id?: string
          concluded_at?: string | null
          hypothesis?: string | null
          id?: string
          metric?: string
          results?: Json
          started_at?: string
          status?: string
          variant_asset_ids?: string[]
          winner_asset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "co_ab_tests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "co_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_ab_tests_winner_asset_id_fkey"
            columns: ["winner_asset_id"]
            isOneToOne: false
            referencedRelation: "co_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      co_analytics: {
        Row: {
          bounce_rate: number | null
          campaign_id: string
          channel: string | null
          clicks: number
          comments: number
          conversions: number
          cost: number
          cost_per_enrollment: number | null
          cost_per_lead: number | null
          created_at: string
          ctr: number | null
          day: string
          enrollments: number
          id: string
          impressions: number
          likes: number
          meta: Json
          open_rate: number | null
          reach: number
          revenue: number
          roi: number | null
          shares: number
          views: number
          watch_time_seconds: number
        }
        Insert: {
          bounce_rate?: number | null
          campaign_id: string
          channel?: string | null
          clicks?: number
          comments?: number
          conversions?: number
          cost?: number
          cost_per_enrollment?: number | null
          cost_per_lead?: number | null
          created_at?: string
          ctr?: number | null
          day: string
          enrollments?: number
          id?: string
          impressions?: number
          likes?: number
          meta?: Json
          open_rate?: number | null
          reach?: number
          revenue?: number
          roi?: number | null
          shares?: number
          views?: number
          watch_time_seconds?: number
        }
        Update: {
          bounce_rate?: number | null
          campaign_id?: string
          channel?: string | null
          clicks?: number
          comments?: number
          conversions?: number
          cost?: number
          cost_per_enrollment?: number | null
          cost_per_lead?: number | null
          created_at?: string
          ctr?: number | null
          day?: string
          enrollments?: number
          id?: string
          impressions?: number
          likes?: number
          meta?: Json
          open_rate?: number | null
          reach?: number
          revenue?: number
          roi?: number | null
          shares?: number
          views?: number
          watch_time_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "co_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "co_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      co_approvals: {
        Row: {
          campaign_id: string
          created_at: string
          decided_at: string | null
          id: string
          notes: string | null
          reviewer_id: string | null
          stage: Database["public"]["Enums"]["co_approval_stage"]
          state: Database["public"]["Enums"]["co_approval_state"]
          task_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          decided_at?: string | null
          id?: string
          notes?: string | null
          reviewer_id?: string | null
          stage: Database["public"]["Enums"]["co_approval_stage"]
          state?: Database["public"]["Enums"]["co_approval_state"]
          task_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          notes?: string | null
          reviewer_id?: string | null
          stage?: Database["public"]["Enums"]["co_approval_stage"]
          state?: Database["public"]["Enums"]["co_approval_state"]
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "co_approvals_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "co_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_approvals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "co_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      co_assets: {
        Row: {
          asset_type: string
          brand_kit_id: string | null
          campaign_id: string
          channel: string | null
          content: Json
          created_at: string
          format: string | null
          id: string
          moderation_status: string
          preview_url: string | null
          storage_url: string | null
          task_id: string | null
          variant_of: string | null
          version: number
        }
        Insert: {
          asset_type: string
          brand_kit_id?: string | null
          campaign_id: string
          channel?: string | null
          content?: Json
          created_at?: string
          format?: string | null
          id?: string
          moderation_status?: string
          preview_url?: string | null
          storage_url?: string | null
          task_id?: string | null
          variant_of?: string | null
          version?: number
        }
        Update: {
          asset_type?: string
          brand_kit_id?: string | null
          campaign_id?: string
          channel?: string | null
          content?: Json
          created_at?: string
          format?: string | null
          id?: string
          moderation_status?: string
          preview_url?: string | null
          storage_url?: string | null
          task_id?: string | null
          variant_of?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "co_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "co_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_assets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "co_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_assets_variant_of_fkey"
            columns: ["variant_of"]
            isOneToOne: false
            referencedRelation: "co_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      co_campaigns: {
        Row: {
          audience: Json
          brand_kit_id: string | null
          budget: number | null
          coupon_code: string | null
          created_at: string
          currency: string | null
          duration_days: number | null
          ends_at: string | null
          geo: Json
          hashtags: string[]
          id: string
          keywords: string[]
          kind: Database["public"]["Enums"]["co_campaign_kind"]
          kpis: Json
          landing_goal: string | null
          language: string | null
          meta: Json
          name: string
          objective: string | null
          offer: Json
          owner_id: string
          plan: Json
          platforms: string[]
          primary_cta: string | null
          priority: number
          prompt: string | null
          secondary_cta: string | null
          slug: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["co_campaign_status"]
          updated_at: string
        }
        Insert: {
          audience?: Json
          brand_kit_id?: string | null
          budget?: number | null
          coupon_code?: string | null
          created_at?: string
          currency?: string | null
          duration_days?: number | null
          ends_at?: string | null
          geo?: Json
          hashtags?: string[]
          id?: string
          keywords?: string[]
          kind?: Database["public"]["Enums"]["co_campaign_kind"]
          kpis?: Json
          landing_goal?: string | null
          language?: string | null
          meta?: Json
          name: string
          objective?: string | null
          offer?: Json
          owner_id: string
          plan?: Json
          platforms?: string[]
          primary_cta?: string | null
          priority?: number
          prompt?: string | null
          secondary_cta?: string | null
          slug?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["co_campaign_status"]
          updated_at?: string
        }
        Update: {
          audience?: Json
          brand_kit_id?: string | null
          budget?: number | null
          coupon_code?: string | null
          created_at?: string
          currency?: string | null
          duration_days?: number | null
          ends_at?: string | null
          geo?: Json
          hashtags?: string[]
          id?: string
          keywords?: string[]
          kind?: Database["public"]["Enums"]["co_campaign_kind"]
          kpis?: Json
          landing_goal?: string | null
          language?: string | null
          meta?: Json
          name?: string
          objective?: string | null
          offer?: Json
          owner_id?: string
          plan?: Json
          platforms?: string[]
          primary_cta?: string | null
          priority?: number
          prompt?: string | null
          secondary_cta?: string | null
          slug?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["co_campaign_status"]
          updated_at?: string
        }
        Relationships: []
      }
      co_optimizations: {
        Row: {
          applied: boolean
          campaign_id: string
          category: string
          created_at: string
          detail: string | null
          id: string
          recommended_action: Json
          severity: string
          title: string
        }
        Insert: {
          applied?: boolean
          campaign_id: string
          category: string
          created_at?: string
          detail?: string | null
          id?: string
          recommended_action?: Json
          severity?: string
          title: string
        }
        Update: {
          applied?: boolean
          campaign_id?: string
          category?: string
          created_at?: string
          detail?: string | null
          id?: string
          recommended_action?: Json
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "co_optimizations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "co_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      co_schedule: {
        Row: {
          asset_id: string | null
          attempts: number
          campaign_id: string
          channel: string
          created_at: string
          external_id: string | null
          external_url: string | null
          id: string
          last_error: string | null
          publish_status: string
          published_at: string | null
          scheduled_at: string
          task_id: string | null
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          attempts?: number
          campaign_id: string
          channel: string
          created_at?: string
          external_id?: string | null
          external_url?: string | null
          id?: string
          last_error?: string | null
          publish_status?: string
          published_at?: string | null
          scheduled_at: string
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          attempts?: number
          campaign_id?: string
          channel?: string
          created_at?: string
          external_id?: string | null
          external_url?: string | null
          id?: string
          last_error?: string | null
          publish_status?: string
          published_at?: string | null
          scheduled_at?: string
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "co_schedule_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "co_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_schedule_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "co_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_schedule_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "co_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      co_tasks: {
        Row: {
          asset_id: string | null
          brief: Json
          campaign_id: string
          channel: string | null
          cost_estimate: number | null
          created_at: string
          error: string | null
          id: string
          kind: Database["public"]["Enums"]["co_task_kind"]
          max_retries: number
          model: string | null
          output: Json
          provider: string | null
          retries: number
          scheduled_at: string | null
          status: Database["public"]["Enums"]["co_task_status"]
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          brief?: Json
          campaign_id: string
          channel?: string | null
          cost_estimate?: number | null
          created_at?: string
          error?: string | null
          id?: string
          kind: Database["public"]["Enums"]["co_task_kind"]
          max_retries?: number
          model?: string | null
          output?: Json
          provider?: string | null
          retries?: number
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["co_task_status"]
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          brief?: Json
          campaign_id?: string
          channel?: string | null
          cost_estimate?: number | null
          created_at?: string
          error?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["co_task_kind"]
          max_retries?: number
          model?: string | null
          output?: Json
          provider?: string | null
          retries?: number
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["co_task_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "co_tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "co_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          commission_amount: number
          course_id: string | null
          created_at: string
          eligible_revenue: number
          enrollment_id: string | null
          gross_revenue: number
          hold_reason: string | null
          id: string
          lead_id: string | null
          lead_source: string | null
          lead_type: string | null
          ownership_pending: boolean
          ownership_review_id: string | null
          paid_by: string | null
          partner_id: string
          payout_at: string | null
          payout_reference: string | null
          payout_target_at: string | null
          plan: string | null
          program_id: string
          refund_adjustment: number
          revenue_share_pct: number
          revenue_share_rule_id: string | null
          status: Database["public"]["Enums"]["commission_status"]
          submission_id: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          commission_amount: number
          course_id?: string | null
          created_at?: string
          eligible_revenue: number
          enrollment_id?: string | null
          gross_revenue: number
          hold_reason?: string | null
          id?: string
          lead_id?: string | null
          lead_source?: string | null
          lead_type?: string | null
          ownership_pending?: boolean
          ownership_review_id?: string | null
          paid_by?: string | null
          partner_id: string
          payout_at?: string | null
          payout_reference?: string | null
          payout_target_at?: string | null
          plan?: string | null
          program_id: string
          refund_adjustment?: number
          revenue_share_pct: number
          revenue_share_rule_id?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          submission_id?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          commission_amount?: number
          course_id?: string | null
          created_at?: string
          eligible_revenue?: number
          enrollment_id?: string | null
          gross_revenue?: number
          hold_reason?: string | null
          id?: string
          lead_id?: string | null
          lead_source?: string | null
          lead_type?: string | null
          ownership_pending?: boolean
          ownership_review_id?: string | null
          paid_by?: string | null
          partner_id?: string
          payout_at?: string | null
          payout_reference?: string | null
          payout_target_at?: string | null
          plan?: string | null
          program_id?: string
          refund_adjustment?: number
          revenue_share_pct?: number
          revenue_share_rule_id?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          submission_id?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "partner_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_ownership_review_id_fkey"
            columns: ["ownership_review_id"]
            isOneToOne: false
            referencedRelation: "lead_ownership_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_revenue_share_rule_id_fkey"
            columns: ["revenue_share_rule_id"]
            isOneToOne: false
            referencedRelation: "revenue_share_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "partner_payment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_badges: {
        Row: {
          created_at: string
          criteria: Json
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          tier: string
        }
        Insert: {
          created_at?: string
          criteria?: Json
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          tier?: string
        }
        Update: {
          created_at?: string
          criteria?: Json
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          tier?: string
        }
        Relationships: []
      }
      community_event_rsvps: {
        Row: {
          created_at: string
          id: string
          status: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_event_rsvps_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      community_events: {
        Row: {
          attendee_count: number
          ends_at: string | null
          is_online: boolean
          join_url: string | null
          location: string | null
          starts_at: string
          thread_id: string
        }
        Insert: {
          attendee_count?: number
          ends_at?: string | null
          is_online?: boolean
          join_url?: string | null
          location?: string | null
          starts_at: string
          thread_id: string
        }
        Update: {
          attendee_count?: number
          ends_at?: string | null
          is_online?: boolean
          join_url?: string | null
          location?: string | null
          starts_at?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_events_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: true
            referencedRelation: "community_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      community_follows: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      community_moderation_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          meta: Json | null
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      community_poll_options: {
        Row: {
          id: string
          label: string
          sort_order: number
          thread_id: string
          vote_count: number
        }
        Insert: {
          id?: string
          label: string
          sort_order?: number
          thread_id: string
          vote_count?: number
        }
        Update: {
          id?: string
          label?: string
          sort_order?: number
          thread_id?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_options_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      community_poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "community_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_poll_votes_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          body_md: string
          created_at: string
          id: string
          is_accepted: boolean
          moderation_reason: string | null
          moderation_score: number | null
          parent_post_id: string | null
          status: Database["public"]["Enums"]["community_status"]
          thread_id: string
          updated_at: string
          upvote_count: number
        }
        Insert: {
          author_id: string
          body_md: string
          created_at?: string
          id?: string
          is_accepted?: boolean
          moderation_reason?: string | null
          moderation_score?: number | null
          parent_post_id?: string | null
          status?: Database["public"]["Enums"]["community_status"]
          thread_id: string
          updated_at?: string
          upvote_count?: number
        }
        Update: {
          author_id?: string
          body_md?: string
          created_at?: string
          id?: string
          is_accepted?: boolean
          moderation_reason?: string | null
          moderation_score?: number | null
          parent_post_id?: string | null
          status?: Database["public"]["Enums"]["community_status"]
          thread_id?: string
          updated_at?: string
          upvote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reactions: {
        Row: {
          created_at: string
          id: string
          reaction: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      community_reputation: {
        Row: {
          answers_accepted: number
          avatar_url: string | null
          created_at: string
          display_name: string | null
          headline: string | null
          level: number
          points: number
          posts_created: number
          threads_created: number
          updated_at: string
          upvotes_received: number
          user_id: string
        }
        Insert: {
          answers_accepted?: number
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          headline?: string | null
          level?: number
          points?: number
          posts_created?: number
          threads_created?: number
          updated_at?: string
          upvotes_received?: number
          user_id: string
        }
        Update: {
          answers_accepted?: number
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          headline?: string | null
          level?: number
          points?: number
          posts_created?: number
          threads_created?: number
          updated_at?: string
          upvotes_received?: number
          user_id?: string
        }
        Relationships: []
      }
      community_spaces: {
        Row: {
          audience: Database["public"]["Enums"]["community_audience"]
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_archived: boolean
          is_featured: boolean
          member_count: number
          name: string
          slug: string
          sort_order: number
          thread_count: number
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["community_audience"]
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean
          is_featured?: boolean
          member_count?: number
          name: string
          slug: string
          sort_order?: number
          thread_count?: number
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["community_audience"]
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean
          is_featured?: boolean
          member_count?: number
          name?: string
          slug?: string
          sort_order?: number
          thread_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      community_threads: {
        Row: {
          accepted_post_id: string | null
          author_id: string
          body_md: string
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean
          is_locked: boolean
          is_pinned: boolean
          kind: Database["public"]["Enums"]["community_thread_kind"]
          last_activity_at: string
          moderation_reason: string | null
          moderation_score: number | null
          post_count: number
          seo_description: string | null
          seo_title: string | null
          slug: string
          space_id: string
          status: Database["public"]["Enums"]["community_status"]
          tags: string[]
          title: string
          updated_at: string
          upvote_count: number
          view_count: number
        }
        Insert: {
          accepted_post_id?: string | null
          author_id: string
          body_md?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          is_locked?: boolean
          is_pinned?: boolean
          kind?: Database["public"]["Enums"]["community_thread_kind"]
          last_activity_at?: string
          moderation_reason?: string | null
          moderation_score?: number | null
          post_count?: number
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          space_id: string
          status?: Database["public"]["Enums"]["community_status"]
          tags?: string[]
          title: string
          updated_at?: string
          upvote_count?: number
          view_count?: number
        }
        Update: {
          accepted_post_id?: string | null
          author_id?: string
          body_md?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          is_locked?: boolean
          is_pinned?: boolean
          kind?: Database["public"]["Enums"]["community_thread_kind"]
          last_activity_at?: string
          moderation_reason?: string | null
          moderation_score?: number | null
          post_count?: number
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          space_id?: string
          status?: Database["public"]["Enums"]["community_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          upvote_count?: number
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_threads_accepted_post_fkey"
            columns: ["accepted_post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_threads_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "community_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      community_user_badges: {
        Row: {
          awarded_at: string
          awarded_by: string | null
          badge_id: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "community_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_enquiries: {
        Row: {
          created_at: string
          email: string
          email_normalised: string
          id: string
          idempotency_key: string | null
          ip_hash: string | null
          is_spam: boolean
          name: string
          organisation: string | null
          reference: string | null
          routing_destination: string | null
          status: Database["public"]["Enums"]["contact_enquiry_status"]
          submission_source: Database["public"]["Enums"]["contact_enquiry_source"]
          summary: string
          title: string
          title_normalised: string
          topic: Database["public"]["Enums"]["contact_enquiry_topic"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          email_normalised: string
          id?: string
          idempotency_key?: string | null
          ip_hash?: string | null
          is_spam?: boolean
          name: string
          organisation?: string | null
          reference?: string | null
          routing_destination?: string | null
          status?: Database["public"]["Enums"]["contact_enquiry_status"]
          submission_source?: Database["public"]["Enums"]["contact_enquiry_source"]
          summary: string
          title: string
          title_normalised: string
          topic: Database["public"]["Enums"]["contact_enquiry_topic"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          email_normalised?: string
          id?: string
          idempotency_key?: string | null
          ip_hash?: string | null
          is_spam?: boolean
          name?: string
          organisation?: string | null
          reference?: string | null
          routing_destination?: string | null
          status?: Database["public"]["Enums"]["contact_enquiry_status"]
          submission_source?: Database["public"]["Enums"]["contact_enquiry_source"]
          summary?: string
          title?: string
          title_normalised?: string
          topic?: Database["public"]["Enums"]["contact_enquiry_topic"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      content_analytics_events: {
        Row: {
          content_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          reading_time_sec: number | null
          referrer: string | null
          scroll_percent: number | null
          session_id: string | null
        }
        Insert: {
          content_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          reading_time_sec?: number | null
          referrer?: string | null
          scroll_percent?: number | null
          session_id?: string | null
        }
        Update: {
          content_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          reading_time_sec?: number | null
          referrer?: string | null
          scroll_percent?: number | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_analytics_events_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          name: string
          role: string | null
          slug: string
          socials: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          role?: string | null
          slug: string
          socials?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          role?: string | null
          slug?: string
          socials?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      content_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_comments: {
        Row: {
          anchor: string | null
          author_name: string | null
          author_user_id: string | null
          body: string
          content_id: string
          created_at: string
          id: string
          resolved: boolean
        }
        Insert: {
          anchor?: string | null
          author_name?: string | null
          author_user_id?: string | null
          body: string
          content_id: string
          created_at?: string
          id?: string
          resolved?: boolean
        }
        Update: {
          anchor?: string | null
          author_name?: string | null
          author_user_id?: string | null
          body?: string
          content_id?: string
          created_at?: string
          id?: string
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "content_comments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_internal_links: {
        Row: {
          anchor_text: string | null
          created_at: string
          id: string
          source_content_id: string
          target_content_id: string | null
          target_kind: string | null
          target_url: string
        }
        Insert: {
          anchor_text?: string | null
          created_at?: string
          id?: string
          source_content_id: string
          target_content_id?: string | null
          target_kind?: string | null
          target_url: string
        }
        Update: {
          anchor_text?: string | null
          created_at?: string
          id?: string
          source_content_id?: string
          target_content_id?: string | null
          target_kind?: string | null
          target_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_internal_links_source_content_id_fkey"
            columns: ["source_content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_internal_links_target_content_id_fkey"
            columns: ["target_content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          archived_at: string | null
          author_id: string | null
          avg_reading_time_sec: number | null
          body_markdown: string | null
          canonical_url: string | null
          category_id: string | null
          completion_rate: number | null
          created_at: string
          created_by: string | null
          featured_image: string | null
          featured_image_alt: string | null
          focus_topic: string | null
          id: string
          internal_click_count: number
          last_edited_by: string | null
          metadata: Json | null
          og_image: string | null
          outline: Json | null
          published_at: string | null
          reading_time_min: number | null
          related_topics: string[] | null
          reviewer_id: string | null
          scheduled_for: string | null
          schema_type: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          tag_slugs: string[] | null
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string
          view_count: number
          word_count: number | null
        }
        Insert: {
          archived_at?: string | null
          author_id?: string | null
          avg_reading_time_sec?: number | null
          body_markdown?: string | null
          canonical_url?: string | null
          category_id?: string | null
          completion_rate?: number | null
          created_at?: string
          created_by?: string | null
          featured_image?: string | null
          featured_image_alt?: string | null
          focus_topic?: string | null
          id?: string
          internal_click_count?: number
          last_edited_by?: string | null
          metadata?: Json | null
          og_image?: string | null
          outline?: Json | null
          published_at?: string | null
          reading_time_min?: number | null
          related_topics?: string[] | null
          reviewer_id?: string | null
          scheduled_for?: string | null
          schema_type?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          tag_slugs?: string[] | null
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          view_count?: number
          word_count?: number | null
        }
        Update: {
          archived_at?: string | null
          author_id?: string | null
          avg_reading_time_sec?: number | null
          body_markdown?: string | null
          canonical_url?: string | null
          category_id?: string | null
          completion_rate?: number | null
          created_at?: string
          created_by?: string | null
          featured_image?: string | null
          featured_image_alt?: string | null
          focus_topic?: string | null
          id?: string
          internal_click_count?: number
          last_edited_by?: string | null
          metadata?: Json | null
          og_image?: string | null
          outline?: Json | null
          published_at?: string | null
          reading_time_min?: number | null
          related_topics?: string[] | null
          reviewer_id?: string | null
          scheduled_for?: string | null
          schema_type?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          tag_slugs?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          view_count?: number
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "content_authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "content_authors"
            referencedColumns: ["id"]
          },
        ]
      }
      content_media: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          file_name: string
          folder: string | null
          height: number | null
          id: string
          mime_type: string | null
          public_url: string
          size_bytes: number | null
          storage_path: string
          tags: string[] | null
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          file_name: string
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          public_url: string
          size_bytes?: number | null
          storage_path: string
          tags?: string[] | null
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          file_name?: string
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          public_url?: string
          size_bytes?: number | null
          storage_path?: string
          tags?: string[] | null
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: []
      }
      content_revisions: {
        Row: {
          body_markdown: string | null
          change_note: string | null
          content_id: string
          created_at: string
          edited_by: string | null
          id: string
          revision_number: number
          snapshot: Json
          status: Database["public"]["Enums"]["content_status"] | null
          title: string | null
        }
        Insert: {
          body_markdown?: string | null
          change_note?: string | null
          content_id: string
          created_at?: string
          edited_by?: string | null
          id?: string
          revision_number: number
          snapshot: Json
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string | null
        }
        Update: {
          body_markdown?: string | null
          change_note?: string | null
          content_id?: string
          created_at?: string
          edited_by?: string | null
          id?: string
          revision_number?: number
          snapshot?: Json
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_revisions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          usage_count?: number
        }
        Relationships: []
      }
      counsellor_ai_analyses: {
        Row: {
          analysis: Json
          created_at: string
          generated_by: string | null
          id: string
          lead_id: string
          model: string | null
          updated_at: string
        }
        Insert: {
          analysis?: Json
          created_at?: string
          generated_by?: string | null
          id?: string
          lead_id: string
          model?: string | null
          updated_at?: string
        }
        Update: {
          analysis?: Json
          created_at?: string
          generated_by?: string | null
          id?: string
          lead_id?: string
          model?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "counsellor_ai_analyses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      counsellor_call_logs: {
        Row: {
          ai_summary: string | null
          ai_tasks: Json | null
          channel: string
          counsellor_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          lead_id: string
          outcome: string | null
          raw_notes: string | null
        }
        Insert: {
          ai_summary?: string | null
          ai_tasks?: Json | null
          channel?: string
          counsellor_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          lead_id: string
          outcome?: string | null
          raw_notes?: string | null
        }
        Update: {
          ai_summary?: string | null
          ai_tasks?: Json | null
          channel?: string
          counsellor_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          lead_id?: string
          outcome?: string | null
          raw_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counsellor_call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      counsellor_generated_messages: {
        Row: {
          body: string
          channel: string
          counsellor_id: string
          created_at: string
          id: string
          lead_id: string
          status: string
          subject: string | null
        }
        Insert: {
          body: string
          channel: string
          counsellor_id: string
          created_at?: string
          id?: string
          lead_id: string
          status?: string
          subject?: string | null
        }
        Update: {
          body?: string
          channel?: string
          counsellor_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counsellor_generated_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      counsellor_profiles: {
        Row: {
          active: boolean | null
          avg_response_seconds: number | null
          capacity: number | null
          conversion_rate: number | null
          current_workload: number | null
          display_name: string | null
          is_senior: boolean | null
          languages: string[] | null
          region: string | null
          specialties: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          avg_response_seconds?: number | null
          capacity?: number | null
          conversion_rate?: number | null
          current_workload?: number | null
          display_name?: string | null
          is_senior?: boolean | null
          languages?: string[] | null
          region?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          avg_response_seconds?: number | null
          capacity?: number | null
          conversion_rate?: number | null
          current_workload?: number | null
          display_name?: string | null
          is_senior?: boolean | null
          languages?: string[] | null
          region?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      counsellor_tasks: {
        Row: {
          completed_at: string | null
          counsellor_id: string
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          lead_id: string | null
          priority: string
          source: string | null
          status: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          counsellor_id: string
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          source?: string | null
          status?: string
          title: string
        }
        Update: {
          completed_at?: string | null
          counsellor_id?: string
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          source?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "counsellor_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      course_ai_generations: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          kind: string
          model: string | null
          output: Json | null
          prompt: string | null
          status: string
          tokens_used: number | null
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          kind: string
          model?: string | null
          output?: Json | null
          prompt?: string | null
          status?: string
          tokens_used?: number | null
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          kind?: string
          model?: string | null
          output?: Json | null
          prompt?: string | null
          status?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_ai_generations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_applications: {
        Row: {
          city: string | null
          consent: boolean
          course_id: string
          created_at: string
          current_role_title: string | null
          education: string | null
          email: string
          full_name: string
          graduation_year: number | null
          id: string
          mobile: string
          partner_ref: string | null
          preferred_mode: string | null
          source: string | null
          start_timeline: string | null
          state: string | null
          status: Database["public"]["Enums"]["course_app_status"]
          updated_at: string
          work_experience: string | null
        }
        Insert: {
          city?: string | null
          consent?: boolean
          course_id: string
          created_at?: string
          current_role_title?: string | null
          education?: string | null
          email: string
          full_name: string
          graduation_year?: number | null
          id?: string
          mobile: string
          partner_ref?: string | null
          preferred_mode?: string | null
          source?: string | null
          start_timeline?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["course_app_status"]
          updated_at?: string
          work_experience?: string | null
        }
        Update: {
          city?: string | null
          consent?: boolean
          course_id?: string
          created_at?: string
          current_role_title?: string | null
          education?: string | null
          email?: string
          full_name?: string
          graduation_year?: number | null
          id?: string
          mobile?: string
          partner_ref?: string | null
          preferred_mode?: string | null
          source?: string | null
          start_timeline?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["course_app_status"]
          updated_at?: string
          work_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_applications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_assessments: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_published: boolean
          is_required: boolean
          module_id: string | null
          name: string
          pass_percentage: number
          time_limit_minutes: number | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_published?: boolean
          is_required?: boolean
          module_id?: string | null
          name: string
          pass_percentage?: number
          time_limit_minutes?: number | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_published?: boolean
          is_required?: boolean
          module_id?: string | null
          name?: string
          pass_percentage?: number
          time_limit_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assessments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_assignments: {
        Row: {
          allow_file: boolean
          allow_link: boolean
          allow_multiple_files: boolean
          allow_repo: boolean
          allow_text: boolean
          assignment_type: string
          block_late: boolean
          course_id: string
          created_at: string
          description: string | null
          display_order: number
          due_at: string | null
          due_days: number | null
          evaluation_criteria: string | null
          expected_format: string | null
          id: string
          instructions: string | null
          is_published: boolean
          is_required: boolean
          learning_objective: string | null
          max_score: number | null
          module_id: string | null
          name: string
          passing_score: number | null
          requirements: string | null
          unlock_assignment_id: string | null
          unlock_lesson_id: string | null
          unlock_module_id: string | null
          unlock_rule: string
          updated_at: string
        }
        Insert: {
          allow_file?: boolean
          allow_link?: boolean
          allow_multiple_files?: boolean
          allow_repo?: boolean
          allow_text?: boolean
          assignment_type?: string
          block_late?: boolean
          course_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          due_at?: string | null
          due_days?: number | null
          evaluation_criteria?: string | null
          expected_format?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          is_required?: boolean
          learning_objective?: string | null
          max_score?: number | null
          module_id?: string | null
          name: string
          passing_score?: number | null
          requirements?: string | null
          unlock_assignment_id?: string | null
          unlock_lesson_id?: string | null
          unlock_module_id?: string | null
          unlock_rule?: string
          updated_at?: string
        }
        Update: {
          allow_file?: boolean
          allow_link?: boolean
          allow_multiple_files?: boolean
          allow_repo?: boolean
          allow_text?: boolean
          assignment_type?: string
          block_late?: boolean
          course_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          due_at?: string | null
          due_days?: number | null
          evaluation_criteria?: string | null
          expected_format?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          is_required?: boolean
          learning_objective?: string | null
          max_score?: number | null
          module_id?: string | null
          name?: string
          passing_score?: number | null
          requirements?: string | null
          unlock_assignment_id?: string | null
          unlock_lesson_id?: string | null
          unlock_module_id?: string | null
          unlock_rule?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_unlock_assignment_id_fkey"
            columns: ["unlock_assignment_id"]
            isOneToOne: false
            referencedRelation: "course_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_unlock_lesson_id_fkey"
            columns: ["unlock_lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_unlock_module_id_fkey"
            columns: ["unlock_module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_brochures: {
        Row: {
          capture_lead: boolean
          course_id: string
          created_at: string
          file_url: string
          id: string
          is_published: boolean
          updated_at: string
          version: string | null
        }
        Insert: {
          capture_lead?: boolean
          course_id: string
          created_at?: string
          file_url: string
          id?: string
          is_published?: boolean
          updated_at?: string
          version?: string | null
        }
        Update: {
          capture_lead?: boolean
          course_id?: string
          created_at?: string
          file_url?: string
          id?: string
          is_published?: boolean
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_brochures_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_career_roles: {
        Row: {
          career_role_id: string
          course_id: string
          display_order: number
        }
        Insert: {
          career_role_id: string
          course_id: string
          display_order?: number
        }
        Update: {
          career_role_id?: string
          course_id?: string
          display_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_career_roles_career_role_id_fkey"
            columns: ["career_role_id"]
            isOneToOne: false
            referencedRelation: "career_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_career_roles_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_categories: {
        Row: {
          accent_style: string | null
          created_at: string
          created_by: string | null
          display_order: number
          full_description: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          thumbnail_url: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accent_style?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          full_description?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accent_style?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          full_description?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      course_certifications: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_enabled: boolean
          issuer: string | null
          name: string
          requirements: string | null
          updated_at: string
          verification_available: boolean
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_enabled?: boolean
          issuer?: string | null
          name: string
          requirements?: string | null
          updated_at?: string
          verification_available?: boolean
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_enabled?: boolean
          issuer?: string | null
          name?: string
          requirements?: string | null
          updated_at?: string
          verification_available?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "course_certifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_completion_requirements: {
        Row: {
          accreditation_note: string | null
          certificate_type: string
          course_id: string
          created_at: string
          min_lesson_completion_pct: number
          require_assessments: boolean
          require_assignments: boolean
          require_lessons: boolean
          require_projects: boolean
          updated_at: string
        }
        Insert: {
          accreditation_note?: string | null
          certificate_type?: string
          course_id: string
          created_at?: string
          min_lesson_completion_pct?: number
          require_assessments?: boolean
          require_assignments?: boolean
          require_lessons?: boolean
          require_projects?: boolean
          updated_at?: string
        }
        Update: {
          accreditation_note?: string | null
          certificate_type?: string
          course_id?: string
          created_at?: string
          min_lesson_completion_pct?: number
          require_assessments?: boolean
          require_assignments?: boolean
          require_lessons?: boolean
          require_projects?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_completion_requirements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_faqs: {
        Row: {
          answer: string
          course_id: string
          display_order: number
          id: string
          is_enabled: boolean
          question: string
        }
        Insert: {
          answer: string
          course_id: string
          display_order?: number
          id?: string
          is_enabled?: boolean
          question: string
        }
        Update: {
          answer?: string
          course_id?: string
          display_order?: number
          id?: string
          is_enabled?: boolean
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_faqs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_hiring_partners: {
        Row: {
          company_name: string
          course_id: string
          created_at: string
          id: string
          logo_url: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_name: string
          course_id: string
          created_at?: string
          id?: string
          logo_url?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_name?: string
          course_id?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_hiring_partners_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_learning_path_stages: {
        Row: {
          course_id: string
          created_at: string
          id: string
          note: string | null
          position: number
          stage: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          note?: string | null
          position?: number
          stage: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          note?: string | null
          position?: number
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_learning_path_stages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          display_order: number
          duration: string | null
          id: string
          is_free_preview: boolean
          is_published: boolean
          is_required: boolean
          lesson_type: Database["public"]["Enums"]["lesson_type"]
          name: string
          resource_url: string | null
          topic_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration?: string | null
          id?: string
          is_free_preview?: boolean
          is_published?: boolean
          is_required?: boolean
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          name: string
          resource_url?: string | null
          topic_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration?: string | null
          id?: string
          is_free_preview?: boolean
          is_published?: boolean
          is_required?: boolean
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          name?: string
          resource_url?: string | null
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "course_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          display_order: number
          duration: string | null
          id: string
          is_published: boolean
          is_required: boolean
          learning_outcomes: string[] | null
          name: string
          number: number | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          duration?: string | null
          id?: string
          is_published?: boolean
          is_required?: boolean
          learning_outcomes?: string[] | null
          name: string
          number?: number | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          duration?: string | null
          id?: string
          is_published?: boolean
          is_required?: boolean
          learning_outcomes?: string[] | null
          name?: string
          number?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_placement_support: {
        Row: {
          course_id: string
          description: string | null
          display_order: number
          id: string
          is_enabled: boolean
          support_type: string
        }
        Insert: {
          course_id: string
          description?: string | null
          display_order?: number
          id?: string
          is_enabled?: boolean
          support_type: string
        }
        Update: {
          course_id?: string
          description?: string | null
          display_order?: number
          id?: string
          is_enabled?: boolean
          support_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_placement_support_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_project_templates: {
        Row: {
          created_at: string
          difficulty: string | null
          duration: string | null
          estimated_duration_hours: number | null
          evaluation_criteria: string | null
          expected_outcome: string | null
          full_description: string | null
          id: string
          image_url: string | null
          industry: string | null
          is_active: boolean
          is_published: boolean
          learning_outcomes: string[] | null
          name: string
          objective: string | null
          portfolio_eligible: boolean
          project_type: string | null
          requirements: string | null
          requires_attachment: boolean
          requires_live_link: boolean
          requires_repo_link: boolean
          short_description: string | null
          slug: string
          submission_instructions: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          duration?: string | null
          estimated_duration_hours?: number | null
          evaluation_criteria?: string | null
          expected_outcome?: string | null
          full_description?: string | null
          id?: string
          image_url?: string | null
          industry?: string | null
          is_active?: boolean
          is_published?: boolean
          learning_outcomes?: string[] | null
          name: string
          objective?: string | null
          portfolio_eligible?: boolean
          project_type?: string | null
          requirements?: string | null
          requires_attachment?: boolean
          requires_live_link?: boolean
          requires_repo_link?: boolean
          short_description?: string | null
          slug: string
          submission_instructions?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          duration?: string | null
          estimated_duration_hours?: number | null
          evaluation_criteria?: string | null
          expected_outcome?: string | null
          full_description?: string | null
          id?: string
          image_url?: string | null
          industry?: string | null
          is_active?: boolean
          is_published?: boolean
          learning_outcomes?: string[] | null
          name?: string
          objective?: string | null
          portfolio_eligible?: boolean
          project_type?: string | null
          requirements?: string | null
          requires_attachment?: boolean
          requires_live_link?: boolean
          requires_repo_link?: boolean
          short_description?: string | null
          slug?: string
          submission_instructions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      course_projects: {
        Row: {
          course_id: string
          display_order: number
          due_days_from_start: number | null
          is_published: boolean
          module_id: string | null
          project_id: string
          required_lesson_id: string | null
          required_project_id: string | null
          unlock_rule: string
        }
        Insert: {
          course_id: string
          display_order?: number
          due_days_from_start?: number | null
          is_published?: boolean
          module_id?: string | null
          project_id: string
          required_lesson_id?: string | null
          required_project_id?: string | null
          unlock_rule?: string
        }
        Update: {
          course_id?: string
          display_order?: number
          due_days_from_start?: number | null
          is_published?: boolean
          module_id?: string | null
          project_id?: string
          required_lesson_id?: string | null
          required_project_id?: string | null
          unlock_rule?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_projects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_projects_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "course_project_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_projects_required_lesson_id_fkey"
            columns: ["required_lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_projects_required_project_id_fkey"
            columns: ["required_project_id"]
            isOneToOne: false
            referencedRelation: "course_project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      course_related: {
        Row: {
          course_id: string
          display_order: number
          is_manual: boolean
          related_course_id: string
        }
        Insert: {
          course_id: string
          display_order?: number
          is_manual?: boolean
          related_course_id: string
        }
        Update: {
          course_id?: string
          display_order?: number
          is_manual?: boolean
          related_course_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_related_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_related_related_course_id_fkey"
            columns: ["related_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_salary_stages: {
        Row: {
          course_id: string
          created_at: string
          high: number | null
          id: string
          low: number | null
          note: string | null
          position: number
          range_label: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          high?: number | null
          id?: string
          low?: number | null
          note?: string | null
          position?: number
          range_label?: string | null
          stage: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          high?: number | null
          id?: string
          low?: number | null
          note?: string | null
          position?: number
          range_label?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_salary_stages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sales_content: {
        Row: {
          course_id: string
          created_at: string
          faqs: Json
          id: string
          ideal_learners: string[]
          objections: Json
          talking_points: string[]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          faqs?: Json
          id?: string
          ideal_learners?: string[]
          objections?: Json
          talking_points?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          faqs?: Json
          id?: string
          ideal_learners?: string[]
          objections?: Json
          talking_points?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_sales_content_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sections: {
        Row: {
          content: Json | null
          course_id: string
          created_at: string
          display_order: number
          id: string
          is_enabled: boolean
          section_type: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          course_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_enabled?: boolean
          section_type: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          course_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_enabled?: boolean
          section_type?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_skills: {
        Row: {
          course_id: string
          display_order: number
          skill_id: string
        }
        Insert: {
          course_id: string
          display_order?: number
          skill_id: string
        }
        Update: {
          course_id?: string
          display_order?: number
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_skills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tools: {
        Row: {
          course_id: string
          display_order: number
          tool_id: string
        }
        Insert: {
          course_id: string
          display_order?: number
          tool_id: string
        }
        Update: {
          course_id?: string
          display_order?: number
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_tools_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_tools_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      course_topics: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          module_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          module_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          module_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_topics_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          ai_generated_at: string | null
          ai_generation_status: string | null
          base_price: number | null
          canonical_url: string | null
          capstone: Json | null
          career_launch_price: number | null
          career_pro_price: number | null
          case_studies: Json
          category_id: string
          created_at: string
          created_by: string | null
          currency: string | null
          default_revenue_rule_id: string | null
          discount_pct: number | null
          display_order: number
          duration: string | null
          eligibility: string | null
          emi_available: boolean
          emi_starting: number | null
          format: string | null
          full_description: string | null
          gallery_urls: Json
          hero_image_url: string | null
          highlights: Json
          id: string
          internal_links: Json
          internship_details: Json | null
          is_bestseller: boolean
          is_featured: boolean
          is_popular: boolean
          is_published: boolean
          is_trending: boolean
          language: string | null
          learning_mode: string | null
          learning_outcomes: Json
          level: string | null
          name: string
          offer_price: number | null
          og_image_url: string | null
          partner_sale_eligible: boolean
          prerequisites: string | null
          pricing_notes: string | null
          pricing_visibility: string | null
          promo_video_url: string | null
          scholarship_available: boolean
          self_paced_price: number | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          structured_data: Json | null
          subcategory: string | null
          supported_sales_eligible: boolean
          target_audience: string | null
          tax_config: Json | null
          thumbnail_url: string | null
          unlock_mode: string
          updated_at: string
          updated_by: string | null
          weekly_commitment: string | null
          white_label_eligible: boolean
          who_should_join: Json
        }
        Insert: {
          ai_generated_at?: string | null
          ai_generation_status?: string | null
          base_price?: number | null
          canonical_url?: string | null
          capstone?: Json | null
          career_launch_price?: number | null
          career_pro_price?: number | null
          case_studies?: Json
          category_id: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          default_revenue_rule_id?: string | null
          discount_pct?: number | null
          display_order?: number
          duration?: string | null
          eligibility?: string | null
          emi_available?: boolean
          emi_starting?: number | null
          format?: string | null
          full_description?: string | null
          gallery_urls?: Json
          hero_image_url?: string | null
          highlights?: Json
          id?: string
          internal_links?: Json
          internship_details?: Json | null
          is_bestseller?: boolean
          is_featured?: boolean
          is_popular?: boolean
          is_published?: boolean
          is_trending?: boolean
          language?: string | null
          learning_mode?: string | null
          learning_outcomes?: Json
          level?: string | null
          name: string
          offer_price?: number | null
          og_image_url?: string | null
          partner_sale_eligible?: boolean
          prerequisites?: string | null
          pricing_notes?: string | null
          pricing_visibility?: string | null
          promo_video_url?: string | null
          scholarship_available?: boolean
          self_paced_price?: number | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          structured_data?: Json | null
          subcategory?: string | null
          supported_sales_eligible?: boolean
          target_audience?: string | null
          tax_config?: Json | null
          thumbnail_url?: string | null
          unlock_mode?: string
          updated_at?: string
          updated_by?: string | null
          weekly_commitment?: string | null
          white_label_eligible?: boolean
          who_should_join?: Json
        }
        Update: {
          ai_generated_at?: string | null
          ai_generation_status?: string | null
          base_price?: number | null
          canonical_url?: string | null
          capstone?: Json | null
          career_launch_price?: number | null
          career_pro_price?: number | null
          case_studies?: Json
          category_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          default_revenue_rule_id?: string | null
          discount_pct?: number | null
          display_order?: number
          duration?: string | null
          eligibility?: string | null
          emi_available?: boolean
          emi_starting?: number | null
          format?: string | null
          full_description?: string | null
          gallery_urls?: Json
          hero_image_url?: string | null
          highlights?: Json
          id?: string
          internal_links?: Json
          internship_details?: Json | null
          is_bestseller?: boolean
          is_featured?: boolean
          is_popular?: boolean
          is_published?: boolean
          is_trending?: boolean
          language?: string | null
          learning_mode?: string | null
          learning_outcomes?: Json
          level?: string | null
          name?: string
          offer_price?: number | null
          og_image_url?: string | null
          partner_sale_eligible?: boolean
          prerequisites?: string | null
          pricing_notes?: string | null
          pricing_visibility?: string | null
          promo_video_url?: string | null
          scholarship_available?: boolean
          self_paced_price?: number | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          structured_data?: Json | null
          subcategory?: string | null
          supported_sales_eligible?: boolean
          target_audience?: string | null
          tax_config?: Json | null
          thumbnail_url?: string | null
          unlock_mode?: string
          updated_at?: string
          updated_by?: string | null
          weekly_commitment?: string | null
          white_label_eligible?: boolean
          who_should_join?: Json
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "course_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_default_revenue_rule_id_fkey"
            columns: ["default_revenue_rule_id"]
            isOneToOne: false
            referencedRelation: "revenue_share_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_assets: {
        Row: {
          ai_prompt: string | null
          brand_kit_id: string | null
          created_at: string
          height: number | null
          id: string
          kind: string
          metadata: Json
          mime_type: string | null
          name: string
          owner_id: string
          size_bytes: number | null
          source: string
          tags: string[]
          url: string
          width: number | null
        }
        Insert: {
          ai_prompt?: string | null
          brand_kit_id?: string | null
          created_at?: string
          height?: number | null
          id?: string
          kind: string
          metadata?: Json
          mime_type?: string | null
          name: string
          owner_id: string
          size_bytes?: number | null
          source?: string
          tags?: string[]
          url: string
          width?: number | null
        }
        Update: {
          ai_prompt?: string | null
          brand_kit_id?: string | null
          created_at?: string
          height?: number | null
          id?: string
          kind?: string
          metadata?: Json
          mime_type?: string | null
          name?: string
          owner_id?: string
          size_bytes?: number | null
          source?: string
          tags?: string[]
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cs_assets_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "cs_brand_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_brand_kits: {
        Row: {
          accent_color: string | null
          body_font: string | null
          border_radius: string | null
          button_style: string | null
          created_at: string
          cta_style: string | null
          heading_font: string | null
          icon_style: string | null
          id: string
          illustration_style: string | null
          is_default: boolean
          logo_url: string | null
          metadata: Json
          name: string
          owner_id: string
          primary_color: string | null
          secondary_color: string | null
          tone_of_voice: string | null
          updated_at: string
          watermark_url: string | null
        }
        Insert: {
          accent_color?: string | null
          body_font?: string | null
          border_radius?: string | null
          button_style?: string | null
          created_at?: string
          cta_style?: string | null
          heading_font?: string | null
          icon_style?: string | null
          id?: string
          illustration_style?: string | null
          is_default?: boolean
          logo_url?: string | null
          metadata?: Json
          name: string
          owner_id: string
          primary_color?: string | null
          secondary_color?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          watermark_url?: string | null
        }
        Update: {
          accent_color?: string | null
          body_font?: string | null
          border_radius?: string | null
          button_style?: string | null
          created_at?: string
          cta_style?: string | null
          heading_font?: string | null
          icon_style?: string | null
          id?: string
          illustration_style?: string | null
          is_default?: boolean
          logo_url?: string | null
          metadata?: Json
          name?: string
          owner_id?: string
          primary_color?: string | null
          secondary_color?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          watermark_url?: string | null
        }
        Relationships: []
      }
      cs_design_analytics: {
        Row: {
          actor_id: string | null
          created_at: string
          design_id: string
          event: string
          id: number
          payload: Json
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          design_id: string
          event: string
          id?: number
          payload?: Json
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          design_id?: string
          event?: string
          id?: number
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cs_design_analytics_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "cs_designs"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_design_comments: {
        Row: {
          anchor: Json | null
          author_id: string
          body: string
          created_at: string
          design_id: string
          id: string
          status: string | null
        }
        Insert: {
          anchor?: Json | null
          author_id: string
          body: string
          created_at?: string
          design_id: string
          id?: string
          status?: string | null
        }
        Update: {
          anchor?: Json | null
          author_id?: string
          body?: string
          created_at?: string
          design_id?: string
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cs_design_comments_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "cs_designs"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_design_versions: {
        Row: {
          copy: Json
          created_at: string
          created_by: string | null
          design_id: string
          id: string
          layout: Json
          note: string | null
          palette: Json
          preview_url: string | null
          typography: Json
          version: number
        }
        Insert: {
          copy?: Json
          created_at?: string
          created_by?: string | null
          design_id: string
          id?: string
          layout?: Json
          note?: string | null
          palette?: Json
          preview_url?: string | null
          typography?: Json
          version: number
        }
        Update: {
          copy?: Json
          created_at?: string
          created_by?: string | null
          design_id?: string
          id?: string
          layout?: Json
          note?: string | null
          palette?: Json
          preview_url?: string | null
          typography?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cs_design_versions_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "cs_designs"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_designs: {
        Row: {
          brand_kit_id: string | null
          copy: Json
          created_at: string
          export_urls: Json
          folder_id: string | null
          format: string
          id: string
          layout: Json
          locked_elements: Json
          metadata: Json
          owner_id: string
          palette: Json
          preview_url: string | null
          prompt: string | null
          status: string
          style: string | null
          template_id: string | null
          title: string
          typography: Json
          updated_at: string
          version: number
        }
        Insert: {
          brand_kit_id?: string | null
          copy?: Json
          created_at?: string
          export_urls?: Json
          folder_id?: string | null
          format: string
          id?: string
          layout?: Json
          locked_elements?: Json
          metadata?: Json
          owner_id: string
          palette?: Json
          preview_url?: string | null
          prompt?: string | null
          status?: string
          style?: string | null
          template_id?: string | null
          title: string
          typography?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          brand_kit_id?: string | null
          copy?: Json
          created_at?: string
          export_urls?: Json
          folder_id?: string | null
          format?: string
          id?: string
          layout?: Json
          locked_elements?: Json
          metadata?: Json
          owner_id?: string
          palette?: Json
          preview_url?: string | null
          prompt?: string | null
          status?: string
          style?: string | null
          template_id?: string | null
          title?: string
          typography?: Json
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cs_designs_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "cs_brand_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cs_designs_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "cs_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cs_designs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "cs_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cs_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cs_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_templates: {
        Row: {
          category: string
          created_at: string
          format: string
          id: string
          is_public: boolean
          layout: Json
          metadata: Json
          name: string
          owner_id: string | null
          style: string | null
          thumbnail_url: string | null
          updated_at: string
          usage_count: number
        }
        Insert: {
          category: string
          created_at?: string
          format: string
          id?: string
          is_public?: boolean
          layout?: Json
          metadata?: Json
          name: string
          owner_id?: string | null
          style?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          usage_count?: number
        }
        Update: {
          category?: string
          created_at?: string
          format?: string
          id?: string
          is_public?: boolean
          layout?: Json
          metadata?: Json
          name?: string
          owner_id?: string | null
          style?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      email_brand_settings: {
        Row: {
          accent_color: string | null
          address: string | null
          brand_id: string | null
          brand_name: string | null
          created_at: string
          favicon_url: string | null
          footer_background: string | null
          footer_tagline: string | null
          header_background: string | null
          id: string
          is_platform: boolean
          logo_url: string | null
          logo_url_dark: string | null
          primary_color: string | null
          show_partner_logos: boolean
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_twitter: string | null
          social_youtube: string | null
          support_email: string | null
          support_phone: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          brand_id?: string | null
          brand_name?: string | null
          created_at?: string
          favicon_url?: string | null
          footer_background?: string | null
          footer_tagline?: string | null
          header_background?: string | null
          id?: string
          is_platform?: boolean
          logo_url?: string | null
          logo_url_dark?: string | null
          primary_color?: string | null
          show_partner_logos?: boolean
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          brand_id?: string | null
          brand_name?: string | null
          created_at?: string
          favicon_url?: string | null
          footer_background?: string | null
          footer_tagline?: string | null
          header_background?: string | null
          id?: string
          is_platform?: boolean
          logo_url?: string | null
          logo_url_dark?: string | null
          primary_color?: string | null
          show_partner_logos?: boolean
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_brand_settings_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          attachments: Json | null
          attempts: number
          bcc: string[] | null
          brand_id: string | null
          category: string | null
          cc: string[] | null
          created_at: string
          error_code: string | null
          error_message: string | null
          from_email: string
          from_name: string | null
          headers: Json | null
          html: string | null
          id: string
          idempotency_key: string | null
          max_attempts: number
          next_attempt_at: string | null
          provider: string
          provider_message_id: string | null
          reply_to: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          subject: string
          tags: Json | null
          template_key: string | null
          text: string | null
          to_email: string
          updated_at: string
          user_id: string | null
          variables: Json | null
        }
        Insert: {
          attachments?: Json | null
          attempts?: number
          bcc?: string[] | null
          brand_id?: string | null
          category?: string | null
          cc?: string[] | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          from_email: string
          from_name?: string | null
          headers?: Json | null
          html?: string | null
          id?: string
          idempotency_key?: string | null
          max_attempts?: number
          next_attempt_at?: string | null
          provider?: string
          provider_message_id?: string | null
          reply_to?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          tags?: Json | null
          template_key?: string | null
          text?: string | null
          to_email: string
          updated_at?: string
          user_id?: string | null
          variables?: Json | null
        }
        Update: {
          attachments?: Json | null
          attempts?: number
          bcc?: string[] | null
          brand_id?: string | null
          category?: string | null
          cc?: string[] | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          from_email?: string
          from_name?: string | null
          headers?: Json | null
          html?: string | null
          id?: string
          idempotency_key?: string | null
          max_attempts?: number
          next_attempt_at?: string | null
          provider?: string
          provider_message_id?: string | null
          reply_to?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          tags?: Json | null
          template_key?: string | null
          text?: string | null
          to_email?: string
          updated_at?: string
          user_id?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      email_partner_logos: {
        Row: {
          brand_id: string | null
          category: string
          created_at: string
          created_by: string | null
          enabled: boolean
          id: string
          link_url: string | null
          logo_url: string
          logo_url_dark: string | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          link_url?: string | null
          logo_url: string
          logo_url_dark?: string | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          link_url?: string | null
          logo_url?: string
          logo_url_dark?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_partner_logos_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_attendance: {
        Row: {
          admin_override: boolean
          attendance_date: string
          created_at: string
          employee_id: string
          first_login_at: string | null
          id: string
          is_holiday: boolean
          is_weekly_off: boolean
          last_activity_at: string | null
          logout_at: string | null
          notes: string | null
          status: string
          updated_at: string
          working_minutes: number | null
        }
        Insert: {
          admin_override?: boolean
          attendance_date: string
          created_at?: string
          employee_id: string
          first_login_at?: string | null
          id?: string
          is_holiday?: boolean
          is_weekly_off?: boolean
          last_activity_at?: string | null
          logout_at?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
          working_minutes?: number | null
        }
        Update: {
          admin_override?: boolean
          attendance_date?: string
          created_at?: string
          employee_id?: string
          first_login_at?: string | null
          id?: string
          is_holiday?: boolean
          is_weekly_off?: boolean
          last_activity_at?: string | null
          logout_at?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
          working_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_benefits: {
        Row: {
          activated_at: string | null
          admin_notes: string | null
          benefit_type_id: string
          created_at: string
          employee_id: string
          id: string
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          admin_notes?: string | null
          benefit_type_id: string
          created_at?: string
          employee_id: string
          id?: string
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          admin_notes?: string | null
          benefit_type_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_benefits_benefit_type_id_fkey"
            columns: ["benefit_type_id"]
            isOneToOne: false
            referencedRelation: "benefit_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_code: string
          employment_status: string
          exited_at: string | null
          id: string
          joining_date: string
          notes: string | null
          partner_id: string
          payroll_entity_name: string | null
          salary_cycle: string
          updated_at: string
          user_id: string
          work_model: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_code: string
          employment_status?: string
          exited_at?: string | null
          id?: string
          joining_date?: string
          notes?: string | null
          partner_id: string
          payroll_entity_name?: string | null
          salary_cycle?: string
          updated_at?: string
          user_id: string
          work_model?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_code?: string
          employment_status?: string
          exited_at?: string | null
          id?: string
          joining_date?: string
          notes?: string | null
          partner_id?: string
          payroll_entity_name?: string | null
          salary_cycle?: string
          updated_at?: string
          user_id?: string
          work_model?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_profiles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      engage_ai_generations: {
        Row: {
          brand_id: string | null
          created_at: string
          id: string
          input: Json | null
          kind: string
          model: string | null
          output: Json | null
          prompt: string | null
          tokens_in: number | null
          tokens_out: number | null
          user_id: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          id?: string
          input?: Json | null
          kind: string
          model?: string | null
          output?: Json | null
          prompt?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          id?: string
          input?: Json | null
          kind?: string
          model?: string | null
          output?: Json | null
          prompt?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engage_ai_generations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engage_campaigns: {
        Row: {
          ab_test: Json | null
          bounced_count: number
          brand_id: string | null
          channel: string
          clicked_count: number
          created_at: string
          created_by: string | null
          delivered_count: number
          description: string | null
          id: string
          metadata: Json
          name: string
          opened_count: number
          provider_id: string | null
          recurring_cron: string | null
          revenue_amount: number | null
          schedule_type: string
          scheduled_at: string | null
          segment_id: string | null
          sent_at: string | null
          sent_count: number
          status: string
          template_id: string | null
          template_key: string | null
          tenant_scope: string
          timezone: string | null
          total_recipients: number | null
          unsubscribed_count: number
          updated_at: string
        }
        Insert: {
          ab_test?: Json | null
          bounced_count?: number
          brand_id?: string | null
          channel?: string
          clicked_count?: number
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          opened_count?: number
          provider_id?: string | null
          recurring_cron?: string | null
          revenue_amount?: number | null
          schedule_type?: string
          scheduled_at?: string | null
          segment_id?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          template_id?: string | null
          template_key?: string | null
          tenant_scope?: string
          timezone?: string | null
          total_recipients?: number | null
          unsubscribed_count?: number
          updated_at?: string
        }
        Update: {
          ab_test?: Json | null
          bounced_count?: number
          brand_id?: string | null
          channel?: string
          clicked_count?: number
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          opened_count?: number
          provider_id?: string | null
          recurring_cron?: string | null
          revenue_amount?: number | null
          schedule_type?: string
          scheduled_at?: string | null
          segment_id?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          template_id?: string | null
          template_key?: string | null
          tenant_scope?: string
          timezone?: string | null
          total_recipients?: number | null
          unsubscribed_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engage_campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engage_campaigns_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "engage_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engage_campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "engage_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engage_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "engage_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      engage_events: {
        Row: {
          brand_id: string | null
          created_at: string
          event: string
          id: string
          payload: Json
          processed_at: string | null
          tenant_scope: string
          user_id: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          event: string
          id?: string
          payload?: Json
          processed_at?: string | null
          tenant_scope?: string
          user_id?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          event?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          tenant_scope?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engage_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engage_inapp_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          archived_at: string | null
          body: string | null
          brand_id: string | null
          category: string
          created_at: string
          icon: string | null
          id: string
          metadata: Json
          priority: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          archived_at?: string | null
          body?: string | null
          brand_id?: string | null
          category?: string
          created_at?: string
          icon?: string | null
          id?: string
          metadata?: Json
          priority?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          archived_at?: string | null
          body?: string | null
          brand_id?: string | null
          category?: string
          created_at?: string
          icon?: string | null
          id?: string
          metadata?: Json
          priority?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "engage_inapp_notifications_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engage_messages: {
        Row: {
          bounced_at: string | null
          brand_id: string | null
          campaign_id: string | null
          channel: string
          clicked_at: string | null
          complained_at: string | null
          delivered_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          metadata: Json
          opened_at: string | null
          provider: string | null
          provider_message_id: string | null
          queued_at: string
          recipient: string
          sent_at: string | null
          sequence_enrollment_id: string | null
          status: string
          subject: string | null
          template_id: string | null
          template_key: string | null
          tenant_scope: string
          unsubscribed_at: string | null
          user_id: string | null
          variant: string | null
        }
        Insert: {
          bounced_at?: string | null
          brand_id?: string | null
          campaign_id?: string | null
          channel?: string
          clicked_at?: string | null
          complained_at?: string | null
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          opened_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          queued_at?: string
          recipient: string
          sent_at?: string | null
          sequence_enrollment_id?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          template_key?: string | null
          tenant_scope?: string
          unsubscribed_at?: string | null
          user_id?: string | null
          variant?: string | null
        }
        Update: {
          bounced_at?: string | null
          brand_id?: string | null
          campaign_id?: string | null
          channel?: string
          clicked_at?: string | null
          complained_at?: string | null
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          opened_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          queued_at?: string
          recipient?: string
          sent_at?: string | null
          sequence_enrollment_id?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          template_key?: string | null
          tenant_scope?: string
          unsubscribed_at?: string | null
          user_id?: string | null
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engage_messages_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engage_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "engage_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engage_messages_sequence_enrollment_id_fkey"
            columns: ["sequence_enrollment_id"]
            isOneToOne: false
            referencedRelation: "engage_sequence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engage_messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "engage_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      engage_providers: {
        Row: {
          brand_id: string | null
          channel: string
          config: Json
          created_at: string
          created_by: string | null
          display_name: string | null
          id: string
          is_active: boolean
          is_default: boolean
          kind: string
          last_test_at: string | null
          last_test_error: string | null
          last_test_status: string | null
          secret_ref: string | null
          tenant_scope: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          brand_id?: string | null
          channel?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          kind: string
          last_test_at?: string | null
          last_test_error?: string | null
          last_test_status?: string | null
          secret_ref?: string | null
          tenant_scope?: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          brand_id?: string | null
          channel?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          kind?: string
          last_test_at?: string | null
          last_test_error?: string | null
          last_test_status?: string | null
          secret_ref?: string | null
          tenant_scope?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engage_providers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engage_push_subscriptions: {
        Row: {
          brand_id: string | null
          created_at: string
          device_label: string | null
          endpoint: string
          id: string
          is_active: boolean
          keys: Json
          last_used_at: string | null
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          device_label?: string | null
          endpoint: string
          id?: string
          is_active?: boolean
          keys: Json
          last_used_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          device_label?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean
          keys?: Json
          last_used_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engage_push_subscriptions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engage_segments: {
        Row: {
          audience: string
          brand_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_size: number | null
          id: string
          is_active: boolean
          last_evaluated_at: string | null
          name: string
          rules: Json
          tenant_scope: string
          updated_at: string
        }
        Insert: {
          audience?: string
          brand_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_size?: number | null
          id?: string
          is_active?: boolean
          last_evaluated_at?: string | null
          name: string
          rules?: Json
          tenant_scope?: string
          updated_at?: string
        }
        Update: {
          audience?: string
          brand_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_size?: number | null
          id?: string
          is_active?: boolean
          last_evaluated_at?: string | null
          name?: string
          rules?: Json
          tenant_scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engage_segments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engage_senders: {
        Row: {
          brand_id: string | null
          created_at: string
          dkim_status: string | null
          dmarc_status: string | null
          domain: string | null
          from_email: string
          from_name: string
          id: string
          is_default: boolean
          reply_to: string | null
          spf_status: string | null
          tenant_scope: string
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          dkim_status?: string | null
          dmarc_status?: string | null
          domain?: string | null
          from_email: string
          from_name: string
          id?: string
          is_default?: boolean
          reply_to?: string | null
          spf_status?: string | null
          tenant_scope?: string
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          dkim_status?: string | null
          dmarc_status?: string | null
          domain?: string | null
          from_email?: string
          from_name?: string
          id?: string
          is_default?: boolean
          reply_to?: string | null
          spf_status?: string | null
          tenant_scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engage_senders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engage_sequence_enrollments: {
        Row: {
          completed_at: string | null
          context: Json
          current_step: number
          enrolled_at: string
          id: string
          last_error: string | null
          next_run_at: string | null
          recipient_email: string | null
          sequence_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          context?: Json
          current_step?: number
          enrolled_at?: string
          id?: string
          last_error?: string | null
          next_run_at?: string | null
          recipient_email?: string | null
          sequence_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          context?: Json
          current_step?: number
          enrolled_at?: string
          id?: string
          last_error?: string | null
          next_run_at?: string | null
          recipient_email?: string | null
          sequence_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engage_sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "engage_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      engage_sequences: {
        Row: {
          audience: string
          brand_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          metadata: Json
          name: string
          steps: Json
          tenant_scope: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          audience?: string
          brand_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          metadata?: Json
          name: string
          steps?: Json
          tenant_scope?: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          audience?: string
          brand_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          metadata?: Json
          name?: string
          steps?: Json
          tenant_scope?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engage_sequences_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engage_subscriptions: {
        Row: {
          brand_id: string | null
          category: string
          channel: string
          created_at: string
          email: string | null
          id: string
          is_subscribed: boolean
          unsubscribe_token: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          brand_id?: string | null
          category: string
          channel?: string
          created_at?: string
          email?: string | null
          id?: string
          is_subscribed?: boolean
          unsubscribe_token?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          brand_id?: string | null
          category?: string
          channel?: string
          created_at?: string
          email?: string | null
          id?: string
          is_subscribed?: boolean
          unsubscribe_token?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engage_subscriptions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engage_templates: {
        Row: {
          body_html: string | null
          body_json: Json | null
          body_mjml: string | null
          body_text: string | null
          brand_id: string | null
          category: string | null
          channel: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_system: boolean
          locale: string
          metadata: Json
          name: string
          preview_text: string | null
          subject: string | null
          template_key: string
          tenant_scope: string
          updated_at: string
          version: number
        }
        Insert: {
          body_html?: string | null
          body_json?: Json | null
          body_mjml?: string | null
          body_text?: string | null
          brand_id?: string | null
          category?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          locale?: string
          metadata?: Json
          name: string
          preview_text?: string | null
          subject?: string | null
          template_key: string
          tenant_scope?: string
          updated_at?: string
          version?: number
        }
        Update: {
          body_html?: string | null
          body_json?: Json | null
          body_mjml?: string | null
          body_text?: string | null
          brand_id?: string | null
          category?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          locale?: string
          metadata?: Json
          name?: string
          preview_text?: string | null
          subject?: string | null
          template_key?: string
          tenant_scope?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "engage_templates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          ambassador_id: string | null
          ambassador_referral_code: string | null
          ambassador_session_id: string | null
          completed_at: string | null
          content_completed_at: string | null
          course_id: string | null
          created_at: string
          current_lesson_id: string | null
          current_module_id: string | null
          eligible_revenue: number
          enrolled_at: string
          enrollment_code: string | null
          gross_revenue: number
          id: string
          last_accessed_at: string | null
          lead_source: string | null
          lms_status: string
          partner_id: string | null
          program_id: string
          program_title: string
          status: Database["public"]["Enums"]["enrollment_status"]
          student_email: string | null
          student_name: string
          student_user_id: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          ambassador_id?: string | null
          ambassador_referral_code?: string | null
          ambassador_session_id?: string | null
          completed_at?: string | null
          content_completed_at?: string | null
          course_id?: string | null
          created_at?: string
          current_lesson_id?: string | null
          current_module_id?: string | null
          eligible_revenue: number
          enrolled_at?: string
          enrollment_code?: string | null
          gross_revenue: number
          id?: string
          last_accessed_at?: string | null
          lead_source?: string | null
          lms_status?: string
          partner_id?: string | null
          program_id: string
          program_title: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_email?: string | null
          student_name: string
          student_user_id?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          ambassador_id?: string | null
          ambassador_referral_code?: string | null
          ambassador_session_id?: string | null
          completed_at?: string | null
          content_completed_at?: string | null
          course_id?: string | null
          created_at?: string
          current_lesson_id?: string | null
          current_module_id?: string | null
          eligible_revenue?: number
          enrolled_at?: string
          enrollment_code?: string | null
          gross_revenue?: number
          id?: string
          last_accessed_at?: string | null
          lead_source?: string | null
          lms_status?: string
          partner_id?: string | null
          program_id?: string
          program_title?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_email?: string | null
          student_name?: string
          student_user_id?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_current_lesson_id_fkey"
            columns: ["current_lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_current_module_id_fkey"
            columns: ["current_module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          action_href: string | null
          action_label: string | null
          alt_phrases: string[]
          category_id: string | null
          created_at: string
          display_order: number
          effective_date: string | null
          full_answer: string
          id: string
          intent: string | null
          is_featured: boolean
          is_popular: boolean
          is_published: boolean
          policy_slug: string | null
          question: string
          related_program_slug: string | null
          review_date: string | null
          search_doc: unknown
          search_keywords: string[]
          short_answer: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          action_href?: string | null
          action_label?: string | null
          alt_phrases?: string[]
          category_id?: string | null
          created_at?: string
          display_order?: number
          effective_date?: string | null
          full_answer: string
          id?: string
          intent?: string | null
          is_featured?: boolean
          is_popular?: boolean
          is_published?: boolean
          policy_slug?: string | null
          question: string
          related_program_slug?: string | null
          review_date?: string | null
          search_doc?: unknown
          search_keywords?: string[]
          short_answer: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_href?: string | null
          action_label?: string | null
          alt_phrases?: string[]
          category_id?: string | null
          created_at?: string
          display_order?: number
          effective_date?: string | null
          full_answer?: string
          id?: string
          intent?: string | null
          is_featured?: boolean
          is_popular?: boolean
          is_published?: boolean
          policy_slug?: string | null
          question?: string
          related_program_slug?: string | null
          review_date?: string | null
          search_doc?: unknown
          search_keywords?: string[]
          short_answer?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faqs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "faq_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_applications: {
        Row: {
          applicant_user_id: string | null
          application_code: string | null
          application_status: string
          consent_status: boolean
          cover_note: string | null
          created_at: string
          current_location: string | null
          email: string
          experience_summary: string | null
          full_name: string
          id: string
          linkedin_url: string | null
          mobile: string
          portfolio_url: string | null
          resume_path: string | null
          role_id: string
          source: string | null
          submitted_at: string
          updated_at: string
        }
        Insert: {
          applicant_user_id?: string | null
          application_code?: string | null
          application_status?: string
          consent_status?: boolean
          cover_note?: string | null
          created_at?: string
          current_location?: string | null
          email: string
          experience_summary?: string | null
          full_name: string
          id?: string
          linkedin_url?: string | null
          mobile: string
          portfolio_url?: string | null
          resume_path?: string | null
          role_id: string
          source?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          applicant_user_id?: string | null
          application_code?: string | null
          application_status?: string
          consent_status?: boolean
          cover_note?: string | null
          created_at?: string
          current_location?: string | null
          email?: string
          experience_summary?: string | null
          full_name?: string
          id?: string
          linkedin_url?: string | null
          mobile?: string
          portfolio_url?: string | null
          resume_path?: string | null
          role_id?: string
          source?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hiring_applications_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "hiring_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_departments: {
        Row: {
          created_at: string
          display_order: number
          focus_areas: string[]
          headline: string | null
          id: string
          is_active: boolean
          name: string
          purpose: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          focus_areas?: string[]
          headline?: string | null
          id?: string
          is_active?: boolean
          name: string
          purpose?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          focus_areas?: string[]
          headline?: string | null
          id?: string
          is_active?: boolean
          name?: string
          purpose?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      hiring_roles: {
        Row: {
          application_close_at: string | null
          application_open_at: string | null
          created_at: string
          department_id: string | null
          display_order: number
          employment_type: string
          experience_level: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          location_display: string | null
          location_type: string
          overview: string | null
          preferred_qualifications: string[]
          requirements: string[]
          responsibilities: string[]
          role_code: string | null
          seo_description: string | null
          seo_title: string | null
          short_summary: string | null
          skills: string[]
          slug: string
          status: string
          title: string
          updated_at: string
          work_type: string
        }
        Insert: {
          application_close_at?: string | null
          application_open_at?: string | null
          created_at?: string
          department_id?: string | null
          display_order?: number
          employment_type?: string
          experience_level?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          location_display?: string | null
          location_type?: string
          overview?: string | null
          preferred_qualifications?: string[]
          requirements?: string[]
          responsibilities?: string[]
          role_code?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_summary?: string | null
          skills?: string[]
          slug: string
          status?: string
          title: string
          updated_at?: string
          work_type?: string
        }
        Update: {
          application_close_at?: string | null
          application_open_at?: string | null
          created_at?: string
          department_id?: string | null
          display_order?: number
          employment_type?: string
          experience_level?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          location_display?: string | null
          location_type?: string
          overview?: string | null
          preferred_qualifications?: string[]
          requirements?: string[]
          responsibilities?: string[]
          role_code?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_summary?: string | null
          skills?: string[]
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "hiring_roles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hiring_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_links: {
        Row: {
          auto_generated: boolean
          created_at: string
          from_id: string
          from_type: Database["public"]["Enums"]["internal_link_entity"]
          id: string
          reason: string | null
          relation: string
          score: number
          to_id: string
          to_type: Database["public"]["Enums"]["internal_link_entity"]
          updated_at: string
        }
        Insert: {
          auto_generated?: boolean
          created_at?: string
          from_id: string
          from_type: Database["public"]["Enums"]["internal_link_entity"]
          id?: string
          reason?: string | null
          relation: string
          score?: number
          to_id: string
          to_type: Database["public"]["Enums"]["internal_link_entity"]
          updated_at?: string
        }
        Update: {
          auto_generated?: boolean
          created_at?: string
          from_id?: string
          from_type?: Database["public"]["Enums"]["internal_link_entity"]
          id?: string
          reason?: string | null
          relation?: string
          score?: number
          to_id?: string
          to_type?: Database["public"]["Enums"]["internal_link_entity"]
          updated_at?: string
        }
        Relationships: []
      }
      internship_projects: {
        Row: {
          course_project_template_id: string | null
          created_at: string
          description: string | null
          expected_outcome: string | null
          id: string
          internship_id: string
          is_final: boolean
          is_required: boolean
          order_index: number
          project_type: Database["public"]["Enums"]["internship_project_type"]
          publish_status: string
          requirements: string | null
          submission_instructions: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_project_template_id?: string | null
          created_at?: string
          description?: string | null
          expected_outcome?: string | null
          id?: string
          internship_id: string
          is_final?: boolean
          is_required?: boolean
          order_index?: number
          project_type?: Database["public"]["Enums"]["internship_project_type"]
          publish_status?: string
          requirements?: string | null
          submission_instructions?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_project_template_id?: string | null
          created_at?: string
          description?: string | null
          expected_outcome?: string | null
          id?: string
          internship_id?: string
          is_final?: boolean
          is_required?: boolean
          order_index?: number
          project_type?: Database["public"]["Enums"]["internship_project_type"]
          publish_status?: string
          requirements?: string | null
          submission_instructions?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_projects_course_project_template_id_fkey"
            columns: ["course_project_template_id"]
            isOneToOne: false
            referencedRelation: "course_project_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_projects_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_stages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          internship_id: string
          is_required: boolean
          name: string
          order_index: number
          publish_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          internship_id: string
          is_required?: boolean
          name: string
          order_index?: number
          publish_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          internship_id?: string
          is_required?: boolean
          name?: string
          order_index?: number
          publish_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_stages_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_tasks: {
        Row: {
          allow_multiple_files: boolean
          created_at: string
          description: string | null
          due_offset_days: number | null
          estimated_hours: number | null
          evaluation_criteria: string | null
          expected_outcome: string | null
          id: string
          instructions: string | null
          is_required: boolean
          objective: string | null
          order_index: number
          publish_status: string
          requirements: string | null
          stage_id: string
          submission_instructions: string | null
          submission_types: string[]
          task_type: Database["public"]["Enums"]["internship_task_type"]
          title: string
          updated_at: string
        }
        Insert: {
          allow_multiple_files?: boolean
          created_at?: string
          description?: string | null
          due_offset_days?: number | null
          estimated_hours?: number | null
          evaluation_criteria?: string | null
          expected_outcome?: string | null
          id?: string
          instructions?: string | null
          is_required?: boolean
          objective?: string | null
          order_index?: number
          publish_status?: string
          requirements?: string | null
          stage_id: string
          submission_instructions?: string | null
          submission_types?: string[]
          task_type?: Database["public"]["Enums"]["internship_task_type"]
          title: string
          updated_at?: string
        }
        Update: {
          allow_multiple_files?: boolean
          created_at?: string
          description?: string | null
          due_offset_days?: number | null
          estimated_hours?: number | null
          evaluation_criteria?: string | null
          expected_outcome?: string | null
          id?: string
          instructions?: string | null
          is_required?: boolean
          objective?: string | null
          order_index?: number
          publish_status?: string
          requirements?: string | null
          stage_id?: string
          submission_instructions?: string | null
          submission_types?: string[]
          task_type?: Database["public"]["Enums"]["internship_task_type"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "internship_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          completion_requirements: Json
          course_id: string
          created_at: string
          description: string | null
          duration_weeks: number | null
          eligibility: Json
          id: string
          publish_status: string
          sequential: boolean
          title: string
          updated_at: string
        }
        Insert: {
          completion_requirements?: Json
          course_id: string
          created_at?: string
          description?: string | null
          duration_weeks?: number | null
          eligibility?: Json
          id?: string
          publish_status?: string
          sequential?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          completion_requirements?: Json
          course_id?: string
          created_at?: string
          description?: string | null
          duration_weeks?: number | null
          eligibility?: Json
          id?: string
          publish_status?: string
          sequential?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internships_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_activity: {
        Row: {
          created_at: string
          event_type: string
          id: string
          meta: Json
          session_id: string | null
          student_user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          meta?: Json
          session_id?: string | null
          student_user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json
          session_id?: string | null
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_activity_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_answers: {
        Row: {
          answer_text: string | null
          category_scores: Json
          created_at: string
          evaluated_at: string | null
          evaluation_status: string
          feedback: Json
          id: string
          is_skipped: boolean
          practice_score: number | null
          question_id: string
          session_id: string
          submitted_at: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          answer_text?: string | null
          category_scores?: Json
          created_at?: string
          evaluated_at?: string | null
          evaluation_status?: string
          feedback?: Json
          id?: string
          is_skipped?: boolean
          practice_score?: number | null
          question_id: string
          session_id: string
          submitted_at?: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          answer_text?: string | null
          category_scores?: Json
          created_at?: string
          evaluated_at?: string | null
          evaluation_status?: string
          feedback?: Json
          id?: string
          is_skipped?: boolean
          practice_score?: number | null
          question_id?: string
          session_id?: string
          submitted_at?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          category: string | null
          created_at: string
          expected_topics: Json
          id: string
          position: number
          question_text: string
          session_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          expected_topics?: Json
          id?: string
          position: number
          question_text: string
          session_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          expected_topics?: Json
          id?: string
          position?: number
          question_text?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          ai_available: boolean
          answered_count: number
          avg_practice_score: number | null
          completed_at: string | null
          course_id: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["interview_difficulty"]
          id: string
          internship_id: string | null
          interview_type: Database["public"]["Enums"]["interview_type"]
          meta: Json
          mode: Database["public"]["Enums"]["interview_mode"]
          project_id: string | null
          question_count: number
          skipped_count: number
          started_at: string
          status: Database["public"]["Enums"]["interview_status"]
          student_user_id: string
          target_role: string | null
          updated_at: string
          use_resume: boolean
        }
        Insert: {
          ai_available?: boolean
          answered_count?: number
          avg_practice_score?: number | null
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["interview_difficulty"]
          id?: string
          internship_id?: string | null
          interview_type: Database["public"]["Enums"]["interview_type"]
          meta?: Json
          mode?: Database["public"]["Enums"]["interview_mode"]
          project_id?: string | null
          question_count: number
          skipped_count?: number
          started_at?: string
          status?: Database["public"]["Enums"]["interview_status"]
          student_user_id: string
          target_role?: string | null
          updated_at?: string
          use_resume?: boolean
        }
        Update: {
          ai_available?: boolean
          answered_count?: number
          avg_practice_score?: number | null
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["interview_difficulty"]
          id?: string
          internship_id?: string | null
          interview_type?: Database["public"]["Enums"]["interview_type"]
          meta?: Json
          mode?: Database["public"]["Enums"]["interview_mode"]
          project_id?: string | null
          question_count?: number
          skipped_count?: number
          started_at?: string
          status?: Database["public"]["Enums"]["interview_status"]
          student_user_id?: string
          target_role?: string | null
          updated_at?: string
          use_resume?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_sessions_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "student_internships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "student_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_article_versions: {
        Row: {
          article_id: string
          body_md: string | null
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          summary: string | null
          title: string
          version_number: number
        }
        Insert: {
          article_id: string
          body_md?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          summary?: string | null
          title: string
          version_number: number
        }
        Update: {
          article_id?: string
          body_md?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          summary?: string | null
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "kb_article_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "kb_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_articles: {
        Row: {
          author_id: string | null
          body_md: string | null
          category_id: string | null
          cover_image: string | null
          created_at: string
          featured: boolean
          helpful_count: number
          id: string
          json_ld: Json | null
          kind: string
          published: boolean
          reading_time: number | null
          related_ids: string[]
          seo_description: string | null
          seo_keywords: string[]
          seo_title: string | null
          slug: string
          summary: string | null
          tags: string[]
          title: string
          unhelpful_count: number
          updated_at: string
          version: number
          video_url: string | null
          view_count: number
        }
        Insert: {
          author_id?: string | null
          body_md?: string | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string
          featured?: boolean
          helpful_count?: number
          id?: string
          json_ld?: Json | null
          kind?: string
          published?: boolean
          reading_time?: number | null
          related_ids?: string[]
          seo_description?: string | null
          seo_keywords?: string[]
          seo_title?: string | null
          slug: string
          summary?: string | null
          tags?: string[]
          title: string
          unhelpful_count?: number
          updated_at?: string
          version?: number
          video_url?: string | null
          view_count?: number
        }
        Update: {
          author_id?: string | null
          body_md?: string | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string
          featured?: boolean
          helpful_count?: number
          id?: string
          json_ld?: Json | null
          kind?: string
          published?: boolean
          reading_time?: number | null
          related_ids?: string[]
          seo_description?: string | null
          seo_keywords?: string[]
          seo_title?: string | null
          slug?: string
          summary?: string | null
          tags?: string[]
          title?: string
          unhelpful_count?: number
          updated_at?: string
          version?: number
          video_url?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "kb_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "kb_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          position: number
          published: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          position?: number
          published?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          position?: number
          published?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "kb_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_feedback: {
        Row: {
          article_id: string
          comment: string | null
          created_at: string
          helpful: boolean
          id: string
          user_id: string | null
        }
        Insert: {
          article_id: string
          comment?: string | null
          created_at?: string
          helpful: boolean
          id?: string
          user_id?: string | null
        }
        Update: {
          article_id?: string
          comment?: string | null
          created_at?: string
          helpful?: boolean
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "kb_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_content_plan: {
        Row: {
          business_value: number | null
          cluster: string | null
          content_type: string
          created_at: string
          id: string
          internal_links: Json | null
          month: number
          priority: number | null
          project_id: string
          status: string
          supporting_keywords: string[] | null
          target_keyword: string | null
          title: string
        }
        Insert: {
          business_value?: number | null
          cluster?: string | null
          content_type: string
          created_at?: string
          id?: string
          internal_links?: Json | null
          month: number
          priority?: number | null
          project_id: string
          status?: string
          supporting_keywords?: string[] | null
          target_keyword?: string | null
          title: string
        }
        Update: {
          business_value?: number | null
          cluster?: string | null
          content_type?: string
          created_at?: string
          id?: string
          internal_links?: Json | null
          month?: number
          priority?: number | null
          project_id?: string
          status?: string
          supporting_keywords?: string[] | null
          target_keyword?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "keyword_content_plan_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "keyword_research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_research_keywords: {
        Row: {
          business_value: number | null
          category: string
          cluster: string | null
          competition: string | null
          conversion_score: number | null
          cpc: number | null
          created_at: string
          difficulty: number | null
          estimated_traffic: number | null
          id: string
          intent: string | null
          keyword: string
          monthly_volume: number | null
          notes: string | null
          priority: number | null
          project_id: string
          seasonality: string | null
          suggested_content_type: string | null
        }
        Insert: {
          business_value?: number | null
          category: string
          cluster?: string | null
          competition?: string | null
          conversion_score?: number | null
          cpc?: number | null
          created_at?: string
          difficulty?: number | null
          estimated_traffic?: number | null
          id?: string
          intent?: string | null
          keyword: string
          monthly_volume?: number | null
          notes?: string | null
          priority?: number | null
          project_id: string
          seasonality?: string | null
          suggested_content_type?: string | null
        }
        Update: {
          business_value?: number | null
          category?: string
          cluster?: string | null
          competition?: string | null
          conversion_score?: number | null
          cpc?: number | null
          created_at?: string
          difficulty?: number | null
          estimated_traffic?: number | null
          id?: string
          intent?: string | null
          keyword?: string
          monthly_volume?: number | null
          notes?: string | null
          priority?: number | null
          project_id?: string
          seasonality?: string | null
          suggested_content_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_research_keywords_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "keyword_research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_research_projects: {
        Row: {
          brand_id: string | null
          created_at: string
          id: string
          language: string | null
          location: string | null
          name: string
          notes: string | null
          owner_id: string | null
          scope: string
          seed_query: string
          status: string
          subject_type: string
          summary: Json | null
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          id?: string
          language?: string | null
          location?: string | null
          name: string
          notes?: string | null
          owner_id?: string | null
          scope?: string
          seed_query: string
          status?: string
          subject_type: string
          summary?: Json | null
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          id?: string
          language?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          owner_id?: string | null
          scope?: string
          seed_query?: string
          status?: string
          subject_type?: string
          summary?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      lead_assignment_history: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          from_partner_id: string | null
          id: string
          lead_id: string
          metadata: Json | null
          method: string | null
          reason: string | null
          to_partner_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          from_partner_id?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          method?: string | null
          reason?: string | null
          to_partner_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          from_partner_id?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          method?: string | null
          reason?: string | null
          to_partner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignment_history_from_partner_id_fkey"
            columns: ["from_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignment_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "partner_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignment_history_to_partner_id_fkey"
            columns: ["to_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_ownership_history: {
        Row: {
          changed_by: string | null
          created_at: string
          ended_at: string | null
          id: string
          lead_id: string
          owner_partner_id: string | null
          ownership_type: Database["public"]["Enums"]["lead_ownership_type"]
          reason: string | null
          started_at: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          lead_id: string
          owner_partner_id?: string | null
          ownership_type: Database["public"]["Enums"]["lead_ownership_type"]
          reason?: string | null
          started_at?: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          lead_id?: string
          owner_partner_id?: string | null
          ownership_type?: Database["public"]["Enums"]["lead_ownership_type"]
          reason?: string | null
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_ownership_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "partner_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_ownership_history_owner_partner_id_fkey"
            columns: ["owner_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_ownership_reviews: {
        Row: {
          admin_decision: string | null
          admin_reason: string | null
          approved_lead_id: string | null
          claiming_partner_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          existing_lead_id: string | null
          id: string
          merged_into_lead_id: string | null
          status: Database["public"]["Enums"]["lead_ownership_review_status"]
          submitted_course_id: string | null
          submitted_email: string | null
          submitted_full_name: string
          submitted_mobile: string
          submitted_mobile_normalized: string
          submitted_notes: string | null
          submitted_program_interest: string | null
          submitted_source: string | null
          updated_at: string
        }
        Insert: {
          admin_decision?: string | null
          admin_reason?: string | null
          approved_lead_id?: string | null
          claiming_partner_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          existing_lead_id?: string | null
          id?: string
          merged_into_lead_id?: string | null
          status?: Database["public"]["Enums"]["lead_ownership_review_status"]
          submitted_course_id?: string | null
          submitted_email?: string | null
          submitted_full_name: string
          submitted_mobile: string
          submitted_mobile_normalized: string
          submitted_notes?: string | null
          submitted_program_interest?: string | null
          submitted_source?: string | null
          updated_at?: string
        }
        Update: {
          admin_decision?: string | null
          admin_reason?: string | null
          approved_lead_id?: string | null
          claiming_partner_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          existing_lead_id?: string | null
          id?: string
          merged_into_lead_id?: string | null
          status?: Database["public"]["Enums"]["lead_ownership_review_status"]
          submitted_course_id?: string | null
          submitted_email?: string | null
          submitted_full_name?: string
          submitted_mobile?: string
          submitted_mobile_normalized?: string
          submitted_notes?: string | null
          submitted_program_interest?: string | null
          submitted_source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_ownership_reviews_approved_lead_id_fkey"
            columns: ["approved_lead_id"]
            isOneToOne: false
            referencedRelation: "partner_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_ownership_reviews_claiming_partner_id_fkey"
            columns: ["claiming_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_ownership_reviews_existing_lead_id_fkey"
            columns: ["existing_lead_id"]
            isOneToOne: false
            referencedRelation: "partner_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_ownership_reviews_merged_into_lead_id_fkey"
            columns: ["merged_into_lead_id"]
            isOneToOne: false
            referencedRelation: "partner_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_ownership_reviews_submitted_course_id_fkey"
            columns: ["submitted_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_score_snapshots: {
        Row: {
          breakdown: Json
          category: string
          created_at: string
          id: string
          lead_id: string
          probability: number
          reason: string | null
          score: number
        }
        Insert: {
          breakdown?: Json
          category: string
          created_at?: string
          id?: string
          lead_id: string
          probability?: number
          reason?: string | null
          score: number
        }
        Update: {
          breakdown?: Json
          category?: string
          created_at?: string
          id?: string
          lead_id?: string
          probability?: number
          reason?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_score_snapshots_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scoring_config: {
        Row: {
          automation: Json
          created_at: string
          id: string
          is_active: boolean
          thresholds: Json
          updated_at: string
          updated_by: string | null
          weights: Json
        }
        Insert: {
          automation?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          thresholds?: Json
          updated_at?: string
          updated_by?: string | null
          weights?: Json
        }
        Update: {
          automation?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          thresholds?: Json
          updated_at?: string
          updated_by?: string | null
          weights?: Json
        }
        Relationships: []
      }
      lesson_notes: {
        Row: {
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          notes: string
          student_user_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          notes?: string
          student_user_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          notes?: string
          student_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          enrollment_id: string | null
          id: string
          last_accessed_at: string
          last_position_seconds: number
          lesson_id: string
          started_at: string
          status: string
          student_user_id: string
          updated_at: string
          video_progress_pct: number
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          last_accessed_at?: string
          last_position_seconds?: number
          lesson_id: string
          started_at?: string
          status?: string
          student_user_id: string
          updated_at?: string
          video_progress_pct?: number
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          last_accessed_at?: string
          last_position_seconds?: number
          lesson_id?: string
          started_at?: string
          status?: string
          student_user_id?: string
          updated_at?: string
          video_progress_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      live_class_ai_outputs: {
        Row: {
          assignments: Json | null
          generated_at: string
          generated_by: string | null
          id: string
          important_topics: Json | null
          interview_questions: Json | null
          key_notes: Json | null
          next_module_recommendation: Json | null
          quiz: Json | null
          session_id: string
          summary: string | null
          transcript: string | null
        }
        Insert: {
          assignments?: Json | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          important_topics?: Json | null
          interview_questions?: Json | null
          key_notes?: Json | null
          next_module_recommendation?: Json | null
          quiz?: Json | null
          session_id: string
          summary?: string | null
          transcript?: string | null
        }
        Update: {
          assignments?: Json | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          important_topics?: Json | null
          interview_questions?: Json | null
          key_notes?: Json | null
          next_module_recommendation?: Json | null
          quiz?: Json | null
          session_id?: string
          summary?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_class_ai_outputs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_class_notifications: {
        Row: {
          channel: string
          created_at: string
          delivered_at: string | null
          event: string
          id: string
          payload: Json
          scheduled_for: string
          session_id: string
          status: string
          student_user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          delivered_at?: string | null
          event: string
          id?: string
          payload?: Json
          scheduled_for: string
          session_id: string
          status?: string
          student_user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          delivered_at?: string | null
          event?: string
          id?: string
          payload?: Json
          scheduled_for?: string
          session_id?: string
          status?: string
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_class_notifications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_class_providers: {
        Row: {
          account_email: string | null
          account_id: string | null
          account_name: string | null
          connected_at: string | null
          connected_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_connected: boolean
          last_error: string | null
          metadata: Json
          provider: string
          scopes: string[] | null
          updated_at: string
        }
        Insert: {
          account_email?: string | null
          account_id?: string | null
          account_name?: string | null
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_connected?: boolean
          last_error?: string | null
          metadata?: Json
          provider: string
          scopes?: string[] | null
          updated_at?: string
        }
        Update: {
          account_email?: string | null
          account_id?: string | null
          account_name?: string | null
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_connected?: boolean
          last_error?: string | null
          metadata?: Json
          provider?: string
          scopes?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      live_sessions: {
        Row: {
          agenda: string | null
          batch_id: string | null
          breakout_rooms: boolean
          cancellation_note: string | null
          chat_enabled: boolean
          course_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          host_url: string | null
          id: string
          instructor_notes: string | null
          is_published: boolean
          is_recurring: boolean
          is_webinar: boolean
          join_window_minutes: number
          learning_topics: string[]
          max_participants: number | null
          meeting_url: string | null
          mentor_id: string | null
          module_id: string | null
          passcode: string | null
          previous_scheduled_at: string | null
          provider: string
          provider_meeting_id: string | null
          recording_enabled: boolean
          recording_url: string | null
          recurrence: Json | null
          require_registration: boolean
          scheduled_at: string
          status: Database["public"]["Enums"]["live_session_status"]
          timezone: string
          title: string
          updated_at: string
          waiting_room: boolean
        }
        Insert: {
          agenda?: string | null
          batch_id?: string | null
          breakout_rooms?: boolean
          cancellation_note?: string | null
          chat_enabled?: boolean
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          host_url?: string | null
          id?: string
          instructor_notes?: string | null
          is_published?: boolean
          is_recurring?: boolean
          is_webinar?: boolean
          join_window_minutes?: number
          learning_topics?: string[]
          max_participants?: number | null
          meeting_url?: string | null
          mentor_id?: string | null
          module_id?: string | null
          passcode?: string | null
          previous_scheduled_at?: string | null
          provider?: string
          provider_meeting_id?: string | null
          recording_enabled?: boolean
          recording_url?: string | null
          recurrence?: Json | null
          require_registration?: boolean
          scheduled_at: string
          status?: Database["public"]["Enums"]["live_session_status"]
          timezone?: string
          title: string
          updated_at?: string
          waiting_room?: boolean
        }
        Update: {
          agenda?: string | null
          batch_id?: string | null
          breakout_rooms?: boolean
          cancellation_note?: string | null
          chat_enabled?: boolean
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          host_url?: string | null
          id?: string
          instructor_notes?: string | null
          is_published?: boolean
          is_recurring?: boolean
          is_webinar?: boolean
          join_window_minutes?: number
          learning_topics?: string[]
          max_participants?: number | null
          meeting_url?: string | null
          mentor_id?: string | null
          module_id?: string | null
          passcode?: string | null
          previous_scheduled_at?: string | null
          provider?: string
          provider_meeting_id?: string | null
          recording_enabled?: boolean
          recording_url?: string | null
          recurrence?: Json | null
          require_registration?: boolean
          scheduled_at?: string
          status?: Database["public"]["Enums"]["live_session_status"]
          timezone?: string
          title?: string
          updated_at?: string
          waiting_room?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "session_mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      ma_agents: {
        Row: {
          approval_level: string
          auto_blog: boolean
          auto_email: boolean
          auto_landing: boolean
          auto_optimize: boolean
          auto_publish: boolean
          auto_social: boolean
          auto_video: boolean
          brand_id: string | null
          budget_monthly: number | null
          channels: string[]
          created_at: string
          goals: Json
          id: string
          language: string
          last_tick_at: string | null
          name: string
          next_tick_at: string | null
          owner_id: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          approval_level?: string
          auto_blog?: boolean
          auto_email?: boolean
          auto_landing?: boolean
          auto_optimize?: boolean
          auto_publish?: boolean
          auto_social?: boolean
          auto_video?: boolean
          brand_id?: string | null
          budget_monthly?: number | null
          channels?: string[]
          created_at?: string
          goals?: Json
          id?: string
          language?: string
          last_tick_at?: string | null
          name: string
          next_tick_at?: string | null
          owner_id: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          approval_level?: string
          auto_blog?: boolean
          auto_email?: boolean
          auto_landing?: boolean
          auto_optimize?: boolean
          auto_publish?: boolean
          auto_social?: boolean
          auto_video?: boolean
          brand_id?: string | null
          budget_monthly?: number | null
          channels?: string[]
          created_at?: string
          goals?: Json
          id?: string
          language?: string
          last_tick_at?: string | null
          name?: string
          next_tick_at?: string | null
          owner_id?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      ma_decisions: {
        Row: {
          action: Json
          agent_id: string
          confidence: number | null
          created_at: string
          executed_at: string | null
          id: string
          kind: string
          rationale: string | null
          reviewer_id: string | null
          rolled_back_at: string | null
          state: string
          target_id: string | null
          target_kind: string | null
        }
        Insert: {
          action?: Json
          agent_id: string
          confidence?: number | null
          created_at?: string
          executed_at?: string | null
          id?: string
          kind: string
          rationale?: string | null
          reviewer_id?: string | null
          rolled_back_at?: string | null
          state?: string
          target_id?: string | null
          target_kind?: string | null
        }
        Update: {
          action?: Json
          agent_id?: string
          confidence?: number | null
          created_at?: string
          executed_at?: string | null
          id?: string
          kind?: string
          rationale?: string | null
          reviewer_id?: string | null
          rolled_back_at?: string | null
          state?: string
          target_id?: string | null
          target_kind?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ma_decisions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ma_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ma_knowledge: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          key: string
          kind: string
          last_seen_at: string
          score: number | null
          value: Json
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          key: string
          kind: string
          last_seen_at?: string
          score?: number | null
          value?: Json
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          key?: string
          kind?: string
          last_seen_at?: string
          score?: number | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ma_knowledge_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ma_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ma_metrics_snapshots: {
        Row: {
          agent_id: string
          created_at: string
          day: string
          id: string
          metrics: Json
        }
        Insert: {
          agent_id: string
          created_at?: string
          day: string
          id?: string
          metrics?: Json
        }
        Update: {
          agent_id?: string
          created_at?: string
          day?: string
          id?: string
          metrics?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ma_metrics_snapshots_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ma_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ma_plans: {
        Row: {
          agent_id: string
          created_at: string
          created_by: string
          horizon: string
          id: string
          period_end: string
          period_start: string
          plan: Json
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          created_by?: string
          horizon: string
          id?: string
          period_end: string
          period_start: string
          plan?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          created_by?: string
          horizon?: string
          id?: string
          period_end?: string
          period_start?: string
          plan?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ma_plans_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ma_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ma_recommendations: {
        Row: {
          actioned_at: string | null
          agent_id: string
          created_at: string
          detail: Json
          id: string
          kind: string
          priority: number
          state: string
          title: string
        }
        Insert: {
          actioned_at?: string | null
          agent_id: string
          created_at?: string
          detail?: Json
          id?: string
          kind: string
          priority?: number
          state?: string
          title: string
        }
        Update: {
          actioned_at?: string | null
          agent_id?: string
          created_at?: string
          detail?: Json
          id?: string
          kind?: string
          priority?: number
          state?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ma_recommendations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ma_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ma_reports: {
        Row: {
          agent_id: string
          body: Json
          created_at: string
          id: string
          kind: string
          period_end: string | null
          period_start: string | null
          summary: string | null
          title: string
        }
        Insert: {
          agent_id: string
          body?: Json
          created_at?: string
          id?: string
          kind: string
          period_end?: string | null
          period_start?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          agent_id?: string
          body?: Json
          created_at?: string
          id?: string
          kind?: string
          period_end?: string | null
          period_start?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ma_reports_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ma_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_resource_interactions: {
        Row: {
          ambassador_id: string
          campaign_id: string | null
          created_at: string
          id: string
          interaction_type: Database["public"]["Enums"]["marketing_interaction_type"]
          metadata: Json | null
          program_id: string | null
          resource_id: string | null
        }
        Insert: {
          ambassador_id: string
          campaign_id?: string | null
          created_at?: string
          id?: string
          interaction_type: Database["public"]["Enums"]["marketing_interaction_type"]
          metadata?: Json | null
          program_id?: string | null
          resource_id?: string | null
        }
        Update: {
          ambassador_id?: string
          campaign_id?: string | null
          created_at?: string
          id?: string
          interaction_type?: Database["public"]["Enums"]["marketing_interaction_type"]
          metadata?: Json | null
          program_id?: string | null
          resource_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_resource_interactions_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_resource_interactions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_resource_interactions_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "marketing_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_resource_issues: {
        Row: {
          admin_note: string | null
          ambassador_id: string
          created_at: string
          description: string | null
          id: string
          issue_code: string
          issue_type: Database["public"]["Enums"]["marketing_issue_type"]
          program_id: string | null
          resolved_at: string | null
          resource_id: string | null
          status: Database["public"]["Enums"]["marketing_issue_status"]
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          ambassador_id: string
          created_at?: string
          description?: string | null
          id?: string
          issue_code: string
          issue_type: Database["public"]["Enums"]["marketing_issue_type"]
          program_id?: string | null
          resolved_at?: string | null
          resource_id?: string | null
          status?: Database["public"]["Enums"]["marketing_issue_status"]
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          ambassador_id?: string
          created_at?: string
          description?: string | null
          id?: string
          issue_code?: string
          issue_type?: Database["public"]["Enums"]["marketing_issue_type"]
          program_id?: string | null
          resolved_at?: string | null
          resource_id?: string | null
          status?: Database["public"]["Enums"]["marketing_issue_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_resource_issues_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_resource_issues_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_resource_issues_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "marketing_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_resource_saves: {
        Row: {
          ambassador_id: string
          created_at: string
          id: string
          resource_id: string
        }
        Insert: {
          ambassador_id: string
          created_at?: string
          id?: string
          resource_id: string
        }
        Update: {
          ambassador_id?: string
          created_at?: string
          id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_resource_saves_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "campus_ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_resource_saves_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "marketing_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_resources: {
        Row: {
          aspect_ratio: string | null
          campaign_id: string | null
          caption_content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          effective_from: string | null
          effective_until: string | null
          file_format: string | null
          file_size_bytes: number | null
          id: string
          is_featured: boolean
          media_url: string | null
          personalisation_allowed: boolean
          personalisation_fields: Json | null
          program_id: string | null
          published_at: string | null
          resource_category: string | null
          resource_code: string
          resource_type: Database["public"]["Enums"]["marketing_resource_type"]
          share_message: string | null
          short_copy: string | null
          status: Database["public"]["Enums"]["marketing_resource_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          aspect_ratio?: string | null
          campaign_id?: string | null
          caption_content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          file_format?: string | null
          file_size_bytes?: number | null
          id?: string
          is_featured?: boolean
          media_url?: string | null
          personalisation_allowed?: boolean
          personalisation_fields?: Json | null
          program_id?: string | null
          published_at?: string | null
          resource_category?: string | null
          resource_code: string
          resource_type: Database["public"]["Enums"]["marketing_resource_type"]
          share_message?: string | null
          short_copy?: string | null
          status?: Database["public"]["Enums"]["marketing_resource_status"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          aspect_ratio?: string | null
          campaign_id?: string | null
          caption_content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          file_format?: string | null
          file_size_bytes?: number | null
          id?: string
          is_featured?: boolean
          media_url?: string | null
          personalisation_allowed?: boolean
          personalisation_fields?: Json | null
          program_id?: string | null
          published_at?: string | null
          resource_category?: string | null
          resource_code?: string
          resource_type?: Database["public"]["Enums"]["marketing_resource_type"]
          share_message?: string | null
          short_copy?: string | null
          status?: Database["public"]["Enums"]["marketing_resource_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketing_resources_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_analytics: {
        Row: {
          brand_id: string
          channel_kind: Database["public"]["Enums"]["mkt_channel_kind"]
          clicks: number | null
          comments: number | null
          ctr: number | null
          engagement_rate: number | null
          followers_delta: number | null
          id: string
          impressions: number | null
          likes: number | null
          measured_at: string
          post_id: string | null
          raw: Json
          reach: number | null
          saves: number | null
          shares: number | null
        }
        Insert: {
          brand_id: string
          channel_kind: Database["public"]["Enums"]["mkt_channel_kind"]
          clicks?: number | null
          comments?: number | null
          ctr?: number | null
          engagement_rate?: number | null
          followers_delta?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          measured_at?: string
          post_id?: string | null
          raw?: Json
          reach?: number | null
          saves?: number | null
          shares?: number | null
        }
        Update: {
          brand_id?: string
          channel_kind?: Database["public"]["Enums"]["mkt_channel_kind"]
          clicks?: number | null
          comments?: number | null
          ctr?: number | null
          engagement_rate?: number | null
          followers_delta?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          measured_at?: string
          post_id?: string | null
          raw?: Json
          reach?: number | null
          saves?: number | null
          shares?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mkt_analytics_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "mkt_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "mkt_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_approvals: {
        Row: {
          content_id: string
          created_at: string
          decided_at: string | null
          decision: string
          id: string
          note: string | null
          requested_by: string | null
          reviewer_id: string | null
        }
        Insert: {
          content_id: string
          created_at?: string
          decided_at?: string | null
          decision?: string
          id?: string
          note?: string | null
          requested_by?: string | null
          reviewer_id?: string | null
        }
        Update: {
          content_id?: string
          created_at?: string
          decided_at?: string | null
          decision?: string
          id?: string
          note?: string | null
          requested_by?: string | null
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mkt_approvals_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "mkt_content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_assets: {
        Row: {
          content_id: string | null
          created_at: string
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["mkt_asset_kind"]
          meta: Json
          prompt: string | null
          provider: string | null
          url: string
          variant_id: string | null
          width: number | null
        }
        Insert: {
          content_id?: string | null
          created_at?: string
          height?: number | null
          id?: string
          kind: Database["public"]["Enums"]["mkt_asset_kind"]
          meta?: Json
          prompt?: string | null
          provider?: string | null
          url: string
          variant_id?: string | null
          width?: number | null
        }
        Update: {
          content_id?: string | null
          created_at?: string
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["mkt_asset_kind"]
          meta?: Json
          prompt?: string | null
          provider?: string | null
          url?: string
          variant_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mkt_assets_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "mkt_content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_assets_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "mkt_content_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_brands: {
        Row: {
          accent_color: string | null
          created_at: string
          default_approval_mode: Database["public"]["Enums"]["mkt_approval_mode"]
          default_timezone: string
          id: string
          logo_url: string | null
          meta: Json
          name: string
          owner_id: string
          primary_color: string | null
          slug: string | null
          tone: string | null
          updated_at: string
          voice_notes: string | null
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          default_approval_mode?: Database["public"]["Enums"]["mkt_approval_mode"]
          default_timezone?: string
          id?: string
          logo_url?: string | null
          meta?: Json
          name: string
          owner_id: string
          primary_color?: string | null
          slug?: string | null
          tone?: string | null
          updated_at?: string
          voice_notes?: string | null
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          default_approval_mode?: Database["public"]["Enums"]["mkt_approval_mode"]
          default_timezone?: string
          id?: string
          logo_url?: string | null
          meta?: Json
          name?: string
          owner_id?: string
          primary_color?: string | null
          slug?: string | null
          tone?: string | null
          updated_at?: string
          voice_notes?: string | null
        }
        Relationships: []
      }
      mkt_calendar_events: {
        Row: {
          brand_id: string | null
          category: string
          created_at: string
          description: string | null
          event_date: string
          id: string
          meta: Json
          suggested_type: Database["public"]["Enums"]["mkt_content_type"] | null
          title: string
        }
        Insert: {
          brand_id?: string | null
          category: string
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          meta?: Json
          suggested_type?:
            | Database["public"]["Enums"]["mkt_content_type"]
            | null
          title: string
        }
        Update: {
          brand_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          meta?: Json
          suggested_type?:
            | Database["public"]["Enums"]["mkt_content_type"]
            | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_calendar_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "mkt_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_campaigns: {
        Row: {
          approval_mode: Database["public"]["Enums"]["mkt_approval_mode"]
          brand_id: string
          budget_cents: number | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          meta: Json
          name: string
          objective: string | null
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approval_mode?: Database["public"]["Enums"]["mkt_approval_mode"]
          brand_id: string
          budget_cents?: number | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          meta?: Json
          name: string
          objective?: string | null
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approval_mode?: Database["public"]["Enums"]["mkt_approval_mode"]
          brand_id?: string
          budget_cents?: number | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          meta?: Json
          name?: string
          objective?: string | null
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "mkt_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_channels: {
        Row: {
          auto_publish: boolean
          brand_id: string
          config: Json
          connector_id: string | null
          created_at: string
          credentials_ref: string | null
          display_name: string
          enabled: boolean
          handle: string | null
          id: string
          kind: Database["public"]["Enums"]["mkt_channel_kind"]
          last_health: string | null
          last_health_at: string | null
          updated_at: string
        }
        Insert: {
          auto_publish?: boolean
          brand_id: string
          config?: Json
          connector_id?: string | null
          created_at?: string
          credentials_ref?: string | null
          display_name: string
          enabled?: boolean
          handle?: string | null
          id?: string
          kind: Database["public"]["Enums"]["mkt_channel_kind"]
          last_health?: string | null
          last_health_at?: string | null
          updated_at?: string
        }
        Update: {
          auto_publish?: boolean
          brand_id?: string
          config?: Json
          connector_id?: string | null
          created_at?: string
          credentials_ref?: string | null
          display_name?: string
          enabled?: boolean
          handle?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["mkt_channel_kind"]
          last_health?: string | null
          last_health_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_channels_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "mkt_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_content_items: {
        Row: {
          approval_mode: Database["public"]["Enums"]["mkt_approval_mode"]
          brand_id: string
          brief: string | null
          campaign_id: string | null
          content_type: Database["public"]["Enums"]["mkt_content_type"]
          created_at: string
          created_by: string | null
          id: string
          language: string | null
          meta: Json
          prompt: string | null
          source_kind: string | null
          source_ref: string | null
          status: Database["public"]["Enums"]["mkt_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          approval_mode?: Database["public"]["Enums"]["mkt_approval_mode"]
          brand_id: string
          brief?: string | null
          campaign_id?: string | null
          content_type?: Database["public"]["Enums"]["mkt_content_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          language?: string | null
          meta?: Json
          prompt?: string | null
          source_kind?: string | null
          source_ref?: string | null
          status?: Database["public"]["Enums"]["mkt_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          approval_mode?: Database["public"]["Enums"]["mkt_approval_mode"]
          brand_id?: string
          brief?: string | null
          campaign_id?: string | null
          content_type?: Database["public"]["Enums"]["mkt_content_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          language?: string | null
          meta?: Json
          prompt?: string | null
          source_kind?: string | null
          source_ref?: string | null
          status?: Database["public"]["Enums"]["mkt_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_content_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "mkt_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_content_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mkt_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_content_variants: {
        Row: {
          body: string | null
          caption: string | null
          channel_kind: Database["public"]["Enums"]["mkt_channel_kind"]
          content_id: string
          created_at: string
          cta: string | null
          hashtags: string[] | null
          headline: string | null
          id: string
          meta: Json
          seo_description: string | null
          seo_title: string | null
          updated_at: string
          variant_label: string | null
        }
        Insert: {
          body?: string | null
          caption?: string | null
          channel_kind: Database["public"]["Enums"]["mkt_channel_kind"]
          content_id: string
          created_at?: string
          cta?: string | null
          hashtags?: string[] | null
          headline?: string | null
          id?: string
          meta?: Json
          seo_description?: string | null
          seo_title?: string | null
          updated_at?: string
          variant_label?: string | null
        }
        Update: {
          body?: string | null
          caption?: string | null
          channel_kind?: Database["public"]["Enums"]["mkt_channel_kind"]
          content_id?: string
          created_at?: string
          cta?: string | null
          hashtags?: string[] | null
          headline?: string | null
          id?: string
          meta?: Json
          seo_description?: string | null
          seo_title?: string | null
          updated_at?: string
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mkt_content_variants_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "mkt_content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_learnings: {
        Row: {
          brand_id: string
          channel_kind: Database["public"]["Enums"]["mkt_channel_kind"]
          id: string
          metric: string
          sample_size: number | null
          score: number | null
          updated_at: string
          value: Json
        }
        Insert: {
          brand_id: string
          channel_kind: Database["public"]["Enums"]["mkt_channel_kind"]
          id?: string
          metric: string
          sample_size?: number | null
          score?: number | null
          updated_at?: string
          value: Json
        }
        Update: {
          brand_id?: string
          channel_kind?: Database["public"]["Enums"]["mkt_channel_kind"]
          id?: string
          metric?: string
          sample_size?: number | null
          score?: number | null
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "mkt_learnings_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "mkt_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_posts: {
        Row: {
          attempts: number
          brand_id: string
          campaign_id: string | null
          channel_id: string | null
          channel_kind: Database["public"]["Enums"]["mkt_channel_kind"]
          content_id: string
          created_at: string
          due_at: string
          external_id: string | null
          external_url: string | null
          id: string
          last_error: string | null
          locked_until: string | null
          max_attempts: number
          meta: Json
          provider_response: Json | null
          published_at: string | null
          status: Database["public"]["Enums"]["mkt_status"]
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          attempts?: number
          brand_id: string
          campaign_id?: string | null
          channel_id?: string | null
          channel_kind: Database["public"]["Enums"]["mkt_channel_kind"]
          content_id: string
          created_at?: string
          due_at?: string
          external_id?: string | null
          external_url?: string | null
          id?: string
          last_error?: string | null
          locked_until?: string | null
          max_attempts?: number
          meta?: Json
          provider_response?: Json | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["mkt_status"]
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          attempts?: number
          brand_id?: string
          campaign_id?: string | null
          channel_id?: string | null
          channel_kind?: Database["public"]["Enums"]["mkt_channel_kind"]
          content_id?: string
          created_at?: string
          due_at?: string
          external_id?: string | null
          external_url?: string | null
          id?: string
          last_error?: string | null
          locked_until?: string | null
          max_attempts?: number
          meta?: Json
          provider_response?: Json | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["mkt_status"]
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mkt_posts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "mkt_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mkt_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "mkt_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_posts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "mkt_content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_posts_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "mkt_content_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_schedules: {
        Row: {
          active: boolean
          brand_id: string
          campaign_id: string | null
          channels: Database["public"]["Enums"]["mkt_channel_kind"][]
          content_id: string | null
          created_at: string
          cron: string | null
          id: string
          last_run_at: string | null
          meta: Json
          mode: string
          next_run_at: string | null
          run_at: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          brand_id: string
          campaign_id?: string | null
          channels?: Database["public"]["Enums"]["mkt_channel_kind"][]
          content_id?: string | null
          created_at?: string
          cron?: string | null
          id?: string
          last_run_at?: string | null
          meta?: Json
          mode: string
          next_run_at?: string | null
          run_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          brand_id?: string
          campaign_id?: string | null
          channels?: Database["public"]["Enums"]["mkt_channel_kind"][]
          content_id?: string | null
          created_at?: string
          cron?: string | null
          id?: string
          last_run_at?: string | null
          meta?: Json
          mode?: string
          next_run_at?: string | null
          run_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_schedules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "mkt_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_schedules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mkt_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_schedules_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "mkt_content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      module_completions: {
        Row: {
          completed_at: string
          course_id: string
          created_at: string
          enrollment_id: string
          id: string
          module_id: string
          student_user_id: string
        }
        Insert: {
          completed_at?: string
          course_id: string
          created_at?: string
          enrollment_id: string
          id?: string
          module_id: string
          student_user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          module_id?: string
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_completions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_completions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_completions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_agreement_acceptances: {
        Row: {
          accepted_at: string
          agreement_id: string
          id: string
          ip_address: string | null
          partner_id: string
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          agreement_id: string
          id?: string
          ip_address?: string | null
          partner_id: string
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          agreement_id?: string
          id?: string
          ip_address?: string | null
          partner_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_agreement_acceptances_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "partner_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_agreement_acceptances_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_agreements: {
        Row: {
          body_markdown: string
          created_at: string
          effective_from: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["partner_agreement_kind"]
          title: string
          version: string
        }
        Insert: {
          body_markdown: string
          created_at?: string
          effective_from?: string
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["partner_agreement_kind"]
          title: string
          version: string
        }
        Update: {
          body_markdown?: string
          created_at?: string
          effective_from?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["partner_agreement_kind"]
          title?: string
          version?: string
        }
        Relationships: []
      }
      partner_application_status_history: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          to_status: string
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status: string
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_applications: {
        Row: {
          admin_notes: string | null
          assigned_manager_id: string | null
          city: string | null
          country: string | null
          created_at: string
          current_income_range: string | null
          current_monthly_target: string | null
          current_role_title: string | null
          email: string
          estimated_lead_count: string | null
          full_name: string
          has_own_leads: string | null
          hours_per_day: string | null
          id: string
          industry: string | null
          lead_sources: string[] | null
          mobile: string
          preferred_categories: string[] | null
          preferred_days: string[] | null
          preferred_model: Database["public"]["Enums"]["lead_model"] | null
          previous_experience: string | null
          referred_by_code: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          state: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string | null
          working_preference: Database["public"]["Enums"]["working_pref"] | null
          years_experience: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_manager_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_income_range?: string | null
          current_monthly_target?: string | null
          current_role_title?: string | null
          email: string
          estimated_lead_count?: string | null
          full_name: string
          has_own_leads?: string | null
          hours_per_day?: string | null
          id?: string
          industry?: string | null
          lead_sources?: string[] | null
          mobile: string
          preferred_categories?: string[] | null
          preferred_days?: string[] | null
          preferred_model?: Database["public"]["Enums"]["lead_model"] | null
          previous_experience?: string | null
          referred_by_code?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string | null
          working_preference?:
            | Database["public"]["Enums"]["working_pref"]
            | null
          years_experience?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_manager_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_income_range?: string | null
          current_monthly_target?: string | null
          current_role_title?: string | null
          email?: string
          estimated_lead_count?: string | null
          full_name?: string
          has_own_leads?: string | null
          hours_per_day?: string | null
          id?: string
          industry?: string | null
          lead_sources?: string[] | null
          mobile?: string
          preferred_categories?: string[] | null
          preferred_days?: string[] | null
          preferred_model?: Database["public"]["Enums"]["lead_model"] | null
          previous_experience?: string | null
          referred_by_code?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string | null
          working_preference?:
            | Database["public"]["Enums"]["working_pref"]
            | null
          years_experience?: string | null
        }
        Relationships: []
      }
      partner_brand_profiles: {
        Row: {
          admin_message: string | null
          authorized_contact_email: string | null
          authorized_contact_name: string | null
          brand_description: string | null
          brand_name: string
          brand_type: Database["public"]["Enums"]["partner_brand_type"]
          business_email: string | null
          business_phone: string | null
          company_name: string | null
          created_at: string
          id: string
          logo_bucket: string | null
          logo_mime: string | null
          logo_path: string | null
          notes: string | null
          partner_id: string
          rejection_reason: string | null
          relationship_to_brand: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selling_model: Database["public"]["Enums"]["partner_selling_model"]
          social_link: string | null
          status: Database["public"]["Enums"]["partner_brand_status"]
          submitted_at: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          admin_message?: string | null
          authorized_contact_email?: string | null
          authorized_contact_name?: string | null
          brand_description?: string | null
          brand_name: string
          brand_type: Database["public"]["Enums"]["partner_brand_type"]
          business_email?: string | null
          business_phone?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          logo_bucket?: string | null
          logo_mime?: string | null
          logo_path?: string | null
          notes?: string | null
          partner_id: string
          rejection_reason?: string | null
          relationship_to_brand?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selling_model: Database["public"]["Enums"]["partner_selling_model"]
          social_link?: string | null
          status?: Database["public"]["Enums"]["partner_brand_status"]
          submitted_at?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          admin_message?: string | null
          authorized_contact_email?: string | null
          authorized_contact_name?: string | null
          brand_description?: string | null
          brand_name?: string
          brand_type?: Database["public"]["Enums"]["partner_brand_type"]
          business_email?: string | null
          business_phone?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          logo_bucket?: string | null
          logo_mime?: string | null
          logo_path?: string | null
          notes?: string | null
          partner_id?: string
          rejection_reason?: string | null
          relationship_to_brand?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selling_model?: Database["public"]["Enums"]["partner_selling_model"]
          social_link?: string | null
          status?: Database["public"]["Enums"]["partner_brand_status"]
          submitted_at?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_brand_profiles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_brand_review_actions: {
        Row: {
          action: string
          actor_role: string
          actor_user_id: string | null
          created_at: string
          from_status:
            | Database["public"]["Enums"]["partner_brand_status"]
            | null
          id: string
          message: string | null
          profile_id: string
          to_status: Database["public"]["Enums"]["partner_brand_status"] | null
        }
        Insert: {
          action: string
          actor_role: string
          actor_user_id?: string | null
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["partner_brand_status"]
            | null
          id?: string
          message?: string | null
          profile_id: string
          to_status?: Database["public"]["Enums"]["partner_brand_status"] | null
        }
        Update: {
          action?: string
          actor_role?: string
          actor_user_id?: string | null
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["partner_brand_status"]
            | null
          id?: string
          message?: string | null
          profile_id?: string
          to_status?: Database["public"]["Enums"]["partner_brand_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_brand_review_actions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_follow_ups: {
        Row: {
          completed_at: string | null
          created_at: string
          due_at: string
          id: string
          lead_id: string
          next_follow_up_id: string | null
          notes: string | null
          partner_id: string
          reminder_sent: boolean
          result: string | null
          status: Database["public"]["Enums"]["follow_up_status"]
          type: Database["public"]["Enums"]["follow_up_type"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_at: string
          id?: string
          lead_id: string
          next_follow_up_id?: string | null
          notes?: string | null
          partner_id: string
          reminder_sent?: boolean
          result?: string | null
          status?: Database["public"]["Enums"]["follow_up_status"]
          type?: Database["public"]["Enums"]["follow_up_type"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_at?: string
          id?: string
          lead_id?: string
          next_follow_up_id?: string | null
          notes?: string | null
          partner_id?: string
          reminder_sent?: boolean
          result?: string | null
          status?: Database["public"]["Enums"]["follow_up_status"]
          type?: Database["public"]["Enums"]["follow_up_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "partner_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_follow_ups_next_follow_up_id_fkey"
            columns: ["next_follow_up_id"]
            isOneToOne: false
            referencedRelation: "partner_follow_ups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_follow_ups_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_full_time_applications: {
        Row: {
          admin_notes: string | null
          applicant_notes: string | null
          applied_at: string
          created_at: string
          id: string
          partner_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          applicant_notes?: string | null
          applied_at?: string
          created_at?: string
          id?: string
          partner_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          applicant_notes?: string | null
          applied_at?: string
          created_at?: string
          id?: string
          partner_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_full_time_applications_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_lead_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["partner_activity_type"]
          content: string | null
          created_at: string
          id: string
          lead_id: string
          metadata: Json | null
          partner_id: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["partner_activity_type"]
          content?: string | null
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json | null
          partner_id?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["partner_activity_type"]
          content?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          partner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "partner_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_lead_activities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_lead_attribution_reviews: {
        Row: {
          admin_notes: string | null
          claiming_partner_id: string
          created_at: string
          existing_lead_id: string | null
          id: string
          lead_id: string
          reason: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["partner_lead_attribution_status"]
        }
        Insert: {
          admin_notes?: string | null
          claiming_partner_id: string
          created_at?: string
          existing_lead_id?: string | null
          id?: string
          lead_id: string
          reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["partner_lead_attribution_status"]
        }
        Update: {
          admin_notes?: string | null
          claiming_partner_id?: string
          created_at?: string
          existing_lead_id?: string | null
          id?: string
          lead_id?: string
          reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["partner_lead_attribution_status"]
        }
        Relationships: [
          {
            foreignKeyName: "partner_lead_attribution_reviews_claiming_partner_id_fkey"
            columns: ["claiming_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_lead_attribution_reviews_existing_lead_id_fkey"
            columns: ["existing_lead_id"]
            isOneToOne: false
            referencedRelation: "partner_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_lead_attribution_reviews_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "partner_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_lead_payment_links: {
        Row: {
          amount: number
          assigned_at: string
          course_id: string
          created_at: string
          id: string
          lead_id: string
          partner_id: string
          payment_link_id: string
          plan: Database["public"]["Enums"]["payment_plan"]
          selling_brand_profile_id: string | null
          status: Database["public"]["Enums"]["payment_link_status"]
          updated_at: string
          url: string
        }
        Insert: {
          amount: number
          assigned_at?: string
          course_id: string
          created_at?: string
          id?: string
          lead_id: string
          partner_id: string
          payment_link_id: string
          plan: Database["public"]["Enums"]["payment_plan"]
          selling_brand_profile_id?: string | null
          status?: Database["public"]["Enums"]["payment_link_status"]
          updated_at?: string
          url: string
        }
        Update: {
          amount?: number
          assigned_at?: string
          course_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          partner_id?: string
          payment_link_id?: string
          plan?: Database["public"]["Enums"]["payment_plan"]
          selling_brand_profile_id?: string | null
          status?: Database["public"]["Enums"]["payment_link_status"]
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_lead_payment_links_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_lead_payment_links_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "partner_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_lead_payment_links_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_lead_payment_links_payment_link_id_fkey"
            columns: ["payment_link_id"]
            isOneToOne: false
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_lead_payment_links_selling_brand_profile_id_fkey"
            columns: ["selling_brand_profile_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_leads: {
        Row: {
          assigned_at: string | null
          assigned_by_user_id: string | null
          assigned_partner_id: string | null
          assignment_method: string | null
          attribution_status: Database["public"]["Enums"]["partner_lead_attribution_status"]
          campaign_source: string | null
          city: string | null
          course_id: string | null
          created_at: string
          email: string | null
          email_normalized: string | null
          full_name: string
          id: string
          last_activity_at: string | null
          lead_model: Database["public"]["Enums"]["lead_model"]
          lead_ownership_type: Database["public"]["Enums"]["lead_ownership_type"]
          mobile: string
          mobile_normalized: string | null
          next_follow_up_at: string | null
          notes: string | null
          owner_partner_id: string | null
          preferred_contact_time: string | null
          priority: string | null
          program_interest: string | null
          selling_brand_profile_id: string | null
          source: Database["public"]["Enums"]["partner_lead_source"]
          state: string | null
          status: Database["public"]["Enums"]["partner_lead_status"]
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by_user_id?: string | null
          assigned_partner_id?: string | null
          assignment_method?: string | null
          attribution_status?: Database["public"]["Enums"]["partner_lead_attribution_status"]
          campaign_source?: string | null
          city?: string | null
          course_id?: string | null
          created_at?: string
          email?: string | null
          email_normalized?: string | null
          full_name: string
          id?: string
          last_activity_at?: string | null
          lead_model?: Database["public"]["Enums"]["lead_model"]
          lead_ownership_type?: Database["public"]["Enums"]["lead_ownership_type"]
          mobile: string
          mobile_normalized?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          owner_partner_id?: string | null
          preferred_contact_time?: string | null
          priority?: string | null
          program_interest?: string | null
          selling_brand_profile_id?: string | null
          source?: Database["public"]["Enums"]["partner_lead_source"]
          state?: string | null
          status?: Database["public"]["Enums"]["partner_lead_status"]
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by_user_id?: string | null
          assigned_partner_id?: string | null
          assignment_method?: string | null
          attribution_status?: Database["public"]["Enums"]["partner_lead_attribution_status"]
          campaign_source?: string | null
          city?: string | null
          course_id?: string | null
          created_at?: string
          email?: string | null
          email_normalized?: string | null
          full_name?: string
          id?: string
          last_activity_at?: string | null
          lead_model?: Database["public"]["Enums"]["lead_model"]
          lead_ownership_type?: Database["public"]["Enums"]["lead_ownership_type"]
          mobile?: string
          mobile_normalized?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          owner_partner_id?: string | null
          preferred_contact_time?: string | null
          priority?: string | null
          program_interest?: string | null
          selling_brand_profile_id?: string | null
          source?: Database["public"]["Enums"]["partner_lead_source"]
          state?: string | null
          status?: Database["public"]["Enums"]["partner_lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_leads_assigned_partner_id_fkey"
            columns: ["assigned_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_leads_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_leads_owner_partner_id_fkey"
            columns: ["owner_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_leads_selling_brand_profile_id_fkey"
            columns: ["selling_brand_profile_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_model_approval_history: {
        Row: {
          approved_model: string | null
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          partner_id: string
          reason: string | null
          selected_model: string | null
          to_status: string
        }
        Insert: {
          approved_model?: string | null
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          partner_id: string
          reason?: string | null
          selected_model?: string | null
          to_status: string
        }
        Update: {
          approved_model?: string | null
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          partner_id?: string
          reason?: string | null
          selected_model?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_model_approval_history_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link_url: string | null
          partner_id: string
          title: string
          type: Database["public"]["Enums"]["partner_notification_type"]
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          partner_id: string
          title: string
          type: Database["public"]["Enums"]["partner_notification_type"]
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          partner_id?: string
          title?: string
          type?: Database["public"]["Enums"]["partner_notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "partner_notifications_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payment_actions: {
        Row: {
          action: string
          actor_role: string
          actor_user_id: string | null
          created_at: string
          from_status:
            | Database["public"]["Enums"]["payment_submission_status"]
            | null
          id: string
          message: string | null
          metadata: Json
          submission_id: string
          to_status: Database["public"]["Enums"]["payment_submission_status"]
        }
        Insert: {
          action: string
          actor_role: string
          actor_user_id?: string | null
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["payment_submission_status"]
            | null
          id?: string
          message?: string | null
          metadata?: Json
          submission_id: string
          to_status: Database["public"]["Enums"]["payment_submission_status"]
        }
        Update: {
          action?: string
          actor_role?: string
          actor_user_id?: string | null
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["payment_submission_status"]
            | null
          id?: string
          message?: string | null
          metadata?: Json
          submission_id?: string
          to_status?: Database["public"]["Enums"]["payment_submission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "partner_payment_actions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "partner_payment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payment_submissions: {
        Row: {
          admin_notes: string | null
          amount: number
          course_id: string
          created_at: string
          id: string
          is_duplicate_flag: boolean
          lead_id: string
          lead_payment_link_id: string | null
          partner_id: string
          partner_notes: string | null
          payment_date: string
          payment_link_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          plan: Database["public"]["Enums"]["payment_plan"]
          proof_bucket: string
          proof_hash: string | null
          proof_mime: string | null
          proof_path: string
          proof_size_bytes: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          selling_brand_profile_id: string | null
          status: Database["public"]["Enums"]["payment_submission_status"]
          submitted_at: string
          updated_at: string
          utr_normalized: string | null
          utr_reference: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          course_id: string
          created_at?: string
          id?: string
          is_duplicate_flag?: boolean
          lead_id: string
          lead_payment_link_id?: string | null
          partner_id: string
          partner_notes?: string | null
          payment_date: string
          payment_link_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          plan: Database["public"]["Enums"]["payment_plan"]
          proof_bucket?: string
          proof_hash?: string | null
          proof_mime?: string | null
          proof_path: string
          proof_size_bytes?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selling_brand_profile_id?: string | null
          status?: Database["public"]["Enums"]["payment_submission_status"]
          submitted_at?: string
          updated_at?: string
          utr_normalized?: string | null
          utr_reference: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          course_id?: string
          created_at?: string
          id?: string
          is_duplicate_flag?: boolean
          lead_id?: string
          lead_payment_link_id?: string | null
          partner_id?: string
          partner_notes?: string | null
          payment_date?: string
          payment_link_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          plan?: Database["public"]["Enums"]["payment_plan"]
          proof_bucket?: string
          proof_hash?: string | null
          proof_mime?: string | null
          proof_path?: string
          proof_size_bytes?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selling_brand_profile_id?: string | null
          status?: Database["public"]["Enums"]["payment_submission_status"]
          submitted_at?: string
          updated_at?: string
          utr_normalized?: string | null
          utr_reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_payment_submissions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payment_submissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "partner_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payment_submissions_lead_payment_link_id_fkey"
            columns: ["lead_payment_link_id"]
            isOneToOne: false
            referencedRelation: "partner_lead_payment_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payment_submissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payment_submissions_payment_link_id_fkey"
            columns: ["payment_link_id"]
            isOneToOne: false
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payment_submissions_selling_brand_profile_id_fkey"
            columns: ["selling_brand_profile_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payout_details: {
        Row: {
          account_holder_name: string | null
          account_last4: string | null
          account_type: string | null
          bank_account_number: string | null
          bank_details_completed: boolean
          bank_name: string | null
          gstin: string | null
          ifsc_code: string | null
          legal_name: string | null
          pan: string | null
          pan_details_completed: boolean
          pan_masked: string | null
          partner_id: string
          tax_status: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_last4?: string | null
          account_type?: string | null
          bank_account_number?: string | null
          bank_details_completed?: boolean
          bank_name?: string | null
          gstin?: string | null
          ifsc_code?: string | null
          legal_name?: string | null
          pan?: string | null
          pan_details_completed?: boolean
          pan_masked?: string | null
          partner_id: string
          tax_status?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_last4?: string | null
          account_type?: string | null
          bank_account_number?: string | null
          bank_details_completed?: boolean
          bank_name?: string | null
          gstin?: string | null
          ifsc_code?: string | null
          legal_name?: string | null
          pan?: string | null
          pan_details_completed?: boolean
          pan_masked?: string | null
          partner_id?: string
          tax_status?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_payout_details_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_program_eligibility: {
        Row: {
          assigned_by: string | null
          course_id: string
          created_at: string
          id: string
          internal_notes: string | null
          partner_id: string
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          course_id: string
          created_at?: string
          id?: string
          internal_notes?: string | null
          partner_id: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          course_id?: string
          created_at?: string
          id?: string
          internal_notes?: string | null
          partner_id?: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_program_eligibility_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_program_eligibility_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_program_interests: {
        Row: {
          category_id: string | null
          course_id: string | null
          created_at: string
          id: string
          partner_id: string
        }
        Insert: {
          category_id?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          partner_id: string
        }
        Update: {
          category_id?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_program_interests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "course_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_program_interests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_program_interests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_program_links: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_active: boolean
          label: string | null
          partner_id: string
          ref_code: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          partner_id: string
          ref_code: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          partner_id?: string
          ref_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_program_links_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_program_links_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_referral_events: {
        Row: {
          course_id: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["referral_event"]
          id: string
          metadata: Json | null
          partner_ref: string | null
          session_id: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["referral_event"]
          id?: string
          metadata?: Json | null
          partner_ref?: string | null
          session_id?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["referral_event"]
          id?: string
          metadata?: Json | null
          partner_ref?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_referral_events_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_referrals: {
        Row: {
          admin_note: string | null
          bonus_amount: number | null
          bonus_approved_at: string | null
          bonus_approved_by: string | null
          bonus_paid_at: string | null
          bonus_paid_by: string | null
          created_at: string
          id: string
          payout_reference: string | null
          qualification_deadline: string | null
          qualified_at: string | null
          referral_code: string
          referred_application_id: string | null
          referred_partner_id: string | null
          referrer_partner_id: string
          rejection_reason: string | null
          signed_up_at: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          bonus_amount?: number | null
          bonus_approved_at?: string | null
          bonus_approved_by?: string | null
          bonus_paid_at?: string | null
          bonus_paid_by?: string | null
          created_at?: string
          id?: string
          payout_reference?: string | null
          qualification_deadline?: string | null
          qualified_at?: string | null
          referral_code: string
          referred_application_id?: string | null
          referred_partner_id?: string | null
          referrer_partner_id: string
          rejection_reason?: string | null
          signed_up_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          bonus_amount?: number | null
          bonus_approved_at?: string | null
          bonus_approved_by?: string | null
          bonus_paid_at?: string | null
          bonus_paid_by?: string | null
          created_at?: string
          id?: string
          payout_reference?: string | null
          qualification_deadline?: string | null
          qualified_at?: string | null
          referral_code?: string
          referred_application_id?: string | null
          referred_partner_id?: string | null
          referrer_partner_id?: string
          rejection_reason?: string | null
          signed_up_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_referrals_referred_application_id_fkey"
            columns: ["referred_application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_referrals_referred_partner_id_fkey"
            columns: ["referred_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_referrals_referrer_partner_id_fkey"
            columns: ["referrer_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_sales_enablement: {
        Row: {
          course_id: string
          created_at: string
          email_body: string | null
          email_subject: string | null
          icp: string | null
          id: string
          key_benefits: Json | null
          objection_handling: Json | null
          pain_points: string | null
          sales_angle: string | null
          short_pitch: string | null
          talking_points: Json | null
          updated_at: string
          updated_by: string | null
          value_proposition: string | null
          whatsapp_pitch: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          email_body?: string | null
          email_subject?: string | null
          icp?: string | null
          id?: string
          key_benefits?: Json | null
          objection_handling?: Json | null
          pain_points?: string | null
          sales_angle?: string | null
          short_pitch?: string | null
          talking_points?: Json | null
          updated_at?: string
          updated_by?: string | null
          value_proposition?: string | null
          whatsapp_pitch?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          email_body?: string | null
          email_subject?: string | null
          icp?: string | null
          id?: string
          key_benefits?: Json | null
          objection_handling?: Json | null
          pain_points?: string | null
          sales_angle?: string | null
          short_pitch?: string | null
          talking_points?: Json | null
          updated_at?: string
          updated_by?: string | null
          value_proposition?: string | null
          whatsapp_pitch?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_sales_enablement_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_statements: {
        Row: {
          adjustments: number
          approved_revenue_share: number
          attributed_revenue: number
          closing_balance: number
          generated_at: string
          id: string
          partner_id: string
          payouts: number
          period_month: string
          reversals: number
        }
        Insert: {
          adjustments?: number
          approved_revenue_share?: number
          attributed_revenue?: number
          closing_balance?: number
          generated_at?: string
          id?: string
          partner_id: string
          payouts?: number
          period_month: string
          reversals?: number
        }
        Update: {
          adjustments?: number
          approved_revenue_share?: number
          attributed_revenue?: number
          closing_balance?: number
          generated_at?: string
          id?: string
          partner_id?: string
          payouts?: number
          period_month?: string
          reversals?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_statements_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_support_activity: {
        Row: {
          action: string
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          detail: string | null
          id: string
          ticket_id: string
        }
        Insert: {
          action: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          ticket_id: string
        }
        Update: {
          action?: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_support_activity_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "partner_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_support_assignments: {
        Row: {
          assigned_admin_id: string
          assigned_at: string
          assigned_by: string
          id: string
          ticket_id: string
          unassigned_at: string | null
        }
        Insert: {
          assigned_admin_id: string
          assigned_at?: string
          assigned_by: string
          id?: string
          ticket_id: string
          unassigned_at?: string | null
        }
        Update: {
          assigned_admin_id?: string
          assigned_at?: string
          assigned_by?: string
          id?: string
          ticket_id?: string
          unassigned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_support_assignments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "partner_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_support_messages: {
        Row: {
          attachment_url: string | null
          author_user_id: string | null
          body: string
          created_at: string
          id: string
          is_admin: boolean
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          attachment_url?: string | null
          author_user_id?: string | null
          body: string
          created_at?: string
          id?: string
          is_admin?: boolean
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          attachment_url?: string | null
          author_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "partner_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_support_tickets: {
        Row: {
          assigned_admin_id: string | null
          assigned_at: string | null
          attachment_url: string | null
          category: Database["public"]["Enums"]["support_ticket_category"]
          closed_at: string | null
          created_at: string
          description: string
          id: string
          last_activity_at: string
          partner_id: string
          priority: string | null
          related_brand_profile_id: string | null
          related_commission_id: string | null
          related_lead_id: string | null
          related_payment_link_id: string | null
          related_payment_submission_id: string | null
          related_payout_id: string | null
          related_program_id: string | null
          related_referral_id: string | null
          resolution_note: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          ticket_code: string | null
          updated_at: string
        }
        Insert: {
          assigned_admin_id?: string | null
          assigned_at?: string | null
          attachment_url?: string | null
          category: Database["public"]["Enums"]["support_ticket_category"]
          closed_at?: string | null
          created_at?: string
          description: string
          id?: string
          last_activity_at?: string
          partner_id: string
          priority?: string | null
          related_brand_profile_id?: string | null
          related_commission_id?: string | null
          related_lead_id?: string | null
          related_payment_link_id?: string | null
          related_payment_submission_id?: string | null
          related_payout_id?: string | null
          related_program_id?: string | null
          related_referral_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          ticket_code?: string | null
          updated_at?: string
        }
        Update: {
          assigned_admin_id?: string | null
          assigned_at?: string | null
          attachment_url?: string | null
          category?: Database["public"]["Enums"]["support_ticket_category"]
          closed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          last_activity_at?: string
          partner_id?: string
          priority?: string | null
          related_brand_profile_id?: string | null
          related_commission_id?: string | null
          related_lead_id?: string | null
          related_payment_link_id?: string | null
          related_payment_submission_id?: string | null
          related_payout_id?: string | null
          related_program_id?: string | null
          related_referral_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject?: string
          ticket_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_support_tickets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_support_tickets_related_brand_profile_id_fkey"
            columns: ["related_brand_profile_id"]
            isOneToOne: false
            referencedRelation: "partner_brand_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_support_tickets_related_commission_id_fkey"
            columns: ["related_commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_support_tickets_related_lead_id_fkey"
            columns: ["related_lead_id"]
            isOneToOne: false
            referencedRelation: "partner_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_support_tickets_related_payment_link_id_fkey"
            columns: ["related_payment_link_id"]
            isOneToOne: false
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_support_tickets_related_payment_submission_id_fkey"
            columns: ["related_payment_submission_id"]
            isOneToOne: false
            referencedRelation: "partner_payment_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_support_tickets_related_payout_id_fkey"
            columns: ["related_payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_support_tickets_related_program_id_fkey"
            columns: ["related_program_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_support_tickets_related_referral_id_fkey"
            columns: ["related_referral_id"]
            isOneToOne: false
            referencedRelation: "partner_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          account_status: string
          agreement_status: string
          application_id: string | null
          approved_sales_model: string | null
          bank_account_last4: string | null
          bank_name: string | null
          brand_selling_model:
            | Database["public"]["Enums"]["partner_selling_model"]
            | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          default_revenue_share: number
          display_name: string
          dual_model_enabled: boolean
          email: string
          first_name: string | null
          id: string
          income_situation: string | null
          kyc_completed: boolean
          lead_model: Database["public"]["Enums"]["lead_model"]
          lead_reach_range: string | null
          lead_sources: string[]
          manager_id: string | null
          mobile: string | null
          monthly_sales_target: string | null
          onboarding_completed_at: string | null
          onboarding_current_step: number
          onboarding_draft: Json
          onboarding_last_saved_at: string | null
          onboarding_status: string
          partner_code: string | null
          payout_details_verified: boolean
          payout_min_threshold: number
          payout_profile_status: string
          profile_photo_url: string | null
          referral_code: string | null
          role_title: string | null
          role_title_other: string | null
          sales_domains: string[]
          sales_experience: string | null
          sales_model_approval_status: string
          sales_model_approved_at: string | null
          sales_model_approved_by: string | null
          sales_model_selected_at: string | null
          sales_model_selection: string | null
          sold_education_before: boolean | null
          state: string | null
          status: Database["public"]["Enums"]["partner_status"]
          updated_at: string
          user_id: string | null
          work_model: string
          work_model_approved_at: string | null
          work_model_approved_by: string | null
          work_model_selected_at: string | null
          work_model_status: string
        }
        Insert: {
          account_status?: string
          agreement_status?: string
          application_id?: string | null
          approved_sales_model?: string | null
          bank_account_last4?: string | null
          bank_name?: string | null
          brand_selling_model?:
            | Database["public"]["Enums"]["partner_selling_model"]
            | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          default_revenue_share?: number
          display_name: string
          dual_model_enabled?: boolean
          email: string
          first_name?: string | null
          id?: string
          income_situation?: string | null
          kyc_completed?: boolean
          lead_model?: Database["public"]["Enums"]["lead_model"]
          lead_reach_range?: string | null
          lead_sources?: string[]
          manager_id?: string | null
          mobile?: string | null
          monthly_sales_target?: string | null
          onboarding_completed_at?: string | null
          onboarding_current_step?: number
          onboarding_draft?: Json
          onboarding_last_saved_at?: string | null
          onboarding_status?: string
          partner_code?: string | null
          payout_details_verified?: boolean
          payout_min_threshold?: number
          payout_profile_status?: string
          profile_photo_url?: string | null
          referral_code?: string | null
          role_title?: string | null
          role_title_other?: string | null
          sales_domains?: string[]
          sales_experience?: string | null
          sales_model_approval_status?: string
          sales_model_approved_at?: string | null
          sales_model_approved_by?: string | null
          sales_model_selected_at?: string | null
          sales_model_selection?: string | null
          sold_education_before?: boolean | null
          state?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
          user_id?: string | null
          work_model?: string
          work_model_approved_at?: string | null
          work_model_approved_by?: string | null
          work_model_selected_at?: string | null
          work_model_status?: string
        }
        Update: {
          account_status?: string
          agreement_status?: string
          application_id?: string | null
          approved_sales_model?: string | null
          bank_account_last4?: string | null
          bank_name?: string | null
          brand_selling_model?:
            | Database["public"]["Enums"]["partner_selling_model"]
            | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          default_revenue_share?: number
          display_name?: string
          dual_model_enabled?: boolean
          email?: string
          first_name?: string | null
          id?: string
          income_situation?: string | null
          kyc_completed?: boolean
          lead_model?: Database["public"]["Enums"]["lead_model"]
          lead_reach_range?: string | null
          lead_sources?: string[]
          manager_id?: string | null
          mobile?: string | null
          monthly_sales_target?: string | null
          onboarding_completed_at?: string | null
          onboarding_current_step?: number
          onboarding_draft?: Json
          onboarding_last_saved_at?: string | null
          onboarding_status?: string
          partner_code?: string | null
          payout_details_verified?: boolean
          payout_min_threshold?: number
          payout_profile_status?: string
          profile_photo_url?: string | null
          referral_code?: string | null
          role_title?: string | null
          role_title_other?: string | null
          sales_domains?: string[]
          sales_experience?: string | null
          sales_model_approval_status?: string
          sales_model_approved_at?: string | null
          sales_model_approved_by?: string | null
          sales_model_selected_at?: string | null
          sales_model_selection?: string | null
          sold_education_before?: boolean | null
          state?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
          user_id?: string | null
          work_model?: string
          work_model_approved_at?: string | null
          work_model_approved_by?: string | null
          work_model_selected_at?: string | null
          work_model_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_links: {
        Row: {
          amount: number
          code: string
          course_id: string
          created_at: string
          created_by: string | null
          disabled_at: string | null
          disabled_by: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          plan: Database["public"]["Enums"]["payment_plan"]
          status: string
          updated_at: string
          url: string
        }
        Insert: {
          amount: number
          code: string
          course_id: string
          created_at?: string
          created_by?: string | null
          disabled_at?: string | null
          disabled_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          plan: Database["public"]["Enums"]["payment_plan"]
          status?: string
          updated_at?: string
          url: string
        }
        Update: {
          amount?: number
          code?: string
          course_id?: string
          created_at?: string
          created_by?: string | null
          disabled_at?: string | null
          disabled_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          plan?: Database["public"]["Enums"]["payment_plan"]
          status?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_items: {
        Row: {
          amount: number
          commission_id: string
          created_at: string
          id: string
          payout_id: string
        }
        Insert: {
          amount: number
          commission_id: string
          created_at?: string
          id?: string
          payout_id: string
        }
        Update: {
          amount?: number
          commission_id?: string
          created_at?: string
          id?: string
          payout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_items_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          admin_notes: string | null
          amount: number
          approved_amount: number | null
          created_at: string
          hold_reason: string | null
          id: string
          partner_id: string
          payment_reference: string | null
          payout_method: string | null
          processed_at: string | null
          processed_by: string | null
          reference: string | null
          rejection_reason: string | null
          requested_amount: number | null
          requested_at: string | null
          requested_by: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          approved_amount?: number | null
          created_at?: string
          hold_reason?: string | null
          id?: string
          partner_id: string
          payment_reference?: string | null
          payout_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reference?: string | null
          rejection_reason?: string | null
          requested_amount?: number | null
          requested_at?: string | null
          requested_by?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          approved_amount?: number | null
          created_at?: string
          hold_reason?: string | null
          id?: string
          partner_id?: string
          payment_reference?: string | null
          payout_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reference?: string | null
          rejection_reason?: string | null
          requested_amount?: number | null
          requested_at?: string | null
          requested_by?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          absent_days: number
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          basic: number
          created_at: string
          currency: string
          employee_id: string
          employee_pf: number
          employer_pf: number
          gross_earnings: number
          half_days: number
          holiday_days: number
          hra: number
          id: string
          late_days: number
          leave_days: number
          net_pay: number
          other_deductions: number
          other_earnings: number
          paid_at: string | null
          payable_days: number
          payment_date: string | null
          payment_reference: string | null
          payroll_month: number
          payroll_year: number
          performance_incentive: number
          present_days: number
          professional_tax: number
          slip_generated_at: string | null
          special_allowance: number
          status: string
          tds: number
          total_deductions: number
          updated_at: string
          weekly_off_days: number
        }
        Insert: {
          absent_days?: number
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          basic?: number
          created_at?: string
          currency?: string
          employee_id: string
          employee_pf?: number
          employer_pf?: number
          gross_earnings?: number
          half_days?: number
          holiday_days?: number
          hra?: number
          id?: string
          late_days?: number
          leave_days?: number
          net_pay?: number
          other_deductions?: number
          other_earnings?: number
          paid_at?: string | null
          payable_days?: number
          payment_date?: string | null
          payment_reference?: string | null
          payroll_month: number
          payroll_year: number
          performance_incentive?: number
          present_days?: number
          professional_tax?: number
          slip_generated_at?: string | null
          special_allowance?: number
          status?: string
          tds?: number
          total_deductions?: number
          updated_at?: string
          weekly_off_days?: number
        }
        Update: {
          absent_days?: number
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          basic?: number
          created_at?: string
          currency?: string
          employee_id?: string
          employee_pf?: number
          employer_pf?: number
          gross_earnings?: number
          half_days?: number
          holiday_days?: number
          hra?: number
          id?: string
          late_days?: number
          leave_days?: number
          net_pay?: number
          other_deductions?: number
          other_earnings?: number
          paid_at?: string | null
          payable_days?: number
          payment_date?: string | null
          payment_reference?: string | null
          payroll_month?: number
          payroll_year?: number
          performance_incentive?: number
          present_days?: number
          professional_tax?: number
          slip_generated_at?: string | null
          special_allowance?: number
          status?: string
          tds?: number
          total_deductions?: number
          updated_at?: string
          weekly_off_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_registry: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          permission: string
          role: string
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          permission: string
          role: string
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          permission?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      pf_preferences: {
        Row: {
          admin_notes: string | null
          created_at: string
          employee_id: string
          id: string
          preference: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          employee_id: string
          id?: string
          preference: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          preference?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pf_preferences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_lead_events: {
        Row: {
          created_at: string
          duration_seconds: number | null
          event_type: string
          id: string
          lead_id: string | null
          metadata: Json
          page_path: string | null
          session_id: string | null
          source: string | null
          variant: string | null
          weight: number
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          event_type: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          page_path?: string | null
          session_id?: string | null
          source?: string | null
          variant?: string | null
          weight?: number
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          event_type?: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          page_path?: string | null
          session_id?: string | null
          source?: string | null
          variant?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "platform_lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_leads: {
        Row: {
          ai_next_action: string | null
          ai_summary: string | null
          assigned_to: string | null
          budget_range: string | null
          buying_intent: string | null
          campaign: string | null
          career_interest: string | null
          city: string | null
          country: string | null
          created_at: string
          current_status: string | null
          device: string | null
          email: string | null
          event_count: number
          first_seen_at: string | null
          id: string
          interested_course: string | null
          ip_hash: string | null
          last_activity_at: string | null
          metadata: Json
          name: string | null
          notes: string | null
          page_path: string | null
          phone: string | null
          predicted_course: string | null
          predicted_enrollment_date: string | null
          predicted_revenue: number | null
          preferred_timing: string | null
          probability: number
          qualification: string | null
          referrer: string | null
          region: string | null
          score: number
          score_category: string
          score_updated_at: string | null
          skill_level: string | null
          source: string
          source_detail: string | null
          status: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visit_count: number
        }
        Insert: {
          ai_next_action?: string | null
          ai_summary?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          buying_intent?: string | null
          campaign?: string | null
          career_interest?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_status?: string | null
          device?: string | null
          email?: string | null
          event_count?: number
          first_seen_at?: string | null
          id?: string
          interested_course?: string | null
          ip_hash?: string | null
          last_activity_at?: string | null
          metadata?: Json
          name?: string | null
          notes?: string | null
          page_path?: string | null
          phone?: string | null
          predicted_course?: string | null
          predicted_enrollment_date?: string | null
          predicted_revenue?: number | null
          preferred_timing?: string | null
          probability?: number
          qualification?: string | null
          referrer?: string | null
          region?: string | null
          score?: number
          score_category?: string
          score_updated_at?: string | null
          skill_level?: string | null
          source?: string
          source_detail?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visit_count?: number
        }
        Update: {
          ai_next_action?: string | null
          ai_summary?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          buying_intent?: string | null
          campaign?: string | null
          career_interest?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_status?: string | null
          device?: string | null
          email?: string | null
          event_count?: number
          first_seen_at?: string | null
          id?: string
          interested_course?: string | null
          ip_hash?: string | null
          last_activity_at?: string | null
          metadata?: Json
          name?: string | null
          notes?: string | null
          page_path?: string | null
          phone?: string | null
          predicted_course?: string | null
          predicted_enrollment_date?: string | null
          predicted_revenue?: number | null
          preferred_timing?: string | null
          probability?: number
          qualification?: string | null
          referrer?: string | null
          region?: string | null
          score?: number
          score_category?: string
          score_updated_at?: string | null
          skill_level?: string | null
          source?: string
          source_detail?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visit_count?: number
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      program_content_completions: {
        Row: {
          completed_at: string
          course_id: string
          created_at: string
          enrollment_id: string
          id: string
          student_user_id: string
        }
        Insert: {
          completed_at?: string
          course_id: string
          created_at?: string
          enrollment_id: string
          id?: string
          student_user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_content_completions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_content_completions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_required: boolean
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_required?: boolean
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_required?: boolean
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "course_project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      pseo_generation_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          id: string
          last_error: string | null
          page_id: string
          priority: number
          scheduled_for: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          page_id: string
          priority?: number
          scheduled_for?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          page_id?: string
          priority?: number
          scheduled_for?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pseo_generation_jobs_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pseo_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pseo_interlinks: {
        Row: {
          anchor: string | null
          created_at: string
          from_page_id: string
          id: string
          relation: string
          to_page_id: string
          weight: number
        }
        Insert: {
          anchor?: string | null
          created_at?: string
          from_page_id: string
          id?: string
          relation: string
          to_page_id: string
          weight?: number
        }
        Update: {
          anchor?: string | null
          created_at?: string
          from_page_id?: string
          id?: string
          relation?: string
          to_page_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "pseo_interlinks_from_page_id_fkey"
            columns: ["from_page_id"]
            isOneToOne: false
            referencedRelation: "pseo_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pseo_interlinks_to_page_id_fkey"
            columns: ["to_page_id"]
            isOneToOne: false
            referencedRelation: "pseo_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pseo_locations: {
        Row: {
          country: string
          created_at: string
          id: string
          is_active: boolean
          kind: string
          name: string
          parent_slug: string | null
          population: number | null
          priority: number
          slug: string
          updated_at: string
        }
        Insert: {
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind: string
          name: string
          parent_slug?: string | null
          population?: number | null
          priority?: number
          slug: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          parent_slug?: string | null
          population?: number | null
          priority?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      pseo_pages: {
        Row: {
          canonical_url: string | null
          content: Json
          course_id: string | null
          created_at: string
          error_message: string | null
          h1: string | null
          id: string
          keywords: string[]
          last_regenerated_at: string | null
          location_id: string | null
          meta_description: string | null
          page_type: string
          published_at: string | null
          quality_score: number | null
          related_slugs: string[]
          slug: string
          status: string
          title: string | null
          updated_at: string
          view_count: number
          word_count: number | null
        }
        Insert: {
          canonical_url?: string | null
          content?: Json
          course_id?: string | null
          created_at?: string
          error_message?: string | null
          h1?: string | null
          id?: string
          keywords?: string[]
          last_regenerated_at?: string | null
          location_id?: string | null
          meta_description?: string | null
          page_type: string
          published_at?: string | null
          quality_score?: number | null
          related_slugs?: string[]
          slug: string
          status?: string
          title?: string | null
          updated_at?: string
          view_count?: number
          word_count?: number | null
        }
        Update: {
          canonical_url?: string | null
          content?: Json
          course_id?: string | null
          created_at?: string
          error_message?: string | null
          h1?: string | null
          id?: string
          keywords?: string[]
          last_regenerated_at?: string | null
          location_id?: string | null
          meta_description?: string | null
          page_type?: string
          published_at?: string | null
          quality_score?: number | null
          related_slugs?: string[]
          slug?: string
          status?: string
          title?: string | null
          updated_at?: string
          view_count?: number
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pseo_pages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pseo_pages_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "pseo_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_buckets: {
        Row: {
          bucket_key: string
          count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          bucket_key: string
          count?: number
          updated_at?: string
          window_start: string
        }
        Update: {
          bucket_key?: string
          count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      referral_program_settings: {
        Row: {
          bonus_amount: number
          id: number
          is_active: boolean
          min_revenue_generated: number
          min_verified_sales: number
          qualification_period_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bonus_amount?: number
          id?: number
          is_active?: boolean
          min_revenue_generated?: number
          min_verified_sales?: number
          qualification_period_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bonus_amount?: number
          id?: number
          is_active?: boolean
          min_revenue_generated?: number
          min_verified_sales?: number
          qualification_period_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      refund_adjustments: {
        Row: {
          adjustment_amount: number
          adjustment_type: Database["public"]["Enums"]["refund_adjustment_type"]
          approval_status: Database["public"]["Enums"]["refund_adjustment_status"]
          approved_at: string | null
          approved_by: string | null
          commission_id: string
          created_at: string
          created_by: string | null
          enrollment_id: string | null
          id: string
          notes: string | null
          original_amount: number | null
          reason: string
        }
        Insert: {
          adjustment_amount: number
          adjustment_type?: Database["public"]["Enums"]["refund_adjustment_type"]
          approval_status?: Database["public"]["Enums"]["refund_adjustment_status"]
          approved_at?: string | null
          approved_by?: string | null
          commission_id: string
          created_at?: string
          created_by?: string | null
          enrollment_id?: string | null
          id?: string
          notes?: string | null
          original_amount?: number | null
          reason: string
        }
        Update: {
          adjustment_amount?: number
          adjustment_type?: Database["public"]["Enums"]["refund_adjustment_type"]
          approval_status?: Database["public"]["Enums"]["refund_adjustment_status"]
          approved_at?: string | null
          approved_by?: string | null
          commission_id?: string
          created_at?: string
          created_by?: string | null
          enrollment_id?: string | null
          id?: string
          notes?: string | null
          original_amount?: number | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_adjustments_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_adjustments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      revenue_share_rules: {
        Row: {
          active: boolean
          campaign: string | null
          category_slug: string | null
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          lead_source: string | null
          name: string
          partner_id: string | null
          partner_type: Database["public"]["Enums"]["lead_model"] | null
          priority: number
          program_id: string | null
          share_percentage: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          campaign?: string | null
          category_slug?: string | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          lead_source?: string | null
          name: string
          partner_id?: string | null
          partner_type?: Database["public"]["Enums"]["lead_model"] | null
          priority?: number
          program_id?: string | null
          share_percentage: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          campaign?: string | null
          category_slug?: string | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          lead_source?: string | null
          name?: string
          partner_id?: string | null
          partner_type?: Database["public"]["Enums"]["lead_model"] | null
          priority?: number
          program_id?: string | null
          share_percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_share_rules_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      review_requests: {
        Row: {
          channel: string | null
          created_at: string
          expires_at: string | null
          id: string
          last_reminder_at: string | null
          metadata: Json | null
          opened_at: string | null
          reminders_sent: number | null
          review_id: string | null
          sent_at: string | null
          status: string
          submitted_at: string | null
          target_id: string | null
          target_label: string | null
          target_slug: string | null
          target_type: string
          token: string
          trigger_event: string
          updated_at: string
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_reminder_at?: string | null
          metadata?: Json | null
          opened_at?: string | null
          reminders_sent?: number | null
          review_id?: string | null
          sent_at?: string | null
          status?: string
          submitted_at?: string | null
          target_id?: string | null
          target_label?: string | null
          target_slug?: string | null
          target_type: string
          token?: string
          trigger_event: string
          updated_at?: string
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_reminder_at?: string | null
          metadata?: Json | null
          opened_at?: string | null
          reminders_sent?: number | null
          review_id?: string | null
          sent_at?: string | null
          status?: string
          submitted_at?: string | null
          target_id?: string | null
          target_label?: string | null
          target_slug?: string | null
          target_type?: string
          token?: string
          trigger_event?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "student_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_flag_activity: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          detail: Json
          flag_id: string
          from_status: Database["public"]["Enums"]["risk_flag_status"] | null
          id: string
          to_status: Database["public"]["Enums"]["risk_flag_status"] | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          detail?: Json
          flag_id: string
          from_status?: Database["public"]["Enums"]["risk_flag_status"] | null
          id?: string
          to_status?: Database["public"]["Enums"]["risk_flag_status"] | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          detail?: Json
          flag_id?: string
          from_status?: Database["public"]["Enums"]["risk_flag_status"] | null
          id?: string
          to_status?: Database["public"]["Enums"]["risk_flag_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_flag_activity_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "risk_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_flag_notes: {
        Row: {
          author_user_id: string | null
          created_at: string
          flag_id: string
          id: string
          note: string
        }
        Insert: {
          author_user_id?: string | null
          created_at?: string
          flag_id: string
          id?: string
          note: string
        }
        Update: {
          author_user_id?: string | null
          created_at?: string
          flag_id?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_flag_notes_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "risk_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_flags: {
        Row: {
          amount_delta: number | null
          amount_expected: number | null
          amount_submitted: number | null
          connected_records: Json
          created_at: string
          dedupe_key: string | null
          detected_at: string
          flag_type: Database["public"]["Enums"]["risk_flag_type"]
          id: string
          lead_id: string | null
          metadata: Json
          partner_id: string | null
          payment_link_id: string | null
          reason: string
          referral_id: string | null
          resolution_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: Database["public"]["Enums"]["risk_flag_severity"]
          status: Database["public"]["Enums"]["risk_flag_status"]
          submission_id: string | null
          updated_at: string
          utr_normalized: string | null
        }
        Insert: {
          amount_delta?: number | null
          amount_expected?: number | null
          amount_submitted?: number | null
          connected_records?: Json
          created_at?: string
          dedupe_key?: string | null
          detected_at?: string
          flag_type: Database["public"]["Enums"]["risk_flag_type"]
          id?: string
          lead_id?: string | null
          metadata?: Json
          partner_id?: string | null
          payment_link_id?: string | null
          reason: string
          referral_id?: string | null
          resolution_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: Database["public"]["Enums"]["risk_flag_severity"]
          status?: Database["public"]["Enums"]["risk_flag_status"]
          submission_id?: string | null
          updated_at?: string
          utr_normalized?: string | null
        }
        Update: {
          amount_delta?: number | null
          amount_expected?: number | null
          amount_submitted?: number | null
          connected_records?: Json
          created_at?: string
          dedupe_key?: string | null
          detected_at?: string
          flag_type?: Database["public"]["Enums"]["risk_flag_type"]
          id?: string
          lead_id?: string | null
          metadata?: Json
          partner_id?: string | null
          payment_link_id?: string | null
          reason?: string
          referral_id?: string | null
          resolution_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: Database["public"]["Enums"]["risk_flag_severity"]
          status?: Database["public"]["Enums"]["risk_flag_status"]
          submission_id?: string | null
          updated_at?: string
          utr_normalized?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_flags_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "partner_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_flags_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_flags_payment_link_id_fkey"
            columns: ["payment_link_id"]
            isOneToOne: false
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_flags_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "partner_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_flags_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "partner_payment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_review_settings: {
        Row: {
          amount_delta_min: number
          duplicate_lead_upload_threshold: number
          duplicate_utr_threshold: number
          id: boolean
          submissions_per_hour_threshold: number
          updated_at: string
          updated_by: string | null
          verified_sales_per_day_threshold: number
        }
        Insert: {
          amount_delta_min?: number
          duplicate_lead_upload_threshold?: number
          duplicate_utr_threshold?: number
          id?: boolean
          submissions_per_hour_threshold?: number
          updated_at?: string
          updated_by?: string | null
          verified_sales_per_day_threshold?: number
        }
        Update: {
          amount_delta_min?: number
          duplicate_lead_upload_threshold?: number
          duplicate_utr_threshold?: number
          id?: boolean
          submissions_per_hour_threshold?: number
          updated_at?: string
          updated_by?: string | null
          verified_sales_per_day_threshold?: number
        }
        Relationships: []
      }
      round_robin_settings: {
        Row: {
          eligible_work_models: string[]
          id: number
          is_active: boolean
          last_partner_id: string | null
          require_verified_brand: boolean
          selected_partner_ids: string[]
          updated_at: string
        }
        Insert: {
          eligible_work_models?: string[]
          id?: number
          is_active?: boolean
          last_partner_id?: string | null
          require_verified_brand?: boolean
          selected_partner_ids?: string[]
          updated_at?: string
        }
        Update: {
          eligible_work_models?: string[]
          id?: number
          is_active?: boolean
          last_partner_id?: string | null
          require_verified_brand?: boolean
          selected_partner_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      salary_structures: {
        Row: {
          basic: number
          created_at: string
          currency: string
          effective_from: string
          employee_id: string
          employee_pf_amount: number
          employer_pf_amount: number
          hra: number
          id: string
          monthly_gross: number
          notes: string | null
          other_deductions: number
          other_earnings: number
          performance_incentive: number
          pf_applicable: boolean
          professional_tax: number
          special_allowance: number
          tds: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          basic?: number
          created_at?: string
          currency?: string
          effective_from?: string
          employee_id: string
          employee_pf_amount?: number
          employer_pf_amount?: number
          hra?: number
          id?: string
          monthly_gross?: number
          notes?: string | null
          other_deductions?: number
          other_earnings?: number
          performance_incentive?: number
          pf_applicable?: boolean
          professional_tax?: number
          special_allowance?: number
          tds?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          basic?: number
          created_at?: string
          currency?: string
          effective_from?: string
          employee_id?: string
          employee_pf_amount?: number
          employer_pf_amount?: number
          hra?: number
          id?: string
          monthly_gross?: number
          notes?: string | null
          other_deductions?: number
          other_earnings?: number
          performance_incentive?: number
          pf_applicable?: boolean
          professional_tax?: number
          special_allowance?: number
          tds?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_structures_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_rotation_history: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          reason: string | null
          rotated_by: string | null
          secret_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string | null
          rotated_by?: string | null
          secret_name: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string | null
          rotated_by?: string | null
          secret_name?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          id: string
          ip: string | null
          metadata: Json
          outcome: string
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          risk_level: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          outcome: string
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          risk_level?: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          outcome?: string
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          risk_level?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      session_attendance: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          minutes_attended: number | null
          notes: string | null
          session_id: string
          status: Database["public"]["Enums"]["session_attendance_status"]
          student_user_id: string
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          minutes_attended?: number | null
          notes?: string | null
          session_id: string
          status?: Database["public"]["Enums"]["session_attendance_status"]
          student_user_id: string
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          minutes_attended?: number | null
          notes?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["session_attendance_status"]
          student_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_join_events: {
        Row: {
          course_id: string
          created_at: string
          id: string
          session_id: string
          student_user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          session_id: string
          student_user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          session_id?: string
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_join_events_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_join_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_mentors: {
        Row: {
          bio: string | null
          created_at: string
          expertise: string[]
          id: string
          is_active: boolean
          name: string
          photo_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          expertise?: string[]
          id?: string
          is_active?: boolean
          name: string
          photo_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          expertise?: string[]
          id?: string
          is_active?: boolean
          name?: string
          photo_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      session_resources: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          name: string
          resource_type: Database["public"]["Enums"]["session_resource_type"]
          session_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          name: string
          resource_type?: Database["public"]["Enums"]["session_resource_type"]
          session_id: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          name?: string
          resource_type?: Database["public"]["Enums"]["session_resource_type"]
          session_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_resources_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      soc_accounts: {
        Row: {
          access_token_ciphertext: string | null
          account_external_id: string | null
          account_name: string
          brand_id: string | null
          can_post: boolean
          can_read_analytics: boolean
          connection_status: string
          created_at: string
          id: string
          last_synced_at: string | null
          metadata: Json
          organization: string | null
          owner_id: string
          permissions: Json
          platform: string
          refresh_token_ciphertext: string | null
          token_expires_at: string | null
          updated_at: string
          webhook_status: string
        }
        Insert: {
          access_token_ciphertext?: string | null
          account_external_id?: string | null
          account_name: string
          brand_id?: string | null
          can_post?: boolean
          can_read_analytics?: boolean
          connection_status?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          metadata?: Json
          organization?: string | null
          owner_id: string
          permissions?: Json
          platform: string
          refresh_token_ciphertext?: string | null
          token_expires_at?: string | null
          updated_at?: string
          webhook_status?: string
        }
        Update: {
          access_token_ciphertext?: string | null
          account_external_id?: string | null
          account_name?: string
          brand_id?: string | null
          can_post?: boolean
          can_read_analytics?: boolean
          connection_status?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          metadata?: Json
          organization?: string | null
          owner_id?: string
          permissions?: Json
          platform?: string
          refresh_token_ciphertext?: string | null
          token_expires_at?: string | null
          updated_at?: string
          webhook_status?: string
        }
        Relationships: []
      }
      soc_analytics: {
        Row: {
          campaign_id: string | null
          clicks: number | null
          comments_count: number | null
          conversions: number | null
          created_at: string
          ctr: number | null
          follower_delta: number | null
          id: string
          impressions: number | null
          likes: number | null
          measured_at: string
          owner_id: string
          platform: string
          post_id: string | null
          publishing_success: boolean | null
          raw: Json
          reach: number | null
          revenue: number | null
          saves: number | null
          shares: number | null
          traffic: number | null
          variant_id: string | null
          views: number | null
        }
        Insert: {
          campaign_id?: string | null
          clicks?: number | null
          comments_count?: number | null
          conversions?: number | null
          created_at?: string
          ctr?: number | null
          follower_delta?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          measured_at?: string
          owner_id: string
          platform: string
          post_id?: string | null
          publishing_success?: boolean | null
          raw?: Json
          reach?: number | null
          revenue?: number | null
          saves?: number | null
          shares?: number | null
          traffic?: number | null
          variant_id?: string | null
          views?: number | null
        }
        Update: {
          campaign_id?: string | null
          clicks?: number | null
          comments_count?: number | null
          conversions?: number | null
          created_at?: string
          ctr?: number | null
          follower_delta?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          measured_at?: string
          owner_id?: string
          platform?: string
          post_id?: string | null
          publishing_success?: boolean | null
          raw?: Json
          reach?: number | null
          revenue?: number | null
          saves?: number | null
          shares?: number | null
          traffic?: number | null
          variant_id?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "soc_analytics_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "soc_post_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      soc_approvals: {
        Row: {
          created_at: string
          decision: string
          id: string
          notes: string | null
          owner_id: string
          post_id: string
          reviewer_id: string
        }
        Insert: {
          created_at?: string
          decision: string
          id?: string
          notes?: string | null
          owner_id: string
          post_id: string
          reviewer_id: string
        }
        Update: {
          created_at?: string
          decision?: string
          id?: string
          notes?: string | null
          owner_id?: string
          post_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "soc_approvals_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "soc_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      soc_campaigns: {
        Row: {
          approval_mode: string
          approval_status: string
          audience: Json
          brand_id: string | null
          brand_kit_id: string | null
          created_at: string
          end_date: string | null
          festival_awareness: boolean
          frequency: string | null
          frequency_config: Json
          holiday_awareness: boolean
          id: string
          language: string
          name: string
          objective: string | null
          owner_id: string
          platforms: string[]
          reviewers: string[]
          settings: Json
          start_date: string | null
          timezone: string
          tone: string | null
          updated_at: string
        }
        Insert: {
          approval_mode?: string
          approval_status?: string
          audience?: Json
          brand_id?: string | null
          brand_kit_id?: string | null
          created_at?: string
          end_date?: string | null
          festival_awareness?: boolean
          frequency?: string | null
          frequency_config?: Json
          holiday_awareness?: boolean
          id?: string
          language?: string
          name: string
          objective?: string | null
          owner_id: string
          platforms?: string[]
          reviewers?: string[]
          settings?: Json
          start_date?: string | null
          timezone?: string
          tone?: string | null
          updated_at?: string
        }
        Update: {
          approval_mode?: string
          approval_status?: string
          audience?: Json
          brand_id?: string | null
          brand_kit_id?: string | null
          created_at?: string
          end_date?: string | null
          festival_awareness?: boolean
          frequency?: string | null
          frequency_config?: Json
          holiday_awareness?: boolean
          id?: string
          language?: string
          name?: string
          objective?: string | null
          owner_id?: string
          platforms?: string[]
          reviewers?: string[]
          settings?: Json
          start_date?: string | null
          timezone?: string
          tone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      soc_comments: {
        Row: {
          ai_suggested_reply: string | null
          assigned_to: string | null
          author_external_id: string | null
          author_name: string | null
          content: string
          created_at: string
          external_comment_id: string | null
          id: string
          is_spam: boolean
          metadata: Json
          owner_id: string
          platform: string
          post_id: string | null
          received_at: string
          reply_status: string
          reply_text: string | null
          sentiment: string | null
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          ai_suggested_reply?: string | null
          assigned_to?: string | null
          author_external_id?: string | null
          author_name?: string | null
          content: string
          created_at?: string
          external_comment_id?: string | null
          id?: string
          is_spam?: boolean
          metadata?: Json
          owner_id: string
          platform: string
          post_id?: string | null
          received_at?: string
          reply_status?: string
          reply_text?: string | null
          sentiment?: string | null
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          ai_suggested_reply?: string | null
          assigned_to?: string | null
          author_external_id?: string | null
          author_name?: string | null
          content?: string
          created_at?: string
          external_comment_id?: string | null
          id?: string
          is_spam?: boolean
          metadata?: Json
          owner_id?: string
          platform?: string
          post_id?: string | null
          received_at?: string
          reply_status?: string
          reply_text?: string | null
          sentiment?: string | null
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soc_comments_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "soc_post_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      soc_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          metadata: Json
          owner_id: string
          read_at: string | null
          ref_id: string | null
          ref_type: string | null
          severity: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          metadata?: Json
          owner_id: string
          read_at?: string | null
          ref_id?: string | null
          ref_type?: string | null
          severity?: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json
          owner_id?: string
          read_at?: string | null
          ref_id?: string | null
          ref_type?: string | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      soc_optimization_insights: {
        Row: {
          account_id: string | null
          computed_at: string
          confidence: number
          created_at: string
          id: string
          insight_type: string
          key: string | null
          owner_id: string
          platform: string
          sample_size: number
          value: Json
        }
        Insert: {
          account_id?: string | null
          computed_at?: string
          confidence?: number
          created_at?: string
          id?: string
          insight_type: string
          key?: string | null
          owner_id: string
          platform: string
          sample_size?: number
          value?: Json
        }
        Update: {
          account_id?: string | null
          computed_at?: string
          confidence?: number
          created_at?: string
          id?: string
          insight_type?: string
          key?: string | null
          owner_id?: string
          platform?: string
          sample_size?: number
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "soc_optimization_insights_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "soc_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      soc_post_variants: {
        Row: {
          account_id: string | null
          best_time_at: string | null
          caption: string | null
          created_at: string
          cta: string | null
          external_post_id: string | null
          external_url: string | null
          hashtags: string[]
          id: string
          media: Json
          metadata: Json
          owner_id: string
          platform: string
          post_id: string
          status: string
          suggested_comments: Json
          suggested_replies: Json
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          best_time_at?: string | null
          caption?: string | null
          created_at?: string
          cta?: string | null
          external_post_id?: string | null
          external_url?: string | null
          hashtags?: string[]
          id?: string
          media?: Json
          metadata?: Json
          owner_id: string
          platform: string
          post_id: string
          status?: string
          suggested_comments?: Json
          suggested_replies?: Json
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          best_time_at?: string | null
          caption?: string | null
          created_at?: string
          cta?: string | null
          external_post_id?: string | null
          external_url?: string | null
          hashtags?: string[]
          id?: string
          media?: Json
          metadata?: Json
          owner_id?: string
          platform?: string
          post_id?: string
          status?: string
          suggested_comments?: Json
          suggested_replies?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "soc_post_variants_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "soc_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soc_post_variants_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "soc_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      soc_posts: {
        Row: {
          approval_notes: string | null
          base_content: Json
          base_prompt: string | null
          brand_kit_id: string | null
          campaign_id: string | null
          created_at: string
          id: string
          language: string
          last_error: string | null
          metadata: Json
          owner_id: string
          post_type: string
          published_at: string | null
          retry_count: number
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_at: string | null
          source_entity_id: string | null
          source_entity_type: string | null
          status: string
          target_platforms: string[]
          timezone: string
          tone: string | null
          topic: string | null
          updated_at: string
        }
        Insert: {
          approval_notes?: string | null
          base_content?: Json
          base_prompt?: string | null
          brand_kit_id?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: string
          language?: string
          last_error?: string | null
          metadata?: Json
          owner_id: string
          post_type: string
          published_at?: string | null
          retry_count?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          status?: string
          target_platforms?: string[]
          timezone?: string
          tone?: string | null
          topic?: string | null
          updated_at?: string
        }
        Update: {
          approval_notes?: string | null
          base_content?: Json
          base_prompt?: string | null
          brand_kit_id?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: string
          language?: string
          last_error?: string | null
          metadata?: Json
          owner_id?: string
          post_type?: string
          published_at?: string | null
          retry_count?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          status?: string
          target_platforms?: string[]
          timezone?: string
          tone?: string | null
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "soc_posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "soc_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      soc_publish_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          error_code: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          next_retry_at: string | null
          owner_id: string
          post_id: string
          request_payload: Json | null
          response_payload: Json | null
          retry_tier: string | null
          started_at: string | null
          status: string
          variant_id: string
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          next_retry_at?: string | null
          owner_id: string
          post_id: string
          request_payload?: Json | null
          response_payload?: Json | null
          retry_tier?: string | null
          started_at?: string | null
          status: string
          variant_id: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          next_retry_at?: string | null
          owner_id?: string
          post_id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          retry_tier?: string | null
          started_at?: string | null
          status?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "soc_publish_attempts_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "soc_post_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      soc_recycling_candidates: {
        Row: {
          actions_taken: Json
          created_at: string
          id: string
          owner_id: string
          reason: string | null
          scheduled_recycle_at: string | null
          score: number
          source_variant_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actions_taken?: Json
          created_at?: string
          id?: string
          owner_id: string
          reason?: string | null
          scheduled_recycle_at?: string | null
          score?: number
          source_variant_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actions_taken?: Json
          created_at?: string
          id?: string
          owner_id?: string
          reason?: string | null
          scheduled_recycle_at?: string | null
          score?: number
          source_variant_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "soc_recycling_candidates_source_variant_id_fkey"
            columns: ["source_variant_id"]
            isOneToOne: false
            referencedRelation: "soc_post_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      student_activity: {
        Row: {
          activity_type: string
          course_id: string | null
          created_at: string
          description: string
          entity_id: string | null
          id: string
          student_user_id: string
        }
        Insert: {
          activity_type: string
          course_id?: string | null
          created_at?: string
          description: string
          entity_id?: string | null
          id?: string
          student_user_id: string
        }
        Update: {
          activity_type?: string
          course_id?: string | null
          created_at?: string
          description?: string
          entity_id?: string | null
          id?: string
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_activity_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_assignments: {
        Row: {
          assignment_id: string
          completed_at: string | null
          course_id: string
          created_at: string
          current_version: number
          id: string
          is_portfolio: boolean
          last_submitted_at: string | null
          started_at: string | null
          status: string
          student_user_id: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          completed_at?: string | null
          course_id: string
          created_at?: string
          current_version?: number
          id?: string
          is_portfolio?: boolean
          last_submitted_at?: string | null
          started_at?: string | null
          status?: string
          student_user_id: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          completed_at?: string | null
          course_id?: string
          created_at?: string
          current_version?: number
          id?: string
          is_portfolio?: boolean
          last_submitted_at?: string | null
          started_at?: string | null
          status?: string
          student_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_assignments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "course_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_career_preferences: {
        Row: {
          created_at: string
          id: string
          open_to_entry_level: boolean
          open_to_internship: boolean
          open_to_opportunities: boolean
          open_to_remote: boolean
          preferred_industries: string[]
          preferred_locations: string[]
          preferred_role: string | null
          preferred_work_types: string[]
          student_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          open_to_entry_level?: boolean
          open_to_internship?: boolean
          open_to_opportunities?: boolean
          open_to_remote?: boolean
          preferred_industries?: string[]
          preferred_locations?: string[]
          preferred_role?: string | null
          preferred_work_types?: string[]
          student_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          open_to_entry_level?: boolean
          open_to_internship?: boolean
          open_to_opportunities?: boolean
          open_to_remote?: boolean
          preferred_industries?: string[]
          preferred_locations?: string[]
          preferred_role?: string | null
          preferred_work_types?: string[]
          student_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_education: {
        Row: {
          created_at: string
          degree: string | null
          display_order: number
          end_year: number | null
          id: string
          institution: string
          is_current: boolean
          specialisation: string | null
          start_year: number | null
          student_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          degree?: string | null
          display_order?: number
          end_year?: number | null
          id?: string
          institution: string
          is_current?: boolean
          specialisation?: string | null
          start_year?: number | null
          student_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          degree?: string | null
          display_order?: number
          end_year?: number | null
          id?: string
          institution?: string
          is_current?: boolean
          specialisation?: string | null
          start_year?: number | null
          student_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_internship_activity: {
        Row: {
          event: string
          id: string
          metadata: Json
          occurred_at: string
          student_internship_id: string | null
          student_user_id: string
        }
        Insert: {
          event: string
          id?: string
          metadata?: Json
          occurred_at?: string
          student_internship_id?: string | null
          student_user_id: string
        }
        Update: {
          event?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          student_internship_id?: string | null
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_internship_activity_student_internship_id_fkey"
            columns: ["student_internship_id"]
            isOneToOne: false
            referencedRelation: "student_internships"
            referencedColumns: ["id"]
          },
        ]
      }
      student_internship_stage_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          stage_id: string
          status: Database["public"]["Enums"]["internship_stage_status"]
          student_internship_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          stage_id: string
          status?: Database["public"]["Enums"]["internship_stage_status"]
          student_internship_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          stage_id?: string
          status?: Database["public"]["Enums"]["internship_stage_status"]
          student_internship_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_internship_stage_progress_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "internship_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_internship_stage_progress_student_internship_id_fkey"
            columns: ["student_internship_id"]
            isOneToOne: false
            referencedRelation: "student_internships"
            referencedColumns: ["id"]
          },
        ]
      }
      student_internship_task_submissions: {
        Row: {
          created_at: string
          files: Json
          id: string
          is_late: boolean
          live_project_link: string | null
          max_score: number | null
          repository_link: string | null
          result: string | null
          review_notes: string | null
          review_status: Database["public"]["Enums"]["internship_submission_review"]
          reviewed_at: string | null
          reviewer_user_id: string | null
          score: number | null
          student_internship_task_id: string
          submission_link: string | null
          submission_notes: string | null
          submitted_at: string
          text_response: string | null
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          files?: Json
          id?: string
          is_late?: boolean
          live_project_link?: string | null
          max_score?: number | null
          repository_link?: string | null
          result?: string | null
          review_notes?: string | null
          review_status?: Database["public"]["Enums"]["internship_submission_review"]
          reviewed_at?: string | null
          reviewer_user_id?: string | null
          score?: number | null
          student_internship_task_id: string
          submission_link?: string | null
          submission_notes?: string | null
          submitted_at?: string
          text_response?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          files?: Json
          id?: string
          is_late?: boolean
          live_project_link?: string | null
          max_score?: number | null
          repository_link?: string | null
          result?: string | null
          review_notes?: string | null
          review_status?: Database["public"]["Enums"]["internship_submission_review"]
          reviewed_at?: string | null
          reviewer_user_id?: string | null
          score?: number | null
          student_internship_task_id?: string
          submission_link?: string | null
          submission_notes?: string | null
          submitted_at?: string
          text_response?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_internship_task_submiss_student_internship_task_id_fkey"
            columns: ["student_internship_task_id"]
            isOneToOne: false
            referencedRelation: "student_internship_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      student_internship_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          current_version: number
          id: string
          started_at: string | null
          status: Database["public"]["Enums"]["internship_task_status"]
          student_internship_id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_version?: number
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["internship_task_status"]
          student_internship_id: string
          task_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_version?: number
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["internship_task_status"]
          student_internship_id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_internship_tasks_student_internship_id_fkey"
            columns: ["student_internship_id"]
            isOneToOne: false
            referencedRelation: "student_internships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_internship_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "internship_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      student_internships: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          current_stage_id: string | null
          id: string
          internship_id: string
          progress_percent: number
          review_started_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["internship_status"]
          student_user_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          current_stage_id?: string | null
          id?: string
          internship_id: string
          progress_percent?: number
          review_started_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["internship_status"]
          student_user_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          current_stage_id?: string | null
          id?: string
          internship_id?: string
          progress_percent?: number
          review_started_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["internship_status"]
          student_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_internships_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_internships_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "internship_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_internships_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      student_notification_preferences: {
        Row: {
          category: string
          created_at: string
          id: string
          in_app_enabled: boolean
          student_user_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          in_app_enabled?: boolean
          student_user_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          in_app_enabled?: boolean
          student_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_notifications: {
        Row: {
          action_label: string | null
          action_route: string | null
          category: string
          created_at: string
          dedupe_key: string
          id: string
          is_mandatory: boolean
          message: string
          notif_type: string
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          student_user_id: string
          title: string
          updated_at: string
        }
        Insert: {
          action_label?: string | null
          action_route?: string | null
          category: string
          created_at?: string
          dedupe_key: string
          id?: string
          is_mandatory?: boolean
          message: string
          notif_type?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          student_user_id: string
          title: string
          updated_at?: string
        }
        Update: {
          action_label?: string | null
          action_route?: string | null
          category?: string
          created_at?: string
          dedupe_key?: string
          id?: string
          is_mandatory?: boolean
          message?: string
          notif_type?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          student_user_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          city: string | null
          created_at: string
          current_role_title: string | null
          education: string | null
          email: string | null
          full_name: string | null
          graduation_year: number | null
          learner_type: string
          mobile: string | null
          onboarded_at: string | null
          preferred_mode: string | null
          state: string | null
          updated_at: string
          user_id: string
          work_experience: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          current_role_title?: string | null
          education?: string | null
          email?: string | null
          full_name?: string | null
          graduation_year?: number | null
          learner_type?: string
          mobile?: string | null
          onboarded_at?: string | null
          preferred_mode?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          work_experience?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          current_role_title?: string | null
          education?: string | null
          email?: string | null
          full_name?: string | null
          graduation_year?: number | null
          learner_type?: string
          mobile?: string | null
          onboarded_at?: string | null
          preferred_mode?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          work_experience?: string | null
        }
        Relationships: []
      }
      student_project_submissions: {
        Row: {
          attachments: Json
          course_id: string
          created_at: string
          id: string
          live_url: string | null
          project_id: string
          reference_url: string | null
          repository_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_feedback: string | null
          reviewer_notes: string | null
          status: string
          student_project_id: string
          student_user_id: string
          submission_notes: string | null
          submitted_at: string
          summary: string | null
          title: string | null
          updated_at: string
          version: number
        }
        Insert: {
          attachments?: Json
          course_id: string
          created_at?: string
          id?: string
          live_url?: string | null
          project_id: string
          reference_url?: string | null
          repository_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_feedback?: string | null
          reviewer_notes?: string | null
          status?: string
          student_project_id: string
          student_user_id: string
          submission_notes?: string | null
          submitted_at?: string
          summary?: string | null
          title?: string | null
          updated_at?: string
          version: number
        }
        Update: {
          attachments?: Json
          course_id?: string
          created_at?: string
          id?: string
          live_url?: string | null
          project_id?: string
          reference_url?: string | null
          repository_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_feedback?: string | null
          reviewer_notes?: string | null
          status?: string
          student_project_id?: string
          student_user_id?: string
          submission_notes?: string | null
          submitted_at?: string
          summary?: string | null
          title?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_project_submissions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_project_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "course_project_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_project_submissions_student_project_id_fkey"
            columns: ["student_project_id"]
            isOneToOne: false
            referencedRelation: "student_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_projects: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          current_version: number
          enrollment_id: string | null
          id: string
          last_submitted_at: string | null
          portfolio_added: boolean
          portfolio_selected_at: string | null
          project_id: string
          started_at: string
          status: string
          student_user_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          current_version?: number
          enrollment_id?: string | null
          id?: string
          last_submitted_at?: string | null
          portfolio_added?: boolean
          portfolio_selected_at?: string | null
          project_id: string
          started_at?: string
          status?: string
          student_user_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          current_version?: number
          enrollment_id?: string | null
          id?: string
          last_submitted_at?: string | null
          portfolio_added?: boolean
          portfolio_selected_at?: string | null
          project_id?: string
          started_at?: string
          status?: string
          student_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_projects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_projects_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "course_project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      student_reviews: {
        Row: {
          after_snapshot: Json | null
          before_snapshot: Json | null
          career_growth_notes: string | null
          company_logo_url: string | null
          company_name: string | null
          created_at: string
          display_locations: string[] | null
          featured: boolean | null
          id: string
          ip_address: unknown
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          published_at: string | null
          rating: number
          review_text: string
          reviewer_avatar_url: string | null
          reviewer_email: string | null
          reviewer_linkedin_url: string | null
          reviewer_name: string
          salary_after_lpa: number | null
          salary_before_lpa: number | null
          salary_growth_pct: number | null
          seo_slug: string | null
          source: string | null
          spam_score: number | null
          status: string
          success_story_id: string | null
          target_id: string | null
          target_label: string | null
          target_slug: string | null
          target_type: string
          title: string | null
          trigger_event: string
          updated_at: string
          user_id: string | null
          video_thumbnail_url: string | null
          video_url: string | null
        }
        Insert: {
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          career_growth_notes?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          created_at?: string
          display_locations?: string[] | null
          featured?: boolean | null
          id?: string
          ip_address?: unknown
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          published_at?: string | null
          rating: number
          review_text: string
          reviewer_avatar_url?: string | null
          reviewer_email?: string | null
          reviewer_linkedin_url?: string | null
          reviewer_name: string
          salary_after_lpa?: number | null
          salary_before_lpa?: number | null
          salary_growth_pct?: number | null
          seo_slug?: string | null
          source?: string | null
          spam_score?: number | null
          status?: string
          success_story_id?: string | null
          target_id?: string | null
          target_label?: string | null
          target_slug?: string | null
          target_type: string
          title?: string | null
          trigger_event: string
          updated_at?: string
          user_id?: string | null
          video_thumbnail_url?: string | null
          video_url?: string | null
        }
        Update: {
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          career_growth_notes?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          created_at?: string
          display_locations?: string[] | null
          featured?: boolean | null
          id?: string
          ip_address?: unknown
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          published_at?: string | null
          rating?: number
          review_text?: string
          reviewer_avatar_url?: string | null
          reviewer_email?: string | null
          reviewer_linkedin_url?: string | null
          reviewer_name?: string
          salary_after_lpa?: number | null
          salary_before_lpa?: number | null
          salary_growth_pct?: number | null
          seo_slug?: string | null
          source?: string | null
          spam_score?: number | null
          status?: string
          success_story_id?: string | null
          target_id?: string | null
          target_label?: string | null
          target_slug?: string | null
          target_type?: string
          title?: string | null
          trigger_event?: string
          updated_at?: string
          user_id?: string | null
          video_thumbnail_url?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_reviews_success_story_id_fkey"
            columns: ["success_story_id"]
            isOneToOne: false
            referencedRelation: "success_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      student_skills: {
        Row: {
          created_at: string
          id: string
          linked_course_id: string | null
          linked_skill_id: string | null
          show_in_profile: boolean
          skill_level: string | null
          skill_name: string
          skill_source: string
          student_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          linked_course_id?: string | null
          linked_skill_id?: string | null
          show_in_profile?: boolean
          skill_level?: string | null
          skill_name: string
          skill_source?: string
          student_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          linked_course_id?: string | null
          linked_skill_id?: string | null
          show_in_profile?: boolean
          skill_level?: string | null
          skill_name?: string
          skill_source?: string
          student_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_skills_linked_course_id_fkey"
            columns: ["linked_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_skills_linked_skill_id_fkey"
            columns: ["linked_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      student_support_activity: {
        Row: {
          action: string
          actor_role: string
          created_at: string
          detail: string | null
          id: string
          meta: Json
          student_user_id: string
          ticket_id: string
        }
        Insert: {
          action: string
          actor_role: string
          created_at?: string
          detail?: string | null
          id?: string
          meta?: Json
          student_user_id: string
          ticket_id: string
        }
        Update: {
          action?: string
          actor_role?: string
          created_at?: string
          detail?: string | null
          id?: string
          meta?: Json
          student_user_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_support_activity_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "student_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      student_support_messages: {
        Row: {
          attachments: Json
          author_user_id: string
          body: string
          created_at: string
          id: string
          is_admin: boolean
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          attachments?: Json
          author_user_id: string
          body: string
          created_at?: string
          id?: string
          is_admin?: boolean
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          attachments?: Json
          author_user_id?: string
          body?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "student_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      student_support_tickets: {
        Row: {
          assigned_admin_id: string | null
          assigned_at: string | null
          attachments: Json
          category: Database["public"]["Enums"]["student_support_category"]
          closed_at: string | null
          context_record_id: string | null
          context_type: Database["public"]["Enums"]["student_support_context_type"]
          created_at: string
          description: string
          id: string
          last_activity_at: string
          priority: Database["public"]["Enums"]["student_support_priority"]
          program_id: string | null
          reopened_at: string | null
          resolution_note: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["student_support_status"]
          student_user_id: string
          subject: string
          ticket_code: string | null
          updated_at: string
        }
        Insert: {
          assigned_admin_id?: string | null
          assigned_at?: string | null
          attachments?: Json
          category: Database["public"]["Enums"]["student_support_category"]
          closed_at?: string | null
          context_record_id?: string | null
          context_type?: Database["public"]["Enums"]["student_support_context_type"]
          created_at?: string
          description: string
          id?: string
          last_activity_at?: string
          priority?: Database["public"]["Enums"]["student_support_priority"]
          program_id?: string | null
          reopened_at?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["student_support_status"]
          student_user_id: string
          subject: string
          ticket_code?: string | null
          updated_at?: string
        }
        Update: {
          assigned_admin_id?: string | null
          assigned_at?: string | null
          attachments?: Json
          category?: Database["public"]["Enums"]["student_support_category"]
          closed_at?: string | null
          context_record_id?: string | null
          context_type?: Database["public"]["Enums"]["student_support_context_type"]
          created_at?: string
          description?: string
          id?: string
          last_activity_at?: string
          priority?: Database["public"]["Enums"]["student_support_priority"]
          program_id?: string | null
          reopened_at?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["student_support_status"]
          student_user_id?: string
          subject?: string
          ticket_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_support_tickets_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      success_stories: {
        Row: {
          avatar_url: string | null
          batch: string | null
          company: string
          company_domain: string | null
          company_slug: string | null
          course: string
          course_category: string | null
          created_at: string
          featured: boolean
          graduation_year: number | null
          id: string
          linkedin_url: string | null
          location: string | null
          name: string
          package_label: string | null
          package_lpa: number | null
          published: boolean
          quote: string
          rating: number
          role: string
          sort_order: number
          story_url: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          batch?: string | null
          company: string
          company_domain?: string | null
          company_slug?: string | null
          course: string
          course_category?: string | null
          created_at?: string
          featured?: boolean
          graduation_year?: number | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          name: string
          package_label?: string | null
          package_lpa?: number | null
          published?: boolean
          quote: string
          rating?: number
          role: string
          sort_order?: number
          story_url?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          batch?: string | null
          company?: string
          company_domain?: string | null
          company_slug?: string | null
          course?: string
          course_category?: string | null
          created_at?: string
          featured?: boolean
          graduation_year?: number | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          name?: string
          package_label?: string | null
          package_lpa?: number | null
          published?: boolean
          quote?: string
          rating?: number
          role?: string
          sort_order?: number
          story_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tools: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      usage_counters: {
        Row: {
          id: string
          period_start: string
          quota_key: string
          updated_at: string
          used: number
          user_id: string
        }
        Insert: {
          id?: string
          period_start: string
          quota_key: string
          updated_at?: string
          used?: number
          user_id: string
        }
        Update: {
          id?: string
          period_start?: string
          quota_key?: string
          updated_at?: string
          used?: number
          user_id?: string
        }
        Relationships: []
      }
      usage_quotas: {
        Row: {
          created_at: string
          hard_stop: boolean
          id: string
          limit_value: number
          period: string
          quota_key: string
          scope: string
          subject_id: string | null
          subject_role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hard_stop?: boolean
          id?: string
          limit_value: number
          period: string
          quota_key: string
          scope: string
          subject_id?: string | null
          subject_role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hard_stop?: boolean
          id?: string
          limit_value?: number
          period?: string
          quota_key?: string
          scope?: string
          subject_id?: string | null
          subject_role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vs_analytics: {
        Row: {
          channel: string | null
          comments: number
          completion_rate: number
          conversions: number
          ctr: number
          engagement: number
          id: string
          likes: number
          metadata: Json
          owner_id: string
          project_id: string
          recorded_at: string
          shares: number
          views: number
          watch_time_seconds: number
        }
        Insert: {
          channel?: string | null
          comments?: number
          completion_rate?: number
          conversions?: number
          ctr?: number
          engagement?: number
          id?: string
          likes?: number
          metadata?: Json
          owner_id: string
          project_id: string
          recorded_at?: string
          shares?: number
          views?: number
          watch_time_seconds?: number
        }
        Update: {
          channel?: string | null
          comments?: number
          completion_rate?: number
          conversions?: number
          ctr?: number
          engagement?: number
          id?: string
          likes?: number
          metadata?: Json
          owner_id?: string
          project_id?: string
          recorded_at?: string
          shares?: number
          views?: number
          watch_time_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "vs_analytics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vs_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_assets: {
        Row: {
          bytes: number | null
          created_at: string
          duration_seconds: number | null
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["vs_asset_kind"]
          language: string | null
          metadata: Json
          mime_type: string | null
          owner_id: string
          project_id: string | null
          provider_ref: string | null
          provider_slug: string | null
          scene_id: string | null
          storage_path: string | null
          url: string | null
          width: number | null
        }
        Insert: {
          bytes?: number | null
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind: Database["public"]["Enums"]["vs_asset_kind"]
          language?: string | null
          metadata?: Json
          mime_type?: string | null
          owner_id: string
          project_id?: string | null
          provider_ref?: string | null
          provider_slug?: string | null
          scene_id?: string | null
          storage_path?: string | null
          url?: string | null
          width?: number | null
        }
        Update: {
          bytes?: number | null
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["vs_asset_kind"]
          language?: string | null
          metadata?: Json
          mime_type?: string | null
          owner_id?: string
          project_id?: string | null
          provider_ref?: string | null
          provider_slug?: string | null
          scene_id?: string | null
          storage_path?: string | null
          url?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vs_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vs_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vs_assets_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "vs_scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          detail: Json
          id: string
          owner_id: string | null
          project_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          detail?: Json
          id?: string
          owner_id?: string | null
          project_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          detail?: Json
          id?: string
          owner_id?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vs_audit_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vs_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_automation_sources: {
        Row: {
          config: Json
          created_at: string
          format: Database["public"]["Enums"]["vs_video_format"]
          id: string
          is_active: boolean
          last_project_id: string | null
          last_run_at: string | null
          owner_id: string
          source_id: string
          source_type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          format: Database["public"]["Enums"]["vs_video_format"]
          id?: string
          is_active?: boolean
          last_project_id?: string | null
          last_run_at?: string | null
          owner_id: string
          source_id: string
          source_type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          format?: Database["public"]["Enums"]["vs_video_format"]
          id?: string
          is_active?: boolean
          last_project_id?: string | null
          last_run_at?: string | null
          owner_id?: string
          source_id?: string
          source_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vs_automation_sources_last_project_id_fkey"
            columns: ["last_project_id"]
            isOneToOne: false
            referencedRelation: "vs_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_brand_kits: {
        Row: {
          accent_color: string | null
          created_at: string
          cta_style: Json
          font_body: string | null
          font_heading: string | null
          id: string
          intro_asset_url: string | null
          is_default: boolean
          logo_url: string | null
          metadata: Json
          name: string
          outro_asset_url: string | null
          owner_id: string
          primary_color: string | null
          secondary_color: string | null
          tone_of_voice: string | null
          updated_at: string
          watermark_url: string | null
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          cta_style?: Json
          font_body?: string | null
          font_heading?: string | null
          id?: string
          intro_asset_url?: string | null
          is_default?: boolean
          logo_url?: string | null
          metadata?: Json
          name: string
          outro_asset_url?: string | null
          owner_id: string
          primary_color?: string | null
          secondary_color?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          watermark_url?: string | null
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          cta_style?: Json
          font_body?: string | null
          font_heading?: string | null
          id?: string
          intro_asset_url?: string | null
          is_default?: boolean
          logo_url?: string | null
          metadata?: Json
          name?: string
          outro_asset_url?: string | null
          owner_id?: string
          primary_color?: string | null
          secondary_color?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          watermark_url?: string | null
        }
        Relationships: []
      }
      vs_jobs: {
        Row: {
          attempts: number
          cost_credits: number
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          input: Json
          kind: string
          max_attempts: number
          next_poll_at: string | null
          output: Json
          owner_id: string
          priority: number
          project_id: string | null
          provider_ref: string | null
          provider_slug: string
          scene_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["vs_job_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          cost_credits?: number
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          kind: string
          max_attempts?: number
          next_poll_at?: string | null
          output?: Json
          owner_id: string
          priority?: number
          project_id?: string | null
          provider_ref?: string | null
          provider_slug: string
          scene_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["vs_job_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          cost_credits?: number
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          kind?: string
          max_attempts?: number
          next_poll_at?: string | null
          output?: Json
          owner_id?: string
          priority?: number
          project_id?: string | null
          provider_ref?: string | null
          provider_slug?: string
          scene_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["vs_job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vs_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vs_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vs_jobs_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "vs_scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_projects: {
        Row: {
          archived_at: string | null
          aspect_ratio: string
          brand_id: string | null
          brand_kit_id: string | null
          brief: Json
          cost_credits: number
          created_at: string
          cta: string | null
          duration_seconds: number
          format: Database["public"]["Enums"]["vs_video_format"]
          generation_ms: number
          goal: string | null
          id: string
          language: string
          metadata: Json
          owner_id: string
          platform: string | null
          published_at: string | null
          resolution: string
          script: string | null
          seo: Json
          source_id: string | null
          source_type: string | null
          status: Database["public"]["Enums"]["vs_project_status"]
          storyboard: Json
          style: string | null
          target_audience: string | null
          template_id: string | null
          title: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          aspect_ratio?: string
          brand_id?: string | null
          brand_kit_id?: string | null
          brief?: Json
          cost_credits?: number
          created_at?: string
          cta?: string | null
          duration_seconds?: number
          format: Database["public"]["Enums"]["vs_video_format"]
          generation_ms?: number
          goal?: string | null
          id?: string
          language?: string
          metadata?: Json
          owner_id: string
          platform?: string | null
          published_at?: string | null
          resolution?: string
          script?: string | null
          seo?: Json
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["vs_project_status"]
          storyboard?: Json
          style?: string | null
          target_audience?: string | null
          template_id?: string | null
          title: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          aspect_ratio?: string
          brand_id?: string | null
          brand_kit_id?: string | null
          brief?: Json
          cost_credits?: number
          created_at?: string
          cta?: string | null
          duration_seconds?: number
          format?: Database["public"]["Enums"]["vs_video_format"]
          generation_ms?: number
          goal?: string | null
          id?: string
          language?: string
          metadata?: Json
          owner_id?: string
          platform?: string | null
          published_at?: string | null
          resolution?: string
          script?: string | null
          seo?: Json
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["vs_project_status"]
          storyboard?: Json
          style?: string | null
          target_audience?: string | null
          template_id?: string | null
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vs_projects_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "vs_brand_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vs_projects_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "vs_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_providers: {
        Row: {
          adapter: string
          capabilities: Json
          config: Json
          created_at: string
          id: string
          is_active: boolean
          kind: string
          name: string
          pricing: Json
          priority: number
          slug: string
          updated_at: string
        }
        Insert: {
          adapter: string
          capabilities?: Json
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          kind: string
          name: string
          pricing?: Json
          priority?: number
          slug: string
          updated_at?: string
        }
        Update: {
          adapter?: string
          capabilities?: Json
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          pricing?: Json
          priority?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      vs_scenes: {
        Row: {
          animation_type: string | null
          background_audio: string | null
          brand_assets: Json
          camera_movement: string | null
          created_at: string
          duration_seconds: number
          id: string
          metadata: Json
          narration: string | null
          overlay_text: string | null
          project_id: string
          scene_number: number
          status: Database["public"]["Enums"]["vs_job_status"]
          subtitle_asset_id: string | null
          transition: string | null
          updated_at: string
          video_asset_id: string | null
          video_prompt: string | null
          visual_prompt: string | null
          voice_asset_id: string | null
        }
        Insert: {
          animation_type?: string | null
          background_audio?: string | null
          brand_assets?: Json
          camera_movement?: string | null
          created_at?: string
          duration_seconds?: number
          id?: string
          metadata?: Json
          narration?: string | null
          overlay_text?: string | null
          project_id: string
          scene_number: number
          status?: Database["public"]["Enums"]["vs_job_status"]
          subtitle_asset_id?: string | null
          transition?: string | null
          updated_at?: string
          video_asset_id?: string | null
          video_prompt?: string | null
          visual_prompt?: string | null
          voice_asset_id?: string | null
        }
        Update: {
          animation_type?: string | null
          background_audio?: string | null
          brand_assets?: Json
          camera_movement?: string | null
          created_at?: string
          duration_seconds?: number
          id?: string
          metadata?: Json
          narration?: string | null
          overlay_text?: string | null
          project_id?: string
          scene_number?: number
          status?: Database["public"]["Enums"]["vs_job_status"]
          subtitle_asset_id?: string | null
          transition?: string | null
          updated_at?: string
          video_asset_id?: string | null
          video_prompt?: string | null
          visual_prompt?: string | null
          voice_asset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vs_scenes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vs_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_templates: {
        Row: {
          aspect_ratio: string
          brand_kit_id: string | null
          category: string | null
          created_at: string
          default_duration: number
          description: string | null
          format: Database["public"]["Enums"]["vs_video_format"]
          id: string
          is_public: boolean
          language: string
          metadata: Json
          name: string
          owner_id: string | null
          storyboard: Json
          style: string | null
          updated_at: string
        }
        Insert: {
          aspect_ratio?: string
          brand_kit_id?: string | null
          category?: string | null
          created_at?: string
          default_duration?: number
          description?: string | null
          format: Database["public"]["Enums"]["vs_video_format"]
          id?: string
          is_public?: boolean
          language?: string
          metadata?: Json
          name: string
          owner_id?: string | null
          storyboard?: Json
          style?: string | null
          updated_at?: string
        }
        Update: {
          aspect_ratio?: string
          brand_kit_id?: string | null
          category?: string | null
          created_at?: string
          default_duration?: number
          description?: string | null
          format?: Database["public"]["Enums"]["vs_video_format"]
          id?: string
          is_public?: boolean
          language?: string
          metadata?: Json
          name?: string
          owner_id?: string | null
          storyboard?: Json
          style?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vs_templates_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "vs_brand_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          project_id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          project_id: string
          snapshot: Json
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "vs_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vs_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vs_voices: {
        Row: {
          accent: string | null
          created_at: string
          external_id: string
          gender: string | null
          id: string
          is_active: boolean
          language: string
          metadata: Json
          name: string
          preview_url: string | null
          provider_slug: string
          style: string | null
        }
        Insert: {
          accent?: string | null
          created_at?: string
          external_id: string
          gender?: string | null
          id?: string
          is_active?: boolean
          language?: string
          metadata?: Json
          name: string
          preview_url?: string | null
          provider_slug: string
          style?: string | null
        }
        Update: {
          accent?: string | null
          created_at?: string
          external_id?: string
          gender?: string | null
          id?: string
          is_active?: boolean
          language?: string
          metadata?: Json
          name?: string
          preview_url?: string | null
          provider_slug?: string
          style?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      internal_link_orphans: {
        Row: {
          entity_type:
            | Database["public"]["Enums"]["internal_link_entity"]
            | null
          id: string | null
          slug: string | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      amb_campaign_matches_scope: {
        Args: { _campus_scope: string; _college_name: string }
        Returns: boolean
      }
      amb_category_is_enabled: {
        Args: { _ambassador_id: string; _category: string }
        Returns: boolean
      }
      ambassador_active_ranking_rule: {
        Args: { _type: Database["public"]["Enums"]["amb_leaderboard_type"] }
        Returns: {
          ambassador_explanation: string
          final_tie_policy: Database["public"]["Enums"]["amb_final_tie_policy"]
          is_valid: boolean
          minimum_activity_metric: Database["public"]["Enums"]["amb_ranking_metric"]
          minimum_activity_threshold: number
          ranking_metric: Database["public"]["Enums"]["amb_ranking_metric"]
          rule_code: string
          rule_id: string
          rule_name: string
          rule_version: number
          tie_breaker_1: Database["public"]["Enums"]["amb_tie_breaker_type"]
          tie_breaker_2: Database["public"]["Enums"]["amb_tie_breaker_type"]
          tie_breaker_3: Database["public"]["Enums"]["amb_tie_breaker_type"]
        }[]
      }
      ambassador_award_recognition_badge: {
        Args: {
          _achievement_id: string
          _ambassador_id: string
          _badge_id: string
        }
        Returns: undefined
      }
      ambassador_evaluate_campaign_recognition: {
        Args: { _campaign_id: string }
        Returns: number
      }
      ambassador_evaluate_period_recognition: {
        Args: {
          _college_key?: string
          _leaderboard_type: string
          _period_key: string
          _program_id?: string
        }
        Returns: number
      }
      ambassador_leaderboard_campaign: {
        Args: {
          _campaign_id: string
          _limit?: number
          _offset?: number
          _search?: string
        }
        Returns: {
          ambassador_id: string
          college_display: string
          display_identity: string
          is_final: boolean
          level_icon: string
          level_name: string
          metric_value: number
          photo_url: string
          progress_pct: number
          rank_position: number
          ranking_metric: string
          total_count: number
        }[]
      }
      ambassador_leaderboard_college: {
        Args: { _limit?: number; _offset?: number; _search?: string }
        Returns: {
          ambassador_id: string
          college_display: string
          college_name: string
          conversion_rate: number
          display_identity: string
          level_icon: string
          level_name: string
          photo_url: string
          rank_position: number
          total_count: number
          valid_referral_leads: number
          verified_enrollments: number
        }[]
      }
      ambassador_leaderboard_featured_badges: {
        Args: { _ids: string[] }
        Returns: {
          achieved_at: string
          ambassador_id: string
          badge_icon: string
          badge_id: string
          badge_name: string
        }[]
      }
      ambassador_leaderboard_monthly: {
        Args: {
          _limit?: number
          _month: number
          _offset?: number
          _search?: string
          _year: number
        }
        Returns: {
          ambassador_id: string
          college_display: string
          conversion_rate: number
          display_identity: string
          level_icon: string
          level_name: string
          photo_url: string
          rank_position: number
          total_count: number
          valid_referral_leads: number
          verified_enrollments: number
        }[]
      }
      ambassador_leaderboard_my_campaign_rank: {
        Args: { _campaign_id: string }
        Returns: {
          ambassador_code: string
          ambassador_id: string
          college_display: string
          display_identity: string
          is_final: boolean
          level_icon: string
          level_name: string
          metric_value: number
          photo_url: string
          progress_pct: number
          rank_position: number
          ranking_metric: string
          total_ranked: number
        }[]
      }
      ambassador_leaderboard_my_college_rank: {
        Args: never
        Returns: {
          ambassador_code: string
          ambassador_id: string
          college_name: string
          conversion_rate: number
          display_identity: string
          level_icon: string
          level_name: string
          photo_url: string
          rank_position: number
          total_ranked: number
          valid_referral_leads: number
          verified_enrollments: number
        }[]
      }
      ambassador_leaderboard_my_monthly_rank: {
        Args: { _month: number; _year: number }
        Returns: {
          ambassador_code: string
          ambassador_id: string
          college_display: string
          conversion_rate: number
          display_identity: string
          level_icon: string
          level_name: string
          photo_url: string
          rank_position: number
          total_ranked: number
          valid_referral_leads: number
          verified_enrollments: number
        }[]
      }
      ambassador_leaderboard_my_program_rank: {
        Args: { _program_id: string }
        Returns: {
          ambassador_code: string
          ambassador_id: string
          college_display: string
          conversion_rate: number
          display_identity: string
          level_icon: string
          level_name: string
          photo_url: string
          rank_position: number
          total_ranked: number
          valid_referral_leads: number
          verified_enrollments: number
        }[]
      }
      ambassador_leaderboard_my_rank: {
        Args: never
        Returns: {
          ambassador_code: string
          ambassador_id: string
          college_display: string
          conversion_rate: number
          display_identity: string
          level_icon: string
          level_name: string
          photo_url: string
          rank_position: number
          total_active: number
          valid_referral_leads: number
          verified_enrollments: number
        }[]
      }
      ambassador_leaderboard_overall: {
        Args: { _limit?: number; _offset?: number; _search?: string }
        Returns: {
          ambassador_id: string
          college_display: string
          conversion_rate: number
          display_identity: string
          level_icon: string
          level_name: string
          photo_url: string
          rank_position: number
          total_count: number
          valid_referral_leads: number
          verified_enrollments: number
        }[]
      }
      ambassador_leaderboard_program: {
        Args: {
          _limit?: number
          _offset?: number
          _program_id: string
          _search?: string
        }
        Returns: {
          ambassador_id: string
          college_display: string
          conversion_rate: number
          display_identity: string
          level_icon: string
          level_name: string
          photo_url: string
          rank_position: number
          total_count: number
          valid_referral_leads: number
          verified_enrollments: number
        }[]
      }
      ambassador_my_college_context: {
        Args: never
        Returns: {
          ambassador_id: string
          college_key: string
          college_name: string
          has_college: boolean
        }[]
      }
      ambassador_my_rank_history: {
        Args: { _type?: string }
        Returns: {
          campaign_id: string
          campaign_name: string
          college_key: string
          final_rank: number
          finalised_at: string
          leaderboard_type: string
          metric_value: number
          period_key: string
          primary_metric: string
          program_id: string
          program_name: string
          recognition_title: string
        }[]
      }
      ambassador_my_rank_movement: {
        Args: {
          _campaign_id?: string
          _period_key?: string
          _program_id?: string
          _type: Database["public"]["Enums"]["amb_leaderboard_type"]
        }
        Returns: {
          calculated_at: string
          current_rank: number
          is_new: boolean
          previous_rank: number
          rank_difference: number
        }[]
      }
      ambassador_my_recognitions: {
        Args: never
        Returns: {
          achieved_at: string
          badge_icon: string
          badge_id: string
          badge_name: string
          campaign_id: string
          campaign_name: string
          college_key: string
          final_rank: number
          id: string
          leaderboard_type: string
          program_id: string
          program_name: string
          ranking_period_key: string
          recognition_title: string
          recognition_type: string
        }[]
      }
      ambassador_previous_monthly_leaders: {
        Args: { _limit?: number }
        Returns: {
          ambassador_id: string
          college_display: string
          display_identity: string
          finalised_at: string
          level_icon: string
          level_name: string
          metric_value: number
          period_key: string
          photo_url: string
          primary_metric: string
        }[]
      }
      ambassador_ranking_explanation: {
        Args: { _type: Database["public"]["Enums"]["amb_leaderboard_type"] }
        Returns: {
          ambassador_explanation: string
          is_valid: boolean
          minimum_activity_label: string
          primary_metric_label: string
          rule_name: string
          tie_breakers: string[]
          weighted_components: Json
        }[]
      }
      ambassador_ranking_rule_is_valid: {
        Args: { _rule_id: string }
        Returns: boolean
      }
      ambassador_visible_campaigns: {
        Args: never
        Returns: {
          banner_text: string
          campaign_code: string
          campaign_type: string
          campus_scope: string
          description: string
          ends_at: string
          id: string
          is_final: boolean
          name: string
          program_id: string
          ranking_finalised_at: string
          ranking_metric: string
          starts_at: string
          status: string
        }[]
      }
      automation_claim_jobs: {
        Args: { _limit?: number; _lock_seconds?: number; _worker_id: string }
        Returns: {
          approval_id: string | null
          attempts: number
          backoff_seconds: number
          completed_at: string | null
          correlation_id: string | null
          created_at: string
          handler: string
          id: string
          idempotency_key: string | null
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          owner_id: string | null
          parent_job_id: string | null
          payload: Json
          priority: number
          result: Json | null
          run_at: string
          started_at: string | null
          status: string
          timeout_seconds: number
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "automation_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      automation_requeue_stuck: {
        Args: { _lock_ttl_seconds?: number }
        Returns: number
      }
      community_can_view_audience: {
        Args: {
          _audience: Database["public"]["Enums"]["community_audience"]
          _user: string
        }
        Returns: boolean
      }
      evaluate_ambassador_badges: {
        Args: { _ambassador_id: string }
        Returns: number
      }
      evaluate_ambassador_level: {
        Args: { _ambassador_id: string }
        Returns: string
      }
      generate_contact_reference: { Args: never; Returns: string }
      generate_employee_code: { Args: never; Returns: string }
      get_admin_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["admin_role_type"]
      }
      get_internal_links: {
        Args: {
          p_from_id: string
          p_from_type: Database["public"]["Enums"]["internal_link_entity"]
          p_limit?: number
          p_relation?: string
        }
        Returns: {
          reason: string
          relation: string
          score: number
          slug: string
          title: string
          to_id: string
          to_type: Database["public"]["Enums"]["internal_link_entity"]
        }[]
      }
      has_admin_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_brand_owner: {
        Args: { _brand_id: string; _user_id: string }
        Returns: boolean
      }
      is_community_moderator: { Args: { _user: string }; Returns: boolean }
      is_copilot_user: { Args: { _uid: string }; Returns: boolean }
      is_partner: { Args: { _user_id: string }; Returns: boolean }
      is_student: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      ma_agent_accessible: { Args: { _agent_id: string }; Returns: boolean }
      mask_account_number: { Args: { _num: string }; Returns: string }
      mask_upi_id: { Args: { _upi: string }; Returns: string }
      mkt_is_staff: { Args: { _uid: string }; Returns: boolean }
      normalize_email: { Args: { _email: string }; Returns: string }
      normalize_phone: { Args: { _phone: string }; Returns: string }
      notify_campaigns_ending_soon: { Args: never; Returns: number }
      partner_id_for: { Args: { _user_id: string }; Returns: string }
      promote_scheduled_content: { Args: never; Returns: undefined }
      rate_limit_incr: {
        Args: { _bucket_key: string; _delta?: number; _window_start: string }
        Returns: number
      }
      rebuild_internal_links: {
        Args: never
        Returns: {
          inserted: number
          relation: string
        }[]
      }
      recompute_pseo_interlinks: {
        Args: { p_page_id: string }
        Returns: number
      }
      scan_referral_patterns: { Args: never; Returns: number }
      seed_pseo_pages_for_course: {
        Args: { p_course_id: string }
        Returns: number
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      student_enrolled_in_course: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      tg_amb_notify_campaign_broadcast: {
        Args: {
          _campaign_id: string
          _dedupe_prefix: string
          _message: string
          _notif_type: string
          _participants_only: boolean
          _title: string
        }
        Returns: undefined
      }
      tg_amb_notify_insert: {
        Args: {
          p_action_route: string
          p_ambassador_id: string
          p_category: string
          p_dedupe_key: string
          p_message: string
          p_notif_type: string
          p_related_entity_id: string
          p_related_entity_type: string
          p_title: string
        }
        Returns: undefined
      }
      verify_certificate: {
        Args: { _code: string }
        Returns: {
          certificate_number: string
          certificate_type: string
          completion_date: string
          course_name: string
          is_valid: boolean
          issued_at: string
          student_name: string
        }[]
      }
    }
    Enums: {
      admin_account_status: "active" | "suspended" | "inactive"
      admin_role_type:
        | "super_admin"
        | "sales_admin"
        | "lead_manager"
        | "payment_verifier"
        | "payout_manager"
        | "referral_manager"
        | "brand_manager"
        | "support_agent"
        | "employment_admin"
        | "payroll_admin"
      ai_mentor_context_type:
        | "general"
        | "current_lesson"
        | "current_module"
        | "program"
        | "project"
        | "assignment"
        | "live_session"
        | "internship"
        | "career"
      ai_mentor_feedback_type: "helpful" | "not_helpful"
      ai_mentor_message_role: "student" | "mentor" | "system"
      ai_mentor_message_status: "sent" | "generating" | "completed" | "failed"
      amb_final_tie_policy: "shared_rank" | "stable_deterministic"
      amb_leaderboard_type:
        | "overall"
        | "monthly"
        | "college"
        | "program"
        | "campaign"
      amb_ranking_metric:
        | "verified_enrollments"
        | "valid_referral_leads"
        | "conversion_rate"
        | "weighted_performance_score"
        | "campaign_milestone_progress"
        | "program_verified_enrollments"
      amb_ranking_period_type:
        | "lifetime"
        | "monthly"
        | "campaign_window"
        | "program_lifetime"
      amb_tie_breaker_type:
        | "higher_verified_enrollments"
        | "higher_conversion_rate"
        | "higher_valid_referral_leads"
        | "higher_campaign_milestones"
        | "earlier_achievement_timestamp"
      amb_weighted_component:
        | "valid_referral_leads"
        | "verified_enrollments"
        | "conversion_rate"
        | "campaign_milestones"
        | "marketing_resource_usage"
      ambassador_attribution_status:
        | "valid"
        | "pending_review"
        | "conflict_review"
        | "confirmed"
        | "invalid"
        | "expired"
      ambassador_bank_account_type: "savings" | "current"
      ambassador_commission_status:
        | "pending_verification"
        | "eligible"
        | "approved"
        | "available"
        | "payout_processing"
        | "paid"
        | "on_hold"
        | "reversed"
        | "ineligible"
      ambassador_commission_txn_type:
        | "enrollment_commission"
        | "bonus_commission"
        | "positive_adjustment"
        | "negative_adjustment"
        | "recovery"
        | "correction"
      ambassador_payout_method: "bank_account" | "upi"
      ambassador_payout_profile_status:
        | "not_added"
        | "incomplete"
        | "submitted"
        | "under_review"
        | "more_info_required"
        | "verified"
        | "update_required"
        | "rejected"
      ambassador_payout_status:
        | "requested"
        | "under_review"
        | "approved"
        | "processing"
        | "paid"
        | "failed"
        | "on_hold"
        | "cancelled"
        | "reversed"
      ambassador_profile_status:
        | "active"
        | "suspended"
        | "inactive"
        | "terminated"
      app_role:
        | "super_admin"
        | "admin"
        | "partner_manager"
        | "partner"
        | "wl_owner"
        | "student"
        | "campus_ambassador"
        | "counsellor"
        | "brand_owner"
        | "instructor"
      application_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "more_info_required"
        | "approved"
        | "rejected"
        | "suspended"
      brand_application_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "information_required"
        | "approved"
        | "configuration_started"
        | "brand_design"
        | "website_setup"
        | "lms_setup"
        | "program_configuration"
        | "quality_review"
        | "launch_ready"
        | "launched"
        | "on_hold"
        | "rejected"
        | "suspended"
      brand_program_status:
        | "requested"
        | "under_review"
        | "approved"
        | "published"
        | "paused"
        | "rejected"
      brand_stage:
        | "configuration"
        | "brand_design"
        | "website_setup"
        | "lms_setup"
        | "program_configuration"
        | "quality_review"
        | "launch_ready"
        | "launched"
        | "on_hold"
        | "suspended"
      brand_task_priority: "low" | "medium" | "high" | "urgent"
      brand_task_status:
        | "not_started"
        | "in_progress"
        | "waiting_for_client"
        | "review_required"
        | "completed"
        | "blocked"
      ca_ambassador_status:
        | "active"
        | "temporarily_suspended"
        | "inactive"
        | "terminated"
      ca_application_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "more_info_required"
        | "approved"
        | "rejected"
        | "withdrawn"
      co_approval_stage: "marketing" | "seo" | "brand" | "final"
      co_approval_state:
        | "pending"
        | "approved"
        | "rejected"
        | "changes_requested"
      co_campaign_kind:
        | "course_launch"
        | "admissions"
        | "internship"
        | "hiring"
        | "scholarship"
        | "live_class"
        | "masterclass"
        | "discount"
        | "festival"
        | "referral"
        | "certification"
        | "partner_announcement"
        | "placement_drive"
        | "brand_awareness"
        | "email_campaign"
        | "webinar"
        | "bootcamp"
        | "ai_news"
        | "tech_update"
        | "success_story"
        | "custom"
      co_campaign_status:
        | "draft"
        | "planning"
        | "generating"
        | "review"
        | "approved"
        | "scheduled"
        | "publishing"
        | "running"
        | "paused"
        | "completed"
        | "archived"
        | "failed"
      co_task_kind:
        | "landing_page"
        | "blog"
        | "seo_meta"
        | "linkedin_post"
        | "linkedin_carousel"
        | "instagram_post"
        | "instagram_carousel"
        | "instagram_story"
        | "facebook_post"
        | "telegram_message"
        | "whatsapp_message"
        | "x_post"
        | "threads_post"
        | "youtube_community"
        | "email_welcome"
        | "email_campaign"
        | "email_reminder"
        | "email_last_chance"
        | "email_certificate"
        | "email_enrollment"
        | "newsletter"
        | "push_notification"
        | "video_reel"
        | "video_short"
        | "video_promo"
        | "video_explainer"
        | "video_ad"
        | "video_story"
        | "video_intro"
        | "voice_narration"
        | "poster"
        | "banner"
        | "carousel_slide"
        | "story_creative"
        | "course_cover"
        | "thumbnail"
        | "infographic"
        | "certificate_promo"
        | "faq"
      co_task_status:
        | "queued"
        | "generating"
        | "ready"
        | "failed"
        | "approved"
        | "rejected"
        | "scheduled"
        | "published"
      commission_status:
        | "calculated"
        | "under_verification"
        | "approved"
        | "on_hold"
        | "payout_processing"
        | "paid"
        | "cancelled"
        | "refund_adjusted"
        | "tracking"
        | "pending_verification"
        | "eligible"
        | "available_for_payout"
        | "reversed"
        | "rejected"
      community_audience:
        | "public"
        | "students"
        | "partners"
        | "mentors"
        | "brand_owners"
        | "staff"
      community_status: "pending" | "approved" | "hidden" | "deleted"
      community_thread_kind:
        | "discussion"
        | "question"
        | "poll"
        | "announcement"
        | "event"
      contact_enquiry_source:
        | "contact_page"
        | "ai_prepared"
        | "router"
        | "manual_topic"
      contact_enquiry_status: "submitted" | "in_review" | "routed" | "closed"
      contact_enquiry_topic:
        | "general"
        | "partnership"
        | "institution"
        | "business"
        | "media"
        | "careers"
        | "other"
      content_status:
        | "draft"
        | "published"
        | "archived"
        | "in_review"
        | "approved"
        | "scheduled"
      content_type:
        | "learn_guide"
        | "glossary"
        | "comparison"
        | "faq"
        | "roadmap"
        | "career_guide"
        | "interview_guide"
        | "cheat_sheet"
        | "learning_path"
        | "program_support"
      course_app_status:
        | "new"
        | "contacted"
        | "qualified"
        | "enrolled"
        | "rejected"
        | "archived"
      enrollment_status:
        | "received"
        | "under_verification"
        | "verified"
        | "cancelled"
        | "refund_full"
        | "refund_partial"
        | "fraud_review"
        | "duplicate"
      follow_up_status:
        | "scheduled"
        | "completed"
        | "missed"
        | "rescheduled"
        | "cancelled"
      follow_up_type: "call" | "whatsapp" | "email" | "meeting" | "other"
      internal_link_entity:
        | "course"
        | "blog"
        | "career_path"
        | "skill"
        | "certification"
        | "job"
        | "faq"
      internship_project_type:
        | "practice"
        | "industry_inspired"
        | "capstone"
        | "final"
      internship_stage_status:
        | "locked"
        | "available"
        | "in_progress"
        | "completed"
      internship_status:
        | "locked"
        | "eligible"
        | "active"
        | "in_progress"
        | "completion_review"
        | "completed"
        | "suspended"
        | "cancelled"
      internship_submission_review:
        | "pending"
        | "under_review"
        | "needs_revision"
        | "approved"
      internship_task_status:
        | "locked"
        | "available"
        | "in_progress"
        | "submitted"
        | "under_review"
        | "needs_revision"
        | "completed"
      internship_task_type:
        | "learning"
        | "research"
        | "practical"
        | "technical"
        | "case_study"
        | "industry"
        | "documentation"
        | "presentation"
        | "portfolio"
      interview_difficulty: "beginner" | "intermediate" | "advanced"
      interview_mode: "text" | "voice"
      interview_status: "in_progress" | "completed" | "incomplete"
      interview_type:
        | "technical"
        | "hr"
        | "behavioural"
        | "project"
        | "internship"
        | "mixed"
      lead_model: "own_leads" | "supported" | "not_sure"
      lead_ownership_review_status:
        | "pending_review"
        | "under_review"
        | "possible_duplicate"
        | "disputed"
        | "resolved_keep_existing"
        | "resolved_partner_own"
        | "resolved_glintr_provided"
        | "resolved_merged"
        | "rejected"
      lead_ownership_type: "partner_own" | "glintr_provided"
      lesson_type:
        | "video"
        | "text"
        | "pdf"
        | "quiz"
        | "assignment"
        | "live"
        | "project"
        | "external"
      live_session_status:
        | "scheduled"
        | "starting_soon"
        | "live"
        | "completed"
        | "cancelled"
        | "rescheduled"
      marketing_interaction_type:
        | "viewed"
        | "downloaded"
        | "caption_copied"
        | "share_message_copied"
        | "referral_link_copied"
        | "share_started"
        | "qr_downloaded"
        | "personalised_generated"
      marketing_issue_status:
        | "submitted"
        | "in_review"
        | "resolved"
        | "wont_fix"
      marketing_issue_type:
        | "broken_download"
        | "incorrect_program_info"
        | "outdated_price"
        | "incorrect_referral_link"
        | "image_quality"
        | "other"
      marketing_resource_status:
        | "draft"
        | "scheduled"
        | "published"
        | "paused"
        | "expired"
        | "archived"
      marketing_resource_type:
        | "program_poster"
        | "square_social"
        | "portrait_social"
        | "instagram_story"
        | "whatsapp_creative"
        | "linkedin_creative"
        | "program_banner"
        | "campaign_poster"
        | "caption_instagram"
        | "caption_linkedin"
        | "short_copy"
        | "whatsapp_message"
        | "story_text"
      mkt_approval_mode: "auto" | "manual" | "team_review"
      mkt_asset_kind:
        | "square"
        | "portrait"
        | "landscape"
        | "carousel_slide"
        | "quote"
        | "infographic"
        | "story"
        | "event_poster"
        | "course_poster"
        | "video"
        | "thumbnail"
      mkt_channel_kind:
        | "linkedin"
        | "instagram"
        | "facebook"
        | "twitter"
        | "threads"
        | "youtube_community"
        | "telegram"
        | "whatsapp_channel"
        | "blog"
        | "email"
      mkt_content_type:
        | "course_launch"
        | "career_tip"
        | "hiring_update"
        | "success_story"
        | "project_showcase"
        | "tech_news"
        | "ai_news"
        | "learning_tip"
        | "certification_promo"
        | "webinar"
        | "event"
        | "discount_campaign"
        | "internship"
        | "partner_announcement"
        | "custom"
      mkt_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "rejected"
        | "scheduled"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled"
      partner_activity_type:
        | "note"
        | "stage_change"
        | "follow_up_scheduled"
        | "follow_up_completed"
        | "link_shared"
        | "application_started"
        | "application_submitted"
        | "payment_recorded"
        | "enrollment_verified"
        | "revenue_pending"
        | "revenue_approved"
        | "revenue_reversed"
        | "assigned"
        | "reassigned"
      partner_agreement_kind:
        | "partner_terms"
        | "revenue_share"
        | "payout"
        | "lead_handling"
        | "data_privacy"
        | "anti_spam"
        | "refund_reversal"
      partner_brand_status:
        | "draft"
        | "pending_review"
        | "verified"
        | "needs_information"
        | "rejected"
        | "suspended"
      partner_brand_type: "own" | "partnered"
      partner_lead_attribution_status:
        | "confirmed"
        | "duplicate_review"
        | "conflict"
        | "admin_review"
        | "rejected"
      partner_lead_source:
        | "personal_network"
        | "referral"
        | "social_media"
        | "whatsapp"
        | "instagram"
        | "linkedin"
        | "website"
        | "event"
        | "college_network"
        | "assigned"
        | "other"
        | "website_counsellor"
      partner_lead_status:
        | "new"
        | "contacted"
        | "interested"
        | "follow_up"
        | "application_started"
        | "application_submitted"
        | "payment_pending"
        | "enrolled"
        | "not_interested"
        | "lost"
        | "invalid"
        | "duplicate"
        | "refunded"
        | "no_answer"
      partner_notification_type:
        | "new_lead_assigned"
        | "follow_up_due"
        | "application_submitted"
        | "payment_pending"
        | "enrollment_verified"
        | "revenue_pending"
        | "revenue_approved"
        | "payout_available"
        | "payout_processing"
        | "payout_paid"
        | "revenue_reversed"
        | "program_update"
        | "agreement_update"
        | "support_reply"
      partner_selling_model: "glintr" | "own" | "partnered" | "multiple"
      partner_status: "active" | "suspended" | "revoked"
      payment_link_status:
        | "assigned"
        | "payment_pending"
        | "verified"
        | "rejected"
        | "expired"
      payment_method:
        | "upi"
        | "bank_transfer"
        | "payment_gateway"
        | "card"
        | "other"
      payment_plan: "self_paced_edge" | "career_launch" | "career_pro"
      payment_submission_status:
        | "pending_verification"
        | "under_review"
        | "verified"
        | "rejected"
        | "needs_more_info"
        | "duplicate_flagged"
      payout_status:
        | "queued"
        | "processing"
        | "paid"
        | "failed"
        | "on_hold"
        | "cancelled"
        | "requested"
        | "under_review"
        | "approved"
        | "rejected"
        | "reversed"
      referral_event: "visit" | "lead" | "application" | "enrollment"
      refund_adjustment_status:
        | "pending"
        | "approved"
        | "rejected"
        | "applied"
        | "reversed"
      refund_adjustment_type:
        | "full_refund"
        | "partial_refund"
        | "chargeback"
        | "cancelled_enrollment"
        | "failed_payment"
        | "duplicate_enrollment"
        | "fraud_review"
        | "manual_adjustment"
      risk_flag_severity: "low" | "medium" | "high"
      risk_flag_status:
        | "open"
        | "under_review"
        | "needs_information"
        | "resolved"
        | "dismissed"
      risk_flag_type:
        | "duplicate_utr"
        | "possible_duplicate_proof"
        | "unexpected_payment_amount"
        | "lead_multi_partner"
        | "lead_ownership_conflict"
        | "repeated_payment_submission"
        | "unusual_sales_activity"
        | "suspicious_referral_pattern"
        | "repeated_duplicate_lead_uploads"
        | "other"
      session_attendance_status:
        | "not_marked"
        | "attended"
        | "partially_attended"
        | "missed"
        | "excused"
      session_resource_type:
        | "pdf"
        | "presentation"
        | "document"
        | "dataset"
        | "code"
        | "link"
        | "other"
      student_support_category:
        | "program_access"
        | "lesson_or_video"
        | "learning_progress"
        | "live_session"
        | "project"
        | "assignment"
        | "certificate"
        | "internship"
        | "career_center"
        | "resume_builder"
        | "interview_practice"
        | "ai_mentor"
        | "technical_issue"
        | "account_issue"
        | "other"
      student_support_context_type:
        | "none"
        | "program"
        | "lesson"
        | "live_session"
        | "project"
        | "assignment"
        | "certificate"
        | "internship"
        | "internship_task"
        | "resume"
        | "interview_session"
        | "ai_mentor_conversation"
      student_support_priority: "low" | "normal" | "high" | "urgent"
      student_support_status:
        | "open"
        | "assigned"
        | "in_progress"
        | "waiting_student"
        | "waiting_support"
        | "resolved"
        | "closed"
      support_ticket_category:
        | "lead_attribution"
        | "revenue_share"
        | "payout"
        | "program_information"
        | "technical"
        | "application"
        | "account"
        | "other"
        | "lead_issue"
        | "lead_ownership"
        | "payment_verification"
        | "duplicate_utr"
        | "payout_delay"
        | "earnings_issue"
        | "referral_bonus"
        | "brand_approval"
        | "account_problem"
        | "full_time_application"
        | "employment_payroll"
        | "program_question"
        | "payment_link_issue"
        | "technical_issue"
      support_ticket_status:
        | "open"
        | "assigned"
        | "waiting_partner"
        | "under_review"
        | "resolved"
        | "closed"
        | "admin_replied"
      vs_asset_kind:
        | "video"
        | "thumbnail"
        | "voice"
        | "music"
        | "subtitle_srt"
        | "subtitle_vtt"
        | "image"
        | "logo"
        | "project_file"
        | "scene_clip"
        | "preview"
        | "other"
      vs_job_status:
        | "queued"
        | "running"
        | "succeeded"
        | "failed"
        | "cancelled"
        | "retrying"
      vs_project_status:
        | "draft"
        | "brief"
        | "storyboard"
        | "generating"
        | "ready"
        | "failed"
        | "archived"
        | "published"
      vs_video_format:
        | "instagram_reel"
        | "youtube_short"
        | "tiktok"
        | "linkedin_video"
        | "facebook_video"
        | "course_promo"
        | "webinar_promo"
        | "workshop_promo"
        | "internship_promo"
        | "hiring"
        | "explainer"
        | "product_demo"
        | "feature_announcement"
        | "success_story"
        | "testimonial"
        | "corporate"
        | "avatar"
        | "slideshow"
        | "educational"
        | "animated_presentation"
      working_pref: "part_time" | "full_time" | "freelance" | "launch_brand"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admin_account_status: ["active", "suspended", "inactive"],
      admin_role_type: [
        "super_admin",
        "sales_admin",
        "lead_manager",
        "payment_verifier",
        "payout_manager",
        "referral_manager",
        "brand_manager",
        "support_agent",
        "employment_admin",
        "payroll_admin",
      ],
      ai_mentor_context_type: [
        "general",
        "current_lesson",
        "current_module",
        "program",
        "project",
        "assignment",
        "live_session",
        "internship",
        "career",
      ],
      ai_mentor_feedback_type: ["helpful", "not_helpful"],
      ai_mentor_message_role: ["student", "mentor", "system"],
      ai_mentor_message_status: ["sent", "generating", "completed", "failed"],
      amb_final_tie_policy: ["shared_rank", "stable_deterministic"],
      amb_leaderboard_type: [
        "overall",
        "monthly",
        "college",
        "program",
        "campaign",
      ],
      amb_ranking_metric: [
        "verified_enrollments",
        "valid_referral_leads",
        "conversion_rate",
        "weighted_performance_score",
        "campaign_milestone_progress",
        "program_verified_enrollments",
      ],
      amb_ranking_period_type: [
        "lifetime",
        "monthly",
        "campaign_window",
        "program_lifetime",
      ],
      amb_tie_breaker_type: [
        "higher_verified_enrollments",
        "higher_conversion_rate",
        "higher_valid_referral_leads",
        "higher_campaign_milestones",
        "earlier_achievement_timestamp",
      ],
      amb_weighted_component: [
        "valid_referral_leads",
        "verified_enrollments",
        "conversion_rate",
        "campaign_milestones",
        "marketing_resource_usage",
      ],
      ambassador_attribution_status: [
        "valid",
        "pending_review",
        "conflict_review",
        "confirmed",
        "invalid",
        "expired",
      ],
      ambassador_bank_account_type: ["savings", "current"],
      ambassador_commission_status: [
        "pending_verification",
        "eligible",
        "approved",
        "available",
        "payout_processing",
        "paid",
        "on_hold",
        "reversed",
        "ineligible",
      ],
      ambassador_commission_txn_type: [
        "enrollment_commission",
        "bonus_commission",
        "positive_adjustment",
        "negative_adjustment",
        "recovery",
        "correction",
      ],
      ambassador_payout_method: ["bank_account", "upi"],
      ambassador_payout_profile_status: [
        "not_added",
        "incomplete",
        "submitted",
        "under_review",
        "more_info_required",
        "verified",
        "update_required",
        "rejected",
      ],
      ambassador_payout_status: [
        "requested",
        "under_review",
        "approved",
        "processing",
        "paid",
        "failed",
        "on_hold",
        "cancelled",
        "reversed",
      ],
      ambassador_profile_status: [
        "active",
        "suspended",
        "inactive",
        "terminated",
      ],
      app_role: [
        "super_admin",
        "admin",
        "partner_manager",
        "partner",
        "wl_owner",
        "student",
        "campus_ambassador",
        "counsellor",
        "brand_owner",
        "instructor",
      ],
      application_status: [
        "draft",
        "submitted",
        "under_review",
        "more_info_required",
        "approved",
        "rejected",
        "suspended",
      ],
      brand_application_status: [
        "draft",
        "submitted",
        "under_review",
        "information_required",
        "approved",
        "configuration_started",
        "brand_design",
        "website_setup",
        "lms_setup",
        "program_configuration",
        "quality_review",
        "launch_ready",
        "launched",
        "on_hold",
        "rejected",
        "suspended",
      ],
      brand_program_status: [
        "requested",
        "under_review",
        "approved",
        "published",
        "paused",
        "rejected",
      ],
      brand_stage: [
        "configuration",
        "brand_design",
        "website_setup",
        "lms_setup",
        "program_configuration",
        "quality_review",
        "launch_ready",
        "launched",
        "on_hold",
        "suspended",
      ],
      brand_task_priority: ["low", "medium", "high", "urgent"],
      brand_task_status: [
        "not_started",
        "in_progress",
        "waiting_for_client",
        "review_required",
        "completed",
        "blocked",
      ],
      ca_ambassador_status: [
        "active",
        "temporarily_suspended",
        "inactive",
        "terminated",
      ],
      ca_application_status: [
        "draft",
        "submitted",
        "under_review",
        "more_info_required",
        "approved",
        "rejected",
        "withdrawn",
      ],
      co_approval_stage: ["marketing", "seo", "brand", "final"],
      co_approval_state: [
        "pending",
        "approved",
        "rejected",
        "changes_requested",
      ],
      co_campaign_kind: [
        "course_launch",
        "admissions",
        "internship",
        "hiring",
        "scholarship",
        "live_class",
        "masterclass",
        "discount",
        "festival",
        "referral",
        "certification",
        "partner_announcement",
        "placement_drive",
        "brand_awareness",
        "email_campaign",
        "webinar",
        "bootcamp",
        "ai_news",
        "tech_update",
        "success_story",
        "custom",
      ],
      co_campaign_status: [
        "draft",
        "planning",
        "generating",
        "review",
        "approved",
        "scheduled",
        "publishing",
        "running",
        "paused",
        "completed",
        "archived",
        "failed",
      ],
      co_task_kind: [
        "landing_page",
        "blog",
        "seo_meta",
        "linkedin_post",
        "linkedin_carousel",
        "instagram_post",
        "instagram_carousel",
        "instagram_story",
        "facebook_post",
        "telegram_message",
        "whatsapp_message",
        "x_post",
        "threads_post",
        "youtube_community",
        "email_welcome",
        "email_campaign",
        "email_reminder",
        "email_last_chance",
        "email_certificate",
        "email_enrollment",
        "newsletter",
        "push_notification",
        "video_reel",
        "video_short",
        "video_promo",
        "video_explainer",
        "video_ad",
        "video_story",
        "video_intro",
        "voice_narration",
        "poster",
        "banner",
        "carousel_slide",
        "story_creative",
        "course_cover",
        "thumbnail",
        "infographic",
        "certificate_promo",
        "faq",
      ],
      co_task_status: [
        "queued",
        "generating",
        "ready",
        "failed",
        "approved",
        "rejected",
        "scheduled",
        "published",
      ],
      commission_status: [
        "calculated",
        "under_verification",
        "approved",
        "on_hold",
        "payout_processing",
        "paid",
        "cancelled",
        "refund_adjusted",
        "tracking",
        "pending_verification",
        "eligible",
        "available_for_payout",
        "reversed",
        "rejected",
      ],
      community_audience: [
        "public",
        "students",
        "partners",
        "mentors",
        "brand_owners",
        "staff",
      ],
      community_status: ["pending", "approved", "hidden", "deleted"],
      community_thread_kind: [
        "discussion",
        "question",
        "poll",
        "announcement",
        "event",
      ],
      contact_enquiry_source: [
        "contact_page",
        "ai_prepared",
        "router",
        "manual_topic",
      ],
      contact_enquiry_status: ["submitted", "in_review", "routed", "closed"],
      contact_enquiry_topic: [
        "general",
        "partnership",
        "institution",
        "business",
        "media",
        "careers",
        "other",
      ],
      content_status: [
        "draft",
        "published",
        "archived",
        "in_review",
        "approved",
        "scheduled",
      ],
      content_type: [
        "learn_guide",
        "glossary",
        "comparison",
        "faq",
        "roadmap",
        "career_guide",
        "interview_guide",
        "cheat_sheet",
        "learning_path",
        "program_support",
      ],
      course_app_status: [
        "new",
        "contacted",
        "qualified",
        "enrolled",
        "rejected",
        "archived",
      ],
      enrollment_status: [
        "received",
        "under_verification",
        "verified",
        "cancelled",
        "refund_full",
        "refund_partial",
        "fraud_review",
        "duplicate",
      ],
      follow_up_status: [
        "scheduled",
        "completed",
        "missed",
        "rescheduled",
        "cancelled",
      ],
      follow_up_type: ["call", "whatsapp", "email", "meeting", "other"],
      internal_link_entity: [
        "course",
        "blog",
        "career_path",
        "skill",
        "certification",
        "job",
        "faq",
      ],
      internship_project_type: [
        "practice",
        "industry_inspired",
        "capstone",
        "final",
      ],
      internship_stage_status: [
        "locked",
        "available",
        "in_progress",
        "completed",
      ],
      internship_status: [
        "locked",
        "eligible",
        "active",
        "in_progress",
        "completion_review",
        "completed",
        "suspended",
        "cancelled",
      ],
      internship_submission_review: [
        "pending",
        "under_review",
        "needs_revision",
        "approved",
      ],
      internship_task_status: [
        "locked",
        "available",
        "in_progress",
        "submitted",
        "under_review",
        "needs_revision",
        "completed",
      ],
      internship_task_type: [
        "learning",
        "research",
        "practical",
        "technical",
        "case_study",
        "industry",
        "documentation",
        "presentation",
        "portfolio",
      ],
      interview_difficulty: ["beginner", "intermediate", "advanced"],
      interview_mode: ["text", "voice"],
      interview_status: ["in_progress", "completed", "incomplete"],
      interview_type: [
        "technical",
        "hr",
        "behavioural",
        "project",
        "internship",
        "mixed",
      ],
      lead_model: ["own_leads", "supported", "not_sure"],
      lead_ownership_review_status: [
        "pending_review",
        "under_review",
        "possible_duplicate",
        "disputed",
        "resolved_keep_existing",
        "resolved_partner_own",
        "resolved_glintr_provided",
        "resolved_merged",
        "rejected",
      ],
      lead_ownership_type: ["partner_own", "glintr_provided"],
      lesson_type: [
        "video",
        "text",
        "pdf",
        "quiz",
        "assignment",
        "live",
        "project",
        "external",
      ],
      live_session_status: [
        "scheduled",
        "starting_soon",
        "live",
        "completed",
        "cancelled",
        "rescheduled",
      ],
      marketing_interaction_type: [
        "viewed",
        "downloaded",
        "caption_copied",
        "share_message_copied",
        "referral_link_copied",
        "share_started",
        "qr_downloaded",
        "personalised_generated",
      ],
      marketing_issue_status: [
        "submitted",
        "in_review",
        "resolved",
        "wont_fix",
      ],
      marketing_issue_type: [
        "broken_download",
        "incorrect_program_info",
        "outdated_price",
        "incorrect_referral_link",
        "image_quality",
        "other",
      ],
      marketing_resource_status: [
        "draft",
        "scheduled",
        "published",
        "paused",
        "expired",
        "archived",
      ],
      marketing_resource_type: [
        "program_poster",
        "square_social",
        "portrait_social",
        "instagram_story",
        "whatsapp_creative",
        "linkedin_creative",
        "program_banner",
        "campaign_poster",
        "caption_instagram",
        "caption_linkedin",
        "short_copy",
        "whatsapp_message",
        "story_text",
      ],
      mkt_approval_mode: ["auto", "manual", "team_review"],
      mkt_asset_kind: [
        "square",
        "portrait",
        "landscape",
        "carousel_slide",
        "quote",
        "infographic",
        "story",
        "event_poster",
        "course_poster",
        "video",
        "thumbnail",
      ],
      mkt_channel_kind: [
        "linkedin",
        "instagram",
        "facebook",
        "twitter",
        "threads",
        "youtube_community",
        "telegram",
        "whatsapp_channel",
        "blog",
        "email",
      ],
      mkt_content_type: [
        "course_launch",
        "career_tip",
        "hiring_update",
        "success_story",
        "project_showcase",
        "tech_news",
        "ai_news",
        "learning_tip",
        "certification_promo",
        "webinar",
        "event",
        "discount_campaign",
        "internship",
        "partner_announcement",
        "custom",
      ],
      mkt_status: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "scheduled",
        "publishing",
        "published",
        "failed",
        "cancelled",
      ],
      partner_activity_type: [
        "note",
        "stage_change",
        "follow_up_scheduled",
        "follow_up_completed",
        "link_shared",
        "application_started",
        "application_submitted",
        "payment_recorded",
        "enrollment_verified",
        "revenue_pending",
        "revenue_approved",
        "revenue_reversed",
        "assigned",
        "reassigned",
      ],
      partner_agreement_kind: [
        "partner_terms",
        "revenue_share",
        "payout",
        "lead_handling",
        "data_privacy",
        "anti_spam",
        "refund_reversal",
      ],
      partner_brand_status: [
        "draft",
        "pending_review",
        "verified",
        "needs_information",
        "rejected",
        "suspended",
      ],
      partner_brand_type: ["own", "partnered"],
      partner_lead_attribution_status: [
        "confirmed",
        "duplicate_review",
        "conflict",
        "admin_review",
        "rejected",
      ],
      partner_lead_source: [
        "personal_network",
        "referral",
        "social_media",
        "whatsapp",
        "instagram",
        "linkedin",
        "website",
        "event",
        "college_network",
        "assigned",
        "other",
        "website_counsellor",
      ],
      partner_lead_status: [
        "new",
        "contacted",
        "interested",
        "follow_up",
        "application_started",
        "application_submitted",
        "payment_pending",
        "enrolled",
        "not_interested",
        "lost",
        "invalid",
        "duplicate",
        "refunded",
        "no_answer",
      ],
      partner_notification_type: [
        "new_lead_assigned",
        "follow_up_due",
        "application_submitted",
        "payment_pending",
        "enrollment_verified",
        "revenue_pending",
        "revenue_approved",
        "payout_available",
        "payout_processing",
        "payout_paid",
        "revenue_reversed",
        "program_update",
        "agreement_update",
        "support_reply",
      ],
      partner_selling_model: ["glintr", "own", "partnered", "multiple"],
      partner_status: ["active", "suspended", "revoked"],
      payment_link_status: [
        "assigned",
        "payment_pending",
        "verified",
        "rejected",
        "expired",
      ],
      payment_method: [
        "upi",
        "bank_transfer",
        "payment_gateway",
        "card",
        "other",
      ],
      payment_plan: ["self_paced_edge", "career_launch", "career_pro"],
      payment_submission_status: [
        "pending_verification",
        "under_review",
        "verified",
        "rejected",
        "needs_more_info",
        "duplicate_flagged",
      ],
      payout_status: [
        "queued",
        "processing",
        "paid",
        "failed",
        "on_hold",
        "cancelled",
        "requested",
        "under_review",
        "approved",
        "rejected",
        "reversed",
      ],
      referral_event: ["visit", "lead", "application", "enrollment"],
      refund_adjustment_status: [
        "pending",
        "approved",
        "rejected",
        "applied",
        "reversed",
      ],
      refund_adjustment_type: [
        "full_refund",
        "partial_refund",
        "chargeback",
        "cancelled_enrollment",
        "failed_payment",
        "duplicate_enrollment",
        "fraud_review",
        "manual_adjustment",
      ],
      risk_flag_severity: ["low", "medium", "high"],
      risk_flag_status: [
        "open",
        "under_review",
        "needs_information",
        "resolved",
        "dismissed",
      ],
      risk_flag_type: [
        "duplicate_utr",
        "possible_duplicate_proof",
        "unexpected_payment_amount",
        "lead_multi_partner",
        "lead_ownership_conflict",
        "repeated_payment_submission",
        "unusual_sales_activity",
        "suspicious_referral_pattern",
        "repeated_duplicate_lead_uploads",
        "other",
      ],
      session_attendance_status: [
        "not_marked",
        "attended",
        "partially_attended",
        "missed",
        "excused",
      ],
      session_resource_type: [
        "pdf",
        "presentation",
        "document",
        "dataset",
        "code",
        "link",
        "other",
      ],
      student_support_category: [
        "program_access",
        "lesson_or_video",
        "learning_progress",
        "live_session",
        "project",
        "assignment",
        "certificate",
        "internship",
        "career_center",
        "resume_builder",
        "interview_practice",
        "ai_mentor",
        "technical_issue",
        "account_issue",
        "other",
      ],
      student_support_context_type: [
        "none",
        "program",
        "lesson",
        "live_session",
        "project",
        "assignment",
        "certificate",
        "internship",
        "internship_task",
        "resume",
        "interview_session",
        "ai_mentor_conversation",
      ],
      student_support_priority: ["low", "normal", "high", "urgent"],
      student_support_status: [
        "open",
        "assigned",
        "in_progress",
        "waiting_student",
        "waiting_support",
        "resolved",
        "closed",
      ],
      support_ticket_category: [
        "lead_attribution",
        "revenue_share",
        "payout",
        "program_information",
        "technical",
        "application",
        "account",
        "other",
        "lead_issue",
        "lead_ownership",
        "payment_verification",
        "duplicate_utr",
        "payout_delay",
        "earnings_issue",
        "referral_bonus",
        "brand_approval",
        "account_problem",
        "full_time_application",
        "employment_payroll",
        "program_question",
        "payment_link_issue",
        "technical_issue",
      ],
      support_ticket_status: [
        "open",
        "assigned",
        "waiting_partner",
        "under_review",
        "resolved",
        "closed",
        "admin_replied",
      ],
      vs_asset_kind: [
        "video",
        "thumbnail",
        "voice",
        "music",
        "subtitle_srt",
        "subtitle_vtt",
        "image",
        "logo",
        "project_file",
        "scene_clip",
        "preview",
        "other",
      ],
      vs_job_status: [
        "queued",
        "running",
        "succeeded",
        "failed",
        "cancelled",
        "retrying",
      ],
      vs_project_status: [
        "draft",
        "brief",
        "storyboard",
        "generating",
        "ready",
        "failed",
        "archived",
        "published",
      ],
      vs_video_format: [
        "instagram_reel",
        "youtube_short",
        "tiktok",
        "linkedin_video",
        "facebook_video",
        "course_promo",
        "webinar_promo",
        "workshop_promo",
        "internship_promo",
        "hiring",
        "explainer",
        "product_demo",
        "feature_announcement",
        "success_story",
        "testimonial",
        "corporate",
        "avatar",
        "slideshow",
        "educational",
        "animated_presentation",
      ],
      working_pref: ["part_time", "full_time", "freelance", "launch_brand"],
    },
  },
} as const

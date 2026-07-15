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
          base_price: number | null
          canonical_url: string | null
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
          hero_image_url: string | null
          id: string
          is_bestseller: boolean
          is_featured: boolean
          is_popular: boolean
          is_published: boolean
          is_trending: boolean
          language: string | null
          learning_mode: string | null
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
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          supported_sales_eligible: boolean
          target_audience: string | null
          tax_config: Json | null
          thumbnail_url: string | null
          unlock_mode: string
          updated_at: string
          updated_by: string | null
          weekly_commitment: string | null
          white_label_eligible: boolean
        }
        Insert: {
          base_price?: number | null
          canonical_url?: string | null
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
          hero_image_url?: string | null
          id?: string
          is_bestseller?: boolean
          is_featured?: boolean
          is_popular?: boolean
          is_published?: boolean
          is_trending?: boolean
          language?: string | null
          learning_mode?: string | null
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
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          supported_sales_eligible?: boolean
          target_audience?: string | null
          tax_config?: Json | null
          thumbnail_url?: string | null
          unlock_mode?: string
          updated_at?: string
          updated_by?: string | null
          weekly_commitment?: string | null
          white_label_eligible?: boolean
        }
        Update: {
          base_price?: number | null
          canonical_url?: string | null
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
          hero_image_url?: string | null
          id?: string
          is_bestseller?: boolean
          is_featured?: boolean
          is_popular?: boolean
          is_published?: boolean
          is_trending?: boolean
          language?: string | null
          learning_mode?: string | null
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
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          supported_sales_eligible?: boolean
          target_audience?: string | null
          tax_config?: Json | null
          thumbnail_url?: string | null
          unlock_mode?: string
          updated_at?: string
          updated_by?: string | null
          weekly_commitment?: string | null
          white_label_eligible?: boolean
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
      live_sessions: {
        Row: {
          cancellation_note: string | null
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          id: string
          is_published: boolean
          join_window_minutes: number
          learning_topics: string[]
          meeting_url: string | null
          mentor_id: string | null
          module_id: string | null
          previous_scheduled_at: string | null
          recording_url: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["live_session_status"]
          title: string
          updated_at: string
        }
        Insert: {
          cancellation_note?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_published?: boolean
          join_window_minutes?: number
          learning_topics?: string[]
          meeting_url?: string | null
          mentor_id?: string | null
          module_id?: string | null
          previous_scheduled_at?: string | null
          recording_url?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["live_session_status"]
          title: string
          updated_at?: string
        }
        Update: {
          cancellation_note?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_published?: boolean
          join_window_minutes?: number
          learning_topics?: string[]
          meeting_url?: string | null
          mentor_id?: string | null
          module_id?: string | null
          previous_scheduled_at?: string | null
          recording_url?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["live_session_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
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
    }
    Views: {
      [_ in never]: never
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
      evaluate_ambassador_badges: {
        Args: { _ambassador_id: string }
        Returns: number
      }
      evaluate_ambassador_level: {
        Args: { _ambassador_id: string }
        Returns: string
      }
      generate_employee_code: { Args: never; Returns: string }
      get_admin_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["admin_role_type"]
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
      is_partner: { Args: { _user_id: string }; Returns: boolean }
      is_student: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      mask_account_number: { Args: { _num: string }; Returns: string }
      mask_upi_id: { Args: { _upi: string }; Returns: string }
      normalize_email: { Args: { _email: string }; Returns: string }
      normalize_phone: { Args: { _phone: string }; Returns: string }
      notify_campaigns_ending_soon: { Args: never; Returns: number }
      partner_id_for: { Args: { _user_id: string }; Returns: string }
      scan_referral_patterns: { Args: never; Returns: number }
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
      content_status: "draft" | "published" | "archived"
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
      content_status: ["draft", "published", "archived"],
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
      working_pref: ["part_time", "full_time", "freelance", "launch_brand"],
    },
  },
} as const

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
      commissions: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          commission_amount: number
          created_at: string
          eligible_revenue: number
          enrollment_id: string
          gross_revenue: number
          id: string
          lead_source: string | null
          partner_id: string
          payout_at: string | null
          program_id: string
          refund_adjustment: number
          revenue_share_pct: number
          revenue_share_rule_id: string | null
          status: Database["public"]["Enums"]["commission_status"]
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          commission_amount: number
          created_at?: string
          eligible_revenue: number
          enrollment_id: string
          gross_revenue: number
          id?: string
          lead_source?: string | null
          partner_id: string
          payout_at?: string | null
          program_id: string
          refund_adjustment?: number
          revenue_share_pct: number
          revenue_share_rule_id?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          commission_amount?: number
          created_at?: string
          eligible_revenue?: number
          enrollment_id?: string
          gross_revenue?: number
          id?: string
          lead_source?: string | null
          partner_id?: string
          payout_at?: string | null
          program_id?: string
          refund_adjustment?: number
          revenue_share_pct?: number
          revenue_share_rule_id?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
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
        ]
      }
      enrollments: {
        Row: {
          created_at: string
          eligible_revenue: number
          enrolled_at: string
          gross_revenue: number
          id: string
          lead_source: string | null
          partner_id: string | null
          program_id: string
          program_title: string
          status: Database["public"]["Enums"]["enrollment_status"]
          student_email: string | null
          student_name: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          eligible_revenue: number
          enrolled_at?: string
          gross_revenue: number
          id?: string
          lead_source?: string | null
          partner_id?: string | null
          program_id: string
          program_title: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_email?: string | null
          student_name: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          eligible_revenue?: number
          enrolled_at?: string
          gross_revenue?: number
          id?: string
          lead_source?: string | null
          partner_id?: string | null
          program_id?: string
          program_title?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_email?: string | null
          student_name?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
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
      partners: {
        Row: {
          application_id: string | null
          created_at: string
          default_revenue_share: number
          display_name: string
          email: string
          id: string
          kyc_completed: boolean
          lead_model: Database["public"]["Enums"]["lead_model"]
          manager_id: string | null
          mobile: string | null
          partner_code: string | null
          status: Database["public"]["Enums"]["partner_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          default_revenue_share?: number
          display_name: string
          email: string
          id?: string
          kyc_completed?: boolean
          lead_model?: Database["public"]["Enums"]["lead_model"]
          manager_id?: string | null
          mobile?: string | null
          partner_code?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string
          default_revenue_share?: number
          display_name?: string
          email?: string
          id?: string
          kyc_completed?: boolean
          lead_model?: Database["public"]["Enums"]["lead_model"]
          manager_id?: string | null
          mobile?: string | null
          partner_code?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
          user_id?: string | null
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
          created_at: string
          id: string
          partner_id: string
          processed_at: string | null
          reference: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          partner_id: string
          processed_at?: string | null
          reference?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          partner_id?: string
          processed_at?: string | null
          reference?: string | null
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
      refund_adjustments: {
        Row: {
          adjustment_amount: number
          commission_id: string
          created_at: string
          created_by: string | null
          enrollment_id: string | null
          id: string
          reason: string
        }
        Insert: {
          adjustment_amount: number
          commission_id: string
          created_at?: string
          created_by?: string | null
          enrollment_id?: string | null
          id?: string
          reason: string
        }
        Update: {
          adjustment_amount?: number
          commission_id?: string
          created_at?: string
          created_by?: string | null
          enrollment_id?: string | null
          id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "partner_manager"
        | "partner"
        | "wl_owner"
        | "student"
      application_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "more_info_required"
        | "approved"
        | "rejected"
        | "suspended"
      commission_status:
        | "calculated"
        | "under_verification"
        | "approved"
        | "on_hold"
        | "payout_processing"
        | "paid"
        | "cancelled"
        | "refund_adjusted"
      enrollment_status:
        | "received"
        | "under_verification"
        | "verified"
        | "cancelled"
        | "refund_full"
        | "refund_partial"
        | "fraud_review"
        | "duplicate"
      lead_model: "own_leads" | "supported" | "not_sure"
      partner_status: "active" | "suspended" | "revoked"
      payout_status:
        | "queued"
        | "processing"
        | "paid"
        | "failed"
        | "on_hold"
        | "cancelled"
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
      app_role: [
        "super_admin",
        "admin",
        "partner_manager",
        "partner",
        "wl_owner",
        "student",
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
      commission_status: [
        "calculated",
        "under_verification",
        "approved",
        "on_hold",
        "payout_processing",
        "paid",
        "cancelled",
        "refund_adjusted",
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
      lead_model: ["own_leads", "supported", "not_sure"],
      partner_status: ["active", "suspended", "revoked"],
      payout_status: [
        "queued",
        "processing",
        "paid",
        "failed",
        "on_hold",
        "cancelled",
      ],
      working_pref: ["part_time", "full_time", "freelance", "launch_brand"],
    },
  },
} as const

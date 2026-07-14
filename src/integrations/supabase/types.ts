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
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_feedback: string | null
          status: string
          student_user_id: string
          submission_notes: string | null
          submission_text: string | null
          submitted_at: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          course_id: string
          created_at?: string
          enrollment_id?: string | null
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_feedback?: string | null
          status?: string
          student_user_id: string
          submission_notes?: string | null
          submission_text?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          course_id?: string
          created_at?: string
          enrollment_id?: string | null
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_feedback?: string | null
          status?: string
          student_user_id?: string
          submission_notes?: string | null
          submission_text?: string | null
          submitted_at?: string
          updated_at?: string
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
          allow_text: boolean
          course_id: string
          created_at: string
          description: string | null
          display_order: number
          due_days: number | null
          id: string
          instructions: string | null
          is_published: boolean
          is_required: boolean
          module_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          allow_file?: boolean
          allow_text?: boolean
          course_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          due_days?: number | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          is_required?: boolean
          module_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          allow_file?: boolean
          allow_text?: boolean
          course_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          due_days?: number | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          is_required?: boolean
          module_id?: string | null
          name?: string
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
          created_at: string
          display_order: number
          duration: string | null
          id: string
          is_free_preview: boolean
          is_published: boolean
          lesson_type: Database["public"]["Enums"]["lesson_type"]
          name: string
          resource_url: string | null
          topic_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          duration?: string | null
          id?: string
          is_free_preview?: boolean
          is_published?: boolean
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          name: string
          resource_url?: string | null
          topic_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          duration?: string | null
          id?: string
          is_free_preview?: boolean
          is_published?: boolean
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
          full_description: string | null
          id: string
          image_url: string | null
          industry: string | null
          is_active: boolean
          learning_outcomes: string[] | null
          name: string
          project_type: string | null
          short_description: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          duration?: string | null
          full_description?: string | null
          id?: string
          image_url?: string | null
          industry?: string | null
          is_active?: boolean
          learning_outcomes?: string[] | null
          name: string
          project_type?: string | null
          short_description?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          duration?: string | null
          full_description?: string | null
          id?: string
          image_url?: string | null
          industry?: string | null
          is_active?: boolean
          learning_outcomes?: string[] | null
          name?: string
          project_type?: string | null
          short_description?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_projects: {
        Row: {
          course_id: string
          display_order: number
          project_id: string
        }
        Insert: {
          course_id: string
          display_order?: number
          project_id: string
        }
        Update: {
          course_id?: string
          display_order?: number
          project_id?: string
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
            foreignKeyName: "course_projects_project_id_fkey"
            columns: ["project_id"]
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
          completed_at: string | null
          course_id: string | null
          created_at: string
          eligible_revenue: number
          enrolled_at: string
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
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          eligible_revenue: number
          enrolled_at?: string
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
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          eligible_revenue?: number
          enrolled_at?: string
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
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
      lesson_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          enrollment_id: string | null
          id: string
          last_accessed_at: string
          lesson_id: string
          started_at: string
          status: string
          student_user_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          last_accessed_at?: string
          lesson_id: string
          started_at?: string
          status?: string
          student_user_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          last_accessed_at?: string
          lesson_id?: string
          started_at?: string
          status?: string
          student_user_id?: string
          updated_at?: string
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
      generate_employee_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_brand_owner: {
        Args: { _brand_id: string; _user_id: string }
        Returns: boolean
      }
      is_partner: { Args: { _user_id: string }; Returns: boolean }
      is_student: { Args: { _user_id: string }; Returns: boolean }
      normalize_email: { Args: { _email: string }; Returns: string }
      normalize_phone: { Args: { _phone: string }; Returns: string }
      partner_id_for: { Args: { _user_id: string }; Returns: string }
      student_enrolled_in_course: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
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

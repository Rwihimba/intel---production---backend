export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type WithRelationships<T> = {
  [K in keyof T]: T[K] & { Relationships: [] };
};

type _PublicTables = {
      organisations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          timezone: string | null;
          currency_primary: Database['public']['Enums']['currency'] | null;
          currency_secondary: Database['public']['Enums']['currency'] | null;
          usd_rwf_rate: number | null;
          google_workspace_domain: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          timezone?: string | null;
          currency_primary?: Database['public']['Enums']['currency'] | null;
          currency_secondary?: Database['public']['Enums']['currency'] | null;
          usd_rwf_rate?: number | null;
          google_workspace_domain?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          timezone?: string | null;
          currency_primary?: Database['public']['Enums']['currency'] | null;
          currency_secondary?: Database['public']['Enums']['currency'] | null;
          usd_rwf_rate?: number | null;
          google_workspace_domain?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          full_name: string;
          role: Database['public']['Enums']['user_role'];
          is_active: boolean | null;
          last_login_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          org_id: string;
          email: string;
          full_name: string;
          role: Database['public']['Enums']['user_role'];
          is_active?: boolean | null;
          last_login_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          full_name?: string;
          role?: Database['public']['Enums']['user_role'];
          is_active?: boolean | null;
          last_login_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      programs: {
        Row: {
          id: string;
          org_id: string;
          code: string;
          name: string;
          description: string | null;
          total_courses: number | null;
          is_active: boolean | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          code: string;
          name: string;
          description?: string | null;
          total_courses?: number | null;
          is_active?: boolean | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          total_courses?: number | null;
          is_active?: boolean | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      courses: {
        Row: {
          id: string;
          program_id: string;
          org_id: string;
          sequence_number: number;
          name: string;
          description: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          program_id: string;
          org_id: string;
          sequence_number: number;
          name: string;
          description?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          program_id?: string;
          org_id?: string;
          sequence_number?: number;
          name?: string;
          description?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      deliverables: {
        Row: {
          id: string;
          course_id: string;
          org_id: string;
          sequence_number: number;
          name: string;
          description: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          course_id: string;
          org_id: string;
          sequence_number: number;
          name: string;
          description?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          course_id?: string;
          org_id?: string;
          sequence_number?: number;
          name?: string;
          description?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      learners: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          first_name: string;
          last_name: string;
          gender: string | null;
          phone_number: string | null;
          country: string | null;
          region: string | null;
          ehub_profile_url: string | null;
          lms_profile_url: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          first_name: string;
          last_name: string;
          gender?: string | null;
          phone_number?: string | null;
          country?: string | null;
          region?: string | null;
          ehub_profile_url?: string | null;
          lms_profile_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          gender?: string | null;
          phone_number?: string | null;
          country?: string | null;
          region?: string | null;
          ehub_profile_url?: string | null;
          lms_profile_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
      };
      learner_program_enrollments: {
        Row: {
          id: string;
          learner_id: string;
          program_id: string;
          org_id: string;
          enrollment_date: string | null;
          payment_status: Database['public']['Enums']['payment_status'] | null;
          is_activated: boolean | null;
          activation_date: string | null;
          is_program_graduated: boolean | null;
          program_graduation_date: string | null;
          health_status: Database['public']['Enums']['health_status'] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          learner_id: string;
          program_id: string;
          org_id: string;
          enrollment_date?: string | null;
          payment_status?: Database['public']['Enums']['payment_status'] | null;
          is_activated?: boolean | null;
          activation_date?: string | null;
          is_program_graduated?: boolean | null;
          program_graduation_date?: string | null;
          health_status?: Database['public']['Enums']['health_status'] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          learner_id?: string;
          program_id?: string;
          org_id?: string;
          enrollment_date?: string | null;
          payment_status?: Database['public']['Enums']['payment_status'] | null;
          is_activated?: boolean | null;
          activation_date?: string | null;
          is_program_graduated?: boolean | null;
          program_graduation_date?: string | null;
          health_status?: Database['public']['Enums']['health_status'] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      learner_course_progress: {
        Row: {
          id: string;
          learner_id: string;
          course_id: string;
          program_id: string;
          org_id: string;
          course_status: Database['public']['Enums']['course_status'] | null;
          is_graduated: boolean | null;
          graduation_date: string | null;
          sequence_number: number | null;
          time_since_activation_days: number | null;
          first_sign_of_life_date: string | null;
          time_since_sign_of_life_days: number | null;
          has_logged_lms: boolean | null;
          has_shown_up: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          learner_id: string;
          course_id: string;
          program_id: string;
          org_id: string;
          course_status?: Database['public']['Enums']['course_status'] | null;
          is_graduated?: boolean | null;
          graduation_date?: string | null;
          sequence_number?: number | null;
          time_since_activation_days?: number | null;
          first_sign_of_life_date?: string | null;
          time_since_sign_of_life_days?: number | null;
          has_logged_lms?: boolean | null;
          has_shown_up?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          learner_id?: string;
          course_id?: string;
          program_id?: string;
          org_id?: string;
          course_status?: Database['public']['Enums']['course_status'] | null;
          is_graduated?: boolean | null;
          graduation_date?: string | null;
          sequence_number?: number | null;
          time_since_activation_days?: number | null;
          first_sign_of_life_date?: string | null;
          time_since_sign_of_life_days?: number | null;
          has_logged_lms?: boolean | null;
          has_shown_up?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      cold_leads: {
        Row: {
          id: string;
          org_id: string;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          phone_number: string | null;
          source: string | null;
          assigned_to: string | null;
          uploaded_at: string | null;
          converted_to_learner_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone_number?: string | null;
          source?: string | null;
          assigned_to?: string | null;
          uploaded_at?: string | null;
          converted_to_learner_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone_number?: string | null;
          source?: string | null;
          assigned_to?: string | null;
          uploaded_at?: string | null;
          converted_to_learner_at?: string | null;
        };
      };
      deliverable_submissions: {
        Row: {
          id: string;
          learner_id: string;
          deliverable_id: string;
          course_id: string;
          org_id: string;
          submitted_at: string | null;
          evidence_url: string | null;
          submitted_by_agent_id: string | null;
          confirmed_by_data: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          learner_id: string;
          deliverable_id: string;
          course_id: string;
          org_id: string;
          submitted_at?: string | null;
          evidence_url?: string | null;
          submitted_by_agent_id?: string | null;
          confirmed_by_data?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          learner_id?: string;
          deliverable_id?: string;
          course_id?: string;
          org_id?: string;
          submitted_at?: string | null;
          evidence_url?: string | null;
          submitted_by_agent_id?: string | null;
          confirmed_by_data?: boolean | null;
          created_at?: string | null;
        };
      };
      deals: {
        Row: {
          id: string;
          learner_id: string;
          agent_id: string;
          org_id: string;
          program_id: string | null;
          course_id: string | null;
          deal_type: Database['public']['Enums']['deal_type'];
          priority_score: number | null;
          assigned_date: string;
          status: Database['public']['Enums']['deal_status'] | null;
          picked_up: boolean | null;
          outcome_positive: boolean | null;
          reason_category: string | null;
          reason_detail: string | null;
          comment: string | null;
          follow_up_date: string | null;
          value_rwf: number | null;
          approval_status: Database['public']['Enums']['approval_status'] | null;
          approved_by: string | null;
          approved_at: string | null;
          rejected_reason: string | null;
          revision_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          learner_id: string;
          agent_id: string;
          org_id: string;
          program_id?: string | null;
          course_id?: string | null;
          deal_type: Database['public']['Enums']['deal_type'];
          priority_score?: number | null;
          assigned_date: string;
          status?: Database['public']['Enums']['deal_status'] | null;
          picked_up?: boolean | null;
          outcome_positive?: boolean | null;
          reason_category?: string | null;
          reason_detail?: string | null;
          comment?: string | null;
          follow_up_date?: string | null;
          value_rwf?: number | null;
          approval_status?: Database['public']['Enums']['approval_status'] | null;
          approved_by?: string | null;
          approved_at?: string | null;
          rejected_reason?: string | null;
          revision_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          learner_id?: string;
          agent_id?: string;
          org_id?: string;
          program_id?: string | null;
          course_id?: string | null;
          deal_type?: Database['public']['Enums']['deal_type'];
          priority_score?: number | null;
          assigned_date?: string;
          status?: Database['public']['Enums']['deal_status'] | null;
          picked_up?: boolean | null;
          outcome_positive?: boolean | null;
          reason_category?: string | null;
          reason_detail?: string | null;
          comment?: string | null;
          follow_up_date?: string | null;
          value_rwf?: number | null;
          approval_status?: Database['public']['Enums']['approval_status'] | null;
          approved_by?: string | null;
          approved_at?: string | null;
          rejected_reason?: string | null;
          revision_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      deal_deliverables: {
        Row: {
          id: string;
          deal_id: string;
          deliverable_id: string;
          is_confirmed: boolean | null;
          confirmed_at: string | null;
        };
        Insert: {
          id?: string;
          deal_id: string;
          deliverable_id: string;
          is_confirmed?: boolean | null;
          confirmed_at?: string | null;
        };
        Update: {
          id?: string;
          deal_id?: string;
          deliverable_id?: string;
          is_confirmed?: boolean | null;
          confirmed_at?: string | null;
        };
      };
      deal_revisions: {
        Row: {
          id: string;
          deal_id: string;
          edited_by: string;
          before_state: Json | null;
          after_state: Json | null;
          revised_at: string | null;
        };
        Insert: {
          id?: string;
          deal_id: string;
          edited_by: string;
          before_state?: Json | null;
          after_state?: Json | null;
          revised_at?: string | null;
        };
        Update: {
          id?: string;
          deal_id?: string;
          edited_by?: string;
          before_state?: Json | null;
          after_state?: Json | null;
          revised_at?: string | null;
        };
      };
      daily_queues: {
        Row: {
          id: string;
          date: string;
          owner_id: string;
          owner_role: Database['public']['Enums']['user_role'];
          org_id: string;
          items: Json | null;
          generated_at: string | null;
          locked: boolean | null;
        };
        Insert: {
          id?: string;
          date: string;
          owner_id: string;
          owner_role: Database['public']['Enums']['user_role'];
          org_id: string;
          items?: Json | null;
          generated_at?: string | null;
          locked?: boolean | null;
        };
        Update: {
          id?: string;
          date?: string;
          owner_id?: string;
          owner_role?: Database['public']['Enums']['user_role'];
          org_id?: string;
          items?: Json | null;
          generated_at?: string | null;
          locked?: boolean | null;
        };
      };
      distribution_configs: {
        Row: {
          id: string;
          date: string;
          org_id: string;
          program_scope: string | null;
          courses_included: Json | null;
          deal_type_mix: Json | null;
          per_agent_caps: Json | null;
          locked_at: string | null;
          locked_by: string | null;
        };
        Insert: {
          id?: string;
          date: string;
          org_id: string;
          program_scope?: string | null;
          courses_included?: Json | null;
          deal_type_mix?: Json | null;
          per_agent_caps?: Json | null;
          locked_at?: string | null;
          locked_by?: string | null;
        };
        Update: {
          id?: string;
          date?: string;
          org_id?: string;
          program_scope?: string | null;
          courses_included?: Json | null;
          deal_type_mix?: Json | null;
          per_agent_caps?: Json | null;
          locked_at?: string | null;
          locked_by?: string | null;
        };
      };
      value_ledger: {
        Row: {
          id: string;
          agent_id: string;
          deal_id: string | null;
          org_id: string;
          event_label: string;
          value_rwf: number;
          currency: Database['public']['Enums']['currency'] | null;
          status: string | null;
          credited_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          deal_id?: string | null;
          org_id: string;
          event_label: string;
          value_rwf: number;
          currency?: Database['public']['Enums']['currency'] | null;
          status?: string | null;
          credited_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          agent_id?: string;
          deal_id?: string | null;
          org_id?: string;
          event_label?: string;
          value_rwf?: number;
          currency?: Database['public']['Enums']['currency'] | null;
          status?: string | null;
          credited_at?: string | null;
          created_at?: string | null;
        };
      };
      partnerships: {
        Row: {
          id: string;
          org_id: string;
          organisation_name: string;
          contact_name: string | null;
          contact_email: string | null;
          program_scope: string | null;
          value_rwf: number | null;
          stage: Database['public']['Enums']['partnership_stage'] | null;
          last_interaction_date: string | null;
          next_followup_date: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          organisation_name: string;
          contact_name?: string | null;
          contact_email?: string | null;
          program_scope?: string | null;
          value_rwf?: number | null;
          stage?: Database['public']['Enums']['partnership_stage'] | null;
          last_interaction_date?: string | null;
          next_followup_date?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          organisation_name?: string;
          contact_name?: string | null;
          contact_email?: string | null;
          program_scope?: string | null;
          value_rwf?: number | null;
          stage?: Database['public']['Enums']['partnership_stage'] | null;
          last_interaction_date?: string | null;
          next_followup_date?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      events: {
        Row: {
          id: string;
          ambassador_id: string;
          org_id: string;
          name: string;
          location: string | null;
          date: string;
          expected_attendance: number | null;
          actual_attendance: number | null;
          attendee_link: string | null;
          status: Database['public']['Enums']['event_status'] | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          ambassador_id: string;
          org_id: string;
          name: string;
          location?: string | null;
          date: string;
          expected_attendance?: number | null;
          actual_attendance?: number | null;
          attendee_link?: string | null;
          status?: Database['public']['Enums']['event_status'] | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          ambassador_id?: string;
          org_id?: string;
          name?: string;
          location?: string | null;
          date?: string;
          expected_attendance?: number | null;
          actual_attendance?: number | null;
          attendee_link?: string | null;
          status?: Database['public']['Enums']['event_status'] | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      nudge_templates: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          deal_type: Database['public']['Enums']['deal_type'];
          program_id: string | null;
          course_id: string | null;
          deliverable_id: string | null;
          body_text: string;
          is_active: boolean | null;
          created_by: string | null;
          last_used_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          deal_type: Database['public']['Enums']['deal_type'];
          program_id?: string | null;
          course_id?: string | null;
          deliverable_id?: string | null;
          body_text: string;
          is_active?: boolean | null;
          created_by?: string | null;
          last_used_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          deal_type?: Database['public']['Enums']['deal_type'];
          program_id?: string | null;
          course_id?: string | null;
          deliverable_id?: string | null;
          body_text?: string;
          is_active?: boolean | null;
          created_by?: string | null;
          last_used_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      targets: {
        Row: {
          org_id: string;
          key: string;
          name: string;
          current_value: number | null;
          target_value: number;
          unit: string | null;
          updated_by: string | null;
          updated_at: string | null;
        };
        Insert: {
          org_id: string;
          key: string;
          name: string;
          current_value?: number | null;
          target_value: number;
          unit?: string | null;
          updated_by?: string | null;
          updated_at?: string | null;
        };
        Update: {
          org_id?: string;
          key?: string;
          name?: string;
          current_value?: number | null;
          target_value?: number;
          unit?: string | null;
          updated_by?: string | null;
          updated_at?: string | null;
        };
      };
      alerts: {
        Row: {
          id: string;
          org_id: string;
          metric_key: string;
          current_value: number | null;
          target_value: number | null;
          gap_pct: number | null;
          severity: Database['public']['Enums']['alert_severity'];
          detected_at: string | null;
          screen_link: string | null;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          metric_key: string;
          current_value?: number | null;
          target_value?: number | null;
          gap_pct?: number | null;
          severity: Database['public']['Enums']['alert_severity'];
          detected_at?: string | null;
          screen_link?: string | null;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          metric_key?: string;
          current_value?: number | null;
          target_value?: number | null;
          gap_pct?: number | null;
          severity?: Database['public']['Enums']['alert_severity'];
          detected_at?: string | null;
          screen_link?: string | null;
          resolved_at?: string | null;
        };
      };
      upload_history: {
        Row: {
          id: string;
          org_id: string;
          program_id: string | null;
          sheet_type: Database['public']['Enums']['sheet_type'];
          uploaded_by: string | null;
          file_url: string | null;
          row_count: number | null;
          changes_summary: Json | null;
          validation_errors: Json | null;
          uploaded_at: string | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          program_id?: string | null;
          sheet_type: Database['public']['Enums']['sheet_type'];
          uploaded_by?: string | null;
          file_url?: string | null;
          row_count?: number | null;
          changes_summary?: Json | null;
          validation_errors?: Json | null;
          uploaded_at?: string | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          program_id?: string | null;
          sheet_type?: Database['public']['Enums']['sheet_type'];
          uploaded_by?: string | null;
          file_url?: string | null;
          row_count?: number | null;
          changes_summary?: Json | null;
          validation_errors?: Json | null;
          uploaded_at?: string | null;
          is_active?: boolean | null;
        };
      };
      nps_responses: {
        Row: {
          id: string;
          learner_id: string;
          org_id: string;
          score: number | null;
          comment: string | null;
          collected_by_agent_id: string | null;
          collected_at: string | null;
        };
        Insert: {
          id?: string;
          learner_id: string;
          org_id: string;
          score?: number | null;
          comment?: string | null;
          collected_by_agent_id?: string | null;
          collected_at?: string | null;
        };
        Update: {
          id?: string;
          learner_id?: string;
          org_id?: string;
          score?: number | null;
          comment?: string | null;
          collected_by_agent_id?: string | null;
          collected_at?: string | null;
        };
      };
      settings: {
        Row: {
          org_id: string;
          working_days: string[] | null;
          deal_cap_soft: number | null;
          deal_cap_hard: number | null;
          alert_threshold_pct: number | null;
          graduation_push_threshold_days: number | null;
          timezone: string | null;
        };
        Insert: {
          org_id: string;
          working_days?: string[] | null;
          deal_cap_soft?: number | null;
          deal_cap_hard?: number | null;
          alert_threshold_pct?: number | null;
          graduation_push_threshold_days?: number | null;
          timezone?: string | null;
        };
        Update: {
          org_id?: string;
          working_days?: string[] | null;
          deal_cap_soft?: number | null;
          deal_cap_hard?: number | null;
          alert_threshold_pct?: number | null;
          graduation_push_threshold_days?: number | null;
          timezone?: string | null;
        };
      };
      audit_log: {
        Row: {
          id: string;
          org_id: string;
          actor_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          before_state: Json | null;
          after_state: Json | null;
          ip_address: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          actor_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          before_state?: Json | null;
          after_state?: Json | null;
          ip_address?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          before_state?: Json | null;
          after_state?: Json | null;
          ip_address?: string | null;
          created_at?: string | null;
        };
      };
};

type _PublicEnums = {
      user_role: 'admin' | 'agent' | 'ambassador';
      payment_status:
        | 'n/a'
        | 'payment_compliant'
        | 'payment_grace_period'
        | 'payment_overdue'
        | 'payment_due_soon'
        | 'payment_due_now'
        | 'payment_plan_cancelled';
      deal_type:
        | 'conversion'
        | 'followup_conversion'
        | 'cold_lead_enrollment'
        | 'activation'
        | 'course_graduation'
        | 'graduation_push'
        | 'retention';
      deal_status:
        | 'pending'
        | 'attempted'
        | 'successful'
        | 'rejected'
        | 'not_picked_up'
        | 'replaced';
      approval_status: 'pending_admin' | 'pending_data' | 'approved' | 'rejected';
      health_status:
        | 'active_state'
        | 'slow_but_progressing'
        | 'graduated'
        | 'at_risk'
        | 'churned';
      partnership_stage:
        | 'prospect'
        | 'active'
        | 'at_risk'
        | 'no_signs_of_life'
        | 'closed_won'
        | 'closed_lost';
      course_status: 'not_started' | 'in_progress' | 'validated';
      alert_severity: 'critical' | 'warning' | 'watch';
      event_status: 'upcoming' | 'completed' | 'cancelled';
      currency: 'RWF' | 'USD';
      sheet_type: 'health' | 'activity';
};

export type Database = {
  public: {
    Tables: WithRelationships<_PublicTables>;
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: _PublicEnums;
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

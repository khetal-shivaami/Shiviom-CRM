export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          assigned_user_ids: string[] | null
          company: string
          created_at: string
          email: string
          id: string
          last_edited_at: string | null
          name: string
          partner_id: string | null
          phone: string | null
          process: string | null
          product_ids: string[] | null
          status: string
          value: number
          zone: string | null
        }
        Insert: {
          assigned_user_ids?: string[] | null
          company: string
          created_at?: string
          email: string
          id?: string
          last_edited_at?: string | null
          name: string
          partner_id?: string | null
          phone?: string | null
          process?: string | null
          product_ids?: string[] | null
          status?: string
          value?: number
          zone?: string | null
        }
        Update: {
          assigned_user_ids?: string[] | null
          company?: string
          created_at?: string
          email?: string
          id?: string
          last_edited_at?: string | null
          name?: string
          partner_id?: string | null
          phone?: string | null
          process?: string | null
          product_ids?: string[] | null
          status?: string
          value?: number
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_stage_changes: {
        Row: {
          changed_at: string
          changed_by: string
          created_at: string
          from_stage: string
          id: string
          partner_id: string
          reason: string | null
          to_stage: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          created_at?: string
          from_stage: string
          id?: string
          partner_id: string
          reason?: string | null
          to_stage: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          created_at?: string
          from_stage?: string
          id?: string
          partner_id?: string
          reason?: string | null
          to_stage?: string
        }
        Relationships: []
      }
      partner_stage_reversal_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          comments: string | null
          created_at: string
          from_stage: string
          id: string
          partner_id: string
          reason: string
          requested_at: string
          requested_by: string
          status: string
          to_stage: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          comments?: string | null
          created_at?: string
          from_stage: string
          id?: string
          partner_id: string
          reason: string
          requested_at?: string
          requested_by: string
          status?: string
          to_stage: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          comments?: string | null
          created_at?: string
          from_stage?: string
          id?: string
          partner_id?: string
          reason?: string
          requested_at?: string
          requested_by?: string
          status?: string
          to_stage?: string
          updated_at?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          agreement_date: string | null
          agreement_signed: boolean
          assigned_user_ids: string[] | null
          company: string
          created_at: string
          email: string
          id: string
          identity: string
          name: string
          onboarding_data: Json | null
          onboarding_stage: string
          payment_terms: string
          product_types: string[] | null
          specialization: string | null
          status: string
          zone: string | null
        }
        Insert: {
          agreement_date?: string | null
          agreement_signed?: boolean
          assigned_user_ids?: string[] | null
          company: string
          created_at?: string
          email: string
          id?: string
          identity: string
          name: string
          onboarding_data?: Json | null
          onboarding_stage?: string
          payment_terms: string
          product_types?: string[] | null
          specialization?: string | null
          status?: string
          zone?: string | null
        }
        Update: {
          agreement_date?: string | null
          agreement_signed?: boolean
          assigned_user_ids?: string[] | null
          company?: string
          created_at?: string
          email?: string
          id?: string
          identity?: string
          name?: string
          onboarding_data?: Json | null
          onboarding_stage?: string
          payment_terms?: string
          product_types?: string[] | null
          specialization?: string | null
          status?: string
          zone?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          last_edited_at: string | null
          name: string
          plans: Json | null
          status: string
          website: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          last_edited_at?: string | null
          name: string
          plans?: Json | null
          status?: string
          website: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          last_edited_at?: string | null
          name?: string
          plans?: Json | null
          status?: string
          website?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string
          first_name: string | null
          id: string
          last_login: string | null
          last_name: string | null
          phone: string | null
          reporting_to: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          reporting_to?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          reporting_to?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_reporting_to_fkey"
            columns: ["reporting_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      roles: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string
          description: string | null
          display_name: string
          hierarchy_level: number | null
          id: string
          name: string
          permissions: Json | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          hierarchy_level?: number | null
          id?: string
          name: string
          permissions?: Json | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          hierarchy_level?: number | null
          id?: string
          name?: string
          permissions?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_report_executions: {
        Row: {
          created_at: string
          error_message: string | null
          execution_date: string
          execution_duration_ms: number | null
          file_path: string | null
          file_size: number | null
          id: string
          scheduled_report_id: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          execution_date?: string
          execution_duration_ms?: number | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          scheduled_report_id: string
          status: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          execution_date?: string
          execution_duration_ms?: number | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          scheduled_report_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_report_executions_scheduled_report_id_fkey"
            columns: ["scheduled_report_id"]
            isOneToOne: false
            referencedRelation: "scheduled_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          email_recipients: string[]
          filters: Json | null
          frequency: string
          id: string
          last_run_date: string | null
          next_run_date: string | null
          report_format: string
          report_name: string
          report_type: string
          status: string
          time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          email_recipients?: string[]
          filters?: Json | null
          frequency: string
          id?: string
          last_run_date?: string | null
          next_run_date?: string | null
          report_format?: string
          report_name: string
          report_type: string
          status?: string
          time?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          email_recipients?: string[]
          filters?: Json | null
          frequency?: string
          id?: string
          last_run_date?: string | null
          next_run_date?: string | null
          report_format?: string
          report_name?: string
          report_type?: string
          status?: string
          time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_by: string | null
          assigned_to: string | null
          auto_generated: boolean | null
          completed_at: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          is_onboarding_task: boolean | null
          notes: string | null
          onboarding_stage: string | null
          partner_id: string | null
          priority: string
          stage_requirement: boolean | null
          status: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_by?: string | null
          assigned_to?: string | null
          auto_generated?: boolean | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_onboarding_task?: boolean | null
          notes?: string | null
          onboarding_stage?: string | null
          partner_id?: string | null
          priority?: string
          stage_requirement?: boolean | null
          status?: string
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_by?: string | null
          assigned_to?: string | null
          auto_generated?: boolean | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_onboarding_task?: boolean | null
          notes?: string | null
          onboarding_stage?: string | null
          partner_id?: string | null
          priority?: string
          stage_requirement?: boolean | null
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_run_date: {
        Args: {
          frequency: string
          day_of_week: number
          day_of_month: number
          run_time: string
          from_date?: string
        }
        Returns: string
      }
      delete_user_profiles: {
        Args: {
          user_ids_to_delete: string[]
        }
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

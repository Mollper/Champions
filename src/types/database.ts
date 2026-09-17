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
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: number
          role: string
          style: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: never
          role: string
          style?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: never
          role?: string
          style?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activities: Json
          age: number | null
          assistant_style: string
          budget_usd_per_year: number | null
          citizenship: string | null
          completed_at: string | null
          constraints: string[]
          constraints_note: string | null
          created_at: string
          exams: Json
          goal: string | null
          gpa: number | null
          gpa_scale: number
          grade: number | null
          id: string
          intended_major: string | null
          interests: string[]
          languages: Json
          needs_scholarship: boolean
          residence_country: string | null
          start_year: number | null
          target_countries: string[]
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          activities?: Json
          age?: number | null
          assistant_style?: string
          budget_usd_per_year?: number | null
          citizenship?: string | null
          completed_at?: string | null
          constraints?: string[]
          constraints_note?: string | null
          created_at?: string
          exams?: Json
          goal?: string | null
          gpa?: number | null
          gpa_scale?: number
          grade?: number | null
          id?: string
          intended_major?: string | null
          interests?: string[]
          languages?: Json
          needs_scholarship?: boolean
          residence_country?: string | null
          start_year?: number | null
          target_countries?: string[]
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          activities?: Json
          age?: number | null
          assistant_style?: string
          budget_usd_per_year?: number | null
          citizenship?: string | null
          completed_at?: string | null
          constraints?: string[]
          constraints_note?: string | null
          created_at?: string
          exams?: Json
          goal?: string | null
          gpa?: number | null
          gpa_scale?: number
          grade?: number | null
          id?: string
          intended_major?: string | null
          interests?: string[]
          languages?: Json
          needs_scholarship?: boolean
          residence_country?: string | null
          start_year?: number | null
          target_countries?: string[]
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_steps: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: number
          roadmap_id: string
          sort_order: number
          status: string
          step_key: string
          title: string
          university_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: number
          roadmap_id: string
          sort_order?: number
          status?: string
          step_key: string
          title: string
          university_id?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: number
          roadmap_id?: string
          sort_order?: number
          status?: string
          step_key?: string
          title?: string
          university_id?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_steps_roadmap_id_user_id_fkey"
            columns: ["roadmap_id", "user_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "roadmap_steps_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmaps: {
        Row: {
          created_at: string
          generated_at: string
          id: string
          profile_version: number
          summary: Json
          target_university_ids: number[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_at?: string
          id?: string
          profile_version: number
          summary?: Json
          target_university_ids?: number[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_at?: string
          id?: string
          profile_version?: number
          summary?: Json
          target_university_ids?: number[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmaps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarships: {
        Row: {
          amount_note: string | null
          country_code: string | null
          coverage: string
          created_at: string
          deadline: Json | null
          description: string | null
          eligible_citizenships: string[] | null
          id: number
          is_demo: boolean
          min_gpa_4: number | null
          min_ielts: number | null
          name: string
          need_based: boolean
          provider: string
          slug: string
          university_id: number | null
          url: string
        }
        Insert: {
          amount_note?: string | null
          country_code?: string | null
          coverage: string
          created_at?: string
          deadline?: Json | null
          description?: string | null
          eligible_citizenships?: string[] | null
          id?: never
          is_demo?: boolean
          min_gpa_4?: number | null
          min_ielts?: number | null
          name: string
          need_based?: boolean
          provider: string
          slug: string
          university_id?: number | null
          url: string
        }
        Update: {
          amount_note?: string | null
          country_code?: string | null
          coverage?: string
          created_at?: string
          deadline?: Json | null
          description?: string | null
          eligible_citizenships?: string[] | null
          id?: never
          is_demo?: boolean
          min_gpa_4?: number | null
          min_ielts?: number | null
          name?: string
          need_based?: boolean
          provider?: string
          slug?: string
          university_id?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarships_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlist: {
        Row: {
          created_at: string
          note: string | null
          university_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          note?: string | null
          university_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          note?: string | null
          university_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlist_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          acceptance_rate: number | null
          admissions_url: string | null
          application_deadlines: Json
          avg_gpa_4: number | null
          city: string
          country: string
          country_code: string
          created_at: string
          data_source: string | null
          data_updated_at: string | null
          description: string | null
          entrance_exams: string[]
          fields: string[]
          foundation_note: string | null
          highlights: string[]
          id: number
          image_credit: string | null
          image_source_url: string | null
          image_url: string
          instruction_languages: string[]
          intake: string | null
          is_demo: boolean
          living_cost_usd_per_year: number
          min_gpa_4: number | null
          min_ielts: number | null
          min_toefl: number | null
          name: string
          name_ru: string | null
          programs: string[]
          qs_rank: number | null
          requires_foundation: boolean
          sat_recommended: number | null
          sat_required: boolean
          scholarship_level: string
          scholarship_note: string | null
          slug: string
          tuition_usd_per_year: number
          website_url: string
        }
        Insert: {
          acceptance_rate?: number | null
          admissions_url?: string | null
          application_deadlines?: Json
          avg_gpa_4?: number | null
          city: string
          country: string
          country_code: string
          created_at?: string
          data_source?: string | null
          data_updated_at?: string | null
          description?: string | null
          entrance_exams?: string[]
          fields?: string[]
          foundation_note?: string | null
          highlights?: string[]
          id?: never
          image_credit?: string | null
          image_source_url?: string | null
          image_url: string
          instruction_languages?: string[]
          intake?: string | null
          is_demo?: boolean
          living_cost_usd_per_year: number
          min_gpa_4?: number | null
          min_ielts?: number | null
          min_toefl?: number | null
          name: string
          name_ru?: string | null
          programs?: string[]
          qs_rank?: number | null
          requires_foundation?: boolean
          sat_recommended?: number | null
          sat_required?: boolean
          scholarship_level: string
          scholarship_note?: string | null
          slug: string
          tuition_usd_per_year: number
          website_url: string
        }
        Update: {
          acceptance_rate?: number | null
          admissions_url?: string | null
          application_deadlines?: Json
          avg_gpa_4?: number | null
          city?: string
          country?: string
          country_code?: string
          created_at?: string
          data_source?: string | null
          data_updated_at?: string | null
          description?: string | null
          entrance_exams?: string[]
          fields?: string[]
          foundation_note?: string | null
          highlights?: string[]
          id?: never
          image_credit?: string | null
          image_source_url?: string | null
          image_url?: string
          instruction_languages?: string[]
          intake?: string | null
          is_demo?: boolean
          living_cost_usd_per_year?: number
          min_gpa_4?: number | null
          min_ielts?: number | null
          min_toefl?: number | null
          name?: string
          name_ru?: string | null
          programs?: string[]
          qs_rank?: number | null
          requires_foundation?: boolean
          sat_recommended?: number | null
          sat_required?: boolean
          scholarship_level?: string
          scholarship_note?: string | null
          slug?: string
          tuition_usd_per_year?: number
          website_url?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

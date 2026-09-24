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
      catalog_requests: {
        Row: {
          attempts: number
          created_at: string
          id: number
          message: string | null
          query: string
          status: string
          university_id: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: never
          message?: string | null
          query: string
          status?: string
          university_id?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: never
          message?: string | null
          query?: string
          status?: string
          university_id?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_requests_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
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
      essay_reviews: {
        Row: {
          created_at: string
          essay_id: string
          id: string
          locale: string | null
          model: string | null
          review: Json
          score: number
          user_id: string
          word_count: number
        }
        Insert: {
          created_at?: string
          essay_id: string
          id?: string
          locale?: string | null
          model?: string | null
          review: Json
          score: number
          user_id: string
          word_count?: number
        }
        Update: {
          created_at?: string
          essay_id?: string
          id?: string
          locale?: string | null
          model?: string | null
          review?: Json
          score?: number
          user_id?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "essay_reviews_essay_id_fkey"
            columns: ["essay_id"]
            isOneToOne: false
            referencedRelation: "essays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "essay_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      essays: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          prompt: string | null
          target: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          kind: string
          prompt?: string | null
          target?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          prompt?: string | null
          target?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "essays_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          university_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          university_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          university_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_applications: {
        Row: {
          admin_note: string | null
          contact: string | null
          created_at: string
          experience: string
          expertise: string[]
          full_name: string
          headline: string
          id: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          contact?: string | null
          created_at?: string
          experience: string
          expertise?: string[]
          full_name: string
          headline: string
          id?: never
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          contact?: string | null
          created_at?: string
          experience?: string
          expertise?: string[]
          full_name?: string
          headline?: string
          id?: never
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_messages: {
        Row: {
          body: string
          created_at: string
          id: number
          mentor_id: string
          read_at: string | null
          sender_id: string
          student_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: never
          mentor_id: string
          read_at?: string | null
          sender_id: string
          student_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: never
          mentor_id?: string
          read_at?: string | null
          sender_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_messages_mentor_id_student_id_fkey"
            columns: ["mentor_id", "student_id"]
            isOneToOne: false
            referencedRelation: "mentorships"
            referencedColumns: ["mentor_id", "student_id"]
          },
          {
            foreignKeyName: "mentor_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_profiles: {
        Row: {
          accepting: boolean
          bio: string
          created_at: string
          display_name: string
          expertise: string[]
          headline: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepting?: boolean
          bio?: string
          created_at?: string
          display_name: string
          expertise?: string[]
          headline: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepting?: boolean
          bio?: string
          created_at?: string
          display_name?: string
          expertise?: string[]
          headline?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorships: {
        Row: {
          created_at: string
          mentor_id: string
          note: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          mentor_id: string
          note?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          mentor_id?: string
          note?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorships_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorships_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          content: Json
          created_at: string
          done: string[]
          id: number
          kind: string
          model: string | null
          params: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          done?: string[]
          id?: never
          kind: string
          model?: string | null
          params?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          done?: string[]
          id?: never
          kind?: string
          model?: string | null
          params?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_user_id_fkey"
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
          enriched_at: string | null
          entrance_exams: string[]
          field_sources: Json
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
          origin: string
          programs: string[]
          qs_rank: number | null
          requires_foundation: boolean
          sat_recommended: number | null
          sat_required: boolean
          scholarship_level: string
          scholarship_note: string | null
          slug: string
          status: string
          tuition_usd_per_year: number
          website_url: string
          wikidata_id: string | null
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
          enriched_at?: string | null
          entrance_exams?: string[]
          field_sources?: Json
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
          origin?: string
          programs?: string[]
          qs_rank?: number | null
          requires_foundation?: boolean
          sat_recommended?: number | null
          sat_required?: boolean
          scholarship_level: string
          scholarship_note?: string | null
          slug: string
          status?: string
          tuition_usd_per_year: number
          website_url: string
          wikidata_id?: string | null
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
          enriched_at?: string | null
          entrance_exams?: string[]
          field_sources?: Json
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
          origin?: string
          programs?: string[]
          qs_rank?: number | null
          requires_foundation?: boolean
          sat_recommended?: number | null
          sat_required?: boolean
          scholarship_level?: string
          scholarship_note?: string | null
          slug?: string
          status?: string
          tuition_usd_per_year?: number
          website_url?: string
          wikidata_id?: string | null
        }
        Relationships: []
      }
      university_profiles: {
        Row: {
          content: Json
          generated_at: string
          model: string | null
          university_id: number
        }
        Insert: {
          content: Json
          generated_at?: string
          model?: string | null
          university_id: number
        }
        Update: {
          content?: Json
          generated_at?: string
          model?: string | null
          university_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "university_profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: true
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          role?: string
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
// UniRoute · src/types/database.ts

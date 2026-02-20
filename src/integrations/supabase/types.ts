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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          details: string | null
          id: number
          name: string | null
          setting_value: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: number
          name?: string | null
          setting_value?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: number
          name?: string | null
          setting_value?: string | null
        }
        Relationships: []
      }
      credit_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          credits_approved: number | null
          id: string
          message: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          credits_approved?: number | null
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          credits_approved?: number | null
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credits: {
        Row: {
          created_at: string
          id: string
          remaining_credits: number
          total_credits: number
          updated_at: string
          used_credits: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          remaining_credits?: number
          total_credits?: number
          updated_at?: string
          used_credits?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          remaining_credits?: number
          total_credits?: number
          updated_at?: string
          used_credits?: number
          user_id?: string
        }
        Relationships: []
      }
      hearings: {
        Row: {
          audio_duration: string | null
          audio_result: Json | null
          audio_type: string | null
          case_brief: string | null
          case_brief_annotation: Json | null
          chat_history: Json | null
          created_at: string
          edited_grouped: string | null
          edited_plain_text: string | null
          edited_turn_taking: string | null
          file_size: string | null
          file_url: string | null
          grouped: string | null
          id: number
          level: string | null
          organization_id: string | null
          plain_text: string | null
          project_id: string
          status: string | null
          text_content: string | null
          title: string | null
          turn_taking: string | null
          type: string | null
          user_id: string | null
          viewed: boolean
        }
        Insert: {
          audio_duration?: string | null
          audio_result?: Json | null
          audio_type?: string | null
          case_brief?: string | null
          case_brief_annotation?: Json | null
          chat_history?: Json | null
          created_at?: string
          edited_grouped?: string | null
          edited_plain_text?: string | null
          edited_turn_taking?: string | null
          file_size?: string | null
          file_url?: string | null
          grouped?: string | null
          id?: number
          level?: string | null
          organization_id?: string | null
          plain_text?: string | null
          project_id: string
          status?: string | null
          text_content?: string | null
          title?: string | null
          turn_taking?: string | null
          type?: string | null
          user_id?: string | null
          viewed?: boolean
        }
        Update: {
          audio_duration?: string | null
          audio_result?: Json | null
          audio_type?: string | null
          case_brief?: string | null
          case_brief_annotation?: Json | null
          chat_history?: Json | null
          created_at?: string
          edited_grouped?: string | null
          edited_plain_text?: string | null
          edited_turn_taking?: string | null
          file_size?: string | null
          file_url?: string | null
          grouped?: string | null
          id?: number
          level?: string | null
          organization_id?: string | null
          plain_text?: string | null
          project_id?: string
          status?: string | null
          text_content?: string | null
          title?: string | null
          turn_taking?: string | null
          type?: string | null
          user_id?: string | null
          viewed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "hearings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          from_admin: boolean
          id: string
          read: boolean
          subject: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          from_admin?: boolean
          id?: string
          read?: boolean
          subject: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          from_admin?: boolean
          id?: string
          read?: boolean
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_at: string
          joined_at: string | null
          organization_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_at?: string
          joined_at?: string | null
          organization_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_at?: string
          joined_at?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          free_credits: boolean | null
          free_credits_expiry: string | null
          id: string
          name: string
          owner_id: string
          shared_credits: number
          updated_at: string
          used_credits: number
        }
        Insert: {
          created_at?: string
          free_credits?: boolean | null
          free_credits_expiry?: string | null
          id?: string
          name: string
          owner_id: string
          shared_credits?: number
          updated_at?: string
          used_credits?: number
        }
        Update: {
          created_at?: string
          free_credits?: boolean | null
          free_credits_expiry?: string | null
          id?: string
          name?: string
          owner_id?: string
          shared_credits?: number
          updated_at?: string
          used_credits?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          credits_purchased: number | null
          id: string
          payment_method: string | null
          payment_type: string | null
          raw_response: Json | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credits_purchased?: number | null
          id?: string
          payment_method?: string | null
          payment_type?: string | null
          raw_response?: Json | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credits_purchased?: number | null
          id?: string
          payment_method?: string | null
          payment_type?: string | null
          raw_response?: Json | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          full_name: string
          history: Json | null
          id: string
          license_number: string | null
          organization: string | null
          phone_number: string | null
          suspended: boolean
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          full_name: string
          history?: Json | null
          id?: string
          license_number?: string | null
          organization?: string | null
          phone_number?: string | null
          suspended?: boolean
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          full_name?: string
          history?: Json | null
          id?: string
          license_number?: string | null
          organization?: string | null
          phone_number?: string | null
          suspended?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          completed_items: number | null
          created_at: string
          description: string | null
          id: string
          name: string | null
          organization_id: string | null
          owner: string | null
          owner_type: string | null
          status: string | null
          total_items: number | null
          type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_items?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          organization_id?: string | null
          owner?: string | null
          owner_type?: string | null
          status?: string | null
          total_items?: number | null
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_items?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          organization_id?: string | null
          owner?: string | null
          owner_type?: string | null
          status?: string | null
          total_items?: number | null
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      transcription_segments: {
        Row: {
          confidence_score: number | null
          created_at: string
          end_time: number | null
          id: string
          segment_order: number
          speaker_label: string
          start_time: number | null
          text_content: string
          transcription_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          end_time?: number | null
          id?: string
          segment_order: number
          speaker_label: string
          start_time?: number | null
          text_content: string
          transcription_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          end_time?: number | null
          id?: string
          segment_order?: number
          speaker_label?: string
          start_time?: number | null
          text_content?: string
          transcription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcription_segments_transcription_id_fkey"
            columns: ["transcription_id"]
            isOneToOne: false
            referencedRelation: "transcriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      transcriptions: {
        Row: {
          audio_duration: number | null
          case_number: string | null
          confidence_score: number | null
          content: string
          created_at: string
          file_name: string | null
          file_size: number | null
          id: string
          session_type: string | null
          speaker_count: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_duration?: number | null
          case_number?: string | null
          confidence_score?: number | null
          content: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          session_type?: string | null
          speaker_count?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_duration?: number | null
          case_number?: string | null
          confidence_score?: number | null
          content?: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          session_type?: string | null
          speaker_count?: number | null
          title?: string
          updated_at?: string
          user_id?: string
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
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_owner: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const

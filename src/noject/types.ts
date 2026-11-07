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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      noject_audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "noject_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      noject_calendar_events: {
        Row: {
          created_at: string
          description: string | null
          end_at: string
          google_event_id: string | null
          id: string
          location: string | null
          project_id: string
          start_at: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_at: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          project_id: string
          start_at: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_at?: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          project_id?: string
          start_at?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "noject_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      noject_coaching_sessions: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "noject_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      noject_expenses: {
        Row: {
          ai_extracted: Json | null
          amount: number
          category: string | null
          created_at: string
          currency: string
          description: string | null
          drive_file_id: string | null
          drive_file_url: string | null
          expense_date: string | null
          file_id: string | null
          id: string
          project_id: string
          updated_at: string
          user_id: string
          vendor: string | null
        }
        Insert: {
          ai_extracted?: Json | null
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          drive_file_id?: string | null
          drive_file_url?: string | null
          expense_date?: string | null
          file_id?: string | null
          id?: string
          project_id: string
          updated_at?: string
          user_id: string
          vendor?: string | null
        }
        Update: {
          ai_extracted?: Json | null
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          drive_file_id?: string | null
          drive_file_url?: string | null
          expense_date?: string | null
          file_id?: string | null
          id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "noject_project_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "noject_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      noject_google_connections: {
        Row: {
          access_token_ciphertext: string
          created_at: string
          expires_at: string
          google_email: string | null
          refresh_token_ciphertext: string
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_ciphertext: string
          created_at?: string
          expires_at: string
          google_email?: string | null
          refresh_token_ciphertext: string
          scope: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_ciphertext?: string
          created_at?: string
          expires_at?: string
          google_email?: string | null
          refresh_token_ciphertext?: string
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      noject_meeting_transcripts: {
        Row: {
          audio_name: string | null
          created_at: string
          drive_file_id: string | null
          drive_file_url: string | null
          extracted_tasks: Json | null
          file_id: string | null
          id: string
          project_id: string
          summary: string | null
          transcript: string | null
          user_id: string
        }
        Insert: {
          audio_name?: string | null
          created_at?: string
          drive_file_id?: string | null
          drive_file_url?: string | null
          extracted_tasks?: Json | null
          file_id?: string | null
          id?: string
          project_id: string
          summary?: string | null
          transcript?: string | null
          user_id: string
        }
        Update: {
          audio_name?: string | null
          created_at?: string
          drive_file_id?: string | null
          drive_file_url?: string | null
          extracted_tasks?: Json | null
          file_id?: string | null
          id?: string
          project_id?: string
          summary?: string | null
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_transcripts_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "noject_project_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_transcripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "noject_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      noject_notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          meta: Json | null
          project_id: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          meta?: Json | null
          project_id?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          meta?: Json | null
          project_id?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "noject_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      noject_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      noject_project_files: {
        Row: {
          created_at: string
          folder: string
          id: string
          mime_type: string
          name: string
          project_id: string
          size_bytes: number
          source: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder?: string
          id?: string
          mime_type?: string
          name: string
          project_id: string
          size_bytes?: number
          source?: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder?: string
          id?: string
          mime_type?: string
          name?: string
          project_id?: string
          size_bytes?: number
          source?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "noject_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      noject_projects: {
        Row: {
          ai_insights: Json | null
          ai_plan: Json | null
          budget: number | null
          calendar_id: string | null
          color: string | null
          created_at: string
          description: string | null
          doc_id: string | null
          doc_url: string | null
          drive_folder_id: string | null
          drive_folder_url: string | null
          end_date: string | null
          health_data: Json | null
          health_score: number | null
          health_updated_at: string | null
          id: string
          insights_updated_at: string | null
          monte_carlo: Json | null
          name: string
          objective: string | null
          phase: Database["public"]["Enums"]["noject_project_phase"]
          progress: number
          sheet_id: string | null
          sheet_url: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["noject_project_status"]
          tasklist_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_insights?: Json | null
          ai_plan?: Json | null
          budget?: number | null
          calendar_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          doc_id?: string | null
          doc_url?: string | null
          drive_folder_id?: string | null
          drive_folder_url?: string | null
          end_date?: string | null
          health_data?: Json | null
          health_score?: number | null
          health_updated_at?: string | null
          id?: string
          insights_updated_at?: string | null
          monte_carlo?: Json | null
          name: string
          objective?: string | null
          phase?: Database["public"]["Enums"]["noject_project_phase"]
          progress?: number
          sheet_id?: string | null
          sheet_url?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["noject_project_status"]
          tasklist_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_insights?: Json | null
          ai_plan?: Json | null
          budget?: number | null
          calendar_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          doc_id?: string | null
          doc_url?: string | null
          drive_folder_id?: string | null
          drive_folder_url?: string | null
          end_date?: string | null
          health_data?: Json | null
          health_score?: number | null
          health_updated_at?: string | null
          id?: string
          insights_updated_at?: string | null
          monte_carlo?: Json | null
          name?: string
          objective?: string | null
          phase?: Database["public"]["Enums"]["noject_project_phase"]
          progress?: number
          sheet_id?: string | null
          sheet_url?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["noject_project_status"]
          tasklist_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      noject_tasks: {
        Row: {
          actual_hours: number | null
          color: string | null
          completed_at: string | null
          created_at: string
          dependency_ids: string[] | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          google_task_id: string | null
          icon: string | null
          id: string
          notes: string | null
          parent_task_id: string | null
          position: number
          priority: Database["public"]["Enums"]["noject_task_priority"]
          project_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["noject_task_status"]
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_hours?: number | null
          color?: string | null
          completed_at?: string | null
          created_at?: string
          dependency_ids?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          google_task_id?: string | null
          icon?: string | null
          id?: string
          notes?: string | null
          parent_task_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["noject_task_priority"]
          project_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["noject_task_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_hours?: number | null
          color?: string | null
          completed_at?: string | null
          created_at?: string
          dependency_ids?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          google_task_id?: string | null
          icon?: string | null
          id?: string
          notes?: string | null
          parent_task_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["noject_task_priority"]
          project_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["noject_task_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "noject_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "noject_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      noject_time_entries: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          note: string | null
          project_id: string
          started_at: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          note?: string | null
          project_id: string
          started_at?: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          note?: string | null
          project_id?: string
          started_at?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "noject_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "noject_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      noject_user_settings: {
        Row: {
          ai_model: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model?: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      noject_recompute_project_progress: {
        Args: { _project_id: string }
        Returns: undefined
      }
    }
    Enums: {
      noject_project_phase: "lancement" | "planification" | "execution" | "cloture"
      noject_project_status: "actif" | "en_pause" | "termine" | "archive"
      noject_task_priority: "basse" | "moyenne" | "haute" | "critique"
      noject_task_status: "a_faire" | "en_cours" | "en_revue" | "termine" | "bloque"
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
    Enums: {
      noject_project_phase: ["lancement", "planification", "execution", "cloture"],
      noject_project_status: ["actif", "en_pause", "termine", "archive"],
      noject_task_priority: ["basse", "moyenne", "haute", "critique"],
      noject_task_status: ["a_faire", "en_cours", "en_revue", "termine", "bloque"],
    },
  },
} as const

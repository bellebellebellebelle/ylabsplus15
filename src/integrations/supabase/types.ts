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
      angelo_invoices_cache: {
        Row: {
          amount_residual: number
          amount_total: number
          currency: string | null
          due_date: string | null
          id: string
          invoice_date: string | null
          last_reminder_at: string | null
          last_reminder_level: number | null
          name: string
          odoo_id: number
          partner_email: string | null
          partner_id: number | null
          partner_name: string | null
          payment_state: string | null
          reminder_count: number
          sale_orders: string | null
          synced_at: string
          user_id: string
        }
        Insert: {
          amount_residual?: number
          amount_total?: number
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          last_reminder_at?: string | null
          last_reminder_level?: number | null
          name: string
          odoo_id: number
          partner_email?: string | null
          partner_id?: number | null
          partner_name?: string | null
          payment_state?: string | null
          reminder_count?: number
          sale_orders?: string | null
          synced_at?: string
          user_id?: string
        }
        Update: {
          amount_residual?: number
          amount_total?: number
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          last_reminder_at?: string | null
          last_reminder_level?: number | null
          name?: string
          odoo_id?: number
          partner_email?: string | null
          partner_id?: number | null
          partner_name?: string | null
          payment_state?: string | null
          reminder_count?: number
          sale_orders?: string | null
          synced_at?: string
          user_id?: string
        }
        Relationships: []
      }
      angelo_reminder_logs: {
        Row: {
          amount_residual: number | null
          body: string | null
          created_at: string
          days_overdue: number | null
          error: string | null
          id: string
          invoice_name: string | null
          invoice_odoo_id: number | null
          level: number | null
          partner_email: string | null
          partner_name: string | null
          status: string
          subject: string | null
          user_id: string
        }
        Insert: {
          amount_residual?: number | null
          body?: string | null
          created_at?: string
          days_overdue?: number | null
          error?: string | null
          id?: string
          invoice_name?: string | null
          invoice_odoo_id?: number | null
          level?: number | null
          partner_email?: string | null
          partner_name?: string | null
          status?: string
          subject?: string | null
          user_id?: string
        }
        Update: {
          amount_residual?: number | null
          body?: string | null
          created_at?: string
          days_overdue?: number | null
          error?: string | null
          id?: string
          invoice_name?: string | null
          invoice_odoo_id?: number | null
          level?: number | null
          partner_email?: string | null
          partner_name?: string | null
          status?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      angelo_reminder_rules: {
        Row: {
          active: boolean
          created_at: string
          days_overdue: number
          firmness: string
          id: string
          instructions: string
          level: number
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          days_overdue: number
          firmness?: string
          id?: string
          instructions?: string
          level: number
          user_id?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          days_overdue?: number
          firmness?: string
          id?: string
          instructions?: string
          level?: number
          user_id?: string
        }
        Relationships: []
      }
      angelo_run_logs: {
        Row: {
          finished_at: string | null
          id: string
          invoices_found: number
          message: string | null
          overdue_found: number
          reminders_sent: number
          started_at: string
          status: string
          trigger: string
          user_id: string
        }
        Insert: {
          finished_at?: string | null
          id?: string
          invoices_found?: number
          message?: string | null
          overdue_found?: number
          reminders_sent?: number
          started_at?: string
          status?: string
          trigger?: string
          user_id?: string
        }
        Update: {
          finished_at?: string | null
          id?: string
          invoices_found?: number
          message?: string | null
          overdue_found?: number
          reminders_sent?: number
          started_at?: string
          status?: string
          trigger?: string
          user_id?: string
        }
        Relationships: []
      }
      angelo_settings: {
        Row: {
          agent_name: string
          attach_pdf: boolean
          auto_send: boolean
          cc_emails: string
          company_name: string | null
          excluded_partners: string
          extra_instructions: string
          language: string
          legal_text: string
          min_amount: number
          min_days_between_reminders: number
          signature: string
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_name?: string
          attach_pdf?: boolean
          auto_send?: boolean
          cc_emails?: string
          company_name?: string | null
          excluded_partners?: string
          extra_instructions?: string
          language?: string
          legal_text?: string
          min_amount?: number
          min_days_between_reminders?: number
          signature?: string
          tone?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          agent_name?: string
          attach_pdf?: boolean
          auto_send?: boolean
          cc_emails?: string
          company_name?: string | null
          excluded_partners?: string
          extra_instructions?: string
          language?: string
          legal_text?: string
          min_amount?: number
          min_days_between_reminders?: number
          signature?: string
          tone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aura_assistant_logs: {
        Row: {
          action_type: string
          app: string
          created_at: string
          detail: string
          id: string
          reply: string
          request: string
          sources: string[]
          status: string
          target: string | null
          user_id: string
          value: string | null
        }
        Insert: {
          action_type?: string
          app?: string
          created_at?: string
          detail?: string
          id?: string
          reply?: string
          request?: string
          sources?: string[]
          status?: string
          target?: string | null
          user_id?: string
          value?: string | null
        }
        Update: {
          action_type?: string
          app?: string
          created_at?: string
          detail?: string
          id?: string
          reply?: string
          request?: string
          sources?: string[]
          status?: string
          target?: string | null
          user_id?: string
          value?: string | null
        }
        Relationships: []
      }
      aura_messages: {
        Row: {
          board: Json | null
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          board?: Json | null
          content: string
          created_at?: string
          id?: string
          role: string
          user_id?: string
        }
        Update: {
          board?: Json | null
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      calendsky_appointments: {
        Row: {
          buffer_min: number
          category: string
          client: string | null
          created_at: string
          end_at: string
          id: string
          location: string | null
          notes: string | null
          start_at: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          buffer_min?: number
          category?: string
          client?: string | null
          created_at?: string
          end_at: string
          id?: string
          location?: string | null
          notes?: string | null
          start_at: string
          status?: string
          title: string
          user_id?: string
        }
        Update: {
          buffer_min?: number
          category?: string
          client?: string | null
          created_at?: string
          end_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          start_at?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      calendsky_meetings: {
        Row: {
          actions: Json
          category: string
          created_at: string
          decisions: Json
          duration_min: number
          id: string
          meeting_date: string
          next_steps: Json
          participants: Json
          risks: Json
          score_clarity: number
          score_decision: number
          score_efficiency: number
          score_engagement: number
          score_global: number
          sentiment: string
          summary: string
          title: string
          topics: Json
          transcript: string
          user_id: string
        }
        Insert: {
          actions?: Json
          category?: string
          created_at?: string
          decisions?: Json
          duration_min?: number
          id?: string
          meeting_date?: string
          next_steps?: Json
          participants?: Json
          risks?: Json
          score_clarity?: number
          score_decision?: number
          score_efficiency?: number
          score_engagement?: number
          score_global?: number
          sentiment?: string
          summary?: string
          title?: string
          topics?: Json
          transcript?: string
          user_id?: string
        }
        Update: {
          actions?: Json
          category?: string
          created_at?: string
          decisions?: Json
          duration_min?: number
          id?: string
          meeting_date?: string
          next_steps?: Json
          participants?: Json
          risks?: Json
          score_clarity?: number
          score_decision?: number
          score_efficiency?: number
          score_engagement?: number
          score_global?: number
          sentiment?: string
          summary?: string
          title?: string
          topics?: Json
          transcript?: string
          user_id?: string
        }
        Relationships: []
      }
      calendsky_planner_notes: {
        Row: {
          color: string
          content: string
          created_at: string
          day: string
          done: boolean
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          color?: string
          content?: string
          created_at?: string
          day?: string
          done?: boolean
          id?: string
          kind?: string
          user_id: string
        }
        Update: {
          color?: string
          content?: string
          created_at?: string
          day?: string
          done?: boolean
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          completed_at: string | null
          content: string | null
          created_at: string
          duration_minutes: number | null
          external_id: string | null
          external_url: string | null
          id: string
          location: string | null
          metadata: Json | null
          opportunity_id: string | null
          priority: string
          scheduled_at: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          opportunity_id?: string | null
          priority?: string
          scheduled_at?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          opportunity_id?: string | null
          priority?: string
          scheduled_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json
          entity: string | null
          entity_id: string | null
          id: string
          opportunity_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          entity?: string | null
          entity_id?: string | null
          id?: string
          opportunity_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          entity?: string | null
          entity_id?: string | null
          id?: string
          opportunity_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_closing_checklists: {
        Row: {
          category: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          opportunity_id: string
          order_index: number
          priority: string
          source: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          opportunity_id: string
          order_index?: number
          priority?: string
          source?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          opportunity_id?: string
          order_index?: number
          priority?: string
          source?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "closing_checklists_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          influence: string | null
          is_decision_maker: boolean | null
          name: string
          notes: string | null
          opportunity_id: string | null
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          influence?: string | null
          is_decision_maker?: boolean | null
          name: string
          notes?: string | null
          opportunity_id?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          influence?: string | null
          is_decision_maker?: boolean | null
          name?: string
          notes?: string | null
          opportunity_id?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notifications: {
        Row: {
          app: string
          body: string | null
          created_at: string
          href: string | null
          id: string
          opportunity_id: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          app?: string
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          opportunity_id?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          app?: string
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          opportunity_id?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunities: {
        Row: {
          ai_summary: string | null
          closing_score: number | null
          company: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          description: string | null
          doc_id: string | null
          doc_url: string | null
          drive_folder_id: string | null
          drive_folder_url: string | null
          expected_close_date: string | null
          health_score: number | null
          id: string
          last_ai_analysis_at: string | null
          name: string
          next_actions: Json | null
          priority: string | null
          probability: number | null
          risks: Json | null
          sheet_id: string | null
          sheet_url: string | null
          stage: string
          strengths: Json | null
          tags: string[] | null
          tasks_list_id: string | null
          updated_at: string
          user_id: string
          value_amount: number | null
        }
        Insert: {
          ai_summary?: string | null
          closing_score?: number | null
          company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          doc_id?: string | null
          doc_url?: string | null
          drive_folder_id?: string | null
          drive_folder_url?: string | null
          expected_close_date?: string | null
          health_score?: number | null
          id?: string
          last_ai_analysis_at?: string | null
          name: string
          next_actions?: Json | null
          priority?: string | null
          probability?: number | null
          risks?: Json | null
          sheet_id?: string | null
          sheet_url?: string | null
          stage?: string
          strengths?: Json | null
          tags?: string[] | null
          tasks_list_id?: string | null
          updated_at?: string
          user_id: string
          value_amount?: number | null
        }
        Update: {
          ai_summary?: string | null
          closing_score?: number | null
          company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          doc_id?: string | null
          doc_url?: string | null
          drive_folder_id?: string | null
          drive_folder_url?: string | null
          expected_close_date?: string | null
          health_score?: number | null
          id?: string
          last_ai_analysis_at?: string | null
          name?: string
          next_actions?: Json | null
          priority?: string | null
          probability?: number | null
          risks?: Json | null
          sheet_id?: string | null
          sheet_url?: string | null
          stage?: string
          strengths?: Json | null
          tags?: string[] | null
          tasks_list_id?: string | null
          updated_at?: string
          user_id?: string
          value_amount?: number | null
        }
        Relationships: []
      }
      crm_saved_insights: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          google_email: string | null
          refresh_token: string
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          google_email?: string | null
          refresh_token: string
          scope: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          google_email?: string | null
          refresh_token?: string
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ideas: {
        Row: {
          created_at: string
          description: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      lab_activity: {
        Row: {
          app_key: string | null
          created_at: string
          id: string
          kind: string
          seconds_saved: number
          user_id: string
        }
        Insert: {
          app_key?: string | null
          created_at?: string
          id?: string
          kind: string
          seconds_saved?: number
          user_id?: string
        }
        Update: {
          app_key?: string | null
          created_at?: string
          id?: string
          kind?: string
          seconds_saved?: number
          user_id?: string
        }
        Relationships: []
      }
      mm_agent_actions_log: {
        Row: {
          args: Json | null
          attempt: number
          created_at: string
          error_detail: string | null
          id: string
          plan: Json | null
          result: Json | null
          source: string
          stage: string
          status: string
          task_id: string | null
          tool_name: string
          user_id: string
          verification_url: string | null
        }
        Insert: {
          args?: Json | null
          attempt?: number
          created_at?: string
          error_detail?: string | null
          id?: string
          plan?: Json | null
          result?: Json | null
          source?: string
          stage?: string
          status?: string
          task_id?: string | null
          tool_name: string
          user_id: string
          verification_url?: string | null
        }
        Update: {
          args?: Json | null
          attempt?: number
          created_at?: string
          error_detail?: string | null
          id?: string
          plan?: Json | null
          result?: Json | null
          source?: string
          stage?: string
          status?: string
          task_id?: string | null
          tool_name?: string
          user_id?: string
          verification_url?: string | null
        }
        Relationships: []
      }
      mm_agent_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mm_agent_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          parts: Json
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          parts: Json
          role: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mm_agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mm_agent_tools: {
        Row: {
          body_template: string | null
          created_at: string
          description: string
          enabled: boolean
          headers: Json
          http_method: string
          id: string
          input_schema: Json
          name: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          body_template?: string | null
          created_at?: string
          description: string
          enabled?: boolean
          headers?: Json
          http_method?: string
          id?: string
          input_schema?: Json
          name: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          body_template?: string | null
          created_at?: string
          description?: string
          enabled?: boolean
          headers?: Json
          http_method?: string
          id?: string
          input_schema?: Json
          name?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      mm_agents: {
        Row: {
          automation_id: string
          created_at: string
          id: string
          instructions: string
          model: string
          name: string
          order: number
          role: string | null
          services: string[]
          tools: Json
        }
        Insert: {
          automation_id: string
          created_at?: string
          id?: string
          instructions: string
          model?: string
          name: string
          order?: number
          role?: string | null
          services?: string[]
          tools?: Json
        }
        Update: {
          automation_id?: string
          created_at?: string
          id?: string
          instructions?: string
          model?: string
          name?: string
          order?: number
          role?: string | null
          services?: string[]
          tools?: Json
        }
        Relationships: [
          {
            foreignKeyName: "agents_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "mm_automations"
            referencedColumns: ["id"]
          },
        ]
      }
      mm_automations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          model: string
          name: string
          prompt: string | null
          state: Json
          status: Database["public"]["Enums"]["automation_status"]
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          model?: string
          name: string
          prompt?: string | null
          state?: Json
          status?: Database["public"]["Enums"]["automation_status"]
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          model?: string
          name?: string
          prompt?: string | null
          state?: Json
          status?: Database["public"]["Enums"]["automation_status"]
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mm_cron_logs: {
        Row: {
          created_at: string
          duration_ms: number
          frequency: string | null
          id: string
          invoices_found: number
          overdue_found: number
          reason: string | null
          reminders_sent: number
          status: string
          trigger: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number
          frequency?: string | null
          id?: string
          invoices_found?: number
          overdue_found?: number
          reason?: string | null
          reminders_sent?: number
          status?: string
          trigger?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          duration_ms?: number
          frequency?: string | null
          id?: string
          invoices_found?: number
          overdue_found?: number
          reason?: string | null
          reminders_sent?: number
          status?: string
          trigger?: string
          user_id?: string
        }
        Relationships: []
      }
      mm_cron_tokens: {
        Row: {
          id: number
          token: string
        }
        Insert: {
          id?: number
          token: string
        }
        Update: {
          id?: number
          token?: string
        }
        Relationships: []
      }
      mm_debug_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          payload: Json | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          payload?: Json | null
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          payload?: Json | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debug_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mm_debug_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mm_debug_sessions: {
        Row: {
          attempts: Json
          automation_id: string
          created_at: string
          ended_at: string | null
          id: string
          issue: string
          plan: Json | null
          status: string
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: Json
          automation_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          issue: string
          plan?: Json | null
          status?: string
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: Json
          automation_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          issue?: string
          plan?: Json | null
          status?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debug_sessions_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "mm_automations"
            referencedColumns: ["id"]
          },
        ]
      }
      mm_execution_actions: {
        Row: {
          agent_name: string | null
          attempts: number | null
          duration_ms: number | null
          error: string | null
          execution_id: string
          finished_at: string | null
          id: string
          input: Json | null
          label: string
          output: Json | null
          started_at: string
          status: string
          tool: string | null
        }
        Insert: {
          agent_name?: string | null
          attempts?: number | null
          duration_ms?: number | null
          error?: string | null
          execution_id: string
          finished_at?: string | null
          id?: string
          input?: Json | null
          label: string
          output?: Json | null
          started_at?: string
          status?: string
          tool?: string | null
        }
        Update: {
          agent_name?: string | null
          attempts?: number | null
          duration_ms?: number | null
          error?: string | null
          execution_id?: string
          finished_at?: string | null
          id?: string
          input?: Json | null
          label?: string
          output?: Json | null
          started_at?: string
          status?: string
          tool?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "execution_actions_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "mm_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      mm_execution_costs: {
        Row: {
          automation_id: string
          cost_usd: number | null
          created_at: string
          execution_id: string
          id: string
          input_tokens: number | null
          model: string | null
          output_tokens: number | null
          provider: string | null
          user_id: string
        }
        Insert: {
          automation_id: string
          cost_usd?: number | null
          created_at?: string
          execution_id: string
          id?: string
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          provider?: string | null
          user_id: string
        }
        Update: {
          automation_id?: string
          cost_usd?: number | null
          created_at?: string
          execution_id?: string
          id?: string
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          provider?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_costs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "mm_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_costs_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "mm_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      mm_execution_logs: {
        Row: {
          agent_id: string | null
          created_at: string
          execution_id: string
          id: string
          level: string
          message: string
          payload: Json | null
          step: number
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          execution_id: string
          id?: string
          level?: string
          message: string
          payload?: Json | null
          step?: number
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          execution_id?: string
          id?: string
          level?: string
          message?: string
          payload?: Json | null
          step?: number
        }
        Relationships: [
          {
            foreignKeyName: "execution_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "mm_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_logs_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "mm_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      mm_executions: {
        Row: {
          automation_id: string
          error: string | null
          finished_at: string | null
          id: string
          input: Json
          output: Json | null
          started_at: string
          status: Database["public"]["Enums"]["execution_status"]
          trigger_id: string | null
        }
        Insert: {
          automation_id: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          output?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["execution_status"]
          trigger_id?: string | null
        }
        Update: {
          automation_id?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          output?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["execution_status"]
          trigger_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "executions_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "mm_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executions_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "mm_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      mm_schedules: {
        Row: {
          day_of_month: number
          enabled: boolean
          frequency: string
          hour_utc: number
          interval_minutes: number
          last_run_at: string | null
          minute_utc: number
          updated_at: string
          user_id: string
          weekday: number
        }
        Insert: {
          day_of_month?: number
          enabled?: boolean
          frequency?: string
          hour_utc?: number
          interval_minutes?: number
          last_run_at?: string | null
          minute_utc?: number
          updated_at?: string
          user_id?: string
          weekday?: number
        }
        Update: {
          day_of_month?: number
          enabled?: boolean
          frequency?: string
          hour_utc?: number
          interval_minutes?: number
          last_run_at?: string | null
          minute_utc?: number
          updated_at?: string
          user_id?: string
          weekday?: number
        }
        Relationships: []
      }
      mm_tick_logs: {
        Row: {
          duration_ms: number
          error: string | null
          id: string
          launched_count: number
          ran_at: string
          results: Json
        }
        Insert: {
          duration_ms?: number
          error?: string | null
          id?: string
          launched_count?: number
          ran_at?: string
          results?: Json
        }
        Update: {
          duration_ms?: number
          error?: string | null
          id?: string
          launched_count?: number
          ran_at?: string
          results?: Json
        }
        Relationships: []
      }
      mm_triggers: {
        Row: {
          automation_id: string
          config: Json
          consecutive_failures: number | null
          created_at: string
          cron_expr: string | null
          enabled: boolean
          id: string
          last_error: string | null
          last_run_at: string | null
          next_run_at: string | null
          type: Database["public"]["Enums"]["trigger_type"]
        }
        Insert: {
          automation_id: string
          config?: Json
          consecutive_failures?: number | null
          created_at?: string
          cron_expr?: string | null
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          next_run_at?: string | null
          type: Database["public"]["Enums"]["trigger_type"]
        }
        Update: {
          automation_id?: string
          config?: Json
          consecutive_failures?: number | null
          created_at?: string
          cron_expr?: string | null
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          next_run_at?: string | null
          type?: Database["public"]["Enums"]["trigger_type"]
        }
        Relationships: [
          {
            foreignKeyName: "triggers_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "mm_automations"
            referencedColumns: ["id"]
          },
        ]
      }
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
            foreignKeyName: "noject_audit_logs_project_id_fkey"
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
            foreignKeyName: "noject_calendar_events_project_id_fkey"
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
            foreignKeyName: "noject_coaching_sessions_project_id_fkey"
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
            foreignKeyName: "noject_expenses_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "noject_project_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "noject_expenses_project_id_fkey"
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
            foreignKeyName: "noject_meeting_transcripts_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "noject_project_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "noject_meeting_transcripts_project_id_fkey"
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
            foreignKeyName: "noject_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "noject_projects"
            referencedColumns: ["id"]
          },
        ]
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
          mime_type: string
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
            foreignKeyName: "noject_project_files_project_id_fkey"
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
            foreignKeyName: "noject_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "noject_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "noject_tasks_project_id_fkey"
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
            foreignKeyName: "noject_time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "noject_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "noject_time_entries_task_id_fkey"
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
      ocktavus_chat_link_codes: {
        Row: {
          code: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          user_id: string
        }
        Insert: {
          code: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          user_id: string
        }
        Update: {
          code?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ocktavus_chat_messages: {
        Row: {
          created_at: string
          id: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "ocktavus_chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      ocktavus_chat_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ocktavus_gmail_credentials: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          google_email: string | null
          refresh_token: string
          scopes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          google_email?: string | null
          refresh_token: string
          scopes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          google_email?: string | null
          refresh_token?: string
          scopes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ocktavus_google_chat_links: {
        Row: {
          display_name: string | null
          linked_at: string
          space_id: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          linked_at?: string
          space_id: string
          user_id: string
        }
        Update: {
          display_name?: string | null
          linked_at?: string
          space_id?: string
          user_id?: string
        }
        Relationships: []
      }
      ocktavus_google_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          space_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          space_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          space_id?: string
          user_id?: string
        }
        Relationships: []
      }
      ocktavus_google_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          google_email: string | null
          refresh_token: string | null
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          google_email?: string | null
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          google_email?: string | null
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      odoo_connections: {
        Row: {
          api_key: string
          db: string
          last_tested_at: string | null
          modules: Json
          status: string
          status_message: string | null
          uid: number | null
          updated_at: string
          url: string
          user_id: string
          username: string
        }
        Insert: {
          api_key: string
          db: string
          last_tested_at?: string | null
          modules?: Json
          status?: string
          status_message?: string | null
          uid?: number | null
          updated_at?: string
          url: string
          user_id: string
          username: string
        }
        Update: {
          api_key?: string
          db?: string
          last_tested_at?: string | null
          modules?: Json
          status?: string
          status_message?: string | null
          uid?: number | null
          updated_at?: string
          url?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      pa_activity_log: {
        Row: {
          action: string
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          item_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          item_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          item_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pa_agent_instructions: {
        Row: {
          ai_model: string | null
          break_habits: string | null
          communication_style: string | null
          custom_rules: string | null
          extra: Json | null
          priorities: string | null
          timezone: string | null
          updated_at: string
          user_id: string
          work_style: string | null
          working_hours: Json | null
        }
        Insert: {
          ai_model?: string | null
          break_habits?: string | null
          communication_style?: string | null
          custom_rules?: string | null
          extra?: Json | null
          priorities?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          work_style?: string | null
          working_hours?: Json | null
        }
        Update: {
          ai_model?: string | null
          break_habits?: string | null
          communication_style?: string | null
          custom_rules?: string | null
          extra?: Json | null
          priorities?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          work_style?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      pa_ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pa_ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pa_ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "pa_ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      pa_google_connections: {
        Row: {
          access_token: string
          calendar_sync_token: string | null
          created_at: string
          email: string | null
          expires_at: string | null
          last_sync_at: string | null
          refresh_token: string | null
          scope: string | null
          tasks_sync_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_sync_token?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string | null
          last_sync_at?: string | null
          refresh_token?: string | null
          scope?: string | null
          tasks_sync_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_sync_token?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string | null
          last_sync_at?: string | null
          refresh_token?: string | null
          scope?: string | null
          tasks_sync_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pa_planning_items: {
        Row: {
          all_day: boolean | null
          attendees: string[] | null
          board_column: string | null
          color: string | null
          created_at: string
          description: string | null
          due_at: string | null
          duration_min: number | null
          end_at: string | null
          google_calendar_id: string | null
          google_event_id: string | null
          google_synced_at: string | null
          google_task_id: string | null
          google_task_list_id: string | null
          icon: string | null
          id: string
          kind: string
          location: string | null
          metadata: Json | null
          notes: string | null
          position: number | null
          priority: string | null
          start_at: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          attendees?: string[] | null
          board_column?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          duration_min?: number | null
          end_at?: string | null
          google_calendar_id?: string | null
          google_event_id?: string | null
          google_synced_at?: string | null
          google_task_id?: string | null
          google_task_list_id?: string | null
          icon?: string | null
          id?: string
          kind: string
          location?: string | null
          metadata?: Json | null
          notes?: string | null
          position?: number | null
          priority?: string | null
          start_at?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          attendees?: string[] | null
          board_column?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          duration_min?: number | null
          end_at?: string | null
          google_calendar_id?: string | null
          google_event_id?: string | null
          google_synced_at?: string | null
          google_task_id?: string | null
          google_task_list_id?: string | null
          icon?: string | null
          id?: string
          kind?: string
          location?: string | null
          metadata?: Json | null
          notes?: string | null
          position?: number | null
          priority?: string | null
          start_at?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_model: string
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          timezone: string
          updated_at: string | null
        }
        Insert: {
          ai_model?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          timezone?: string
          updated_at?: string | null
        }
        Update: {
          ai_model?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          timezone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sendy_email_threads: {
        Row: {
          body: string | null
          created_at: string
          direction: string
          from_email: string | null
          gmail_message_id: string | null
          gmail_thread_id: string | null
          id: string
          opportunity_id: string
          provider: string
          provider_message_id: string | null
          received_at: string | null
          snippet: string | null
          status: string
          subject: string | null
          to_email: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          direction?: string
          from_email?: string | null
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          id?: string
          opportunity_id: string
          provider?: string
          provider_message_id?: string | null
          received_at?: string | null
          snippet?: string | null
          status?: string
          subject?: string | null
          to_email?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          direction?: string
          from_email?: string | null
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          id?: string
          opportunity_id?: string
          provider?: string
          provider_message_id?: string | null
          received_at?: string | null
          snippet?: string | null
          status?: string
          subject?: string | null
          to_email?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_threads_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      sendy_mail_attachments: {
        Row: {
          content_type: string | null
          created_at: string
          filename: string
          id: string
          message_id: string
          size_bytes: number | null
          storage_path: string
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          filename: string
          id?: string
          message_id: string
          size_bytes?: number | null
          storage_path: string
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          filename?: string
          id?: string
          message_id?: string
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "sendy_mail_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      sendy_mail_messages: {
        Row: {
          body_html: string | null
          body_text: string | null
          cc_addresses: string | null
          created_at: string
          folder: string
          from_address: string
          from_name: string | null
          id: string
          is_priority: boolean
          is_read: boolean
          is_starred: boolean
          provider_message_id: string | null
          raw_mime: string | null
          subject: string
          to_addresses: string
          user_id: string
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: string | null
          created_at?: string
          folder?: string
          from_address?: string
          from_name?: string | null
          id?: string
          is_priority?: boolean
          is_read?: boolean
          is_starred?: boolean
          provider_message_id?: string | null
          raw_mime?: string | null
          subject?: string
          to_addresses?: string
          user_id: string
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: string | null
          created_at?: string
          folder?: string
          from_address?: string
          from_name?: string | null
          id?: string
          is_priority?: boolean
          is_read?: boolean
          is_starred?: boolean
          provider_message_id?: string | null
          raw_mime?: string | null
          subject?: string
          to_addresses?: string
          user_id?: string
        }
        Relationships: []
      }
      sendy_mailboxes: {
        Row: {
          created_at: string
          display_name: string
          local_part: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          local_part: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          local_part?: string
          user_id?: string
        }
        Relationships: []
      }
      skycloud_activities: {
        Row: {
          action: string
          created_at: string
          file_name: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          file_name?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          file_name?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      skycloud_files: {
        Row: {
          created_at: string
          deleted_at: string | null
          encrypted: boolean
          favorite: boolean
          folder_id: string | null
          id: string
          mime_type: string
          name: string
          size: number
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          encrypted?: boolean
          favorite?: boolean
          folder_id?: string | null
          id?: string
          mime_type?: string
          name: string
          size?: number
          storage_path: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          encrypted?: boolean
          favorite?: boolean
          folder_id?: string | null
          id?: string
          mime_type?: string
          name?: string
          size?: number
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "skycloud_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      skycloud_folders: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      skycloud_shares: {
        Row: {
          created_at: string
          expires_at: string | null
          file_id: string
          id: string
          permission: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          file_id: string
          id?: string
          permission?: string
          token?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          file_id?: string
          id?: string
          permission?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shares_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "skycloud_files"
            referencedColumns: ["id"]
          },
        ]
      }
      skydoc_documents: {
        Row: {
          content: string
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      skydoc_messages: {
        Row: {
          content: string
          created_at: string
          document_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          document_id: string
          id?: string
          role: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          document_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sky_messages_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "skydoc_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      skytab_sheets: {
        Row: {
          created_at: string
          current_index: number
          data_text: string | null
          history: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_index?: number
          data_text?: string | null
          history?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          current_index?: number
          data_text?: string | null
          history?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      skytask_lists: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      skytask_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      skytask_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          list_id: string | null
          priority: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          list_id?: string | null
          priority?: string
          status?: string
          title: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          list_id?: string | null
          priority?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "skytask_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      skytask_user_settings: {
        Row: {
          accent: string
          compact: boolean
          daily_goal: number
          display_name: string | null
          notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          accent?: string
          compact?: boolean
          daily_goal?: number
          display_name?: string | null
          notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Update: {
          accent?: string
          compact?: boolean
          daily_goal?: number
          display_name?: string | null
          notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      st_agents: {
        Row: {
          color: string
          created_at: string
          department: string
          id: string
          is_chief: boolean
          lab_apps: string[]
          model: string
          name: string
          pos_x: number
          pos_y: number
          role: string
          skills: string
          status: string
          system_prompt: string
          team_id: string | null
          temperature: number
          tone: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          department: string
          id?: string
          is_chief?: boolean
          lab_apps?: string[]
          model?: string
          name: string
          pos_x?: number
          pos_y?: number
          role?: string
          skills?: string
          status?: string
          system_prompt?: string
          team_id?: string | null
          temperature?: number
          tone?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          department?: string
          id?: string
          is_chief?: boolean
          lab_apps?: string[]
          model?: string
          name?: string
          pos_x?: number
          pos_y?: number
          role?: string
          skills?: string
          status?: string
          system_prompt?: string
          team_id?: string | null
          temperature?: number
          tone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "st_agents_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "st_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      st_custom_departments: {
        Row: {
          blurb: string
          created_at: string
          default_team: string
          id: string
          key: string
          label: string
          user_id: string
        }
        Insert: {
          blurb?: string
          created_at?: string
          default_team?: string
          id?: string
          key: string
          label: string
          user_id: string
        }
        Update: {
          blurb?: string
          created_at?: string
          default_team?: string
          id?: string
          key?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      st_department_modules: {
        Row: {
          created_at: string
          department: string
          id: string
          modules: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          department: string
          id?: string
          modules?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          id?: string
          modules?: string[]
          user_id?: string
        }
        Relationships: []
      }
      st_missions: {
        Row: {
          created_at: string
          id: string
          objective: string
          status: string
          summary: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          objective: string
          status?: string
          summary?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          objective?: string
          status?: string
          summary?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "st_missions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "st_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      st_tasks: {
        Row: {
          agent_id: string | null
          brief: string
          created_at: string
          id: string
          mission_id: string | null
          result: string | null
          status: string
          team_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          brief?: string
          created_at?: string
          id?: string
          mission_id?: string | null
          result?: string | null
          status?: string
          team_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          brief?: string
          created_at?: string
          id?: string
          mission_id?: string | null
          result?: string | null
          status?: string
          team_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "st_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "st_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "st_tasks_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "st_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "st_tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "st_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      st_teams: {
        Row: {
          created_at: string
          department: string
          id: string
          mission: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: string
          id?: string
          mission?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          id?: string
          mission?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      tep_agents: {
        Row: {
          color: string
          created_at: string
          department: string
          id: string
          is_chief: boolean
          model: string
          name: string
          pos_x: number
          pos_y: number
          project_id: string | null
          role: string
          skills: string
          status: string
          system_prompt: string
          team_id: string | null
          temperature: number
          tone: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          department: string
          id?: string
          is_chief?: boolean
          model?: string
          name: string
          pos_x?: number
          pos_y?: number
          project_id?: string | null
          role?: string
          skills?: string
          status?: string
          system_prompt?: string
          team_id?: string | null
          temperature?: number
          tone?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          department?: string
          id?: string
          is_chief?: boolean
          model?: string
          name?: string
          pos_x?: number
          pos_y?: number
          project_id?: string | null
          role?: string
          skills?: string
          status?: string
          system_prompt?: string
          team_id?: string | null
          temperature?: number
          tone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tep_agents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tep_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tep_agents_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tep_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      tep_board_items: {
        Row: {
          ai_result: string | null
          color: string
          content: string
          created_at: string
          done: boolean
          due_at: string | null
          end_at: string | null
          google_event_id: string | null
          google_task_id: string | null
          h: number
          id: string
          kind: string
          mail_sent_at: string | null
          mail_subject: string | null
          mail_to: string | null
          project_id: string | null
          updated_at: string
          user_id: string
          w: number
          x: number
          y: number
        }
        Insert: {
          ai_result?: string | null
          color?: string
          content?: string
          created_at?: string
          done?: boolean
          due_at?: string | null
          end_at?: string | null
          google_event_id?: string | null
          google_task_id?: string | null
          h?: number
          id?: string
          kind?: string
          mail_sent_at?: string | null
          mail_subject?: string | null
          mail_to?: string | null
          project_id?: string | null
          updated_at?: string
          user_id: string
          w?: number
          x?: number
          y?: number
        }
        Update: {
          ai_result?: string | null
          color?: string
          content?: string
          created_at?: string
          done?: boolean
          due_at?: string | null
          end_at?: string | null
          google_event_id?: string | null
          google_task_id?: string | null
          h?: number
          id?: string
          kind?: string
          mail_sent_at?: string | null
          mail_subject?: string | null
          mail_to?: string | null
          project_id?: string | null
          updated_at?: string
          user_id?: string
          w?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "tep_board_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tep_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tep_boards: {
        Row: {
          created_at: string
          id: string
          problem: string
          progress: number
          project_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          problem?: string
          progress?: number
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          problem?: string
          progress?: number
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tep_boards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tep_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tep_brands: {
        Row: {
          audience: string
          created_at: string
          description: string
          font: string
          hashtags: string
          id: string
          name: string
          pillars: string
          primary_color: string
          project_id: string | null
          secondary_color: string
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string
          created_at?: string
          description?: string
          font?: string
          hashtags?: string
          id?: string
          name?: string
          pillars?: string
          primary_color?: string
          project_id?: string | null
          secondary_color?: string
          tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string
          created_at?: string
          description?: string
          font?: string
          hashtags?: string
          id?: string
          name?: string
          pillars?: string
          primary_color?: string
          project_id?: string | null
          secondary_color?: string
          tone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tep_brands_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tep_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tep_bubbles: {
        Row: {
          board_id: string
          content: string
          created_at: string
          done: boolean
          id: string
          kind: string
          mission: string
          objective: string
          status: string
          title: string
          updated_at: string
          user_id: string
          x: number
          y: number
        }
        Insert: {
          board_id: string
          content?: string
          created_at?: string
          done?: boolean
          id?: string
          kind?: string
          mission?: string
          objective?: string
          status?: string
          title?: string
          updated_at?: string
          user_id: string
          x?: number
          y?: number
        }
        Update: {
          board_id?: string
          content?: string
          created_at?: string
          done?: boolean
          id?: string
          kind?: string
          mission?: string
          objective?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "tep_bubbles_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "tep_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      tep_cards: {
        Row: {
          body: string
          color: string
          created_at: string
          data: Json
          h: number
          id: string
          parent_id: string | null
          project_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
          w: number
          x: number
          y: number
        }
        Insert: {
          body?: string
          color?: string
          created_at?: string
          data?: Json
          h?: number
          id?: string
          parent_id?: string | null
          project_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          w?: number
          x?: number
          y?: number
        }
        Update: {
          body?: string
          color?: string
          created_at?: string
          data?: Json
          h?: number
          id?: string
          parent_id?: string | null
          project_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          w?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "tep_cards_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tep_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tep_cards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tep_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tep_content_boards: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tep_content_boards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tep_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tep_content_notes: {
        Row: {
          board_id: string
          body: string
          caption: string
          color: string
          created_at: string
          data: Json
          hashtags: string
          height: number
          id: string
          image_url: string | null
          kind: string
          network: string | null
          scheduled_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          width: number
          x: number
          y: number
        }
        Insert: {
          board_id: string
          body?: string
          caption?: string
          color?: string
          created_at?: string
          data?: Json
          hashtags?: string
          height?: number
          id?: string
          image_url?: string | null
          kind?: string
          network?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
          width?: number
          x?: number
          y?: number
        }
        Update: {
          board_id?: string
          body?: string
          caption?: string
          color?: string
          created_at?: string
          data?: Json
          hashtags?: string
          height?: number
          id?: string
          image_url?: string | null
          kind?: string
          network?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          width?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "tep_content_notes_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "tep_content_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      tep_custom_departments: {
        Row: {
          blurb: string
          created_at: string
          default_team: string
          id: string
          key: string
          label: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          blurb?: string
          created_at?: string
          default_team?: string
          id?: string
          key: string
          label: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          blurb?: string
          created_at?: string
          default_team?: string
          id?: string
          key?: string
          label?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tep_custom_departments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tep_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tep_department_modules: {
        Row: {
          created_at: string
          department: string
          id: string
          modules: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          department: string
          id?: string
          modules?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          id?: string
          modules?: string[]
          user_id?: string
        }
        Relationships: []
      }
      tep_google_connections: {
        Row: {
          created_at: string
          google_email: string | null
          refresh_token: string
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          google_email?: string | null
          refresh_token: string
          scope?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          google_email?: string | null
          refresh_token?: string
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tep_google_oauth_states: {
        Row: {
          created_at: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      tep_links: {
        Row: {
          created_at: string
          id: string
          label: string
          project_id: string | null
          source_id: string
          target_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string
          project_id?: string | null
          source_id: string
          target_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          project_id?: string | null
          source_id?: string
          target_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tep_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tep_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tep_links_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "tep_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tep_links_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "tep_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      tep_missions: {
        Row: {
          created_at: string
          id: string
          objective: string
          status: string
          summary: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          objective: string
          status?: string
          summary?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          objective?: string
          status?: string
          summary?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tep_missions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tep_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      tep_notes: {
        Row: {
          color: string
          content: string
          created_at: string
          data: Json
          h: number
          id: string
          parent_id: string | null
          project_id: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
          w: number
          x: number
          y: number
        }
        Insert: {
          color?: string
          content?: string
          created_at?: string
          data?: Json
          h?: number
          id?: string
          parent_id?: string | null
          project_id?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id: string
          w?: number
          x?: number
          y?: number
        }
        Update: {
          color?: string
          content?: string
          created_at?: string
          data?: Json
          h?: number
          id?: string
          parent_id?: string | null
          project_id?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          w?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "tep_notes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tep_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tep_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tep_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tep_odoo_connections: {
        Row: {
          api_key: string
          connected: boolean
          created_at: string
          database: string
          id: string
          uid: number | null
          url: string
          user_id: string
          username: string
        }
        Insert: {
          api_key: string
          connected?: boolean
          created_at?: string
          database: string
          id?: string
          uid?: number | null
          url: string
          user_id: string
          username: string
        }
        Update: {
          api_key?: string
          connected?: boolean
          created_at?: string
          database?: string
          id?: string
          uid?: number | null
          url?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      tep_planning_google_connections: {
        Row: {
          access_token_ciphertext: string | null
          access_token_expires_at: string | null
          created_at: string
          google_email: string | null
          refresh_token_ciphertext: string
          scopes: string
          tasklist_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_ciphertext?: string | null
          access_token_expires_at?: string | null
          created_at?: string
          google_email?: string | null
          refresh_token_ciphertext: string
          scopes?: string
          tasklist_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_ciphertext?: string | null
          access_token_expires_at?: string | null
          created_at?: string
          google_email?: string | null
          refresh_token_ciphertext?: string
          scopes?: string
          tasklist_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tep_planning_google_oauth_states: {
        Row: {
          created_at: string
          redirect_uri: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          redirect_uri: string
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          redirect_uri?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      tep_projects: {
        Row: {
          board_type: string
          created_at: string
          id: string
          parent_board_id: string | null
          ref_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board_type: string
          created_at?: string
          id?: string
          parent_board_id?: string | null
          ref_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board_type?: string
          created_at?: string
          id?: string
          parent_board_id?: string | null
          ref_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tep_projects_parent_board_id_fkey"
            columns: ["parent_board_id"]
            isOneToOne: false
            referencedRelation: "tep_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tep_sketch_boards: {
        Row: {
          created_at: string
          elements: Json
          id: string
          notes: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          elements?: Json
          id?: string
          notes?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          elements?: Json
          id?: string
          notes?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tep_stickies: {
        Row: {
          color: string
          content: string
          created_at: string
          day: string
          done: boolean
          duration_min: number | null
          email_sent: boolean
          email_to: string | null
          google_id: string | null
          google_list_id: string | null
          id: string
          kind: string
          project_id: string | null
          start_time: string | null
          synced_at: string | null
          title: string
          updated_at: string
          user_id: string
          x: number
          y: number
        }
        Insert: {
          color?: string
          content?: string
          created_at?: string
          day: string
          done?: boolean
          duration_min?: number | null
          email_sent?: boolean
          email_to?: string | null
          google_id?: string | null
          google_list_id?: string | null
          id?: string
          kind?: string
          project_id?: string | null
          start_time?: string | null
          synced_at?: string | null
          title?: string
          updated_at?: string
          user_id: string
          x?: number
          y?: number
        }
        Update: {
          color?: string
          content?: string
          created_at?: string
          day?: string
          done?: boolean
          duration_min?: number | null
          email_sent?: boolean
          email_to?: string | null
          google_id?: string | null
          google_list_id?: string | null
          id?: string
          kind?: string
          project_id?: string | null
          start_time?: string | null
          synced_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "tep_stickies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tep_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tep_tasks: {
        Row: {
          agent_id: string | null
          brief: string
          created_at: string
          id: string
          mission_id: string | null
          result: string | null
          status: string
          team_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          brief?: string
          created_at?: string
          id?: string
          mission_id?: string | null
          result?: string | null
          status?: string
          team_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          brief?: string
          created_at?: string
          id?: string
          mission_id?: string | null
          result?: string | null
          status?: string
          team_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tep_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "tep_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tep_tasks_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "tep_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tep_tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tep_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      tep_teams: {
        Row: {
          created_at: string
          department: string
          id: string
          mission: string | null
          name: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          department: string
          id?: string
          mission?: string | null
          name: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          id?: string
          mission?: string | null
          name?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tep_teams_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tep_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tep_user_settings: {
        Row: {
          ai_model: string
          board_theme: string
          created_at: string
          default_calendar_id: string
          default_tasklist_id: string | null
          display_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model?: string
          board_theme?: string
          created_at?: string
          default_calendar_id?: string
          default_tasklist_id?: string | null
          display_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model?: string
          board_theme?: string
          created_at?: string
          default_calendar_id?: string
          default_tasklist_id?: string | null
          display_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ui_preferences: {
        Row: {
          background_opacity: number
          background_url: string | null
          created_at: string
          sidebar_collapsed: boolean
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          background_opacity?: number
          background_url?: string | null
          created_at?: string
          sidebar_collapsed?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          background_opacity?: number
          background_url?: string | null
          created_at?: string
          sidebar_collapsed?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_ai_keys: {
        Row: {
          created_at: string
          gemini_key: string | null
          openai_key: string | null
          preferred_provider: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gemini_key?: string | null
          openai_key?: string | null
          preferred_provider?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gemini_key?: string | null
          openai_key?: string | null
          preferred_provider?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_app_models: {
        Row: {
          app_key: string
          created_at: string
          id: string
          model_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_key: string
          created_at?: string
          id?: string
          model_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_key?: string
          created_at?: string
          id?: string
          model_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          ai_model: string
          chat_memory_size: number
          created_at: string
          email_greeting: string
          email_signature: string
          email_tone: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model?: string
          chat_memory_size?: number
          created_at?: string
          email_greeting?: string
          email_signature?: string
          email_tone?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model?: string
          chat_memory_size?: number
          created_at?: string
          email_greeting?: string
          email_signature?: string
          email_tone?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      gmail_connection_status: {
        Row: {
          expires_at: string | null
          google_email: string | null
          scopes: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          expires_at?: string | null
          google_email?: string | null
          scopes?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          expires_at?: string | null
          google_email?: string | null
          scopes?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      angelo_init_user: { Args: { _uid: string }; Returns: undefined }
      is_address_available: { Args: { _local: string }; Returns: boolean }
      meets_mfa_requirement: { Args: never; Returns: boolean }
      noject_recompute_project_progress: {
        Args: { _project_id: string }
        Returns: undefined
      }
    }
    Enums: {
      automation_status: "draft" | "active" | "paused"
      execution_status: "pending" | "running" | "success" | "error"
      noject_project_phase:
        | "lancement"
        | "planification"
        | "execution"
        | "cloture"
      noject_project_status: "actif" | "en_pause" | "termine" | "archive"
      noject_task_priority: "basse" | "moyenne" | "haute" | "critique"
      noject_task_status:
        | "a_faire"
        | "en_cours"
        | "en_revue"
        | "termine"
        | "bloque"
      trigger_type: "cron" | "new_email" | "new_event" | "new_task"
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
      automation_status: ["draft", "active", "paused"],
      execution_status: ["pending", "running", "success", "error"],
      noject_project_phase: [
        "lancement",
        "planification",
        "execution",
        "cloture",
      ],
      noject_project_status: ["actif", "en_pause", "termine", "archive"],
      noject_task_priority: ["basse", "moyenne", "haute", "critique"],
      noject_task_status: [
        "a_faire",
        "en_cours",
        "en_revue",
        "termine",
        "bloque",
      ],
      trigger_type: ["cron", "new_email", "new_event", "new_task"],
    },
  },
} as const

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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cep_search_events: {
        Row: {
          cep: string
          id: string
          referrer: string | null
          results_count: number
          searched_at: string
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          cep: string
          id?: string
          referrer?: string | null
          results_count?: number
          searched_at?: string
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          cep?: string
          id?: string
          referrer?: string | null
          results_count?: number
          searched_at?: string
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      grades: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_index: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      import_jobs: {
        Row: {
          batch_size: number | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          current_batch: number | null
          cursor_line: number | null
          error_details: Json | null
          error_message: string | null
          failed_records: number | null
          file_name: string
          file_path: string | null
          id: string
          inserted_records: number | null
          job_type: string
          processed_records: number | null
          skipped_records: number | null
          started_at: string | null
          status: string
          total_records: number | null
          updated_at: string
        }
        Insert: {
          batch_size?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_batch?: number | null
          cursor_line?: number | null
          error_details?: Json | null
          error_message?: string | null
          failed_records?: number | null
          file_name: string
          file_path?: string | null
          id?: string
          inserted_records?: number | null
          job_type?: string
          processed_records?: number | null
          skipped_records?: number | null
          started_at?: string | null
          status?: string
          total_records?: number | null
          updated_at?: string
        }
        Update: {
          batch_size?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_batch?: number | null
          cursor_line?: number | null
          error_details?: Json | null
          error_message?: string | null
          failed_records?: number | null
          file_name?: string
          file_path?: string | null
          id?: string
          inserted_records?: number | null
          job_type?: string
          processed_records?: number | null
          skipped_records?: number | null
          started_at?: string | null
          status?: string
          total_records?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      list_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          list_id: string
          metadata: Json | null
          new_status: Database["public"]["Enums"]["list_status"]
          previous_status: Database["public"]["Enums"]["list_status"] | null
          reason: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          list_id: string
          metadata?: Json | null
          new_status: Database["public"]["Enums"]["list_status"]
          previous_status?: Database["public"]["Enums"]["list_status"] | null
          reason?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          list_id?: string
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["list_status"]
          previous_status?: Database["public"]["Enums"]["list_status"] | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "list_status_history_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "material_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      list_view_events: {
        Row: {
          grade_id: string
          id: string
          list_id: string
          referrer: string | null
          school_id: string
          session_id: string | null
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          grade_id: string
          id?: string
          list_id: string
          referrer?: string | null
          school_id: string
          session_id?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          grade_id?: string
          id?: string
          list_id?: string
          referrer?: string | null
          school_id?: string
          session_id?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_view_events_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_grades"
            referencedColumns: ["grade_id"]
          },
          {
            foreignKeyName: "list_view_events_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_view_events_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "material_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_view_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "list_view_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      material_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          order_index: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          order_index?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      material_items: {
        Row: {
          brand_suggestion: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_required: boolean | null
          list_id: string
          name: string
          price_estimate: number | null
          purchase_url: string | null
          quantity: number | null
          search_query: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          brand_suggestion?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean | null
          list_id: string
          name: string
          price_estimate?: number | null
          purchase_url?: string | null
          quantity?: number | null
          search_query?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          brand_suggestion?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean | null
          list_id?: string
          name?: string
          price_estimate?: number | null
          purchase_url?: string | null
          quantity?: number | null
          search_query?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "material_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      material_lists: {
        Row: {
          created_at: string
          grade_id: string
          id: string
          is_active: boolean | null
          promoted_at: string | null
          promoted_by: string | null
          school_id: string
          status: Database["public"]["Enums"]["list_status"]
          updated_at: string
          version: number | null
          year: number
        }
        Insert: {
          created_at?: string
          grade_id: string
          id?: string
          is_active?: boolean | null
          promoted_at?: string | null
          promoted_by?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["list_status"]
          updated_at?: string
          version?: number | null
          year?: number
        }
        Update: {
          created_at?: string
          grade_id?: string
          id?: string
          is_active?: boolean | null
          promoted_at?: string | null
          promoted_by?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["list_status"]
          updated_at?: string
          version?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_lists_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_grades"
            referencedColumns: ["grade_id"]
          },
          {
            foreignKeyName: "material_lists_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_lists_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "material_lists_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_stores: {
        Row: {
          affiliate_tag: string | null
          base_url: string
          cart_strategy: string
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          order_index: number
          search_template: string
          updated_at: string
        }
        Insert: {
          affiliate_tag?: string | null
          base_url: string
          cart_strategy?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          order_index?: number
          search_template: string
          updated_at?: string
        }
        Update: {
          affiliate_tag?: string | null
          base_url?: string
          cart_strategy?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          order_index?: number
          search_template?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_events: {
        Row: {
          clicked_at: string
          id: string
          item_id: string
          list_id: string
          referrer: string | null
          school_id: string
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          item_id: string
          list_id: string
          referrer?: string | null
          school_id: string
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          item_id?: string
          list_id?: string
          referrer?: string | null
          school_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_events_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_items"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "purchase_events_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "material_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_events_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "material_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "purchase_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_view_events: {
        Row: {
          id: string
          referrer: string | null
          school_id: string
          session_id: string | null
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          referrer?: string | null
          school_id: string
          session_id?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          referrer?: string | null
          school_id?: string
          session_id?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_view_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "school_view_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          cep: string
          city: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cep: string
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cep?: string
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      share_events: {
        Row: {
          id: string
          list_id: string
          school_id: string
          share_type: string
          shared_at: string
        }
        Insert: {
          id?: string
          list_id: string
          school_id: string
          share_type: string
          shared_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          school_id?: string
          share_type?: string
          shared_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_events_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "material_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "share_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      store_click_events: {
        Row: {
          clicked_at: string
          id: string
          item_id: string | null
          list_id: string | null
          referrer: string | null
          school_id: string | null
          session_id: string | null
          store_id: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          item_id?: string | null
          list_id?: string | null
          referrer?: string | null
          school_id?: string | null
          session_id?: string | null
          store_id?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          item_id?: string | null
          list_id?: string | null
          referrer?: string | null
          school_id?: string | null
          session_id?: string | null
          store_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_click_events_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_items"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "store_click_events_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "material_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_click_events_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "material_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_click_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "store_click_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_click_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "analytics_store_conversion"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_click_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "partner_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          session_id: string | null
          uploaded_list_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          uploaded_list_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          uploaded_list_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "upload_events_uploaded_list_id_fkey"
            columns: ["uploaded_list_id"]
            isOneToOne: false
            referencedRelation: "uploaded_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_lists: {
        Row: {
          created_at: string
          error_message: string | null
          extracted_items: Json | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          grade_id: string | null
          id: string
          material_list_id: string | null
          processing_message: string | null
          processing_progress: number | null
          school_id: string | null
          school_name_custom: string | null
          session_id: string | null
          status: string
          updated_at: string
          user_agent: string | null
          year: number
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          extracted_items?: Json | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          grade_id?: string | null
          id?: string
          material_list_id?: string | null
          processing_message?: string | null
          processing_progress?: number | null
          school_id?: string | null
          school_name_custom?: string | null
          session_id?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          year?: number
        }
        Update: {
          created_at?: string
          error_message?: string | null
          extracted_items?: Json | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          grade_id?: string | null
          id?: string
          material_list_id?: string | null
          processing_message?: string | null
          processing_progress?: number | null
          school_id?: string | null
          school_name_custom?: string | null
          session_id?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_lists_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_grades"
            referencedColumns: ["grade_id"]
          },
          {
            foreignKeyName: "uploaded_lists_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_lists_material_list_id_fkey"
            columns: ["material_list_id"]
            isOneToOne: false
            referencedRelation: "material_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_lists_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "uploaded_lists_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      analytics_daily_summary: {
        Row: {
          cep_searches: number | null
          date: string | null
          list_views: number | null
          school_views: number | null
          shares: number | null
          store_clicks: number | null
        }
        Relationships: []
      }
      analytics_demand_by_region: {
        Row: {
          cep_prefix: string | null
          city: string | null
          state: string | null
          total_list_views: number | null
          total_school_views: number | null
          total_schools: number | null
          total_store_clicks: number | null
          unique_sessions: number | null
        }
        Relationships: []
      }
      analytics_store_conversion: {
        Row: {
          cart_clicks: number | null
          item_clicks: number | null
          lists_clicked: number | null
          logo_url: string | null
          schools_clicked: number | null
          store_id: string | null
          store_name: string | null
          total_clicks: number | null
          unique_sessions: number | null
        }
        Relationships: []
      }
      analytics_top_grades: {
        Row: {
          grade_id: string | null
          grade_name: string | null
          order_index: number | null
          schools_with_lists: number | null
          total_list_views: number | null
          total_store_clicks: number | null
          unique_sessions: number | null
        }
        Relationships: []
      }
      analytics_top_items: {
        Row: {
          category_name: string | null
          item_id: string | null
          item_name: string | null
          schools_clicked: number | null
          total_clicks: number | null
          unique_sessions: number | null
        }
        Relationships: []
      }
      analytics_top_schools: {
        Row: {
          cep: string | null
          city: string | null
          engagement_score: number | null
          school_id: string | null
          school_name: string | null
          state: string | null
          total_list_views: number | null
          total_store_clicks: number | null
          total_views: number | null
          unique_list_sessions: number | null
          unique_sessions: number | null
        }
        Relationships: []
      }
      analytics_upload_funnel: {
        Row: {
          date: string | null
          event_count: number | null
          event_type: string | null
          unique_sessions: number | null
        }
        Relationships: []
      }
      store_recommendation_scores: {
        Row: {
          cart_clicks: number | null
          context_score: number | null
          final_score: number | null
          global_score: number | null
          item_clicks: number | null
          list_id: string | null
          list_views: number | null
          school_id: string | null
          store_id: string | null
          unique_sessions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "store_click_events_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "material_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_click_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "analytics_top_schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "store_click_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_click_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "analytics_store_conversion"
            referencedColumns: ["store_id"]
          },
          {
            foreignKeyName: "store_click_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "partner_stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_distinct_school_cities: {
        Args: { p_state: string }
        Returns: {
          city: string
        }[]
      }
      get_distinct_school_states: {
        Args: never
        Returns: {
          state: string
        }[]
      }
      get_recommended_store: {
        Args: { _list_id: string; _school_id?: string }
        Returns: {
          cart_clicks: number
          item_clicks: number
          reason: string
          score: number
          store_id: string
          store_name: string
        }[]
      }
      get_school_admin_school_id: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_school_admin: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      normalize_cep: { Args: { input_cep: string }; Returns: string }
      promote_list_to_official: {
        Args: { _list_id: string; _user_id: string }
        Returns: boolean
      }
      search_schools: {
        Args: {
          filter_city?: string
          filter_state?: string
          page_number?: number
          page_size?: number
          search_cep?: string
          search_name?: string
        }
        Returns: {
          address: string
          cep: string
          city: string
          id: string
          is_active: boolean
          logo_url: string
          name: string
          slug: string
          state: string
          total_count: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      list_status: "draft" | "published" | "flagged" | "official"
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
      app_role: ["admin", "moderator", "user"],
      list_status: ["draft", "published", "flagged", "official"],
    },
  },
} as const

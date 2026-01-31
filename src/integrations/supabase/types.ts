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
          school_id: string
          updated_at: string
          version: number | null
          year: number
        }
        Insert: {
          created_at?: string
          grade_id: string
          id?: string
          is_active?: boolean | null
          school_id: string
          updated_at?: string
          version?: number | null
          year?: number
        }
        Update: {
          created_at?: string
          grade_id?: string
          id?: string
          is_active?: boolean | null
          school_id?: string
          updated_at?: string
          version?: number | null
          year?: number
        }
        Relationships: [
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
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const

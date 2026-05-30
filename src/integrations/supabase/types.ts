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
      bookings: {
        Row: {
          amount_charged: number
          booking_type: Database["public"]["Enums"]["booking_type"]
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          deposit_amount: number
          dropoff_location_id: string | null
          expires_at: string
          flight_info: string | null
          id: string
          paid_at: string | null
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          pickup_location_id: string | null
          property_checkin: string | null
          property_checkout: string | null
          property_guests: number | null
          property_id: string | null
          property_total: number
          reference: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          total_amount: number
          updated_at: string
          vehicle_end: string | null
          vehicle_id: string | null
          vehicle_start: string | null
          vehicle_total: number
        }
        Insert: {
          amount_charged?: number
          booking_type: Database["public"]["Enums"]["booking_type"]
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          deposit_amount?: number
          dropoff_location_id?: string | null
          expires_at?: string
          flight_info?: string | null
          id?: string
          paid_at?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_location_id?: string | null
          property_checkin?: string | null
          property_checkout?: string | null
          property_guests?: number | null
          property_id?: string | null
          property_total?: number
          reference?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          total_amount: number
          updated_at?: string
          vehicle_end?: string | null
          vehicle_id?: string | null
          vehicle_start?: string | null
          vehicle_total?: number
        }
        Update: {
          amount_charged?: number
          booking_type?: Database["public"]["Enums"]["booking_type"]
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          deposit_amount?: number
          dropoff_location_id?: string | null
          expires_at?: string
          flight_info?: string | null
          id?: string
          paid_at?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_location_id?: string | null
          property_checkin?: string | null
          property_checkout?: string | null
          property_guests?: number | null
          property_id?: string | null
          property_total?: number
          reference?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          total_amount?: number
          updated_at?: string
          vehicle_end?: string | null
          vehicle_id?: string | null
          vehicle_start?: string | null
          vehicle_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_dropoff_location_id_fkey"
            columns: ["dropoff_location_id"]
            isOneToOne: false
            referencedRelation: "pickup_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "pickup_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_locations: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          amenities: string[]
          bedrooms: number
          capacity: number
          created_at: string
          description: string | null
          id: string
          image_urls: string[]
          is_active: boolean
          location: string | null
          name: string
          price_per_night: number
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          bedrooms?: number
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[]
          is_active?: boolean
          location?: string | null
          name: string
          price_per_night: number
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          bedrooms?: number
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[]
          is_active?: boolean
          location?: string | null
          name?: string
          price_per_night?: number
          updated_at?: string
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
      vehicles: {
        Row: {
          category: string
          created_at: string
          description: string | null
          fuel: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_per_day: number
          seats: number
          transmission: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          fuel?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price_per_day: number
          seats?: number
          transmission?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          fuel?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price_per_day?: number
          seats?: number
          transmission?: string
          updated_at?: string
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
      app_role: "admin"
      booking_type: "vehicle" | "property" | "both"
      payment_mode: "deposit" | "full"
      payment_status: "pending" | "paid" | "cancelled" | "expired"
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
      app_role: ["admin"],
      booking_type: ["vehicle", "property", "both"],
      payment_mode: ["deposit", "full"],
      payment_status: ["pending", "paid", "cancelled", "expired"],
    },
  },
} as const

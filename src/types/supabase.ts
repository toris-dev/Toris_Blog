export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          chat_room: string
          create_by: string
          created_at: string
          id: string
          message: string
        }
        Insert: {
          chat_room: string
          create_by: string
          created_at?: string
          id?: string
          message: string
        }
        Update: {
          chat_room?: string
          create_by?: string
          created_at?: string
          id?: string
          message?: string
        }
        Relationships: []
      }
      chat_rooms: {
        Row: {
          created_at: string
          from_anon_id: string
          id: string
          to_owner_id: string
        }
        Insert: {
          created_at?: string
          from_anon_id?: string
          id?: string
          to_owner_id?: string
        }
        Update: {
          created_at?: string
          from_anon_id?: string
          id?: string
          to_owner_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          writer: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          writer: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          writer?: string
        }
        Relationships: []
      }
      Post: {
        Row: {
          category: string
          content: string
          created_at: string
          id: number
          preview_image_url: string | null
          tags: string
          title: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: number
          preview_image_url?: string | null
          tags: string
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: number
          preview_image_url?: string | null
          tags?: string
          title?: string
        }
        Relationships: []
      }
      replies: {
        Row: {
          author_id: string
          comment_id: string
          content: string
          created_at: string
          depth: number
          id: string
          parent_reply_id: string | null
          update_at: string | null
          update_status: boolean | null
        }
        Insert: {
          author_id: string
          comment_id: string
          content: string
          created_at?: string
          depth: number
          id?: string
          parent_reply_id?: string | null
          update_at?: string | null
          update_status?: boolean | null
        }
        Update: {
          author_id?: string
          comment_id?: string
          content?: string
          created_at?: string
          depth?: number
          id?: string
          parent_reply_id?: string | null
          update_at?: string | null
          update_status?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "public_replies_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

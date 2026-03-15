export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined; }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
  public: {
    Tables: {
      badges: {
        Row: {
          badge_id: string;
          description: string | null;
          earned_at: string;
          icon: string | null;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          badge_id: string;
          description?: string | null;
          earned_at?: string;
          icon?: string | null;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          badge_id?: string;
          description?: string | null;
          earned_at?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "badges_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_sessions: {
        Row: {
          created_at: string;
          duration_seconds: number | null;
          ended_at: string | null;
          id: string;
          message_count: number | null;
          session_type: string;
          started_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          duration_seconds?: number | null;
          ended_at?: string | null;
          id?: string;
          message_count?: number | null;
          session_type?: string;
          started_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          duration_seconds?: number | null;
          ended_at?: string | null;
          id?: string;
          message_count?: number | null;
          session_type?: string;
          started_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      course_files: {
        Row: {
          course_id: string;
          created_at: string;
          extracted_content: string | null;
          file_type: string;
          filename: string;
          id: string;
          size_bytes: number;
          storage_path: string;
          updated_at: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          extracted_content?: string | null;
          file_type: string;
          filename: string;
          id?: string;
          size_bytes: number;
          storage_path: string;
          updated_at?: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          extracted_content?: string | null;
          file_type?: string;
          filename?: string;
          id?: string;
          size_bytes?: number;
          storage_path?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "course_files_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["course_id"];
          },
        ];
      };
      course_modules: {
        Row: {
          course_id: string;
          created_at: string;
          description: string | null;
          estimated_time_minutes: number | null;
          id: string;
          module_id: string;
          name: string;
          order_index: number;
          topics: string[] | null;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          description?: string | null;
          estimated_time_minutes?: number | null;
          id?: string;
          module_id: string;
          name: string;
          order_index: number;
          topics?: string[] | null;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          description?: string | null;
          estimated_time_minutes?: number | null;
          id?: string;
          module_id?: string;
          name?: string;
          order_index?: number;
          topics?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["course_id"];
          },
        ];
      };
      courses: {
        Row: {
          course_id: string;
          created_at: string;
          creatorId: string;
          description: string | null;
          estimated_time_minutes: number | null;
          id: string;
          name: string;
          total_modules: number;
          updated_at: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          creatorId: string;
          description?: string | null;
          estimated_time_minutes?: number | null;
          id?: string;
          name: string;
          total_modules?: number;
          updated_at?: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          creatorId?: string;
          description?: string | null;
          estimated_time_minutes?: number | null;
          id?: string;
          name?: string;
          total_modules?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      flash_cards: {
        Row: {
          back: string;
          card_type: string;
          created_at: string;
          ease_factor: number;
          front: string;
          id: string;
          interval_days: number;
          next_review: string;
          repetitions: number;
          topic_id: string;
          user_id: string;
          xp_reward: number;
        };
        Insert: {
          back: string;
          card_type: string;
          created_at?: string;
          ease_factor?: number;
          front: string;
          id?: string;
          interval_days?: number;
          next_review?: string;
          repetitions?: number;
          topic_id: string;
          user_id: string;
          xp_reward?: number;
        };
        Update: {
          back?: string;
          card_type?: string;
          created_at?: string;
          ease_factor?: number;
          front?: string;
          id?: string;
          interval_days?: number;
          next_review?: string;
          repetitions?: number;
          topic_id?: string;
          user_id?: string;
          xp_reward?: number;
        };
        Relationships: [
          {
            foreignKeyName: "flash_cards_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      forge_sessions: {
        Row: {
          answers: Json | null;
          completed_at: string | null;
          discipline: string;
          id: string;
          max_score: number;
          score: number;
          started_at: string;
          user_id: string;
        };
        Insert: {
          answers?: Json | null;
          completed_at?: string | null;
          discipline: string;
          id?: string;
          max_score?: number;
          score?: number;
          started_at?: string;
          user_id: string;
        };
        Update: {
          answers?: Json | null;
          completed_at?: string | null;
          discipline?: string;
          id?: string;
          max_score?: number;
          score?: number;
          started_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forge_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      generated_content: {
        Row: {
          content: Json;
          content_type: string;
          created_at: string;
          difficulty: string | null;
          expires_at: string | null;
          id: string;
          parameters: Json | null;
          topic: string;
          user_id: string;
        };
        Insert: {
          content: Json;
          content_type: string;
          created_at?: string;
          difficulty?: string | null;
          expires_at?: string | null;
          id?: string;
          parameters?: Json | null;
          topic: string;
          user_id: string;
        };
        Update: {
          content?: Json;
          content_type?: string;
          created_at?: string;
          difficulty?: string | null;
          expires_at?: string | null;
          id?: string;
          parameters?: Json | null;
          topic?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generated_content_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lab_sessions: {
        Row: {
          completed: boolean;
          created_at: string;
          id: string;
          paradigm: string;
          score: number;
          topic_id: string | null;
          user_id: string;
        };
        Insert: {
          completed?: boolean;
          created_at?: string;
          id?: string;
          paradigm: string;
          score?: number;
          topic_id?: string | null;
          user_id: string;
        };
        Update: {
          completed?: boolean;
          created_at?: string;
          id?: string;
          paradigm?: string;
          score?: number;
          topic_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lab_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_progress: {
        Row: {
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          id: string;
          lesson_id: string;
          quiz_score: number | null;
          time_spent_minutes: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          lesson_id: string;
          quiz_score?: number | null;
          time_spent_minutes?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          lesson_id?: string;
          quiz_score?: number | null;
          time_spent_minutes?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          accuracy_rate: number;
          avatar_url: string | null;
          created_at: string;
          difficulty: string;
          display_name: string;
          forge_score: number;
          id: string;
          lab_score: number;
          last_active: string | null;
          level: number;
          photosensitivity: boolean;
          recent_wrong_per_topic: Json | null;
          reduced_motion: boolean;
          selected_track: string;
          streak: number;
          theme: string;
          total_correct: number;
          total_time_spent: number;
          total_wrong: number;
          updated_at: string;
          xp: number;
        };
        Insert: {
          accuracy_rate?: number;
          avatar_url?: string | null;
          created_at?: string;
          difficulty?: string;
          display_name?: string;
          forge_score?: number;
          id: string;
          lab_score?: number;
          last_active?: string | null;
          level?: number;
          photosensitivity?: boolean;
          recent_wrong_per_topic?: Json | null;
          reduced_motion?: boolean;
          selected_track?: string;
          streak?: number;
          theme?: string;
          total_correct?: number;
          total_time_spent?: number;
          total_wrong?: number;
          updated_at?: string;
          xp?: number;
        };
        Update: {
          accuracy_rate?: number;
          avatar_url?: string | null;
          created_at?: string;
          difficulty?: string;
          display_name?: string;
          forge_score?: number;
          id?: string;
          lab_score?: number;
          last_active?: string | null;
          level?: number;
          photosensitivity?: boolean;
          recent_wrong_per_topic?: Json | null;
          reduced_motion?: boolean;
          selected_track?: string;
          streak?: number;
          theme?: string;
          total_correct?: number;
          total_time_spent?: number;
          total_wrong?: number;
          updated_at?: string;
          xp?: number;
        };
        Relationships: [];
      };
      progress_reports: {
        Row: {
          course_id: string | null;
          created_at: string;
          id: string;
          include_recommendations: boolean;
          report_data: Json;
          report_date: string;
          time_range_days: number;
          user_id: string;
        };
        Insert: {
          course_id?: string | null;
          created_at?: string;
          id?: string;
          include_recommendations?: boolean;
          report_data: Json;
          report_date?: string;
          time_range_days?: number;
          user_id: string;
        };
        Update: {
          course_id?: string | null;
          created_at?: string;
          id?: string;
          include_recommendations?: boolean;
          report_data?: Json;
          report_date?: string;
          time_range_days?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "progress_reports_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_answers: {
        Row: {
          category: string | null;
          correct: boolean;
          created_at: string;
          difficulty: number;
          id: string;
          time_taken_ms: number | null;
          topic_id: string | null;
          user_id: string;
        };
        Insert: {
          category?: string | null;
          correct: boolean;
          created_at?: string;
          difficulty: number;
          id?: string;
          time_taken_ms?: number | null;
          topic_id?: string | null;
          user_id: string;
        };
        Update: {
          category?: string | null;
          correct?: boolean;
          created_at?: string;
          difficulty?: number;
          id?: string;
          time_taken_ms?: number | null;
          topic_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_answers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      topic_progress: {
        Row: {
          attempts: number;
          best_score: number;
          completed: boolean;
          difficulty_level: string;
          id: string;
          last_seen: string;
          time_spent_minutes: number;
          topic_id: string;
          user_id: string;
          xp_earned: number;
        };
        Insert: {
          attempts?: number;
          best_score?: number;
          completed?: boolean;
          difficulty_level?: string;
          id?: string;
          last_seen?: string;
          time_spent_minutes?: number;
          topic_id: string;
          user_id: string;
          xp_earned?: number;
        };
        Update: {
          attempts?: number;
          best_score?: number;
          completed?: boolean;
          difficulty_level?: string;
          id?: string;
          last_seen?: string;
          time_spent_minutes?: number;
          topic_id?: string;
          user_id?: string;
          xp_earned?: number;
        };
        Relationships: [
          {
            foreignKeyName: "topic_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      topics: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          difficulty_level: string;
          estimated_time_minutes: number | null;
          id: string;
          name: string;
          prerequisites: string[] | null;
          topic_id: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          description?: string | null;
          difficulty_level?: string;
          estimated_time_minutes?: number | null;
          id?: string;
          name: string;
          prerequisites?: string[] | null;
          topic_id: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          difficulty_level?: string;
          estimated_time_minutes?: number | null;
          id?: string;
          name?: string;
          prerequisites?: string[] | null;
          topic_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      fn_bkt_update: {
        Args: {
          is_correct: boolean;
          p_guess: number;
          p_know: number;
          p_learn: number;
          p_slip: number;
        };
        Returns: number;
      };
      fn_detect_weak_concepts: {
        Args: { p_user_id: string; };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals; },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
  ? R
  : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals; },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I;
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I;
  }
  ? I
  : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals; },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U;
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U;
  }
  ? U
  : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals; },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals; },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;

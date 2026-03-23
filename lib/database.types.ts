export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          colour: string;
          category: "work" | "personal";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          colour?: string;
          category?: "work" | "personal";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          colour?: string;
          category?: "work" | "personal";
          created_at?: string;
        };
        Relationships: [];
      };
      entries: {
        Row: {
          id: string;
          user_id: string;
          tag_id: string;
          task_name: string;
          started_at: string;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          tag_id: string;
          task_name: string;
          started_at: string;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tag_id?: string;
          task_name?: string;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entries_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type Entry = Database["public"]["Tables"]["entries"]["Row"];
export type EntryWithTag = Entry & { tags: Tag };

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      account_types: {
        Row: {
          category:
            | "ASSET"
            | "LIABILITY"
            | "EQUITY"
            | "INCOME"
            | "EXPENSE"
            | "SYSTEM";
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          normal_balance: "DEBIT" | "CREDIT";
        };
        Insert: {
          category:
            | "ASSET"
            | "LIABILITY"
            | "EQUITY"
            | "INCOME"
            | "EXPENSE"
            | "SYSTEM";
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          normal_balance: "DEBIT" | "CREDIT";
        };
        Update: {
          category?:
            | "ASSET"
            | "LIABILITY"
            | "EQUITY"
            | "INCOME"
            | "EXPENSE"
            | "SYSTEM";
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          normal_balance?: "DEBIT" | "CREDIT";
        };
        Relationships: [];
      };
      accounts: {
        Row: {
          account_type_id: string | null;
          balance: number | null;
          code: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          parent_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          account_type_id?: string | null;
          balance?: number | null;
          code?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          parent_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          account_type_id?: string | null;
          balance?: number | null;
          code?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          parent_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_account_type_id_fkey";
            columns: ["account_type_id"];
            isOneToOne: false;
            referencedRelation: "account_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accounts_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          }
        ];
      };
      account_prices: {
        Row: {
          id: string;
          user_id: string | null;
          account_id: string;
          price: number;
          date: string;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          account_id: string;
          price: number;
          date: string;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          account_id?: string;
          price?: number;
          date?: string;
          notes?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "account_prices_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          }
        ];
      };
      budget_categories: {
        Row: {
          account_id: string | null;
          allocated_amount: number;
          budget_id: string | null;
          id: string;
          spent_amount: number | null;
        };
        Insert: {
          account_id?: string | null;
          allocated_amount: number;
          budget_id?: string | null;
          id?: string;
          spent_amount?: number | null;
        };
        Update: {
          account_id?: string | null;
          allocated_amount?: number;
          budget_id?: string | null;
          id?: string;
          spent_amount?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "budget_categories_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_categories_budget_id_fkey";
            columns: ["budget_id"];
            isOneToOne: false;
            referencedRelation: "budgets";
            referencedColumns: ["id"];
          }
        ];
      };
      budgets: {
        Row: {
          created_at: string | null;
          end_date: string;
          id: string;
          name: string;
          period_type: string;
          start_date: string;
          total_amount: number;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          end_date: string;
          id?: string;
          name: string;
          period_type: string;
          start_date: string;
          total_amount: number;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          end_date?: string;
          id?: string;
          name?: string;
          period_type?: string;
          start_date?: string;
          total_amount?: number;
          user_id?: string | null;
        };
        Relationships: [];
      };
      investments: {
        Row: {
          account_id: string | null;
          created_at: string | null;
          current_price: number | null;
          id: string;
          investment_type: string;
          maturity_date: string | null;
          name: string;
          purchase_date: string | null;
          purchase_price: number | null;
          quantity: number | null;
          symbol: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          account_id?: string | null;
          created_at?: string | null;
          current_price?: number | null;
          id?: string;
          investment_type: string;
          maturity_date?: string | null;
          name: string;
          purchase_date?: string | null;
          purchase_price?: number | null;
          quantity?: number | null;
          symbol?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          account_id?: string | null;
          created_at?: string | null;
          current_price?: number | null;
          id?: string;
          investment_type?: string;
          maturity_date?: string | null;
          name?: string;
          purchase_date?: string | null;
          purchase_price?: number | null;
          quantity?: number | null;
          symbol?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "investments_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          }
        ];
      };
      tags: {
        Row: {
          color: string | null;
          created_at: string | null;
          id: string;
          name: string;
          user_id: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          id?: string;
          name: string;
          user_id?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      transaction_entries: {
        Row: {
          account_id: string | null;
          amount: number | null;
          description: string | null;
          entry_side: "DEBIT" | "CREDIT";
          id: string;
          line_number: number | null;
          price: number | null;
          quantity: number | null;
          transaction_id: string | null;
        };
        Insert: {
          account_id?: string | null;
          amount?: number | null;
          description?: string | null;
          entry_side: "DEBIT" | "CREDIT";
          id?: string;
          line_number?: number | null;
          price?: number | null;
          quantity?: number | null;
          transaction_id?: string | null;
        };
        Update: {
          account_id?: string | null;
          amount?: number | null;
          description?: string | null;
          entry_side?: "DEBIT" | "CREDIT";
          id?: string;
          line_number?: number | null;
          price?: number | null;
          quantity?: number | null;
          transaction_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_entries_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_entries_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          }
        ];
      };
      transaction_tags: {
        Row: {
          tag_id: string;
          transaction_id: string;
        };
        Insert: {
          tag_id: string;
          transaction_id: string;
        };
        Update: {
          tag_id?: string;
          transaction_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_tags_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          }
        ];
      };
      transactions: {
        Row: {
          created_at: string | null;
          description: string;
          id: string;
          notes: string | null;
          reference_number: string | null;
          total_amount: number;
          transaction_date: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          id?: string;
          notes?: string | null;
          reference_number?: string | null;
          total_amount: number;
          transaction_date: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          id?: string;
          notes?: string | null;
          reference_number?: string | null;
          total_amount?: number;
          transaction_date?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

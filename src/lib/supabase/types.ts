export type Database = {
  public: {
    Views: Record<string, never>
    Functions: Record<string, never>
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'user' | 'admin'
          product_name: string | null
          target_country: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'free' | 'starter' | 'pro'
          monthly_limit_tokens: number
          current_period_start: string
          current_period_end: string
          extra_tokens: number
          credits: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
        Relationships: []
      }
      token_usage: {
        Row: {
          id: string
          user_id: string
          phase: 1 | 2 | 3
          prompt_key: string
          tokens_used: number
          model: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['token_usage']['Row'], 'id' | 'created_at'>
        Update: never
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          user_id: string
          phase: number
          prompt_key: string
          input_json: Record<string, string>
          output_text: string
          report_sections: Record<string, { title: string; text: string; phase: number }> | null
          is_full_report: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at'>
        Update: never
        Relationships: []
      }
      prompt_templates: {
        Row: {
          id: string
          phase: number
          key: string
          title: string
          template_text: string
          model: 'perplexity' | 'openai' | 'claude'
          display_order: number
        }
        Insert: Omit<Database['public']['Tables']['prompt_templates']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['prompt_templates']['Insert']>
        Relationships: []
      }
      iyzico_pending_payments: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          pack_id: string
          report_count: number
          price_try: number
          status: 'pending' | 'completed' | 'failed'
          iyzico_payment_id: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['iyzico_pending_payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['iyzico_pending_payments']['Insert']>
        Relationships: []
      }
      feedback: {
        Row: { id: string; rating: number | null; message: string; created_at: string }
        Insert: { rating?: number | null; message: string; created_at?: string }
        Update: never
        Relationships: []
      }
    }
  }
}

// Hand-maintained mirror of supabase/migrations/*.sql. If you have the
// Supabase CLI linked to a live project, prefer regenerating this with:
//   supabase gen types typescript --linked > src/lib/types/database.ts

export type UserRole = "owner" | "admin" | "member";
export type LeadSourceType =
  | "quiz"
  | "webhook"
  | "zapier"
  | "meta_lead_ad"
  | "manual"
  | "api";
export type BuyerStatus = "active" | "paused" | "archived";
export type DeliveryMethod = "email" | "sms" | "webhook" | "zapier" | "crm_api";
export type FunnelType = "quiz" | "form" | "landing_page";
export type FunnelStatus = "draft" | "published" | "archived";
export type FunnelPageType =
  | "landing"
  | "question"
  | "contact_info"
  | "result"
  | "booking_redirect";
export type FunnelQuestionType =
  | "single_choice"
  | "multiple_choice"
  | "text"
  | "number"
  | "boolean"
  | "dropdown"
  | "slider"
  | "date";
export type LeadStatus =
  | "new"
  | "routing"
  | "routed"
  | "rejected"
  | "sold"
  | "failed"
  | "unmatched";
export type LeadDuplicateStatus = "unique" | "duplicate" | "possible_duplicate";
export type RoutingOutcome =
  | "accepted"
  | "rejected_cap"
  | "rejected_state"
  | "rejected_score"
  | "rejected_availability"
  | "rejected_paused"
  | "delivery_failed"
  | "delivery_success"
  | "no_buyers_matched";
export type RoutingStrategy = "round_robin" | "weighted" | "priority" | "ai_match";
export type IntegrationType = "zapier" | "meta_lead_ads" | "webhook" | "crm";
export type IntegrationStatus = "connected" | "disconnected" | "error";
export type PixelType =
  | "facebook"
  | "google_ads"
  | "tiktok"
  | "snapchat"
  | "google_analytics"
  | "custom";
export type SystemLogSeverity = "info" | "warning" | "error";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["organizations"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Row"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          org_id: string;
          full_name: string | null;
          email: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & {
          id: string;
          org_id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_sources: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          type: LeadSourceType;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_term: string | null;
          utm_content: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["lead_sources"]["Row"]> & {
          org_id: string;
          name: string;
          type: LeadSourceType;
        };
        Update: Partial<Database["public"]["Tables"]["lead_sources"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "lead_sources_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      buyers: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          status: BuyerStatus;
          states: string[];
          product_types: string[];
          min_intent_score: number;
          price_per_lead: number;
          weight: number;
          priority: number;
          daily_cap: number | null;
          weekly_cap: number | null;
          monthly_cap: number | null;
          daily_count: number;
          weekly_count: number;
          monthly_count: number;
          counts_reset_at: string;
          available_start_time: string | null;
          available_end_time: string | null;
          available_days: number[];
          booking_calendar_url: string | null;
          webhook_url: string | null;
          zapier_webhook_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["buyers"]["Row"]> & {
          org_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["buyers"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "buyers_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      buyer_delivery_methods: {
        Row: {
          id: string;
          buyer_id: string;
          method: DeliveryMethod;
          config: Record<string, unknown>;
          is_active: boolean;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["buyer_delivery_methods"]["Row"]
        > & {
          buyer_id: string;
          method: DeliveryMethod;
        };
        Update: Partial<
          Database["public"]["Tables"]["buyer_delivery_methods"]["Row"]
        >;
        Relationships: [
          {
            foreignKeyName: "buyer_delivery_methods_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "buyers";
            referencedColumns: ["id"];
          },
        ];
      };
      funnels: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          slug: string;
          type: FunnelType;
          status: FunnelStatus;
          primary_color: string;
          logo_url: string | null;
          favicon_url: string | null;
          meta_pixel_id: string | null;
          custom_head_script: string | null;
          custom_body_script: string | null;
          ai_generated: boolean;
          ai_prompt: string | null;
          views: number;
          submissions: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["funnels"]["Row"]> & {
          org_id: string;
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["funnels"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "funnels_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      funnel_pages: {
        Row: {
          id: string;
          funnel_id: string;
          page_type: FunnelPageType;
          title: string | null;
          subtitle: string | null;
          position: number;
          content: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["funnel_pages"]["Row"]> & {
          funnel_id: string;
          page_type: FunnelPageType;
        };
        Update: Partial<Database["public"]["Tables"]["funnel_pages"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "funnel_pages_funnel_id_fkey";
            columns: ["funnel_id"];
            isOneToOne: false;
            referencedRelation: "funnels";
            referencedColumns: ["id"];
          },
        ];
      };
      funnel_questions: {
        Row: {
          id: string;
          funnel_page_id: string;
          question_text: string;
          question_type: FunnelQuestionType;
          // weight (optional) feeds the intent scoring engine: picking this
          // option adds/subtracts that many points from the lead's score.
          options: Array<{ label: string; value: string; weight?: number }>;
          is_required: boolean;
          position: number;
          lead_field_mapping: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["funnel_questions"]["Row"]
        > & {
          funnel_page_id: string;
          question_text: string;
        };
        Update: Partial<Database["public"]["Tables"]["funnel_questions"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "funnel_questions_funnel_page_id_fkey";
            columns: ["funnel_page_id"];
            isOneToOne: false;
            referencedRelation: "funnel_pages";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          id: string;
          org_id: string;
          funnel_id: string | null;
          lead_source_id: string | null;
          source: LeadSourceType;
          status: LeadStatus;
          name: string | null;
          email: string | null;
          phone: string | null;
          state: string | null;
          zip: string | null;
          date_of_birth: string | null;
          product_type: string | null;
          answers: Record<string, unknown>;
          intent_score: number;
          raw_payload: Record<string, unknown>;
          duplicate_status: LeadDuplicateStatus;
          duplicate_of_lead_id: string | null;
          assigned_buyer_id: string | null;
          routed_at: string | null;
          routing_duration_ms: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["leads"]["Row"]> & {
          org_id: string;
          source: LeadSourceType;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "leads_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_funnel_id_fkey";
            columns: ["funnel_id"];
            isOneToOne: false;
            referencedRelation: "funnels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_lead_source_id_fkey";
            columns: ["lead_source_id"];
            isOneToOne: false;
            referencedRelation: "lead_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_duplicate_of_lead_id_fkey";
            columns: ["duplicate_of_lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_assigned_buyer_id_fkey";
            columns: ["assigned_buyer_id"];
            isOneToOne: false;
            referencedRelation: "buyers";
            referencedColumns: ["id"];
          },
        ];
      };
      funnel_submissions: {
        Row: {
          id: string;
          funnel_id: string;
          lead_id: string | null;
          answers: Record<string, unknown>;
          completed: boolean;
          ip_address: string | null;
          user_agent: string | null;
          referrer: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_term: string | null;
          utm_content: string | null;
          started_at: string;
          completed_at: string | null;
          redirected_at: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["funnel_submissions"]["Row"]
        > & {
          funnel_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["funnel_submissions"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "funnel_submissions_funnel_id_fkey";
            columns: ["funnel_id"];
            isOneToOne: false;
            referencedRelation: "funnels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "funnel_submissions_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      routing_rules: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          is_active: boolean;
          priority: number;
          states: string[];
          product_types: string[];
          min_intent_score: number;
          max_intent_score: number;
          sources: LeadSourceType[];
          strategy: RoutingStrategy;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["routing_rules"]["Row"]> & {
          org_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["routing_rules"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "routing_rules_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      routing_rule_buyers: {
        Row: {
          routing_rule_id: string;
          buyer_id: string;
        };
        Insert: Database["public"]["Tables"]["routing_rule_buyers"]["Row"];
        Update: Partial<
          Database["public"]["Tables"]["routing_rule_buyers"]["Row"]
        >;
        Relationships: [
          {
            foreignKeyName: "routing_rule_buyers_routing_rule_id_fkey";
            columns: ["routing_rule_id"];
            isOneToOne: false;
            referencedRelation: "routing_rules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routing_rule_buyers_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "buyers";
            referencedColumns: ["id"];
          },
        ];
      };
      routing_events: {
        Row: {
          id: string;
          lead_id: string;
          buyer_id: string | null;
          routing_rule_id: string | null;
          attempt_order: number;
          outcome: RoutingOutcome;
          explanation: string | null;
          response_status: number | null;
          response_body: string | null;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["routing_events"]["Row"]> & {
          lead_id: string;
          outcome: RoutingOutcome;
        };
        Update: Partial<Database["public"]["Tables"]["routing_events"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "routing_events_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routing_events_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "buyers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routing_events_routing_rule_id_fkey";
            columns: ["routing_rule_id"];
            isOneToOne: false;
            referencedRelation: "routing_rules";
            referencedColumns: ["id"];
          },
        ];
      };
      integrations: {
        Row: {
          id: string;
          org_id: string;
          type: IntegrationType;
          name: string;
          status: IntegrationStatus;
          config: Record<string, unknown>;
          ingest_key: string;
          last_event_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["integrations"]["Row"]> & {
          org_id: string;
          type: IntegrationType;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["integrations"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "integrations_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      pixels: {
        Row: {
          id: string;
          org_id: string;
          funnel_id: string | null;
          name: string;
          type: PixelType;
          pixel_id: string;
          event_mappings: Record<string, string>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pixels"]["Row"]> & {
          org_id: string;
          name: string;
          type: PixelType;
          pixel_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["pixels"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "pixels_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pixels_funnel_id_fkey";
            columns: ["funnel_id"];
            isOneToOne: false;
            referencedRelation: "funnels";
            referencedColumns: ["id"];
          },
        ];
      };
      system_logs: {
        Row: {
          id: string;
          org_id: string;
          actor_id: string | null;
          severity: SystemLogSeverity;
          entity_type: string;
          entity_id: string | null;
          event_type: string;
          message: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["system_logs"]["Row"]> & {
          org_id: string;
          entity_type: string;
          event_type: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["system_logs"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "system_logs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "system_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_buyer_counts: {
        Args: { p_buyer_id: string };
        Returns: void;
      };
      increment_funnel_views: {
        Args: { p_funnel_id: string };
        Returns: void;
      };
    };
  };
}

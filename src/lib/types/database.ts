// Hand-maintained mirror of supabase/migrations/*.sql. If you have the
// Supabase CLI linked to a live project, prefer regenerating this with:
//   supabase gen types typescript --linked > src/lib/types/database.ts

export type UserRole = "owner" | "admin" | "member";
export type BuyerStatus = "active" | "paused" | "archived";
export type DeliveryMethod = "webhook" | "email" | "sms" | "crm_api";
export type FunnelType = "quiz" | "form" | "landing_page";
export type FunnelStatus = "draft" | "published" | "archived";
export type LeadSource =
  | "quiz"
  | "webhook"
  | "zapier"
  | "meta_lead_ad"
  | "manual"
  | "api";
export type LeadStatus =
  | "new"
  | "routing"
  | "routed"
  | "rejected"
  | "sold"
  | "failed";
export type RoutingStrategy =
  | "priority"
  | "weighted_round_robin"
  | "highest_price"
  | "highest_intent_match";
export type IntegrationType = "zapier" | "meta_lead_ads" | "webhook" | "crm";
export type IntegrationStatus = "connected" | "disconnected" | "error";
export type SystemEventSeverity = "info" | "warning" | "error";

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
      profiles: {
        Row: {
          id: string;
          org_id: string;
          full_name: string | null;
          email: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          org_id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey";
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
          contact_email: string | null;
          contact_phone: string | null;
          status: BuyerStatus;
          states: string[];
          product_types: string[];
          min_intent_score: number;
          price_per_lead: number;
          weight: number;
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
          delivery_method: DeliveryMethod;
          delivery_config: Record<string, unknown>;
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
      funnels: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          slug: string;
          type: FunnelType;
          status: FunnelStatus;
          config: { steps: unknown[]; [key: string]: unknown };
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
      leads: {
        Row: {
          id: string;
          org_id: string;
          funnel_id: string | null;
          source: LeadSource;
          status: LeadStatus;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          state: string | null;
          zip: string | null;
          date_of_birth: string | null;
          product_type: string | null;
          intent_score: number;
          raw_payload: Record<string, unknown>;
          assigned_buyer_id: string | null;
          routed_at: string | null;
          routing_duration_ms: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["leads"]["Row"]> & {
          org_id: string;
          source: LeadSource;
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
            foreignKeyName: "leads_assigned_buyer_id_fkey";
            columns: ["assigned_buyer_id"];
            isOneToOne: false;
            referencedRelation: "buyers";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_routing_attempts: {
        Row: {
          id: string;
          lead_id: string;
          buyer_id: string;
          routing_rule_id: string | null;
          attempt_order: number;
          outcome: string;
          response_status: number | null;
          response_body: string | null;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["lead_routing_attempts"]["Row"]
        > & {
          lead_id: string;
          buyer_id: string;
          attempt_order: number;
          outcome: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["lead_routing_attempts"]["Row"]
        >;
        Relationships: [
          {
            foreignKeyName: "lead_routing_attempts_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_routing_attempts_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "buyers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_routing_attempts_routing_rule_id_fkey";
            columns: ["routing_rule_id"];
            isOneToOne: false;
            referencedRelation: "routing_rules";
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
          sources: LeadSource[];
          strategy: RoutingStrategy;
          buyer_priority: string[];
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
      system_events: {
        Row: {
          id: string;
          org_id: string;
          actor_id: string | null;
          severity: SystemEventSeverity;
          entity_type: string;
          entity_id: string | null;
          event_type: string;
          message: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["system_events"]["Row"]> & {
          org_id: string;
          entity_type: string;
          event_type: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["system_events"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "system_events_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "system_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

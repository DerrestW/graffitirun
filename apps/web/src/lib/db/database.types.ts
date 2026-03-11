export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: "active" | "paused" | "archived";
          created_at: string;
          updated_at: string;
        };
      };
      workspace_settings: {
        Row: {
          id: string;
          workspace_id: string;
          timezone: string;
          default_posting_mode: string;
          approval_required: boolean;
          auto_schedule_enabled: boolean;
          blocked_categories_json: Json;
          blocked_terms_json: Json;
          brand_voice_notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "editor" | "reviewer" | "analyst";
          invited_at: string | null;
          joined_at: string | null;
          created_at: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
      };
      topics: {
        Row: {
          id: string;
          workspace_id: string;
          source_id: string | null;
          external_ref: string | null;
          title: string;
          summary: string | null;
          source_url: string | null;
          source_domain: string | null;
          image_url: string | null;
          published_at_source: string | null;
          category: string | null;
          language: string | null;
          freshness_score: number;
          viral_score: number;
          brand_fit_score: number;
          political_risk_score: number;
          rights_risk_score: number;
          tragedy_risk_score: number;
          duplicate_risk_score: number;
          final_score: number;
          status: "candidate" | "drafted" | "rejected" | "archived";
          created_at: string;
          updated_at: string;
        };
      };
      topic_checks: {
        Row: {
          id: string;
          workspace_id: string;
          topic_id: string;
          check_type: string;
          result: string;
          score: number;
          notes: string | null;
          created_at: string;
        };
      };
      templates: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          template_type: "story" | "square" | "carousel" | "text_fact";
          width: number;
          height: number;
          config_json: Json;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      drafts: {
        Row: {
          id: string;
          workspace_id: string;
          topic_id: string | null;
          template_id: string | null;
          status: "new" | "in_review" | "approved" | "rejected" | "scheduled" | "published" | "archived";
          selected_headline: string | null;
          selected_summary: string | null;
          selected_hook: string | null;
          selected_caption_id: string | null;
          rendered_asset_path: string | null;
          scheduled_for: string | null;
          created_by: string | null;
          approved_by: string | null;
          published_post_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      draft_versions: {
        Row: {
          id: string;
          workspace_id: string;
          draft_id: string;
          version_number: number;
          headline: string;
          summary: string | null;
          hook_fact: string | null;
          body_copy: string | null;
          metadata_json: Json;
          created_at: string;
          created_by: string | null;
        };
      };
      captions: {
        Row: {
          id: string;
          workspace_id: string;
          draft_id: string;
          variant_name: string;
          caption_text: string;
          cta_text: string | null;
          hashtags_text: string | null;
          created_at: string;
        };
      };
      review_comments: {
        Row: {
          id: string;
          workspace_id: string;
          draft_id: string;
          user_id: string;
          comment: string;
          created_at: string;
        };
      };
      publishing_channels: {
        Row: {
          id: string;
          workspace_id: string;
          channel_type: string;
          display_name: string;
          access_token_encrypted: string | null;
          refresh_token_encrypted: string | null;
          channel_metadata_json: Json;
          status: string;
          created_at: string;
          updated_at: string;
        };
      };
      publish_jobs: {
        Row: {
          id: string;
          workspace_id: string;
          draft_id: string;
          channel_id: string | null;
          status: "queued" | "running" | "succeeded" | "failed" | "canceled";
          scheduled_for: string | null;
          started_at: string | null;
          completed_at: string | null;
          response_json: Json;
          error_message: string | null;
          created_at: string;
        };
      };
      performance_metrics: {
        Row: {
          id: string;
          workspace_id: string;
          published_post_id: string;
          metric_date: string;
          impressions: number;
          reach: number;
          clicks: number;
          reactions: number;
          comments: number;
          shares: number;
          saves: number;
          estimated_earnings: number;
          created_at: string;
        };
      };
    };
  };
};

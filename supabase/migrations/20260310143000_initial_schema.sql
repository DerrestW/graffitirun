create extension if not exists "pgcrypto";

create type workspace_status as enum ('active', 'paused', 'archived');
create type workspace_role as enum ('owner', 'admin', 'editor', 'reviewer', 'analyst');
create type topic_status as enum ('candidate', 'drafted', 'rejected', 'archived');
create type draft_status as enum ('new', 'in_review', 'approved', 'rejected', 'scheduled', 'published', 'archived');
create type publish_job_status as enum ('queued', 'running', 'succeeded', 'failed', 'canceled');

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status workspace_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role workspace_role not null,
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, user_id)
);

create table if not exists public.workspace_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  timezone text not null default 'America/Chicago',
  default_posting_mode text not null default 'manual',
  approval_required boolean not null default true,
  auto_schedule_enabled boolean not null default false,
  blocked_categories_json jsonb not null default '[]'::jsonb,
  blocked_terms_json jsonb not null default '[]'::jsonb,
  brand_voice_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider_name text not null,
  source_type text not null,
  source_url text,
  status text not null default 'active',
  rights_policy text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  external_ref text,
  title text not null,
  summary text,
  source_url text,
  source_domain text,
  image_url text,
  published_at_source timestamptz,
  category text,
  language text,
  freshness_score numeric(5,2) not null default 0,
  viral_score numeric(5,2) not null default 0,
  brand_fit_score numeric(5,2) not null default 0,
  political_risk_score numeric(5,2) not null default 0,
  rights_risk_score numeric(5,2) not null default 0,
  tragedy_risk_score numeric(5,2) not null default 0,
  duplicate_risk_score numeric(5,2) not null default 0,
  final_score numeric(5,2) not null default 0,
  status topic_status not null default 'candidate',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.topic_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  asset_type text not null,
  original_url text,
  local_storage_path text,
  rights_status text not null,
  attribution_required boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.topic_checks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  check_type text not null,
  result text not null,
  score numeric(5,2) not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  template_type text not null,
  width integer not null,
  height integer not null,
  config_json jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  template_id uuid references public.templates(id) on delete set null,
  status draft_status not null default 'new',
  selected_headline text,
  selected_summary text,
  selected_hook text,
  selected_caption_id uuid,
  rendered_asset_path text,
  scheduled_for timestamptz,
  created_by uuid references public.users(id) on delete set null,
  approved_by uuid references public.users(id) on delete set null,
  published_post_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.draft_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  draft_id uuid not null references public.drafts(id) on delete cascade,
  version_number integer not null,
  headline text not null,
  summary text,
  hook_fact text,
  body_copy text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.users(id) on delete set null,
  unique (draft_id, version_number)
);

create table if not exists public.captions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  draft_id uuid not null references public.drafts(id) on delete cascade,
  variant_name text not null,
  caption_text text not null,
  cta_text text,
  hashtags_text text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  draft_id uuid not null references public.drafts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.approval_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  draft_id uuid not null references public.drafts(id) on delete cascade,
  action text not null,
  actor_user_id uuid references public.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.publishing_channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_type text not null,
  display_name text not null,
  access_token_encrypted text,
  refresh_token_encrypted text,
  channel_metadata_json jsonb not null default '{}'::jsonb,
  status text not null default 'disconnected',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.publish_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  draft_id uuid not null references public.drafts(id) on delete cascade,
  channel_id uuid references public.publishing_channels(id) on delete set null,
  status publish_job_status not null default 'queued',
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  response_json jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.published_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  draft_id uuid not null references public.drafts(id) on delete cascade,
  channel_id uuid references public.publishing_channels(id) on delete set null,
  external_post_id text,
  external_url text,
  published_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  published_post_id uuid not null references public.published_posts(id) on delete cascade,
  metric_date date not null,
  impressions integer not null default 0,
  reach integer not null default 0,
  clicks integer not null default 0,
  reactions integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  saves integer not null default 0,
  estimated_earnings numeric(10,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.blocked_domains (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  domain text not null,
  reason text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, domain)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_workspace_members_workspace_id on public.workspace_members (workspace_id);
create index if not exists idx_sources_workspace_id on public.sources (workspace_id);
create index if not exists idx_topics_workspace_id on public.topics (workspace_id);
create index if not exists idx_topics_final_score on public.topics (workspace_id, final_score desc);
create index if not exists idx_topic_assets_workspace_id on public.topic_assets (workspace_id);
create index if not exists idx_topic_checks_workspace_id on public.topic_checks (workspace_id);
create index if not exists idx_templates_workspace_id on public.templates (workspace_id);
create index if not exists idx_drafts_workspace_id on public.drafts (workspace_id);
create index if not exists idx_drafts_status_schedule on public.drafts (workspace_id, status, scheduled_for);
create index if not exists idx_draft_versions_workspace_id on public.draft_versions (workspace_id);
create index if not exists idx_captions_workspace_id on public.captions (workspace_id);
create index if not exists idx_review_comments_workspace_id on public.review_comments (workspace_id);
create index if not exists idx_approval_logs_workspace_id on public.approval_logs (workspace_id);
create index if not exists idx_publishing_channels_workspace_id on public.publishing_channels (workspace_id);
create index if not exists idx_publish_jobs_workspace_id on public.publish_jobs (workspace_id);
create index if not exists idx_publish_jobs_status_schedule on public.publish_jobs (workspace_id, status, scheduled_for);
create index if not exists idx_published_posts_workspace_id on public.published_posts (workspace_id);
create index if not exists idx_performance_metrics_workspace_id on public.performance_metrics (workspace_id);
create index if not exists idx_blocked_domains_workspace_id on public.blocked_domains (workspace_id);
create index if not exists idx_audit_logs_workspace_id on public.audit_logs (workspace_id);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.sources enable row level security;
alter table public.topics enable row level security;
alter table public.topic_assets enable row level security;
alter table public.topic_checks enable row level security;
alter table public.templates enable row level security;
alter table public.drafts enable row level security;
alter table public.draft_versions enable row level security;
alter table public.captions enable row level security;
alter table public.review_comments enable row level security;
alter table public.approval_logs enable row level security;
alter table public.publishing_channels enable row level security;
alter table public.publish_jobs enable row level security;
alter table public.published_posts enable row level security;
alter table public.performance_metrics enable row level security;
alter table public.blocked_domains enable row level security;
alter table public.audit_logs enable row level security;

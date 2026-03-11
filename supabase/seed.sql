insert into public.users (id, email, full_name)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@graffitirun.local', 'Graffiti Run Owner')
on conflict (id) do nothing;

insert into public.workspaces (id, name, slug, status)
values
  ('22222222-2222-2222-2222-222222222222', 'Graffiti Run', 'graffiti-run', 'active')
on conflict (id) do nothing;

insert into public.workspace_members (workspace_id, user_id, role, invited_at, joined_at)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'owner', timezone('utc', now()), timezone('utc', now()))
on conflict (workspace_id, user_id) do nothing;

insert into public.workspace_settings (
  workspace_id,
  timezone,
  default_posting_mode,
  approval_required,
  auto_schedule_enabled,
  blocked_categories_json,
  blocked_terms_json,
  brand_voice_notes
)
values (
  '22222222-2222-2222-2222-222222222222',
  'America/Chicago',
  'manual',
  true,
  false,
  '["politics"]'::jsonb,
  '["election", "campaign"]'::jsonb,
  'Optimistic, high-curiosity, viral-safe framing with clean headlines and original copy.'
)
on conflict (workspace_id) do nothing;

insert into public.sources (id, workspace_id, provider_name, source_type, source_url, status, rights_policy)
values
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222222', 'mock_fixture', 'mock_json', 'file:///data/mock_topics.json', 'active', 'approved'),
  ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222', 'rss_curated', 'rss', 'https://example.com/feed.xml', 'active', 'review_required')
on conflict (id) do nothing;

insert into public.topics (
  id,
  workspace_id,
  source_id,
  external_ref,
  title,
  summary,
  source_url,
  source_domain,
  image_url,
  published_at_source,
  category,
  language,
  freshness_score,
  viral_score,
  brand_fit_score,
  political_risk_score,
  rights_risk_score,
  tragedy_risk_score,
  duplicate_risk_score,
  final_score,
  status
)
values
  (
    '44444444-4444-4444-4444-444444444441',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333331',
    'halo-001',
    'Massive Ice Halo Appears Over Finland',
    'A rare atmospheric halo turned a quiet sunrise into a high-velocity visual topic.',
    'https://example.com/weather-halo',
    'example.com',
    '/mock/halo.jpg',
    '2026-03-01T08:00:00.000Z',
    'weather',
    'en',
    81,
    92,
    88,
    1,
    18,
    4,
    22,
    89,
    'candidate'
  ),
  (
    '44444444-4444-4444-4444-444444444442',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333332',
    'owl-002',
    'Tiny Rescue Owl Learns to Fly Again',
    'Wholesome wildlife recovery story with strong emotional hook and low brand risk.',
    'https://example.com/owl-rehab',
    'example.com',
    '/mock/owl.jpg',
    '2026-03-04T12:30:00.000Z',
    'animals',
    'en',
    76,
    90,
    93,
    0,
    25,
    8,
    17,
    91,
    'candidate'
  ),
  (
    '44444444-4444-4444-4444-444444444443',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333332',
    'tunnel-003',
    'Old Train Tunnel Reopens As a Hidden Hiking Route',
    'Scenic rediscovery angle pairs well with curiosity-led captions and historical framing.',
    'https://example.com/train-tunnel',
    'example.com',
    '/mock/tunnel.jpg',
    '2026-03-06T15:45:00.000Z',
    'travel',
    'en',
    84,
    78,
    85,
    0,
    30,
    3,
    12,
    83,
    'candidate'
  )
on conflict (id) do nothing;

insert into public.topic_checks (id, workspace_id, topic_id, check_type, result, score, notes)
values
  ('55555555-5555-5555-5555-555555555551', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', 'safety_political', 'pass', 98, 'Non-political weather story.'),
  ('55555555-5555-5555-5555-555555555552', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', 'rights_review', 'review', 82, 'Use mock asset library or transformed artwork.'),
  ('55555555-5555-5555-5555-555555555553', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444442', 'safety_wholesome', 'pass', 95, 'High wholesome signal with low policy risk.'),
  ('55555555-5555-5555-5555-555555555554', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444442', 'rights_review', 'pass', 88, 'Approved when rendered with mock asset library.'),
  ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444443', 'safety_travel', 'pass', 92, 'Travel category remains open.'),
  ('55555555-5555-5555-5555-555555555556', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444443', 'rights_review', 'review', 74, 'Manual-source visuals require confirmation if not replaced.')
on conflict (id) do nothing;

insert into public.templates (id, workspace_id, name, template_type, width, height, config_json, is_default)
values
  (
    '66666666-6666-6666-6666-666666666661',
    '22222222-2222-2222-2222-222222222222',
    'Graffiti Run Story',
    'story',
    1080,
    1920,
    '{"accentColor":"#ee6c4d","headlineLimit":52,"notes":"Tall story layout with stacked title and CTA."}'::jsonb,
    true
  ),
  (
    '66666666-6666-6666-6666-666666666662',
    '22222222-2222-2222-2222-222222222222',
    'Graffiti Run Square',
    'square',
    1080,
    1080,
    '{"accentColor":"#214e63","headlineLimit":44,"notes":"Primary feed post layout with compact footer bar."}'::jsonb,
    true
  ),
  (
    '66666666-6666-6666-6666-666666666663',
    '22222222-2222-2222-2222-222222222222',
    'Graffiti Run Carousel',
    'carousel',
    1080,
    1080,
    '{"accentColor":"#247a5a","headlineLimit":36,"notes":"Slide format optimized for hook-first storytelling."}'::jsonb,
    false
  )
on conflict (id) do nothing;

insert into public.publishing_channels (
  id,
  workspace_id,
  channel_type,
  display_name,
  access_token_encrypted,
  refresh_token_encrypted,
  channel_metadata_json,
  status
)
values
  (
    '77777777-7777-7777-7777-777777777771',
    '22222222-2222-2222-2222-222222222222',
    'facebook_page',
    'Graffiti Run Facebook Page',
    null,
    null,
    '{"page_id":"graffiti-run-page","mode":"stubbed"}'::jsonb,
    'disconnected'
  )
on conflict (id) do nothing;

insert into public.drafts (
  id,
  workspace_id,
  topic_id,
  template_id,
  status,
  selected_headline,
  selected_summary,
  selected_hook,
  rendered_asset_path,
  scheduled_for,
  created_by,
  approved_by
)
values
  (
    '88888888-8888-8888-8888-888888888881',
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444442',
    '66666666-6666-6666-6666-666666666662',
    'in_review',
    'This Rescue Owl Just Took Its First Flight Back Into the Wild',
    'A rehab success story with clean emotional payoff and strong share potential.',
    'The owl needed weeks of rehab before attempting a full glide again.',
    '/renders/owl-square-v1.png',
    '2026-03-12T15:00:00.000Z',
    '11111111-1111-1111-1111-111111111111',
    null
  )
on conflict (id) do nothing;

insert into public.draft_versions (
  id,
  workspace_id,
  draft_id,
  version_number,
  headline,
  summary,
  hook_fact,
  body_copy,
  created_by
)
values
  (
    '99999999-9999-9999-9999-999999999991',
    '22222222-2222-2222-2222-222222222222',
    '88888888-8888-8888-8888-888888888881',
    1,
    'This Rescue Owl Just Took Its First Flight Back Into the Wild',
    'A rehab success story with clean emotional payoff and strong share potential.',
    'The owl needed weeks of rehab before attempting a full glide again.',
    'Use a warm but factual tone. Focus on the recovery moment rather than dramatizing injury details.',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    '99999999-9999-9999-9999-999999999992',
    '22222222-2222-2222-2222-222222222222',
    '88888888-8888-8888-8888-888888888881',
    2,
    'After Weeks of Rehab, This Tiny Owl Finally Flew Again',
    'Gentler framing with a more concise emotional arc for feed performance.',
    'Early test hops failed before the owl built enough strength to glide.',
    'Safer caption variant for broad audience distribution and higher sponsor comfort.',
    '11111111-1111-1111-1111-111111111111'
  )
on conflict (id) do nothing;

insert into public.captions (id, workspace_id, draft_id, variant_name, caption_text, cta_text, hashtags_text)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '22222222-2222-2222-2222-222222222222',
    '88888888-8888-8888-8888-888888888881',
    'Hopeful',
    'A tiny owl spent weeks rebuilding strength, and this was the moment it finally flew again.',
    'Would you stop scrolling for this one?',
    '#wildlife #owl #wholesome'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '22222222-2222-2222-2222-222222222222',
    '88888888-8888-8888-8888-888888888881',
    'Curiosity',
    'Most people only see the release. The real story is the slow work that made this flight possible.',
    'What part should the next slide explain?',
    '#animalrescue #nature #storytime'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    '22222222-2222-2222-2222-222222222222',
    '88888888-8888-8888-8888-888888888881',
    'Short-form',
    'Weeks of rehab. One clean glide. Worth the wait.',
    'Drop a if you would share this.',
    '#owl #goodnews #viralstory'
  )
on conflict (id) do nothing;

insert into public.review_comments (id, workspace_id, draft_id, user_id, comment, created_at)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '22222222-2222-2222-2222-222222222222',
    '88888888-8888-8888-8888-888888888881',
    '11111111-1111-1111-1111-111111111111',
    'Tighten the second caption. Keep the payoff earlier and remove any implied medical advice.',
    '2026-03-09T19:20:00.000Z'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    '22222222-2222-2222-2222-222222222222',
    '88888888-8888-8888-8888-888888888881',
    '11111111-1111-1111-1111-111111111111',
    'Visual treatment is solid. Add a source note for the rehab footage reference.',
    '2026-03-09T20:15:00.000Z'
  )
on conflict (id) do nothing;

insert into public.approval_logs (id, workspace_id, draft_id, action, actor_user_id, notes, created_at)
values
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    '22222222-2222-2222-2222-222222222222',
    '88888888-8888-8888-8888-888888888881',
    'created',
    '11111111-1111-1111-1111-111111111111',
    'Draft created from topic queue.',
    '2026-03-09T18:45:00.000Z'
  )
on conflict (id) do nothing;

insert into public.publish_jobs (
  id,
  workspace_id,
  draft_id,
  channel_id,
  status,
  scheduled_for,
  response_json,
  error_message
)
values
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    '22222222-2222-2222-2222-222222222222',
    '88888888-8888-8888-8888-888888888881',
    '77777777-7777-7777-7777-777777777771',
    'queued',
    '2026-03-12T15:00:00.000Z',
    '{"connector":"facebook_page","mode":"stubbed_until_credentials"}'::jsonb,
    null
  )
on conflict (id) do nothing;

insert into public.published_posts (
  id,
  workspace_id,
  draft_id,
  channel_id,
  external_post_id,
  external_url,
  published_at
)
values
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    '22222222-2222-2222-2222-222222222222',
    '88888888-8888-8888-8888-888888888881',
    '77777777-7777-7777-7777-777777777771',
    'fb_post_001',
    'https://facebook.com/graffitirun/posts/fb_post_001',
    '2026-03-08T14:00:00.000Z'
  )
on conflict (id) do nothing;

insert into public.performance_metrics (
  id,
  workspace_id,
  published_post_id,
  metric_date,
  impressions,
  reach,
  clicks,
  reactions,
  comments,
  shares,
  saves,
  estimated_earnings
)
values
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff1',
    '22222222-2222-2222-2222-222222222222',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    '2026-03-08',
    94500,
    82400,
    4100,
    6200,
    420,
    1260,
    610,
    4820.00
  )
on conflict (id) do nothing;

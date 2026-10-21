-- Applied to Supabase project "outreach-engine" (qrthnfmuqsuyvynrpxme)
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create table public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('find_problems','build_solution','find_leads','write_message','send_message','write_followup')),
  params jsonb not null default '{}'::jsonb,
  status text not null default 'running' check (status in ('running','done','failed')),
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz
);
create index jobs_status_idx on public.jobs (status, created_at desc);

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete set null,
  problem_summary text not null,
  sector text,
  who_suffers text,
  pays_for_solution boolean,
  automation_fit text,
  score int check (score between 0 and 100),
  source text,
  source_url text,
  raw_text text,
  market text not null default 'local' check (market in ('gulf','arabic','local')),
  status text not null default 'new' check (status in ('new','solution_ready','leads_found','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index problems_source_url_uq on public.problems (source_url) where source_url is not null;
create index problems_status_score_idx on public.problems (status, score desc);

create table public.solutions (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  solution_name text not null,
  pitch text,
  workflow_steps jsonb,
  demo_script text,
  tools_needed jsonb,
  created_at timestamptz not null default now()
);
create index solutions_problem_idx on public.solutions (problem_id);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid references public.problems(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  name text not null,
  address text,
  city text,
  website text,
  phone text,
  place_id text,
  gap_found text,
  contact_channel text check (contact_channel in ('whatsapp','email','telegram','instagram','other')),
  contact_value text,
  fit_score int check (fit_score between 0 and 100),
  status text not null default 'new' check (status in ('new','contacted','replied','won','lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index leads_place_id_uq on public.leads (place_id) where place_id is not null;
create unique index leads_name_address_uq on public.leads (lower(name), lower(coalesce(address,'')));
create index leads_status_idx on public.leads (status, fit_score desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  solution_id uuid references public.solutions(id) on delete set null,
  parent_message_id uuid references public.messages(id) on delete set null,
  type text not null default 'first' check (type in ('first','followup')),
  channel text not null check (channel in ('whatsapp','email','telegram','instagram','other')),
  subject text,
  message text not null,
  status text not null default 'pending_approval' check (status in ('pending_approval','approved','rejected','sent','failed')),
  followup_count int not null default 0,
  replied boolean not null default false,
  replied_at timestamptz,
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index messages_lead_idx on public.messages (lead_id);
create index messages_status_idx on public.messages (status, created_at desc);
create index messages_followup_idx on public.messages (status, replied, sent_at);

create trigger set_updated_at before update on public.settings for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.jobs for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.problems for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.leads for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.messages for each row execute function public.set_updated_at();

-- RLS on, no policies: only the service role (n8n / dashboard server) can access
alter table public.settings enable row level security;
alter table public.jobs enable row level security;
alter table public.problems enable row level security;
alter table public.solutions enable row level security;
alter table public.leads enable row level security;
alter table public.messages enable row level security;

insert into public.settings (key, value, description) values
  ('llm_model', '{"primary":"gemini-2.0-flash","fallback":"groq-llama-3.3-70b"}', 'النموذج الأساسي والبديل'),
  ('problem_sources', '{"reddit":true,"tavily":true,"apify_google_maps_reviews":true}', 'مصادر Problem Radar'),
  ('send_channels', '{"email":true,"telegram":true,"whatsapp":false,"instagram":"manual"}', 'قنوات الإرسال'),
  ('thresholds', '{"problem_score_min":60,"lead_fit_min":60,"followup_after_days":3,"max_followups":2,"max_message_words":80}', 'حدود الفلترة والمتابعة'),
  ('sectors', '[]', 'القطاعات المستهدفة'),
  ('markets', '[]', 'الأسواق / المدن المستهدفة'),
  ('keywords', '[]', 'كلمات البحث');

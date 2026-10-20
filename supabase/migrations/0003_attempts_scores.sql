create table public.test_blueprints (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  mode public.exam_mode not null,
  version integer not null,
  definition jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  blueprint_id uuid references public.test_blueprints(id),
  mode public.exam_mode not null,
  status public.attempt_status not null default 'in_progress',
  locale text not null check (locale in ('th', 'en')),
  seed text not null,
  current_section text not null check (current_section in ('listening', 'reading', 'practice')),
  started_at timestamptz not null default now(),
  section_expires_at timestamptz,
  submitted_at timestamptz,
  timing_unverified boolean not null default false,
  idempotency_key uuid not null,
  unique (user_id, idempotency_key)
);

create table public.attempt_items (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  ordinal smallint not null check (ordinal > 0),
  section text not null check (section in ('listening', 'reading', 'practice')),
  part smallint not null check (part between 1 and 7),
  group_id uuid references public.question_groups(id) on delete restrict,
  question_version_id uuid not null references public.question_versions(id) on delete restrict,
  choice_order jsonb not null,
  unique (attempt_id, ordinal),
  unique (attempt_id, question_version_id)
);

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  attempt_item_id uuid not null references public.attempt_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  choice_id uuid references public.choices(id) on delete restrict,
  marked boolean not null default false,
  answered_at timestamptz not null default now(),
  unique (attempt_id, attempt_item_id)
);

create table public.score_results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  scoring_version text not null,
  listening_raw smallint,
  reading_raw smallint,
  listening_scaled smallint check (listening_scaled between 5 and 495),
  reading_scaled smallint check (reading_scaled between 5 and 495),
  total_scaled smallint check (total_scaled between 10 and 990),
  breakdown jsonb not null default '{}',
  created_at timestamptz not null default now()
);

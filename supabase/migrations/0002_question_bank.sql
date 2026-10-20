create table public.question_groups (
  id uuid primary key default gen_random_uuid(),
  part smallint not null check (part between 1 and 7),
  group_type text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  status public.content_status not null default 'draft',
  created_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  part smallint not null check (part between 1 and 7),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.question_versions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete restrict,
  group_id uuid references public.question_groups(id) on delete restrict,
  version integer not null check (version > 0),
  prompt jsonb not null,
  solution jsonb not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  skill_tags text[] not null default '{}',
  choice_shuffle_allowed boolean not null default true,
  content_hash text not null,
  status public.content_status not null default 'draft',
  created_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (question_id, version),
  unique (content_hash)
);

create table public.choices (
  id uuid primary key default gen_random_uuid(),
  question_version_id uuid not null references public.question_versions(id) on delete cascade,
  label text not null,
  content jsonb not null,
  is_correct boolean not null default false,
  position smallint not null,
  unique (question_version_id, position)
);

create unique index choices_one_correct_per_question
on public.choices (question_version_id) where is_correct;

create table public.media (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.question_groups(id) on delete cascade,
  question_version_id uuid references public.question_versions(id) on delete cascade,
  kind text not null check (kind in ('image', 'audio')),
  storage_path text not null,
  metadata jsonb not null default '{}',
  status public.content_status not null default 'draft',
  created_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (num_nonnulls(group_id, question_version_id) = 1)
);

create table public.translations (
  id uuid primary key default gen_random_uuid(),
  question_version_id uuid not null references public.question_versions(id) on delete cascade,
  locale text not null check (locale in ('th', 'en')),
  explanation text not null,
  prompt_translation text,
  transcript text,
  status public.content_status not null default 'draft',
  unique (question_version_id, locale)
);

create table public.review_events (
  id bigint generated always as identity primary key,
  question_version_id uuid not null references public.question_versions(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  action text not null,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.protect_published_question_version()
returns trigger language plpgsql as $$
begin
  if old.status in ('published', 'retired') then
    raise exception 'Published question versions are immutable';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger question_versions_immutable
before update or delete on public.question_versions
for each row execute procedure public.protect_published_question_version();

create or replace function public.audit_question_version()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data)
  values (auth.uid(), tg_op, 'question_version', coalesce(new.id, old.id), to_jsonb(old), to_jsonb(new));
  return coalesce(new, old);
end;
$$;

create trigger question_versions_audit
after insert or update or delete on public.question_versions
for each row execute procedure public.audit_question_version();

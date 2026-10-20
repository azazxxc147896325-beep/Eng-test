create unique index attempts_one_active_per_user
on public.attempts (user_id)
where status in ('in_progress', 'section_complete');

create or replace function public.create_attempt_snapshot(
  p_user_id uuid,
  p_idempotency_key uuid,
  p_mode public.exam_mode,
  p_locale text,
  p_seed text,
  p_current_section text,
  p_section_duration_minutes integer,
  p_blueprint_id uuid,
  p_items jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt_id uuid;
  v_item_count integer;
begin
  select id into v_attempt_id
  from public.attempts
  where user_id = p_user_id and idempotency_key = p_idempotency_key;
  if v_attempt_id is not null then return v_attempt_id; end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'Attempt items must be a non-empty array';
  end if;

  insert into public.attempts(
    user_id, blueprint_id, mode, locale, seed, current_section,
    started_at, section_expires_at, idempotency_key
  ) values (
    p_user_id, p_blueprint_id, p_mode, p_locale, p_seed, p_current_section,
    now(), case when p_section_duration_minutes is null then null else now() + make_interval(mins => p_section_duration_minutes) end,
    p_idempotency_key
  ) returning id into v_attempt_id;

  insert into public.attempt_items(
    attempt_id, ordinal, section, part, group_id, question_version_id, choice_order
  )
  select v_attempt_id, item.ordinal, item.section, item.part, item.group_id, item.question_version_id, item.choice_order
  from jsonb_to_recordset(p_items) as item(
    ordinal smallint, section text, part smallint, group_id uuid, question_version_id uuid, choice_order jsonb
  )
  join public.question_versions version
    on version.id = item.question_version_id and version.status = 'published';

  get diagnostics v_item_count = row_count;
  if v_item_count <> jsonb_array_length(p_items) then
    raise exception using errcode = '22023', message = 'Attempt contains unavailable question versions';
  end if;

  return v_attempt_id;
end;
$$;

revoke all on function public.create_attempt_snapshot(uuid, uuid, public.exam_mode, text, text, text, integer, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_attempt_snapshot(uuid, uuid, public.exam_mode, text, text, text, integer, uuid, jsonb) to service_role;

create or replace function public.protect_attempt_item_snapshot()
returns trigger language plpgsql as $$
begin
  raise exception 'Attempt item snapshots are immutable';
end;
$$;

create trigger attempt_items_immutable
before update on public.attempt_items
for each row execute procedure public.protect_attempt_item_snapshot();

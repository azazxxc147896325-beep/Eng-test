create or replace function public.submit_attempt(
  p_user_id uuid,
  p_attempt_id uuid,
  p_scoring_version text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.attempts%rowtype;
  v_existing uuid;
  v_result_id uuid;
  v_listening_raw integer;
  v_listening_total integer;
  v_reading_raw integer;
  v_reading_total integer;
  v_listening_scaled integer;
  v_reading_scaled integer;
  v_breakdown jsonb;
begin
  select * into v_attempt from public.attempts
  where id = p_attempt_id and user_id = p_user_id
  for update;
  if not found then raise exception using errcode = '42501', message = 'Attempt not found'; end if;

  select id into v_existing from public.score_results where attempt_id = p_attempt_id;
  if v_existing is not null then return v_existing; end if;
  if v_attempt.status not in ('in_progress', 'section_complete') then
    raise exception using errcode = '22023', message = 'Attempt cannot be submitted';
  end if;

  select
    count(*) filter (where item.section = 'listening'),
    count(*) filter (where item.section = 'listening' and coalesce(choice.is_correct, false)),
    count(*) filter (where item.section = 'reading'),
    count(*) filter (where item.section = 'reading' and coalesce(choice.is_correct, false))
  into v_listening_total, v_listening_raw, v_reading_total, v_reading_raw
  from public.attempt_items item
  left join public.responses response on response.attempt_item_id = item.id and response.attempt_id = item.attempt_id
  left join public.choices choice on choice.id = response.choice_id and choice.question_version_id = item.question_version_id
  where item.attempt_id = p_attempt_id;

  v_listening_scaled := case when v_listening_total > 0 then
    least(495, greatest(5, round((5 + 490 * (v_listening_raw::numeric / v_listening_total)) / 5) * 5))::integer
    else null end;
  v_reading_scaled := case when v_reading_total > 0 then
    least(495, greatest(5, round((5 + 490 * (v_reading_raw::numeric / v_reading_total)) / 5) * 5))::integer
    else null end;

  select jsonb_build_object('parts', coalesce(jsonb_object_agg(part::text, value), '{}'::jsonb))
  into v_breakdown
  from (
    select item.part, jsonb_build_object(
      'correct', count(*) filter (where coalesce(choice.is_correct, false)),
      'total', count(*),
      'accuracy', round(100 * (count(*) filter (where coalesce(choice.is_correct, false)))::numeric / count(*))
    ) as value
    from public.attempt_items item
    left join public.responses response on response.attempt_item_id = item.id and response.attempt_id = item.attempt_id
    left join public.choices choice on choice.id = response.choice_id and choice.question_version_id = item.question_version_id
    where item.attempt_id = p_attempt_id
    group by item.part
  ) parts;

  update public.attempts set status = 'submitted', submitted_at = now() where id = p_attempt_id;
  insert into public.score_results(
    attempt_id, user_id, scoring_version, listening_raw, reading_raw,
    listening_scaled, reading_scaled, total_scaled, breakdown
  ) values (
    p_attempt_id, p_user_id, p_scoring_version, v_listening_raw, v_reading_raw,
    v_listening_scaled, v_reading_scaled,
    case when v_listening_scaled is not null and v_reading_scaled is not null then v_listening_scaled + v_reading_scaled else null end,
    v_breakdown
  ) returning id into v_result_id;
  return v_result_id;
end;
$$;

revoke all on function public.submit_attempt(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.submit_attempt(uuid, uuid, text) to service_role;

create or replace function public.protect_score_result()
returns trigger language plpgsql as $$
begin
  raise exception 'Score results are immutable';
end;
$$;

create trigger score_results_immutable
before update or delete on public.score_results
for each row execute procedure public.protect_score_result();

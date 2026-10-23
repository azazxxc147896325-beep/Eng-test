create or replace function public.transition_attempt_section(
  p_user_id uuid,
  p_attempt_id uuid
) returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.attempts%rowtype;
  v_duration integer;
  v_expires_at timestamptz;
begin
  select * into v_attempt from public.attempts
  where id = p_attempt_id and user_id = p_user_id
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'Attempt not found';
  end if;
  if v_attempt.current_section = 'reading' and v_attempt.status in ('in_progress', 'section_complete') then
    return v_attempt.section_expires_at;
  end if;
  if v_attempt.current_section <> 'listening' or v_attempt.status not in ('in_progress', 'section_complete')
    or v_attempt.mode not in ('full', 'quick') then
    raise exception using errcode = '22023', message = 'Attempt cannot transition to Reading';
  end if;

  v_duration := case when v_attempt.mode = 'full' then 75 else 18 end;
  v_expires_at := now() + make_interval(mins => v_duration);
  update public.attempts set
    current_section = 'reading',
    status = 'in_progress',
    section_expires_at = v_expires_at
  where id = p_attempt_id;
  return v_expires_at;
end;
$$;

revoke all on function public.transition_attempt_section(uuid, uuid) from public, anon, authenticated;
grant execute on function public.transition_attempt_section(uuid, uuid) to service_role;

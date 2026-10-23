create or replace function public.save_attempt_response(
  p_attempt_id uuid,
  p_attempt_item_id uuid,
  p_choice_id uuid,
  p_marked boolean
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt public.attempts%rowtype;
  v_item public.attempt_items%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select * into v_attempt from public.attempts
  where id = p_attempt_id and user_id = v_user_id
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'Attempt not found';
  end if;
  if v_attempt.status not in ('in_progress', 'section_complete') then
    raise exception using errcode = '22023', message = 'Attempt is not active';
  end if;
  if v_attempt.section_expires_at is not null and now() > v_attempt.section_expires_at then
    raise exception using errcode = '22023', message = 'Section deadline has passed';
  end if;

  select * into v_item from public.attempt_items
  where id = p_attempt_item_id and attempt_id = p_attempt_id;
  if not found or v_item.section <> v_attempt.current_section then
    raise exception using errcode = '22023', message = 'Attempt item is not in the active section';
  end if;
  if p_choice_id is not null and not exists (
    select 1 from public.choices
    where id = p_choice_id and question_version_id = v_item.question_version_id
  ) then
    raise exception using errcode = '22023', message = 'Choice does not belong to the question';
  end if;

  insert into public.responses(attempt_id, attempt_item_id, user_id, choice_id, marked, answered_at)
  values (p_attempt_id, p_attempt_item_id, v_user_id, p_choice_id, p_marked, now())
  on conflict (attempt_id, attempt_item_id) do update set
    choice_id = excluded.choice_id,
    marked = excluded.marked,
    answered_at = excluded.answered_at
  where public.responses.user_id = v_user_id;

  return true;
end;
$$;

drop policy if exists responses_insert_own on public.responses;
drop policy if exists responses_update_own on public.responses;
revoke insert, update on public.responses from authenticated;
revoke all on function public.save_attempt_response(uuid, uuid, uuid, boolean) from public, anon;
grant execute on function public.save_attempt_response(uuid, uuid, uuid, boolean) to authenticated;

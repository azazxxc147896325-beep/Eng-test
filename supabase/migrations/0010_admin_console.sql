create policy profiles_admin_select on public.profiles for select using (public.has_role('admin'));
create policy user_roles_admin_select on public.user_roles for select using (public.has_role('admin'));
create policy versions_creator_update on public.question_versions for update
  using (created_by = auth.uid() and status in ('draft', 'checks_passed'))
  with check (created_by = auth.uid() and status in ('draft', 'checks_passed', 'in_review'));

create or replace function public.set_user_staff_role(p_user_id uuid, p_role public.app_role)
returns void language plpgsql security definer set search_path = '' as $$
declare v_actor uuid := auth.uid();
begin
  if not public.has_role('admin') then raise exception using errcode = '42501', message = 'Admin role required'; end if;
  if p_user_id = v_actor then raise exception using errcode = '42501', message = 'Cannot change your own role'; end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then raise exception using errcode = 'P0002', message = 'User not found'; end if;
  delete from public.user_roles where user_id = p_user_id and role in ('admin', 'reviewer');
  insert into public.user_roles(user_id, role) values (p_user_id, 'user') on conflict do nothing;
  if p_role <> 'user' then insert into public.user_roles(user_id, role) values (p_user_id, p_role) on conflict do nothing; end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, after_data)
  values (v_actor, 'SET_ROLE', 'user', p_user_id, jsonb_build_object('role', p_role));
end; $$;

revoke all on function public.set_user_staff_role(uuid, public.app_role) from public, anon;
grant execute on function public.set_user_staff_role(uuid, public.app_role) to authenticated;

create or replace function public.save_content_drafts(p_drafts jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_draft jsonb; v_count integer;
begin
  if jsonb_typeof(p_drafts) <> 'array' then raise exception using errcode = '22023', message = 'Drafts must be an array'; end if;
  v_count := jsonb_array_length(p_drafts);
  if v_count < 1 or v_count > 200 then raise exception using errcode = '22023', message = 'Import requires 1 to 200 drafts'; end if;
  for v_draft in select value from jsonb_array_elements(p_drafts) loop
    perform public.save_generated_content_draft(v_draft);
  end loop;
  return v_count;
end; $$;

revoke all on function public.save_content_drafts(jsonb) from public, anon;
grant execute on function public.save_content_drafts(jsonb) to authenticated;

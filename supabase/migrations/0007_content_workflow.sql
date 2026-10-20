create or replace function public.protect_published_question_version()
returns trigger language plpgsql as $$
begin
  if old.status = 'published' and tg_op = 'UPDATE' and new.status = 'retired' then return new; end if;
  if old.status in ('published', 'retired') then raise exception 'Published question versions are immutable'; end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.transition_question_version(
  p_question_version_id uuid,
  p_target_status public.content_status,
  p_notes text default null
) returns public.content_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_version public.question_versions%rowtype;
  v_is_admin boolean;
  v_is_reviewer boolean;
begin
  select * into v_version from public.question_versions where id = p_question_version_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Question version not found'; end if;
  select public.has_role('admin'), public.has_role('reviewer') into v_is_admin, v_is_reviewer;

  if p_target_status = 'in_review' then
    if v_version.created_by <> v_actor or v_version.status not in ('draft', 'checks_passed') then
      raise exception using errcode = '42501', message = 'Only the creator can submit this draft';
    end if;
  elsif p_target_status = 'approved' then
    if not (v_is_admin or v_is_reviewer) or v_version.created_by = v_actor or v_version.status <> 'in_review' then
      raise exception using errcode = '42501', message = 'Creators cannot approve their own content';
    end if;
  elsif p_target_status = 'published' then
    if not v_is_admin or v_version.created_by = v_actor or v_version.status <> 'approved' or v_version.approved_by is null then
      raise exception using errcode = '42501', message = 'Only an admin can publish approved content created by another user';
    end if;
  elsif p_target_status = 'retired' then
    if not v_is_admin or v_version.status <> 'published' then
      raise exception using errcode = '42501', message = 'Only an admin can retire published content';
    end if;
  else
    raise exception using errcode = '22023', message = 'Unsupported workflow transition';
  end if;

  update public.question_versions set
    status = p_target_status,
    approved_by = case when p_target_status = 'approved' then v_actor else approved_by end
  where id = p_question_version_id;
  insert into public.review_events(question_version_id, actor_id, action, notes)
  values (p_question_version_id, v_actor, p_target_status::text, p_notes);
  return p_target_status;
end;
$$;

revoke all on function public.transition_question_version(uuid, public.content_status, text) from public, anon;
grant execute on function public.transition_question_version(uuid, public.content_status, text) to authenticated;

create view public.content_pool_coverage with (security_invoker = true) as
with group_counts as (
  select groups.id, groups.part, groups.group_type, groups.status,
    count(versions.id) filter (where versions.status = 'published') as published_questions
  from public.question_groups groups
  left join public.question_versions versions on versions.group_id = groups.id
  group by groups.id
)
select part,
  count(*) filter (where status = 'draft') as draft_groups,
  count(*) filter (where status = 'in_review') as review_groups,
  sum(published_questions) as published_questions,
  count(*) filter (where case
    when part in (1,2,5) then published_questions = 1
    when part in (3,4) then published_questions = 3
    when part = 6 then published_questions = 4
    when part = 7 and group_type = 'single_document' then published_questions between 2 and 4
    when part = 7 and group_type in ('double_document','triple_document') then published_questions = 5
    else false end) as complete_groups
from group_counts group by part;

grant select on public.content_pool_coverage to authenticated;

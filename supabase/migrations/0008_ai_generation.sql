create table public.ai_generation_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id),
  requested_count integer not null check (requested_count between 1 and 10),
  part smallint not null check (part between 1 and 7),
  model text not null,
  outcome text not null,
  created_at timestamptz not null default now()
);

create index ai_generation_usage_daily_idx on public.ai_generation_usage (user_id, created_at desc);
alter table public.ai_generation_usage enable row level security;
create policy ai_usage_staff_select on public.ai_generation_usage for select
  using ((public.has_role('admin') or public.has_role('reviewer')) and user_id = auth.uid());

create or replace function public.save_generated_content_draft(p_draft jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid(); v_group_id uuid; v_question_id uuid; v_version_id uuid;
  v_question jsonb; v_choice jsonb; v_translation jsonb;
  v_part smallint := (p_draft->>'part')::smallint; v_position integer; v_question_count integer;
begin
  if v_actor is null or not (public.has_role('admin') or public.has_role('reviewer')) then
    raise exception using errcode = '42501', message = 'Staff role required';
  end if;
  v_question_count := jsonb_array_length(coalesce(p_draft->'questions', '[]'::jsonb));
  if v_part not between 1 and 7 or not (
    case
      when v_part in (1, 2, 5) then v_question_count = 1
      when v_part in (3, 4) then v_question_count = 3
      when v_part = 6 then v_question_count = 4
      when v_part = 7 and p_draft->>'groupType' = 'single_document' then v_question_count between 2 and 4
      when v_part = 7 and p_draft->>'groupType' in ('double_document', 'triple_document') then v_question_count = 5
      else false
    end
  ) then
    raise exception using errcode = '22023', message = 'Invalid generated draft';
  end if;
  insert into public.question_groups(part, group_type, difficulty, status, created_by)
  values (v_part, p_draft->>'groupType', p_draft->>'difficulty', 'draft', v_actor) returning id into v_group_id;
  for v_question in select value from jsonb_array_elements(p_draft->'questions') loop
    if jsonb_array_length(coalesce(v_question->'choices', '[]'::jsonb)) <> (case when v_part = 2 then 3 else 4 end)
      or (select count(*) from jsonb_array_elements(v_question->'choices') choice where (choice->>'correct')::boolean) <> 1
      or coalesce(v_question->'translations'->'th'->>'explanation', '') = ''
      or coalesce(v_question->'translations'->'en'->>'explanation', '') = ''
      or (v_part <= 4 and (coalesce(v_question->'translations'->'th'->>'transcript', '') = ''
        or coalesce(v_question->'translations'->'en'->>'transcript', '') = '')) then
      raise exception using errcode = '22023', message = 'Invalid generated question structure';
    end if;
    insert into public.questions(part, created_by) values (v_part, v_actor) returning id into v_question_id;
    insert into public.question_versions(question_id, group_id, version, prompt, solution, difficulty, skill_tags,
      choice_shuffle_allowed, content_hash, status, created_by)
    values (v_question_id, v_group_id, 1, v_question->'prompt', jsonb_build_object('correctChoiceId', (
      select choice->>'id' from jsonb_array_elements(v_question->'choices') choice
      where (choice->>'correct')::boolean limit 1)), p_draft->>'difficulty', '{}',
      coalesce((v_question->>'choiceShuffleAllowed')::boolean, true),
      encode(extensions.digest(convert_to(v_question::text || gen_random_uuid()::text, 'UTF8'), 'sha256'), 'hex'),
      'draft', v_actor) returning id into v_version_id;
    v_position := 0;
    for v_choice in select value from jsonb_array_elements(v_question->'choices') loop
      v_position := v_position + 1;
      insert into public.choices(question_version_id, label, content, is_correct, position)
      values (v_version_id, v_choice->>'label', v_choice->'content', (v_choice->>'correct')::boolean, v_position);
    end loop;
    for v_translation in select value from jsonb_array_elements(jsonb_build_array(
      jsonb_build_object('locale', 'th', 'body', v_question->'translations'->'th'),
      jsonb_build_object('locale', 'en', 'body', v_question->'translations'->'en'))) loop
      insert into public.translations(question_version_id, locale, explanation, prompt_translation, transcript, status)
      values (v_version_id, v_translation->>'locale', v_translation->'body'->>'explanation',
        v_translation->'body'->>'promptTranslation', v_translation->'body'->>'transcript', 'draft');
    end loop;
  end loop;
  return v_group_id;
end;
$$;

revoke all on function public.save_generated_content_draft(jsonb) from public, anon;
grant execute on function public.save_generated_content_draft(jsonb) to authenticated;

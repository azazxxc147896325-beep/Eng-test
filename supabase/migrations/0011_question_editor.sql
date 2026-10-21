create or replace function public.update_question_draft(p_question_version_id uuid, p_payload jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_version public.question_versions%rowtype;
  v_choice jsonb;
  v_choice_count integer;
  v_updated integer;
begin
  if octet_length(p_payload::text) > 250000 then
    raise exception using errcode = '22023', message = 'Draft payload is too large';
  end if;
  select * into v_version from public.question_versions where id = p_question_version_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Question version not found'; end if;
  if v_actor is null or v_version.created_by <> v_actor or v_version.status <> 'draft' then
    raise exception using errcode = '42501', message = 'Only the creator can edit a draft';
  end if;
  if jsonb_typeof(p_payload->'prompt') <> 'object'
    or coalesce(btrim(p_payload->'prompt'->>'text'), '') = ''
    or length(p_payload->'prompt'->>'text') > 10000 then
    raise exception using errcode = '22023', message = 'Prompt is required';
  end if;
  if jsonb_typeof(p_payload->'choices') <> 'array' then
    raise exception using errcode = '22023', message = 'Choices must be an array';
  end if;

  select count(*) into v_choice_count from public.choices where question_version_id = p_question_version_id;
  if jsonb_array_length(p_payload->'choices') <> v_choice_count
    or (select count(distinct value->>'id') from jsonb_array_elements(p_payload->'choices')) <> v_choice_count
    or (select count(*) from jsonb_array_elements(p_payload->'choices') where (value->>'correct')::boolean) <> 1
    or exists (select 1 from jsonb_array_elements(p_payload->'choices') where coalesce(btrim(value->>'text'), '') = '' or length(value->>'text') > 2000) then
    raise exception using errcode = '22023', message = 'Invalid choices';
  end if;

  update public.choices set is_correct = false where question_version_id = p_question_version_id;
  for v_choice in select value from jsonb_array_elements(p_payload->'choices') loop
    update public.choices set content = jsonb_build_object('text', v_choice->>'text')
    where id = (v_choice->>'id')::uuid and question_version_id = p_question_version_id;
    get diagnostics v_updated = row_count;
    if v_updated <> 1 then raise exception using errcode = '22023', message = 'Choice does not belong to this question'; end if;
  end loop;
  update public.choices set is_correct = true
  where id = (select (value->>'id')::uuid from jsonb_array_elements(p_payload->'choices') where (value->>'correct')::boolean)
    and question_version_id = p_question_version_id;

  if coalesce(btrim(p_payload->'translations'->'th'->>'explanation'), '') = ''
    or coalesce(btrim(p_payload->'translations'->'en'->>'explanation'), '') = ''
    or length(p_payload->'translations'->'th'->>'explanation') > 20000
    or length(p_payload->'translations'->'en'->>'explanation') > 20000
    or length(coalesce(p_payload->'translations'->'th'->>'promptTranslation', '')) > 10000 then
    raise exception using errcode = '22023', message = 'Thai and English explanations are required';
  end if;
  update public.translations set
    prompt_translation = nullif(p_payload->'translations'->'th'->>'promptTranslation', ''),
    explanation = p_payload->'translations'->'th'->>'explanation',
    transcript = coalesce(p_payload->'translations'->'th'->>'transcript', transcript)
  where question_version_id = p_question_version_id and locale = 'th';
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then raise exception using errcode = '22023', message = 'Thai translation is missing'; end if;
  update public.translations set
    prompt_translation = nullif(p_payload->'translations'->'en'->>'promptTranslation', ''),
    explanation = p_payload->'translations'->'en'->>'explanation',
    transcript = coalesce(p_payload->'translations'->'en'->>'transcript', transcript)
  where question_version_id = p_question_version_id and locale = 'en';
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then raise exception using errcode = '22023', message = 'English translation is missing'; end if;

  update public.question_versions set
    prompt = p_payload->'prompt',
    solution = jsonb_build_object('correctChoiceId', (
      select value->>'id' from jsonb_array_elements(p_payload->'choices') where (value->>'correct')::boolean
    )),
    content_hash = encode(extensions.digest(convert_to(p_payload::text || p_question_version_id::text, 'UTF8'), 'sha256'), 'hex')
  where id = p_question_version_id;
end; $$;

revoke all on function public.update_question_draft(uuid, jsonb) from public, anon;
grant execute on function public.update_question_draft(uuid, jsonb) to authenticated;

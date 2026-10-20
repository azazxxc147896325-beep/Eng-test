begin;
select plan(5);

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.com', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.com', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reviewer@example.com', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@example.com', '{}', '{}', now(), now());

insert into public.user_roles(user_id, role) values
  ('00000000-0000-0000-0000-000000000003', 'reviewer'),
  ('00000000-0000-0000-0000-000000000004', 'admin');

insert into public.attempts(user_id, mode, locale, seed, current_section, idempotency_key)
values
  ('00000000-0000-0000-0000-000000000001', 'practice', 'th', 'a', 'practice', '10000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002', 'practice', 'th', 'b', 'practice', '10000000-0000-0000-0000-000000000002');

insert into public.questions(id, part, created_by)
values ('20000000-0000-0000-0000-000000000001', 5, '00000000-0000-0000-0000-000000000003');
insert into public.question_versions(id, question_id, version, prompt, solution, difficulty, content_hash, created_by)
values ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1, '{}', '{}', 'medium', 'hash-1', '00000000-0000-0000-0000-000000000003');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select results_eq('select count(*) from public.profiles', array[1::bigint], 'user reads only own profile');
select results_eq('select count(*) from public.attempts', array[1::bigint], 'user reads only own attempt');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select results_eq(
  $$with changed as (update public.question_versions set status = 'approved', approved_by = auth.uid() where id = '30000000-0000-0000-0000-000000000001' returning 1) select count(*) from changed$$,
  array[0::bigint],
  'creator cannot approve own question'
);
select results_eq(
  $$with changed as (update public.question_versions set status = 'published' where id = '30000000-0000-0000-0000-000000000001' returning 1) select count(*) from changed$$,
  array[0::bigint],
  'reviewer cannot publish'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select results_eq(
  $$with changed as (update public.question_versions set status = 'published', approved_by = auth.uid() where id = '30000000-0000-0000-0000-000000000001' returning 1) select count(*) from changed$$,
  array[1::bigint],
  'admin can publish content created by another user'
);

select * from finish();
rollback;

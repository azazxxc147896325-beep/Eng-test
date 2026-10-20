begin;
select plan(6);

select ok(
  not has_function_privilege('authenticated', 'public.create_attempt_snapshot(uuid,uuid,public.exam_mode,text,text,text,integer,uuid,jsonb)', 'EXECUTE'),
  'authenticated clients cannot forge attempt snapshots'
);
select ok(
  has_function_privilege('service_role', 'public.create_attempt_snapshot(uuid,uuid,public.exam_mode,text,text,text,integer,uuid,jsonb)', 'EXECUTE'),
  'only the trusted service path can create snapshots'
);

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'attempt@example.com', '{}', '{}', now(), now());

insert into public.questions(id, part, created_by) values
  ('10000000-0000-0000-0000-000000000001', 5, '00000000-0000-0000-0000-000000000010'),
  ('10000000-0000-0000-0000-000000000002', 5, '00000000-0000-0000-0000-000000000010');
insert into public.question_versions(id, question_id, version, prompt, solution, difficulty, content_hash, status, created_by) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, '{"text":"Q1"}', '{"choice":"A"}', 'medium', 'attempt-hash-1', 'published', '00000000-0000-0000-0000-000000000010'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 1, '{"text":"Q2"}', '{"choice":"B"}', 'medium', 'attempt-hash-2', 'published', '00000000-0000-0000-0000-000000000010');

create temp table rpc_results(id uuid);
insert into rpc_results values (public.create_attempt_snapshot(
  '00000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000001',
  'practice', 'th', 'server-seed', 'practice', null, null,
  '[{"ordinal":1,"section":"practice","part":5,"group_id":null,"question_version_id":"20000000-0000-0000-0000-000000000001","choice_order":["A","B"]},{"ordinal":2,"section":"practice","part":5,"group_id":null,"question_version_id":"20000000-0000-0000-0000-000000000002","choice_order":["B","A"]}]'::jsonb
));
insert into rpc_results values (public.create_attempt_snapshot(
  '00000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000001',
  'practice', 'th', 'different-seed-is-ignored', 'practice', null, null, '[]'::jsonb
));

select is((select count(distinct id) from rpc_results), 1::bigint, 'same idempotency key returns same attempt');
select is((select count(*) from public.attempts where user_id = '00000000-0000-0000-0000-000000000010'), 1::bigint, 'only one attempt is created');
select is((select count(*) from public.attempt_items where attempt_id = (select id from rpc_results limit 1)), 2::bigint, 'idempotent replay does not replace items');
select is(
  (select string_agg(question_version_id::text, ',' order by ordinal) from public.attempt_items where attempt_id = (select id from rpc_results limit 1)),
  '20000000-0000-0000-0000-000000000001,20000000-0000-0000-0000-000000000002',
  'reload preserves immutable item order'
);

select * from finish();
rollback;

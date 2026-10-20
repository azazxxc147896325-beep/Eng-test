begin;
select plan(6);

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'score@example.com', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'other-score@example.com', '{}', '{}', now(), now());

insert into public.questions(id, part, created_by) values
  ('11000000-0000-0000-0000-000000000001', 1, '00000000-0000-0000-0000-000000000020'),
  ('11000000-0000-0000-0000-000000000002', 5, '00000000-0000-0000-0000-000000000020');
insert into public.question_versions(id, question_id, version, prompt, solution, difficulty, content_hash, status, created_by) values
  ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 1, '{}', '{"answer":"A"}', 'medium', 'score-hash-1', 'published', '00000000-0000-0000-0000-000000000020'),
  ('21000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', 1, '{}', '{"answer":"B"}', 'medium', 'score-hash-2', 'published', '00000000-0000-0000-0000-000000000020');
insert into public.choices(id, question_version_id, label, content, is_correct, position) values
  ('31000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', 'A', '{}', true, 1),
  ('31000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000002', 'A', '{}', false, 1),
  ('31000000-0000-0000-0000-000000000003', '21000000-0000-0000-0000-000000000002', 'B', '{}', true, 2);
insert into public.attempts(id, user_id, mode, locale, seed, current_section, idempotency_key) values
  ('41000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020', 'full', 'th', 'seed', 'reading', '51000000-0000-0000-0000-000000000001');
insert into public.attempt_items(id, attempt_id, ordinal, section, part, question_version_id, choice_order) values
  ('61000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001', 1, 'listening', 1, '21000000-0000-0000-0000-000000000001', '["31000000-0000-0000-0000-000000000001"]'),
  ('61000000-0000-0000-0000-000000000002', '41000000-0000-0000-0000-000000000001', 2, 'reading', 5, '21000000-0000-0000-0000-000000000002', '["31000000-0000-0000-0000-000000000002","31000000-0000-0000-0000-000000000003"]');
insert into public.responses(attempt_id, attempt_item_id, user_id, choice_id)
values ('41000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020', '31000000-0000-0000-0000-000000000001');

create temp table submitted(id uuid);
insert into submitted values (public.submit_attempt('00000000-0000-0000-0000-000000000020', '41000000-0000-0000-0000-000000000001', 'sq-v1'));
select is((select status::text from public.attempts where id = '41000000-0000-0000-0000-000000000001'), 'submitted', 'submission finalizes the attempt');
select ok((select listening_scaled between 5 and 495 and reading_scaled between 5 and 495 and total_scaled between 10 and 990 from public.score_results where id = (select id from submitted)), 'scaled estimates stay in bounds');
select is((select (breakdown->'parts'->'5'->>'correct')::integer from public.score_results where id = (select id from submitted)), 0, 'unanswered item is scored incorrect');
select is(public.submit_attempt('00000000-0000-0000-0000-000000000020', '41000000-0000-0000-0000-000000000001', 'other-version'), (select id from submitted), 'double submit returns immutable existing result');
select throws_ok($$update public.score_results set total_scaled = 990 where id = (select id from submitted)$$, 'Score results are immutable', 'score result cannot be changed');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000021","role":"authenticated"}', true);
select is((select count(*) from public.score_results), 0::bigint, 'another user cannot read the result');

select * from finish();
rollback;

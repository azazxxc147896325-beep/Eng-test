begin;
select plan(4);
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
('00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000000','authenticated','authenticated','creator@x.test','{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000000','authenticated','authenticated','reviewer@x.test','{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin@x.test','{}','{}',now(),now());
insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-000000000030','reviewer'),('00000000-0000-0000-0000-000000000031','reviewer'),('00000000-0000-0000-0000-000000000032','admin');
insert into public.questions(id, part, created_by) values ('12000000-0000-0000-0000-000000000001',5,'00000000-0000-0000-0000-000000000030');
insert into public.question_versions(id,question_id,version,prompt,solution,difficulty,content_hash,status,created_by) values
('22000000-0000-0000-0000-000000000001','12000000-0000-0000-0000-000000000001',1,'{}','{}','medium','workflow-hash','in_review','00000000-0000-0000-0000-000000000030');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000030","role":"authenticated"}',true);
select throws_ok($$select public.transition_question_version('22000000-0000-0000-0000-000000000001','approved',null)$$,'42501','Creators cannot approve their own content','creator cannot approve own content');
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000031","role":"authenticated"}',true);
select is(public.transition_question_version('22000000-0000-0000-0000-000000000001','approved',null)::text,'approved','another reviewer can approve');
select throws_ok($$select public.transition_question_version('22000000-0000-0000-0000-000000000001','published',null)$$,'42501','Only an admin can publish approved content created by another user','reviewer cannot publish');
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000032","role":"authenticated"}',true);
select is(public.transition_question_version('22000000-0000-0000-0000-000000000001','published',null)::text,'published','admin publishes approved content');
select * from finish();
rollback;

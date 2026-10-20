begin;
select plan(9);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'questions', 'questions table exists');
select has_table('public', 'question_versions', 'question versions are immutable records');
select has_table('public', 'attempts', 'attempts table exists');
select has_table('public', 'attempt_items', 'attempt items snapshot a question version');
select has_column('public', 'attempt_items', 'question_version_id', 'attempt items reference question versions');
select policies_are('public', 'profiles', array['profiles_select_own', 'profiles_update_own'], 'profiles use own-row policies');
select policies_are('public', 'user_roles', array['user_roles_select_own'], 'users can read their own roles');
select policies_are('public', 'attempts', array['attempts_select_own'], 'attempts expose only owner reads');

select * from finish();
rollback;

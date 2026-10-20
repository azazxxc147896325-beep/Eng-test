alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.question_groups enable row level security;
alter table public.questions enable row level security;
alter table public.question_versions enable row level security;
alter table public.choices enable row level security;
alter table public.media enable row level security;
alter table public.translations enable row level security;
alter table public.review_events enable row level security;
alter table public.test_blueprints enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_items enable row level security;
alter table public.responses enable row level security;
alter table public.score_results enable row level security;

create policy profiles_select_own on public.profiles for select using (id = auth.uid());
create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy attempts_select_own on public.attempts for select using (user_id = auth.uid());

create policy attempt_items_select_own on public.attempt_items for select using (
  exists (select 1 from public.attempts where attempts.id = attempt_items.attempt_id and attempts.user_id = auth.uid())
);
create policy responses_select_own on public.responses for select using (user_id = auth.uid());
create policy responses_insert_own on public.responses for insert with check (user_id = auth.uid());
create policy responses_update_own on public.responses for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy scores_select_own on public.score_results for select using (user_id = auth.uid());

create policy groups_staff_select on public.question_groups for select using (public.has_role('admin') or public.has_role('reviewer'));
create policy groups_staff_insert on public.question_groups for insert with check ((public.has_role('admin') or public.has_role('reviewer')) and created_by = auth.uid());
create policy versions_staff_select on public.question_versions for select using (public.has_role('admin') or public.has_role('reviewer'));
create policy versions_staff_insert on public.question_versions for insert with check ((public.has_role('admin') or public.has_role('reviewer')) and created_by = auth.uid());
create policy versions_review_other on public.question_versions for update
  using ((public.has_role('admin') or public.has_role('reviewer')) and created_by <> auth.uid())
  with check (
    created_by <> auth.uid()
    and (
      (public.has_role('reviewer') and status <> 'published' and status <> 'retired')
      or public.has_role('admin')
    )
  );

create policy questions_staff_all on public.questions for all
  using (public.has_role('admin') or public.has_role('reviewer'))
  with check ((public.has_role('admin') or public.has_role('reviewer')) and created_by = auth.uid());
create policy choices_staff_all on public.choices for all
  using (public.has_role('admin') or public.has_role('reviewer'))
  with check (public.has_role('admin') or public.has_role('reviewer'));
create policy media_staff_all on public.media for all
  using (public.has_role('admin') or public.has_role('reviewer'))
  with check (public.has_role('admin') or public.has_role('reviewer'));
create policy translations_staff_all on public.translations for all
  using (public.has_role('admin') or public.has_role('reviewer'))
  with check (public.has_role('admin') or public.has_role('reviewer'));
create policy review_events_staff_select on public.review_events for select using (public.has_role('admin') or public.has_role('reviewer'));
create policy review_events_staff_insert on public.review_events for insert with check ((public.has_role('admin') or public.has_role('reviewer')) and actor_id = auth.uid());

create policy blueprints_authenticated_select on public.test_blueprints for select to authenticated using (active);

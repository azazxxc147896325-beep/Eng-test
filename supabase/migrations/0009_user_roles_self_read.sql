create policy user_roles_select_own
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

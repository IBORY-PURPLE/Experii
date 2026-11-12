-- 0005: web_visitor() is only for the anon role the server uses (RLS checks run as that role). Signed-in Supabase
-- users and PUBLIC do not need it (Supabase security advisor, 2026-11-13).
revoke execute on function public.web_visitor() from public, authenticated;
grant execute on function public.web_visitor() to anon;

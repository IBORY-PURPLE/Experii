-- 0004 (from the 2026-11-13 code review):
-- 1. A server key. Every request must also carry x-web-key, a secret only the web server holds (env WEB_DB_KEY).
--    Without it web_visitor() is null and no policy or function matches, so the publishable key alone reaches
--    nothing. The secret is stored in a schema the API does not expose; it is inserted separately, never in this file:
--      insert into web_private.settings (web_key) values ('<WEB_DB_KEY>');
-- 2. A retry is claimed in one statement (no two runs of the same capture) and counts against the daily limits.
-- 3. The chat allowance says which limit was reached.

create schema if not exists web_private;
revoke all on schema web_private from public, anon, authenticated;

create table web_private.settings (
  id       boolean primary key default true check (id),
  web_key  text not null check (char_length(web_key) >= 32)
);
revoke all on web_private.settings from public, anon, authenticated;

create or replace function public.web_visitor() returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select s.web_key from web_private.settings s)
         = (current_setting('request.headers', true)::json ->> 'x-web-key')
    then nullif(current_setting('request.headers', true)::json ->> 'x-visitor-id', '')::uuid
  end
$$;

drop function public.web_take_retry();

create function public.web_retry_capture(p_capture uuid, p_limit integer)
returns setof public.web_captures
language plpgsql
security definer
set search_path = public
as $$
declare
  v uuid := public.web_visitor();
  today date := (now() at time zone 'Asia/Seoul')::date;
  used integer;
  everyone integer;
  tries integer;
begin
  if v is null then
    raise exception 'no_visitor' using errcode = '28000';
  end if;
  select coalesce(sum(captures), 0) into everyone from public.web_usage where day = today;
  if everyone >= 300 then
    raise exception 'daily_total' using errcode = 'P0001';
  end if;
  -- the claim itself is the check, so two requests at once cannot both start a run
  return query
    update public.web_captures
       set status = 'pending', error = null, reason = null, attempts = attempts + 1, updated_at = now()
     where id = p_capture and visitor_id = v and status in ('failed', 'empty') and attempts < 3
    returning *;
  if not found then
    select attempts into tries from public.web_captures where id = p_capture and visitor_id = v;
    if tries is null then
      raise exception 'capture_not_found' using errcode = 'P0002';
    elsif tries >= 3 then
      raise exception 'too_many_attempts' using errcode = 'P0001';
    end if;
    raise exception 'cannot_retry' using errcode = 'P0001';
  end if;
  delete from public.web_notes where capture_id = p_capture and visitor_id = v and state = 'suggested';
  insert into public.web_usage (visitor_id, day, captures)
  values (v, today, 1)
  on conflict (visitor_id, day) do update set captures = public.web_usage.captures + 1
  returning captures into used;
  if used > least(coalesce(p_limit, 30), 50) then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;
end;
$$;
revoke all on function public.web_retry_capture(uuid, integer) from public, authenticated;
grant execute on function public.web_retry_capture(uuid, integer) to anon;

drop function public.web_take_chat(integer);

create function public.web_take_chat(p_limit integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v uuid := public.web_visitor();
  today date := (now() at time zone 'Asia/Seoul')::date;
  used integer;
  everyone integer;
begin
  if v is null then
    return 'no_visitor';
  end if;
  select coalesce(sum(chats), 0) into everyone from public.web_usage where day = today;
  if everyone >= 3000 then
    return 'daily_total';
  end if;
  insert into public.web_usage (visitor_id, day, chats)
  values (v, today, 1)
  on conflict (visitor_id, day) do update set chats = public.web_usage.chats + 1
  returning chats into used;
  if used > least(coalesce(p_limit, 100), 200) then
    update public.web_usage set chats = chats - 1 where visitor_id = v and day = today;
    return 'daily_limit';
  end if;
  return 'ok';
end;
$$;
revoke all on function public.web_take_chat(integer) from public, authenticated;
grant execute on function public.web_take_chat(integer) to anon;

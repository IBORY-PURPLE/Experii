-- 0003: daily allowances across everyone, so clearing cookies (a new visitor id) cannot run up the Claude bill.
-- Per visitor: captures up to the server's limit (ceiling 50), chat messages up to its limit (ceiling 200).
-- All visitors together: 300 captures and 3000 chat messages a day (Asia/Seoul).

alter table public.web_usage add column chats integer not null default 0;

create or replace function public.web_create_capture(
  p_page uuid,
  p_path text,
  p_media text,
  p_bytes integer,
  p_width integer,
  p_height integer,
  p_x real,
  p_y real,
  p_limit integer
)
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
begin
  if v is null then
    raise exception 'no_visitor' using errcode = '28000';
  end if;
  if not exists (select 1 from public.web_pages where id = p_page and visitor_id = v) then
    raise exception 'page_not_found' using errcode = 'P0002';
  end if;
  if split_part(p_path, '/', 1) <> v::text then
    raise exception 'bad_path' using errcode = '22023';
  end if;
  select coalesce(sum(captures), 0) into everyone from public.web_usage where day = today;
  if everyone >= 300 then
    raise exception 'daily_total' using errcode = 'P0001';
  end if;
  insert into public.web_usage (visitor_id, day, captures)
  values (v, today, 1)
  on conflict (visitor_id, day) do update set captures = public.web_usage.captures + 1
  returning captures into used;
  if used > least(coalesce(p_limit, 30), 50) then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;
  return query
    insert into public.web_captures (page_id, visitor_id, storage_path, media_type, bytes, width, height, x, y)
    values (p_page, v, p_path, p_media, p_bytes, p_width, p_height, p_x, p_y)
    returning *;
end;
$$;

-- A retry runs Claude again on the same image, so it takes one from the same allowances.
create function public.web_take_retry()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v uuid := public.web_visitor();
  today date := (now() at time zone 'Asia/Seoul')::date;
  everyone integer;
begin
  if v is null then
    return false;
  end if;
  select coalesce(sum(captures), 0) into everyone from public.web_usage where day = today;
  if everyone >= 300 then
    return false;
  end if;
  insert into public.web_usage (visitor_id, day, captures)
  values (v, today, 1)
  on conflict (visitor_id, day) do update set captures = public.web_usage.captures + 1;
  return true;
end;
$$;
revoke all on function public.web_take_retry() from public, authenticated;
grant execute on function public.web_take_retry() to anon;

create function public.web_take_chat(p_limit integer)
returns boolean
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
    return false;
  end if;
  select coalesce(sum(chats), 0) into everyone from public.web_usage where day = today;
  if everyone >= 3000 then
    return false;
  end if;
  insert into public.web_usage (visitor_id, day, chats)
  values (v, today, 1)
  on conflict (visitor_id, day) do update set chats = public.web_usage.chats + 1
  returning chats into used;
  if used > least(coalesce(p_limit, 100), 200) then
    update public.web_usage set chats = chats - 1 where visitor_id = v and day = today;
    return false;
  end if;
  return true;
end;
$$;
revoke all on function public.web_take_chat(integer) from public, authenticated;
grant execute on function public.web_take_chat(integer) to anon;

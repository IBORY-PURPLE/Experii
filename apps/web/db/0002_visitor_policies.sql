-- 0002: the web server talks to Supabase with the publishable key and the visitor's id in an x-visitor-id header.
-- There is no secret key on the server and no Supabase Auth: RLS lets a request reach only the rows, and the stored
-- images, of the visitor id it carries. A visitor id is a random UUID kept in an httpOnly cookie (docs/web/tsd.md).

create function public.web_visitor() returns uuid
language sql
stable
set search_path = public
as $$
  select nullif(current_setting('request.headers', true)::json ->> 'x-visitor-id', '')::uuid
$$;
grant execute on function public.web_visitor() to anon;

grant select, insert, update, delete on public.web_pages, public.web_messages, public.web_notes to anon;
grant select, update, delete on public.web_captures to anon;

create policy web_pages_visitor on public.web_pages for all to anon
  using (visitor_id = (select public.web_visitor()))
  with check (visitor_id = (select public.web_visitor()));

create policy web_messages_visitor on public.web_messages for all to anon
  using (visitor_id = (select public.web_visitor()))
  with check (
    visitor_id = (select public.web_visitor())
    and exists (select 1 from public.web_pages p where p.id = page_id and p.visitor_id = (select public.web_visitor()))
  );

create policy web_notes_visitor on public.web_notes for all to anon
  using (visitor_id = (select public.web_visitor()))
  with check (
    visitor_id = (select public.web_visitor())
    and exists (select 1 from public.web_pages p where p.id = page_id and p.visitor_id = (select public.web_visitor()))
  );

create policy web_captures_visitor on public.web_captures for all to anon
  using (visitor_id = (select public.web_visitor()))
  with check (visitor_id = (select public.web_visitor()));

-- A capture is created only here, so the daily allowance cannot be skipped. An exception rolls back the count too.
drop function public.web_take_capture(uuid, integer);

create function public.web_create_capture(
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
  insert into public.web_usage (visitor_id, day, captures)
  values (v, today, 1)
  on conflict (visitor_id, day) do update set captures = public.web_usage.captures + 1
  returning captures into used;
  -- the server passes its own limit; 50 is the ceiling no caller can raise
  if used > least(coalesce(p_limit, 30), 50) then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;
  return query
    insert into public.web_captures (page_id, visitor_id, storage_path, media_type, bytes, width, height, x, y)
    values (p_page, v, p_path, p_media, p_bytes, p_width, p_height, p_x, p_y)
    returning *;
end;
$$;
revoke all on function public.web_create_capture(uuid, text, text, integer, integer, integer, real, real, integer)
  from public, authenticated;
grant execute on function public.web_create_capture(uuid, text, text, integer, integer, integer, real, real, integer)
  to anon;

-- Stored images: a visitor reaches only the folder named after their id.
create policy web_capture_objects_read on storage.objects for select to anon
  using (bucket_id = 'web-captures' and (storage.foldername(name))[1] = (select public.web_visitor())::text);
create policy web_capture_objects_write on storage.objects for insert to anon
  with check (bucket_id = 'web-captures' and (storage.foldername(name))[1] = (select public.web_visitor())::text);
create policy web_capture_objects_delete on storage.objects for delete to anon
  using (bucket_id = 'web-captures' and (storage.foldername(name))[1] = (select public.web_visitor())::text);

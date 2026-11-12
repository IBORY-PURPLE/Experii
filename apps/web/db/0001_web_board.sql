-- Experii web (apps/web): the study pages, chat, captures and notes of invited visitors who have no account.
-- It shares the Supabase project with the landing waitlist (landing/supabase), so every object is prefixed web_ and
-- applied with `supabase db query --linked -f` (docs/web/tsd.md) rather than `db push`, which would mix the two histories.
-- RLS is on and nothing is granted here; 0002_visitor_policies.sql opens each visitor's own rows to the server.

create table public.web_pages (
  id          uuid primary key default gen_random_uuid(),
  visitor_id  uuid not null,
  title       text not null default '새 공부' check (char_length(title) between 1 and 80),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index web_pages_visitor_idx on public.web_pages (visitor_id, updated_at desc);

create table public.web_messages (
  id          uuid primary key default gen_random_uuid(),
  page_id     uuid not null references public.web_pages (id) on delete cascade,
  visitor_id  uuid not null,
  seq         integer not null,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null check (char_length(content) <= 40000),
  created_at  timestamptz not null default now(),
  unique (page_id, seq)
);

create table public.web_captures (
  id            uuid primary key default gen_random_uuid(),
  page_id       uuid not null references public.web_pages (id) on delete cascade,
  visitor_id    uuid not null,
  storage_path  text not null,
  media_type    text not null check (media_type in ('image/png', 'image/jpeg', 'image/webp')),
  bytes         integer not null check (bytes > 0 and bytes <= 5242880),
  width         integer check (width > 0),
  height        integer check (height > 0),
  x             real not null default 0,
  y             real not null default 0,
  status        text not null default 'pending' check (status in ('pending', 'done', 'empty', 'failed')),
  reason        text check (char_length(reason) <= 300),
  error         text check (char_length(error) <= 300),
  adapter       text,
  model         text,
  redacted      integer not null default 0,
  attempts      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index web_captures_page_idx on public.web_captures (page_id, created_at);

create table public.web_notes (
  id             uuid primary key default gen_random_uuid(),
  page_id        uuid not null references public.web_pages (id) on delete cascade,
  visitor_id     uuid not null,
  capture_id     uuid references public.web_captures (id) on delete cascade,
  source         text not null check (source in ('drag-from-chat', 'capture-vision')),
  state          text not null default 'placed' check (state in ('suggested', 'placed')),
  kind           text not null default 'other' check (kind in ('concept', 'step', 'quote', 'warning', 'todo', 'other')),
  text           text not null check (char_length(text) between 1 and 4000),
  source_region  text check (source_region in ('top', 'middle', 'bottom', 'full')),
  confidence     real check (confidence between 0 and 1),
  raw_excerpt    text check (char_length(raw_excerpt) <= 2000),
  question_no    integer,
  ord            integer not null default 0,
  x              real not null default 0,
  y              real not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index web_notes_page_idx on public.web_notes (page_id, created_at);
create index web_notes_capture_idx on public.web_notes (capture_id);

create table public.web_usage (
  visitor_id  uuid not null,
  day         date not null,
  captures    integer not null default 0,
  primary key (visitor_id, day)
);

alter table public.web_pages enable row level security;
alter table public.web_messages enable row level security;
alter table public.web_captures enable row level security;
alter table public.web_notes enable row level security;
alter table public.web_usage enable row level security;
revoke all on public.web_pages, public.web_messages, public.web_captures, public.web_notes, public.web_usage
  from anon, authenticated;

-- One capture against the visitor's daily allowance (Asia/Seoul day). true when it fits, false when the limit is used up.
create function public.web_take_capture(p_visitor uuid, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  used integer;
begin
  insert into public.web_usage (visitor_id, day, captures)
  values (p_visitor, today, 1)
  on conflict (visitor_id, day) do update set captures = public.web_usage.captures + 1
  returning captures into used;
  if used > p_limit then
    update public.web_usage set captures = captures - 1 where visitor_id = p_visitor and day = today;
    return false;
  end if;
  return true;
end;
$$;
revoke all on function public.web_take_capture(uuid, integer) from public, anon, authenticated;
grant execute on function public.web_take_capture(uuid, integer) to service_role;

-- Captured images: private, 5 MB, the three formats the app accepts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('web-captures', 'web-captures', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

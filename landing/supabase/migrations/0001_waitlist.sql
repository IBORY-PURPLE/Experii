create extension if not exists citext;

create table public.waitlist_signups (
  id               uuid primary key default gen_random_uuid(),
  email            citext not null unique check (char_length(email) <= 254),
  student_status   text not null check (student_status in ('undergrad', 'job_seeker', 'other')),
  sqld_status      text not null check (sqld_status in ('studying', 'planning', 'certified', 'none')),
  ai_subscriptions text[] not null check (
    cardinality(ai_subscriptions) between 1 and 2
    and ai_subscriptions <@ array['chatgpt_paid', 'claude_paid', 'none']::text[]
    and (not ('none' = any(ai_subscriptions)) or cardinality(ai_subscriptions) = 1)
  ),
  consent_version  text not null check (char_length(consent_version) <= 40),
  hero_variant     text not null default 'h1' check (hero_variant in ('h1', 'h2', 'h3')),
  utm_source       text check (char_length(utm_source) <= 100),
  utm_medium       text check (char_length(utm_medium) <= 100),
  utm_campaign     text check (char_length(utm_campaign) <= 100),
  utm_content      text check (char_length(utm_content) <= 100),
  utm_term         text check (char_length(utm_term) <= 100),
  referrer_host    text check (char_length(referrer_host) <= 255),
  created_at       timestamptz not null default now()
);

-- 정책을 만들지 않는다: anon·authenticated는 읽기·쓰기 모두 막히고, 서버는 secret key로만 쓴다
alter table public.waitlist_signups enable row level security;
revoke all on public.waitlist_signups from anon, authenticated;

create schema if not exists reporting;
revoke all on schema reporting from anon, authenticated;

create view reporting.signups_daily as
select (created_at at time zone 'Asia/Seoul')::date as day,
       coalesce(utm_source, '(direct)')             as source,
       hero_variant,
       count(*)                                     as signups
from public.waitlist_signups
group by 1, 2, 3;

create view reporting.h3_subscriptions as
select count(*) as total,
       count(*) filter (where ai_subscriptions && array['chatgpt_paid', 'claude_paid']::text[]) as paid_any,
       count(*) filter (where 'chatgpt_paid' = any(ai_subscriptions))                          as chatgpt_paid,
       count(*) filter (where 'claude_paid'  = any(ai_subscriptions))                          as claude_paid,
       count(*) filter (where ai_subscriptions = array['none']::text[])                        as no_paid
from public.waitlist_signups;

create view reporting.priority_targets as
select email, created_at
from public.waitlist_signups
where student_status = 'undergrad' and sqld_status = 'studying'
order by created_at;

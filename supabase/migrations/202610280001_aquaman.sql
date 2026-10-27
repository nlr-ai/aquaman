-- Aquaman demo reporting backend. Run as the project owner in Supabase SQL Editor.
-- No existing project tables or policies are modified. No moderator is added here.
begin;
create schema if not exists aquaman_private;
revoke all on schema aquaman_private from public;
grant usage on schema aquaman_private to anon, authenticated;

create table aquaman_private.moderators (
 user_id uuid primary key references auth.users(id) on delete cascade
);
create table aquaman_private.reports (
 id text primary key default ('AQ-' || replace(gen_random_uuid()::text,'-','')),
 request_key uuid not null unique,
 payload jsonb not null,
 status text not null default 'pending' check(status in ('pending','published','rejected','follow-up')),
 created timestamptz not null default now(),
 reviewed timestamptz,
 reason text
);
create table aquaman_private.review_events (
 id bigint generated always as identity primary key,
 report_id text not null references aquaman_private.reports(id),
 decision text not null,
 note text not null,
 reviewer uuid not null references auth.users(id),
 at timestamptz not null default now()
);
create index aquaman_reports_status_created on aquaman_private.reports(status,created);
alter table aquaman_private.moderators enable row level security;
alter table aquaman_private.reports enable row level security;
alter table aquaman_private.review_events enable row level security;
revoke all on all tables in schema aquaman_private from public,anon,authenticated;
revoke all on all sequences in schema aquaman_private from public,anon,authenticated;

-- Privileged implementations are in a non-exposed schema. Exposed wrappers below
-- are security invoker and can only call these narrowly scoped operations.
create function aquaman_private.require_staff() returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from aquaman_private.moderators where user_id=auth.uid()) then
  raise exception 'Moderator authorization required' using errcode='42501';
 end if;
end; $$;

create function aquaman_private.published() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(r.payload || jsonb_build_object('id',r.id,'created',r.created,'reviewed',r.reviewed) order by r.reviewed,r.id),'[]'::jsonb)
 from aquaman_private.reports r where r.status='published';
$$;

create function aquaman_private.submit(p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_id text; v_key uuid; v_date date; v jsonb; v_point bigint;
begin
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>12000 then
  raise exception 'Invalid report payload';
 end if;
 if coalesce(p_payload->>'kind','') not in ('add','update')
 or coalesce(p_payload->>'status','') not in ('Working','Not working','Intermittent','Unknown')
 or coalesce(p_payload->>'type','') not in ('Borehole','Well','Public tap','Other','Unknown')
 or coalesce(length(btrim(p_payload->>'name')),0) not between 1 and 120
 or coalesce(length(btrim(p_payload->>'area')),0) not between 1 and 100
 or coalesce(length(btrim(p_payload->>'landmark')),0) not between 1 and 300
 or jsonb_typeof(p_payload->'name') is distinct from 'string'
 or jsonb_typeof(p_payload->'area') is distinct from 'string'
 or jsonb_typeof(p_payload->'landmark') is distinct from 'string'
 or jsonb_typeof(p_payload->'description') is distinct from 'string'
 or length(p_payload->>'description')>2000
 or coalesce(p_payload->>'observed','') !~ '^\d{4}-\d{2}-\d{2}$' then
  raise exception 'Please check the required report fields';
 end if;
 v_key:=(p_payload->>'requestKey')::uuid;
 if v_key is null then raise exception 'Request reference required'; end if;
 v_date:=(p_payload->>'observed')::date;
 -- Date-only observations can be one calendar day ahead of UTC near midnight.
 if v_date>current_date+1 then raise exception 'Observation date is in the future'; end if;
 if p_payload->>'kind'='update' then
  v_point:=(p_payload->>'pointId')::bigint;
  if v_point is null or v_point<1 or v_point>9007199254740991 then raise exception 'Invalid water point reference'; end if;
  -- IDs 1..4 are the explicitly fictional frontend seed points. Newly added
  -- points use the same deterministic numeric ID derivation as the prototype.
  if v_point not between 1 and 4 and not exists (
   select 1 from aquaman_private.reports r where r.status='published' and r.payload->>'kind'='add'
   and (('x'||substr(r.id,4,10))::bit(40)::bigint+100)=v_point
  ) then raise exception 'Water point not found'; end if;
 end if;
 v:=jsonb_build_object('kind',p_payload->>'kind','pointId',v_point,'name',btrim(p_payload->>'name'),
 'area',btrim(p_payload->>'area'),'landmark',btrim(p_payload->>'landmark'),'type',p_payload->>'type',
 'status',p_payload->>'status','observed',v_date::text,'description',btrim(p_payload->>'description'));
 -- A retry can only retrieve the same receipt for the same payload.
 perform pg_advisory_xact_lock(81726028);
 select id into v_id from aquaman_private.reports where request_key=v_key and payload=v;
 if v_id is not null then return jsonb_build_object('id',v_id); end if;
 if exists(select 1 from aquaman_private.reports where request_key=v_key) then raise exception 'Request reference already used for different content'; end if;
 -- Pilot-wide circuit breaker, not a substitute for per-client anti-abuse.
 if (select count(*) from aquaman_private.reports where created>now()-interval '1 minute')>=100 then
  raise exception 'Submission limit reached. Please try again later';
 end if;
 insert into aquaman_private.reports(request_key,payload) values(v_key,v) returning id into v_id;
 return jsonb_build_object('id',v_id);
end; $$;

create function aquaman_private.report_status(p_id text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v jsonb;
begin
 select jsonb_build_object('id',id,'status',status,'created',created,'reviewed',reviewed) into v
 from aquaman_private.reports where id=p_id;
 if v is null then raise exception 'Report not found. Check the reference'; end if;
 return v;
end; $$;

create function aquaman_private.staff_session() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin perform aquaman_private.require_staff();return jsonb_build_object('ok',true);end; $$;

create function aquaman_private.queue() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v jsonb;
begin
 perform aquaman_private.require_staff();
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'payload',payload,'status',status,'created',created,'reviewed',reviewed,'reason',reason) order by created desc),'[]'::jsonb) into v from aquaman_private.reports;
 return v;
end; $$;

create function aquaman_private.review(p_id text,p_decision text,p_note text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 perform aquaman_private.require_staff();
 if p_decision is null or p_decision not in ('published','rejected','follow-up') or coalesce(length(btrim(p_note)),0) not between 1 and 1000 then
  raise exception 'Choose a review decision and supply a note';
 end if;
 update aquaman_private.reports set status=p_decision,reviewed=now(),reason=btrim(p_note)
 where id=p_id and status in ('pending','follow-up');
 if not found then raise exception 'Report already reviewed or not found'; end if;
 insert into aquaman_private.review_events(report_id,decision,note,reviewer) values(p_id,p_decision,btrim(p_note),auth.uid());
 return jsonb_build_object('ok',true);
end; $$;

create function public.aquaman_published() returns jsonb language sql stable security invoker set search_path='' as $$select aquaman_private.published()$$;
create function public.aquaman_submit(p_payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select aquaman_private.submit(p_payload)$$;
create function public.aquaman_status(p_id text) returns jsonb language sql stable security invoker set search_path='' as $$select aquaman_private.report_status(p_id)$$;
create function public.aquaman_staff_session() returns jsonb language sql stable security invoker set search_path='' as $$select aquaman_private.staff_session()$$;
create function public.aquaman_queue() returns jsonb language sql stable security invoker set search_path='' as $$select aquaman_private.queue()$$;
create function public.aquaman_review(p_id text,p_decision text,p_note text) returns jsonb language sql security invoker set search_path='' as $$select aquaman_private.review(p_id,p_decision,p_note)$$;

revoke all on all functions in schema aquaman_private from public,anon,authenticated;
revoke all on function public.aquaman_published(),public.aquaman_submit(jsonb),public.aquaman_status(text),public.aquaman_staff_session(),public.aquaman_queue(),public.aquaman_review(text,text,text) from public,anon,authenticated;
grant execute on function aquaman_private.published(),aquaman_private.submit(jsonb),aquaman_private.report_status(text) to anon,authenticated;
grant execute on function public.aquaman_published(),public.aquaman_submit(jsonb),public.aquaman_status(text) to anon,authenticated;
grant execute on function aquaman_private.staff_session(),aquaman_private.queue(),aquaman_private.review(text,text,text) to authenticated;
grant execute on function public.aquaman_staff_session(),public.aquaman_queue(),public.aquaman_review(text,text,text) to authenticated;
notify pgrst,'reload schema';
commit;

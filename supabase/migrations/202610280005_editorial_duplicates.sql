begin;
alter table aquaman_private.reports drop constraint reports_status_check;
alter table aquaman_private.reports add constraint reports_status_check check(status in ('pending','published','rejected','follow-up','retracted'));
create table aquaman_private.point_merges(
 source_id bigint primary key,target_id bigint not null,report_id text not null references aquaman_private.reports(id),
 reviewer uuid not null references auth.users(id),note text not null,at timestamptz not null default now(),check(source_id<>target_id)
);
create table aquaman_private.editorial_events(
 id bigint generated always as identity primary key,report_id text not null references aquaman_private.reports(id),
 action text not null,note text not null,previous_payload jsonb not null,reviewer uuid not null references auth.users(id),at timestamptz not null default now()
);
alter table aquaman_private.point_merges enable row level security;
alter table aquaman_private.editorial_events enable row level security;
revoke all on aquaman_private.point_merges,aquaman_private.editorial_events from public,anon,authenticated;

create function aquaman_private.resolve_point(p_id bigint) returns bigint
language plpgsql stable security definer set search_path='' as $$
declare v bigint:=p_id;n bigint;i integer;
begin
 for i in 1..64 loop select target_id into n from aquaman_private.point_merges where source_id=v;
 if not found then return v;end if;v:=n;end loop;
 raise exception 'Point merge chain is invalid';
end; $$;
create function aquaman_private.point_exists(p_id bigint) returns boolean
language sql stable security definer set search_path='' as $$
 select p_id between 1 and 4 or exists(select 1 from aquaman_private.reports r where r.status='published' and r.payload->>'kind'='add' and (('x'||substr(r.id,4,10))::bit(40)::bigint+100)=p_id);
$$;

create or replace function aquaman_private.published() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(
 r.payload || case when m.source_id is not null then jsonb_build_object('kind','update','pointId',aquaman_private.resolve_point(m.target_id),'mergedFrom',m.source_id)
 when r.payload->>'kind'='update' then jsonb_build_object('pointId',aquaman_private.resolve_point((r.payload->>'pointId')::bigint)) else '{}'::jsonb end
 || jsonb_build_object('id',r.id,'reference',r.reference,'created',r.created,'reviewed',r.reviewed,
 'editorial',coalesce((select jsonb_agg(jsonb_build_object('action',e.action,'note',e.note,'at',e.at) order by e.at,e.id) from aquaman_private.editorial_events e where e.report_id=r.id),'[]'::jsonb)) order by r.reviewed,r.id),'[]'::jsonb)
 from aquaman_private.reports r left join aquaman_private.point_merges m on m.report_id=r.id
 where r.status='published' and
 (case when m.source_id is not null then aquaman_private.point_exists(aquaman_private.resolve_point(m.target_id))
 when r.payload->>'kind'='update' then aquaman_private.point_exists(aquaman_private.resolve_point((r.payload->>'pointId')::bigint)) else true end);
$$;

create function aquaman_private.merge_report(p_id text,p_target bigint,p_note text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r aquaman_private.reports;source bigint;target bigint;
begin
 perform aquaman_private.require_staff();perform pg_advisory_xact_lock(81726029);
 if coalesce(length(btrim(p_note)),0) not between 1 and 1000 then raise exception 'Explain why these records are the same water point';end if;
 select * into r from aquaman_private.reports where id=p_id for update;
 if not found or r.payload->>'kind'<>'add' or r.status not in ('pending','follow-up','published') then raise exception 'Only a new-point report can be merged';end if;
 source:=(('x'||substr(r.id,4,10))::bit(40)::bigint+100);target:=aquaman_private.resolve_point(p_target);
 if target is null or target=source or not aquaman_private.point_exists(target) then raise exception 'Choose a different existing water point';end if;
 if exists(select 1 from aquaman_private.point_merges where source_id=source) then raise exception 'This point has already been merged';end if;
 insert into aquaman_private.point_merges(source_id,target_id,report_id,reviewer,note) values(source,target,p_id,auth.uid(),btrim(p_note));
 insert into aquaman_private.editorial_events(report_id,action,note,previous_payload,reviewer) values(p_id,'merged',btrim(p_note),r.payload,auth.uid());
 update aquaman_private.reports set status='published',reviewed=now(),reason=btrim(p_note) where id=p_id;
 return jsonb_build_object('ok',true,'target',target);
end; $$;

create function aquaman_private.edit_report(p_id text,p_action text,p_patch jsonb,p_note text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r aquaman_private.reports;v jsonb;
begin
 perform aquaman_private.require_staff();perform pg_advisory_xact_lock(81726029);
 if coalesce(length(btrim(p_note)),0) not between 1 and 1000 then raise exception 'A public correction/retraction explanation is required';end if;
 select * into r from aquaman_private.reports where id=p_id for update;
 if not found then raise exception 'Report not found';end if;
 if p_action='restore' then
  if r.status<>'retracted' then raise exception 'Only a retracted report can be restored';end if;
  update aquaman_private.reports set status='published',reviewed=now(),reason=btrim(p_note) where id=p_id;
 elsif p_action='retract' then
  if r.status<>'published' then raise exception 'Only a published report can be retracted';end if;
  update aquaman_private.reports set status='retracted',reviewed=now(),reason=btrim(p_note) where id=p_id;
 elsif p_action='correct' then
  if r.status<>'published' then raise exception 'Only a published report can be corrected';end if;
  if jsonb_typeof(p_patch) is distinct from 'object' or exists(select 1 from jsonb_object_keys(p_patch) k where k not in ('name','landmark','description')) then raise exception 'Only name, landmark and description can be corrected here';end if;
  v:=r.payload||p_patch;
  if jsonb_typeof(v->'name') is distinct from 'string' or jsonb_typeof(v->'landmark') is distinct from 'string' or jsonb_typeof(v->'description') is distinct from 'string'
  or coalesce(length(btrim(v->>'name')),0) not between 1 and 120 or coalesce(length(btrim(v->>'landmark')),0) not between 1 and 300 or length(v->>'description')>2000 then raise exception 'Invalid correction text';end if;
  update aquaman_private.reports set payload=v,reviewed=now(),reason=btrim(p_note) where id=p_id;
 else raise exception 'Unknown editorial action';end if;
 insert into aquaman_private.editorial_events(report_id,action,note,previous_payload,reviewer) values(p_id,p_action,btrim(p_note),r.payload,auth.uid());
 return jsonb_build_object('ok',true);
end; $$;

create function aquaman_private.editorial_log(p_point bigint) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('reference',r.reference,'action',e.action,'note',e.note,'at',e.at) order by e.at,e.id),'[]'::jsonb)
 from aquaman_private.editorial_events e join aquaman_private.reports r on r.id=e.report_id
 where aquaman_private.resolve_point(case when r.payload->>'kind'='add' then (('x'||substr(r.id,4,10))::bit(40)::bigint+100) else (r.payload->>'pointId')::bigint end)=aquaman_private.resolve_point(p_point);
$$;

create or replace function aquaman_private.can_read_photo(p_name text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from aquaman_private.moderators where user_id=auth.uid())
 or exists(select 1 from jsonb_array_elements(aquaman_private.published()) r where r->>'photoPath'=p_name or replace(r->>'photoPath','photo.jpg','thumb.jpg')=p_name);
$$;

create or replace function aquaman_private.queue() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v jsonb;
begin
 perform aquaman_private.require_staff();
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'reference',r.reference,'payload',r.payload,'status',r.status,'created',r.created,'reviewed',r.reviewed,'reason',r.reason,'mergedInto',m.target_id,
 'edits',coalesce((select jsonb_agg(jsonb_build_object('action',e.action,'note',e.note,'at',e.at,'previousPayload',e.previous_payload) order by e.at,e.id) from aquaman_private.editorial_events e where e.report_id=r.id),'[]'::jsonb)) order by r.created desc),'[]'::jsonb) into v
 from aquaman_private.reports r left join aquaman_private.point_merges m on m.report_id=r.id;
 return v;
end; $$;

create function aquaman_private.unmerge_report(p_id text,p_note text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare m aquaman_private.point_merges;payload jsonb;
begin
 perform aquaman_private.require_staff();perform pg_advisory_xact_lock(81726029);
 if coalesce(length(btrim(p_note)),0) not between 1 and 1000 then raise exception 'Explain why this merge is being undone';end if;
 select * into m from aquaman_private.point_merges where report_id=p_id for update;
 if not found then raise exception 'This point is not merged';end if;
 select r.payload into payload from aquaman_private.reports r where r.id=p_id;
 insert into aquaman_private.editorial_events(report_id,action,note,previous_payload,reviewer) values(p_id,'unmerged',btrim(p_note),payload||jsonb_build_object('previousMergeTarget',m.target_id),auth.uid());
 delete from aquaman_private.point_merges where source_id=m.source_id;
 return jsonb_build_object('ok',true);
end; $$;
create function public.aquaman_unmerge(p_id text,p_note text) returns jsonb language sql security invoker set search_path='' as $$select aquaman_private.unmerge_report(p_id,p_note)$$;
revoke all on function aquaman_private.unmerge_report(text,text),public.aquaman_unmerge(text,text) from public,anon,authenticated;
grant execute on function aquaman_private.unmerge_report(text,text),public.aquaman_unmerge(text,text) to authenticated;

create function public.aquaman_merge(p_id text,p_target bigint,p_note text) returns jsonb language sql security invoker set search_path='' as $$select aquaman_private.merge_report(p_id,p_target,p_note)$$;
create function public.aquaman_edit(p_id text,p_action text,p_patch jsonb,p_note text) returns jsonb language sql security invoker set search_path='' as $$select aquaman_private.edit_report(p_id,p_action,p_patch,p_note)$$;
create function public.aquaman_editorial_log(p_point bigint) returns jsonb language sql stable security invoker set search_path='' as $$select aquaman_private.editorial_log(p_point)$$;
revoke all on function aquaman_private.resolve_point(bigint),aquaman_private.point_exists(bigint),aquaman_private.merge_report(text,bigint,text),aquaman_private.edit_report(text,text,jsonb,text),aquaman_private.editorial_log(bigint) from public,anon,authenticated;
revoke all on function public.aquaman_merge(text,bigint,text),public.aquaman_edit(text,text,jsonb,text),public.aquaman_editorial_log(bigint) from public,anon,authenticated;
grant execute on function aquaman_private.merge_report(text,bigint,text),aquaman_private.edit_report(text,text,jsonb,text),public.aquaman_merge(text,bigint,text),public.aquaman_edit(text,text,jsonb,text) to authenticated;
grant execute on function aquaman_private.editorial_log(bigint),public.aquaman_editorial_log(bigint) to anon,authenticated;
notify pgrst,'reload schema';
commit;

-- Keep initial observation publication order stable across editorial actions.
begin;
create or replace function aquaman_private.merge_report(p_id text,p_target bigint,p_note text) returns jsonb
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
 update aquaman_private.reports set status='published',reviewed=coalesce(reviewed,now()),reason=btrim(p_note) where id=p_id;
 return jsonb_build_object('ok',true,'target',target);
end; $$;

create or replace function aquaman_private.edit_report(p_id text,p_action text,p_patch jsonb,p_note text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r aquaman_private.reports;v jsonb;
begin
 perform aquaman_private.require_staff();perform pg_advisory_xact_lock(81726029);
 if coalesce(length(btrim(p_note)),0) not between 1 and 1000 then raise exception 'A public correction/retraction explanation is required';end if;
 select * into r from aquaman_private.reports where id=p_id for update;
 if not found then raise exception 'Report not found';end if;
 if p_action='restore' then
  if r.status<>'retracted' then raise exception 'Only a retracted report can be restored';end if;
  update aquaman_private.reports set status='published',reason=btrim(p_note) where id=p_id;
 elsif p_action='retract' then
  if r.status<>'published' then raise exception 'Only a published report can be retracted';end if;
  update aquaman_private.reports set status='retracted',reason=btrim(p_note) where id=p_id;
 elsif p_action='correct' then
  if r.status<>'published' then raise exception 'Only a published report can be corrected';end if;
  if jsonb_typeof(p_patch) is distinct from 'object' or exists(select 1 from jsonb_object_keys(p_patch) k where k not in ('name','landmark','description')) then raise exception 'Only name, landmark and description can be corrected here';end if;
  v:=r.payload||p_patch;
  if jsonb_typeof(v->'name') is distinct from 'string' or jsonb_typeof(v->'landmark') is distinct from 'string' or jsonb_typeof(v->'description') is distinct from 'string'
  or coalesce(length(btrim(v->>'name')),0) not between 1 and 120 or coalesce(length(btrim(v->>'landmark')),0) not between 1 and 300 or length(v->>'description')>2000 then raise exception 'Invalid correction text';end if;
  update aquaman_private.reports set payload=v,reason=btrim(p_note) where id=p_id;
 else raise exception 'Unknown editorial action';end if;
 insert into aquaman_private.editorial_events(report_id,action,note,previous_payload,reviewer) values(p_id,p_action,btrim(p_note),r.payload,auth.uid());
 return jsonb_build_object('ok',true);
end; $$;


create or replace function aquaman_private.unmerge_report(p_id text,p_note text) returns jsonb
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
 update aquaman_private.reports set reason=btrim(p_note) where id=p_id;
 return jsonb_build_object('ok',true);
end; $$;

commit;

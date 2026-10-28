begin;
-- Remove the retired demonstration dataset, including its dependent audit records.
create temporary table retired_reports on commit drop as
 select id from aquaman_private.reports where coalesce(payload->>'dataset','demo')='demo';
delete from aquaman_private.point_merges where report_id in(select id from retired_reports);
delete from aquaman_private.editorial_events where report_id in(select id from retired_reports);
delete from aquaman_private.review_events where report_id in(select id from retired_reports);
delete from aquaman_private.reports where id in(select id from retired_reports);
create or replace function aquaman_private.point_exists(p_id bigint) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from aquaman_private.provider_points where id=p_id)
 or exists(select 1 from aquaman_private.reports r where r.status='published' and r.payload->>'kind'='add' and (('x'||substr(r.id,4,10))::bit(40)::bigint+100)=p_id);
$$;

create or replace function aquaman_private.submit(p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_id text; v_key uuid; v_date date; v jsonb; v_point bigint; v_coords jsonb; v_photo text;
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
  -- Only imported or published community points can receive updates.
  if not exists(select 1 from aquaman_private.provider_points where id=v_point) and not exists (
   select 1 from aquaman_private.reports r where r.status='published' and r.payload->>'kind'='add'
   and (('x'||substr(r.id,4,10))::bit(40)::bigint+100)=v_point
  ) then raise exception 'Water point not found'; end if;
 end if;
 v_coords:=p_payload->'coords';
 if v_coords is not null and v_coords<>'null'::jsonb then
  if jsonb_typeof(v_coords)<>'array' then raise exception 'Coordinates must be a pair'; end if;
  if jsonb_array_length(v_coords)<>2 or jsonb_typeof(v_coords->0)<>'number' or jsonb_typeof(v_coords->1)<>'number' then raise exception 'Invalid coordinates'; end if;
  if (v_coords->>0)::numeric not between -90 and 90 or (v_coords->>1)::numeric not between -180 and 180 then raise exception 'Coordinates out of range'; end if;
  if p_payload->>'locationConsent' is distinct from 'true' then raise exception 'Confirm permission to publish the water point position'; end if;
 end if;
 v_photo:=nullif(p_payload->>'photoPath','');
 if v_photo is not null then
  if v_photo !~ '^[0-9a-f-]{36}/photo\.jpg$' then raise exception 'Invalid photo reference'; end if;
  if p_payload->>'photoConsent' is distinct from 'true' then raise exception 'Photo publication permission required'; end if;
  if not exists(select 1 from storage.objects where bucket_id='aquaman-photos' and name=v_photo)
  or not exists(select 1 from storage.objects where bucket_id='aquaman-photos' and name=replace(v_photo,'photo.jpg','thumb.jpg')) then raise exception 'Photo upload is incomplete'; end if;
 end if;
 v:=jsonb_build_object('kind',p_payload->>'kind','pointId',v_point,'name',btrim(p_payload->>'name'),
 'area',btrim(p_payload->>'area'),'landmark',btrim(p_payload->>'landmark'),'type',p_payload->>'type',
 'status',p_payload->>'status','observed',v_date::text,'description',btrim(p_payload->>'description'));
 if v_coords is not null and v_coords<>'null'::jsonb then v:=v||jsonb_build_object('coords',v_coords); end if;
 if v_photo is not null then v:=v||jsonb_build_object('photoPath',v_photo); end if;
 if coalesce(p_payload->>'dataset','community') <> 'community' then raise exception 'Invalid contribution dataset'; end if;
 v:=v||jsonb_build_object('dataset','community');
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



notify pgrst,'reload schema';
commit;

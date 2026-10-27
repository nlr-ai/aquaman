begin;
create function aquaman_private.new_report_reference() returns text
language plpgsql volatile set search_path='' as $$
declare raw text:=''; alphabet text:='23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; seed bytea; i integer;
begin
 seed:=decode(md5(gen_random_uuid()::text),'hex');
 for i in 0..11 loop raw:=raw||substr(alphabet,1+(get_byte(seed,i)&31),1);end loop;
 return 'AQ-'||substr(raw,1,4)||'-'||substr(raw,5,4)||'-'||substr(raw,9,4);
end; $$;
revoke all on function aquaman_private.new_report_reference() from public,anon,authenticated;
alter table aquaman_private.reports add column reference text not null default aquaman_private.new_report_reference();
alter table aquaman_private.reports add constraint aquaman_report_reference_unique unique(reference);

create function aquaman_private.submit_with_reference(p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare receipt jsonb;
begin
 receipt:=aquaman_private.submit(p_payload);
 return receipt||jsonb_build_object('reference',(select reference from aquaman_private.reports where id=receipt->>'id'));
end; $$;
create or replace function public.aquaman_submit(p_payload jsonb) returns jsonb
language sql security invoker set search_path='' as $$select aquaman_private.submit_with_reference(p_payload)$$;
revoke all on function aquaman_private.submit_with_reference(jsonb) from public,anon,authenticated;
grant execute on function aquaman_private.submit_with_reference(jsonb) to anon,authenticated;

create or replace function aquaman_private.report_status(p_id text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v jsonb;
begin
 select jsonb_build_object('id',id,'reference',reference,'status',status,'created',created,'reviewed',reviewed) into v
 from aquaman_private.reports where id=p_id or regexp_replace(reference,'[^A-Z0-9]','','g')=regexp_replace(upper(p_id),'[^A-Z0-9]','','g');
 if v is null then raise exception 'Report not found. Check the reference'; end if;
 return v;
end; $$;
create or replace function aquaman_private.queue() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v jsonb;
begin
 perform aquaman_private.require_staff();
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'reference',reference,'payload',payload,'status',status,'created',created,'reviewed',reviewed,'reason',reason) order by created desc),'[]'::jsonb) into v from aquaman_private.reports;
 return v;
end; $$;
notify pgrst,'reload schema';
commit;

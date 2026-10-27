-- A conservative global storage circuit breaker for the public pilot.
begin;
create function aquaman_private.photo_budget_available() returns boolean
language sql stable security definer set search_path='' as $$
 select count(*)<1000 from storage.objects where bucket_id='aquaman-photos';
$$;
revoke all on function aquaman_private.photo_budget_available() from public,anon,authenticated;
grant execute on function aquaman_private.photo_budget_available() to anon,authenticated;
alter policy aquaman_photo_insert on storage.objects
 with check(bucket_id='aquaman-photos' and name ~ '^[0-9a-f-]{36}/(photo|thumb)\.jpg$'
 and aquaman_private.photo_budget_available());
commit;

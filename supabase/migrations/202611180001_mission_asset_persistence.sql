-- Keep the Storage and Media Library contracts aligned. The student app and
-- portal consume durable public URLs for approved educational media.
update storage.buckets
set public = true
where id = 'mission-assets';

alter table public.mission_assets
  add column if not exists storage_bucket text not null default 'mission-assets',
  add column if not exists storage_path text;

-- Backfill the exact storage object path for existing public asset URLs so an
-- authorized delete removes both the library record and its stored object.
update public.mission_assets
set storage_path = split_part(
  split_part(cdn_url, '/storage/v1/object/public/mission-assets/', 2),
  '?',
  1
)
where storage_path is null
  and cdn_url like '%/storage/v1/object/public/mission-assets/%';

create index if not exists mission_assets_storage_path_idx
  on public.mission_assets (storage_bucket, storage_path)
  where storage_path is not null;

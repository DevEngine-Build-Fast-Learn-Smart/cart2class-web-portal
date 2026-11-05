-- Global product identity remains in products. Store-specific commercial details
-- belong here so one store cannot alter another store's price or availability.
create table public.store_product_listings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  description text,
  brand text,
  sku text,
  price numeric(10,2) check (price is null or price >= 0),
  currency char(3) not null default 'USD',
  package_size text,
  image_path text,
  is_available boolean not null default true,
  is_archived boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, product_id)
);
create index store_product_listings_store_active_idx on public.store_product_listings(store_id, is_archived, is_available, updated_at desc);
create trigger store_product_listings_touch before update on public.store_product_listings for each row execute function public.touch_updated_at();
alter table public.store_product_listings enable row level security;
create policy "store users view own product listings" on public.store_product_listings for select using (exists(select 1 from public.store_memberships sm where sm.store_id=store_product_listings.store_id and sm.user_id=auth.uid() and sm.is_active));
create policy "admins manage all product listings" on public.store_product_listings for all using (public.has_role('admin')) with check (public.has_role('admin'));
grant select on public.store_product_listings to authenticated;

create or replace function public.my_store_product_listings()
returns table(listing_id uuid, store_id uuid, product_id uuid, name text, barcode text, barcode_symbology text, category text, description text, brand text, sku text, price numeric, currency char(3), package_size text, weight_text text, image_path text, is_available boolean, is_archived boolean, updated_at timestamptz)
language sql stable security definer set search_path = public set row_security = off as $$
  select spl.id,spl.store_id,p.id,p.name,p.barcode,p.barcode_symbology,p.category,spl.description,spl.brand,spl.sku,spl.price,spl.currency,spl.package_size,p.weight_text,spl.image_path,spl.is_available,spl.is_archived,spl.updated_at
  from public.store_product_listings spl join public.products p on p.id=spl.product_id
  where exists(select 1 from public.store_memberships sm where sm.store_id=spl.store_id and sm.user_id=auth.uid() and sm.is_active)
  order by spl.updated_at desc
$$;

create or replace function public.save_store_product_listing(p_store_id uuid, p_listing_id uuid default null, p_name text default null, p_barcode text default null, p_category text default null, p_description text default null, p_brand text default null, p_sku text default null, p_price numeric default null, p_currency text default 'USD', p_package_size text default null, p_weight_text text default null, p_image_path text default null, p_is_available boolean default true)
returns uuid
language plpgsql security definer set search_path = public set row_security = off as $$
declare v_product_id uuid; v_listing_id uuid; v_barcode text;
begin
  if not exists(select 1 from public.store_memberships where store_id=p_store_id and user_id=auth.uid() and is_active) then raise exception 'not authorized to manage this store product'; end if;
  if p_listing_id is not null and not exists(select 1 from public.store_product_listings where id=p_listing_id and store_id=p_store_id) then raise exception 'Product listing not found'; end if;
  if p_name is null or char_length(trim(p_name)) < 2 then raise exception 'A product name is required'; end if;
  if p_price is not null and p_price < 0 then raise exception 'Price cannot be negative'; end if;
  if p_currency is null or p_currency !~ '^[A-Za-z]{3}$' then raise exception 'Currency must be a three-letter code'; end if;
  v_barcode := nullif(trim(coalesce(p_barcode,'')), '');
  if v_barcode is not null then select id into v_product_id from public.products where barcode=v_barcode; end if;
  if v_product_id is null then
    insert into public.products(barcode,name,category,weight_text,data_source,source_checked_at) values(v_barcode,trim(p_name),nullif(trim(coalesce(p_category,'')),''),nullif(trim(coalesce(p_weight_text,'')),''),'store_partner',now()) returning id into v_product_id;
    if v_barcode is not null then insert into public.product_barcodes(barcode,product_id) values(v_barcode,v_product_id) on conflict(barcode) do nothing; end if;
  end if;
  if p_listing_id is null then
    insert into public.store_product_listings(store_id,product_id,description,brand,sku,price,currency,package_size,image_path,is_available,created_by)
    values(p_store_id,v_product_id,nullif(trim(coalesce(p_description,'')),''),nullif(trim(coalesce(p_brand,'')),''),nullif(trim(coalesce(p_sku,'')),''),p_price,upper(p_currency),nullif(trim(coalesce(p_package_size,'')),''),nullif(trim(coalesce(p_image_path,'')),''),coalesce(p_is_available,true),auth.uid())
    on conflict(store_id,product_id) do update set description=excluded.description,brand=excluded.brand,sku=excluded.sku,price=excluded.price,currency=excluded.currency,package_size=excluded.package_size,image_path=excluded.image_path,is_available=excluded.is_available,is_archived=false,updated_at=now()
    returning id into v_listing_id;
  else
    update public.store_product_listings set product_id=v_product_id,description=nullif(trim(coalesce(p_description,'')),''),brand=nullif(trim(coalesce(p_brand,'')),''),sku=nullif(trim(coalesce(p_sku,'')),''),price=p_price,currency=upper(p_currency),package_size=nullif(trim(coalesce(p_package_size,'')),''),image_path=nullif(trim(coalesce(p_image_path,'')),''),is_available=coalesce(p_is_available,true),updated_at=now() where id=p_listing_id and store_id=p_store_id returning id into v_listing_id;
  end if;
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,metadata) select s.organization_id,auth.uid(),'store_product.saved','store_product_listing',v_listing_id,jsonb_build_object('store_id',p_store_id,'product_id',v_product_id) from public.stores s where s.id=p_store_id;
  return v_listing_id;
end $$;

create or replace function public.archive_store_product_listing(p_listing_id uuid)
returns void
language plpgsql security definer set search_path = public set row_security = off as $$
declare v_store_id uuid;
begin
  select store_id into v_store_id from public.store_product_listings where id=p_listing_id;
  if v_store_id is null or not exists(select 1 from public.store_memberships where store_id=v_store_id and user_id=auth.uid() and is_active) then raise exception 'not authorized to archive this product listing'; end if;
  update public.store_product_listings set is_archived=true,is_available=false,updated_at=now() where id=p_listing_id;
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id) select s.organization_id,auth.uid(),'store_product.archived','store_product_listing',p_listing_id from public.stores s where s.id=v_store_id;
end $$;
grant execute on function public.my_store_product_listings(), public.save_store_product_listing(uuid,uuid,text,text,text,text,text,text,numeric,text,text,text,text,boolean), public.archive_store_product_listing(uuid) to authenticated;

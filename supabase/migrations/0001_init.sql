-- HOLASKEY v1 schema
-- All money is stored as integer kobo (₦1 = 100 kobo).
-- Every table has id uuid, created_at, updated_at.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles and roles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  email text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin');
$$;

-- Create a profile for every new auth user (email sign-up passes full_name/phone as metadata).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.email, '')
  )
  on conflict (user_id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Customer data
-- ---------------------------------------------------------------------------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  recipient text not null,
  phone text not null,
  state text not null,
  city text not null,
  street text not null,
  landmark text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.addresses (user_id);
create unique index addresses_one_default on public.addresses (user_id) where is_default;

create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  chest numeric(5,1),
  waist numeric(5,1),
  hips numeric(5,1),
  shoulder numeric(5,1),
  sleeve numeric(5,1),
  length numeric(5,1),
  inseam numeric(5,1),
  shoe_size text,
  shoe_system text check (shoe_system in ('EU', 'UK')),
  foot_length_cm numeric(4,1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('clothing', 'shoes')),
  name text not null,
  slug text not null unique,
  image_path text,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category_id uuid references public.categories(id) on delete set null,
  price bigint not null check (price >= 0),
  compare_at_price bigint check (compare_at_price is null or compare_at_price >= 0),
  description text not null default '',
  care text not null default '',
  is_featured boolean not null default false,
  is_new boolean not null default false,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.products (category_id);
create index on public.products (status, created_at desc);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  path text not null,
  alt text not null default '',
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.product_images (product_id, sort);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  colour text not null,
  colour_hex text,
  stock int not null default 0 check (stock >= 0),
  sku text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size, colour)
);
create index on public.product_variants (product_id);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  qty int not null check (qty > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, variant_id)
);

create table public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create sequence public.order_number_seq;
create sequence public.custom_number_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  number text not null unique default ('HLK-' || lpad(nextval('public.order_number_seq')::text, 4, '0')),
  status text not null default 'pending_payment' check (status in (
    'pending_payment', 'paid', 'paid_out_of_stock', 'processing', 'shipped', 'delivered', 'expired', 'cancelled')),
  subtotal bigint not null,
  delivery_fee bigint not null,
  total bigint not null,
  address jsonb not null,
  email text not null default '',
  paystack_ref text unique,
  paid_at timestamptz,
  tracking_note text,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders (user_id, created_at desc);
create index on public.orders (status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  title text not null,
  size text not null,
  colour text not null,
  image_path text,
  unit_price bigint not null,
  qty int not null check (qty > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Custom orders
-- ---------------------------------------------------------------------------
create table public.custom_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  number text not null unique default ('HLK-C-' || lpad(nextval('public.custom_number_seq')::text, 4, '0')),
  kind text not null check (kind in ('clothing', 'shoes')),
  item_type text not null,
  description text not null check (char_length(description) <= 1000),
  colour_material text not null default '',
  measurements jsonb not null default '{}'::jsonb,
  product_id uuid references public.products(id) on delete set null,
  budget_min bigint,
  budget_max bigint,
  needed_by date,
  status text not null default 'submitted' check (status in (
    'submitted', 'needs_info', 'quoted', 'declined', 'expired', 'paid',
    'in_production', 'ready', 'shipped', 'delivered', 'cancelled')),
  quote_amount bigint,
  quote_delivery bigint,
  quote_days int,
  quote_note text,
  quote_expires_at timestamptz,
  quote_reminder_sent boolean not null default false,
  cancel_reason text,
  paystack_ref text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.custom_requests (user_id, created_at desc);
create index on public.custom_requests (status);

create table public.custom_request_images (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.custom_requests(id) on delete cascade,
  path text not null,
  note text not null default '',
  kind text not null default 'reference' check (kind in ('reference', 'progress')),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.custom_request_images (request_id);

create table public.custom_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.custom_requests(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  from_admin boolean not null default false,
  body text not null default '',
  image_paths text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.custom_messages (request_id, created_at);

create table public.status_events (
  id uuid primary key default gen_random_uuid(),
  entity text not null check (entity in ('order', 'custom')),
  entity_id uuid not null,
  from_status text,
  to_status text not null,
  note text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.status_events (entity, entity_id, created_at);

-- ---------------------------------------------------------------------------
-- Settings (single row)
-- ---------------------------------------------------------------------------
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  delivery_fee bigint not null default 500000, -- ₦5,000
  quote_expiry_days int not null default 7,
  whatsapp text not null default '',
  instagram text not null default 'https://instagram.com/shopwithholaskey',
  announcement text not null default 'Custom orders now open — send us the look',
  hero_images text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.settings default values;

-- Footer "First to the drop" sign-ups (insert-only for the public, read by admins).
create table public.newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['profiles','addresses','measurements','categories','products','product_images',
    'product_variants','cart_items','wishlist','orders','order_items','custom_requests',
    'custom_request_images','custom_messages','status_events','settings','newsletter_signups']
  loop
    execute format('create trigger %I_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.measurements enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.custom_requests enable row level security;
alter table public.custom_request_images enable row level security;
alter table public.custom_messages enable row level security;
alter table public.status_events enable row level security;
alter table public.settings enable row level security;
alter table public.newsletter_signups enable row level security;
create policy "newsletter public insert" on public.newsletter_signups for insert with check (true);
create policy "newsletter admin read" on public.newsletter_signups for select using (public.is_admin());

-- profiles: read own, admins read all. Customers may only edit name and phone (never role).
create policy "profiles read own" on public.profiles for select using (user_id = auth.uid() or public.is_admin());
create policy "profiles update own" on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "profiles admin update" on public.profiles for update using (public.is_admin());
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone) on public.profiles to authenticated;

-- own-row tables
create policy "addresses own" on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "addresses admin read" on public.addresses for select using (public.is_admin());
create policy "measurements own" on public.measurements for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "measurements admin read" on public.measurements for select using (public.is_admin());
create policy "cart own" on public.cart_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "wishlist own" on public.wishlist for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- catalogue: public read, admin write
create policy "categories public read" on public.categories for select using (true);
create policy "categories admin write" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "products public read" on public.products for select using (status = 'active' or public.is_admin());
create policy "products admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "images public read" on public.product_images for select using (true);
create policy "images admin write" on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy "variants public read" on public.product_variants for select using (true);
create policy "variants admin write" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());
create policy "settings public read" on public.settings for select using (true);
create policy "settings admin write" on public.settings for update using (public.is_admin()) with check (public.is_admin());

-- orders: customers read their own; orders are created by the server (service role); admins manage.
create policy "orders read own" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "orders admin update" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "order items read own" on public.order_items for select using (
  public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- custom requests
create policy "custom read own" on public.custom_requests for select using (user_id = auth.uid() or public.is_admin());
create policy "custom insert own" on public.custom_requests for insert with check (
  user_id = auth.uid() and status = 'submitted' and quote_amount is null and paystack_ref is null and paid_at is null);
create policy "custom admin update" on public.custom_requests for update using (public.is_admin()) with check (public.is_admin());

create policy "custom images read" on public.custom_request_images for select using (
  public.is_admin() or exists (select 1 from public.custom_requests r where r.id = request_id and r.user_id = auth.uid()));
create policy "custom images insert own" on public.custom_request_images for insert with check (
  (kind = 'reference' and uploaded_by = auth.uid()
    and exists (select 1 from public.custom_requests r where r.id = request_id and r.user_id = auth.uid()))
  or public.is_admin());
create policy "custom images admin write" on public.custom_request_images for delete using (public.is_admin());

create policy "messages read" on public.custom_messages for select using (
  public.is_admin() or exists (select 1 from public.custom_requests r where r.id = request_id and r.user_id = auth.uid()));
create policy "messages insert" on public.custom_messages for insert with check (
  sender_id = auth.uid() and (
    (from_admin and public.is_admin())
    or (not from_admin and exists (select 1 from public.custom_requests r where r.id = request_id and r.user_id = auth.uid()))));

create policy "events read" on public.status_events for select using (
  public.is_admin()
  or (entity = 'order' and exists (select 1 from public.orders o where o.id = entity_id and o.user_id = auth.uid()))
  or (entity = 'custom' and exists (select 1 from public.custom_requests r where r.id = entity_id and r.user_id = auth.uid())));
create policy "events admin insert" on public.status_events for insert with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Payment functions (called only by the server with the service role key)
-- ---------------------------------------------------------------------------

-- Marks an order paid after Paystack confirms it. Idempotent. Takes stock only if every
-- line is still available; otherwise the order becomes paid_out_of_stock for the owner to resolve.
create or replace function public.mark_order_paid(p_ref text, p_amount bigint)
returns table (order_id uuid, status text, changed boolean)
language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype;
  short int;
begin
  select * into o from public.orders where paystack_ref = p_ref for update;
  if not found then
    raise exception 'order not found for reference %', p_ref;
  end if;
  if o.status not in ('pending_payment', 'expired') then
    return query select o.id, o.status, false;
    return;
  end if;
  if p_amount <> o.total then
    raise exception 'amount mismatch for %: got %, expected %', p_ref, p_amount, o.total;
  end if;

  -- lock the variants involved, then check stock
  perform 1 from public.product_variants v
    where v.id in (select variant_id from public.order_items where order_items.order_id = o.id)
    for update;

  select count(*) into short
  from public.order_items i
  left join public.product_variants v on v.id = i.variant_id
  where i.order_id = o.id and (v.id is null or v.stock < i.qty);

  if short = 0 then
    update public.product_variants v set stock = v.stock - i.qty
      from public.order_items i where i.order_id = o.id and v.id = i.variant_id;
    update public.orders set status = 'paid', paid_at = now() where id = o.id;
    insert into public.status_events (entity, entity_id, from_status, to_status, note)
      values ('order', o.id, o.status, 'paid', 'Payment confirmed by Paystack');
    delete from public.cart_items c using public.order_items i
      where c.user_id = o.user_id and i.order_id = o.id and c.variant_id = i.variant_id;
    return query select o.id, 'paid'::text, true;
  else
    update public.orders set status = 'paid_out_of_stock', paid_at = now() where id = o.id;
    insert into public.status_events (entity, entity_id, from_status, to_status, note)
      values ('order', o.id, o.status, 'paid_out_of_stock', 'Paid, but an item sold out first. Refund or swap.');
    delete from public.cart_items c using public.order_items i
      where c.user_id = o.user_id and i.order_id = o.id and c.variant_id = i.variant_id;
    return query select o.id, 'paid_out_of_stock'::text, true;
  end if;
end $$;

create or replace function public.mark_custom_paid(p_ref text, p_amount bigint)
returns table (request_id uuid, status text, changed boolean)
language plpgsql security definer set search_path = public as $$
declare
  r public.custom_requests%rowtype;
begin
  select * into r from public.custom_requests where paystack_ref = p_ref for update;
  if not found then
    raise exception 'custom request not found for reference %', p_ref;
  end if;
  if r.status <> 'quoted' then
    return query select r.id, r.status, false;
    return;
  end if;
  if p_amount <> coalesce(r.quote_amount, 0) + coalesce(r.quote_delivery, 0) then
    raise exception 'amount mismatch for %', p_ref;
  end if;
  update public.custom_requests set status = 'paid', paid_at = now() where id = r.id;
  insert into public.status_events (entity, entity_id, from_status, to_status, note)
    values ('custom', r.id, r.status, 'paid', 'Payment confirmed by Paystack');
  return query select r.id, 'paid'::text, true;
end $$;

-- Daily housekeeping: unpaid orders older than 24 h and quotes past their expiry.
create or replace function public.expire_stale() returns void
language plpgsql security definer set search_path = public as $$
begin
  with x as (
    update public.orders set status = 'expired'
    where status = 'pending_payment' and created_at < now() - interval '24 hours'
    returning id
  )
  insert into public.status_events (entity, entity_id, from_status, to_status, note)
    select 'order', id, 'pending_payment', 'expired', 'Unpaid after 24 hours' from x;

  with y as (
    update public.custom_requests set status = 'expired'
    where status = 'quoted' and quote_expires_at < now()
    returning id
  )
  insert into public.status_events (entity, entity_id, from_status, to_status, note)
    select 'custom', id, 'quoted', 'expired', 'Quote expired' from y;
end $$;

revoke all on function public.mark_order_paid(text, bigint) from public, anon, authenticated;
revoke all on function public.mark_custom_paid(text, bigint) from public, anon, authenticated;
revoke all on function public.expire_stale() from public, anon, authenticated;
grant execute on function public.mark_order_paid(text, bigint) to service_role;
grant execute on function public.mark_custom_paid(text, bigint) to service_role;
grant execute on function public.expire_stale() to service_role;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('products', 'products', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif']),
  ('custom-refs', 'custom-refs', false, 8388608, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do nothing;

create policy "products bucket public read" on storage.objects for select using (bucket_id = 'products');
create policy "products bucket admin write" on storage.objects for insert with check (bucket_id = 'products' and public.is_admin());
create policy "products bucket admin update" on storage.objects for update using (bucket_id = 'products' and public.is_admin());
create policy "products bucket admin delete" on storage.objects for delete using (bucket_id = 'products' and public.is_admin());

-- custom-refs: files live under <user_id>/<request_id>/...; only that user and admins.
create policy "refs read own" on storage.objects for select using (
  bucket_id = 'custom-refs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "refs insert own" on storage.objects for insert with check (
  bucket_id = 'custom-refs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "refs delete own" on storage.objects for delete using (
  bucket_id = 'custom-refs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

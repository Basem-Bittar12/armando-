-- ============================================================================
-- معلومات التواصل بالإعدادات + جدول الاستفسارات + دوال حفظ تعمل بعملية واحدة (transaction)
-- ============================================================================

-- ---------- معلومات التواصل: تُعدَّل من اللوحة وتظهر بكل الموقع ----------
alter table public.settings
  add column phone text not null default '' check (length(phone) <= 40),
  add column whatsapp text not null default '' check (whatsapp ~ '^[0-9]{0,20}$'),
  add column email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  add column address text not null default '' check (length(address) <= 300),
  add column hours text check (hours is null or length(hours) <= 200),
  -- [{ "label": "Instagram", "href": "https://…" }]
  add column social jsonb not null default '[]'::jsonb check (jsonb_typeof(social) = 'array');

-- القيم الحالية من config/site.ts (البريد وساعات العمل فارغة حتى تصل من العميل)
update public.settings set
  phone = '+971 50 246 5851',
  whatsapp = '971502465851',
  address = 'مكتب 3126، Aspin Commercial Tower، شارع الشيخ زايد، دبي'
where id = 1;

-- ---------- الاستفسارات: الزائر يضيف فقط، المسؤول يقرأ ويعدّل الحالة ----------
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  phone text not null check (length(regexp_replace(phone, '\D', '', 'g')) between 7 and 20 and length(phone) <= 40),
  rental_term text check (rental_term is null or length(rental_term) <= 60),
  city text check (city is null or length(city) <= 60),
  message text check (message is null or length(message) <= 2000),
  property_code text check (property_code is null or length(property_code) <= 20),
  status text not null default 'جديد' check (status in ('جديد', 'تم التواصل', 'مغلق')),
  -- فخّ للسبام: حقل مخفي بالنموذج؛ الإنسان يتركه فاضي، والروبوت يعبّيه فينرفض الإدخال
  website text check (website is null or website = ''),
  created_at timestamptz not null default now()
);
create index inquiries_created_idx on public.inquiries (created_at desc);

alter table public.inquiries enable row level security;
grant insert on public.inquiries to anon, authenticated;
grant select, update, delete on public.inquiries to authenticated;

create policy inquiries_insert on public.inquiries for insert to anon, authenticated
  with check (status = 'جديد');
create policy inquiries_read on public.inquiries for select to authenticated using (public.is_admin());
create policy inquiries_update on public.inquiries for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy inquiries_delete on public.inquiries for delete to authenticated using (public.is_admin());

-- ---------- حفظ عقار كامل (الحقول + الأسعار + المرافق + ترتيب الصور) بعملية واحدة ----------
-- security invoker: قواعد RLS نفسها تنطبق، والتحقق من المسؤول أول سطر
create function public.save_property(p jsonb, prices jsonb, amenity_ids uuid[], images jsonb)
returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  r public.properties;
  pid uuid := (p ->> 'id')::uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  r := jsonb_populate_record(null::public.properties, p);

  if exists (select 1 from public.properties where id = pid) then
    update public.properties set
      code = r.code, title = r.title, description = coalesce(r.description, ''),
      city_id = r.city_id, area_id = r.area_id, type_id = r.type_id,
      bedrooms = r.bedrooms, bathrooms = r.bathrooms, area_sqft = r.area_sqft, floor = r.floor,
      year_built = r.year_built, furnished = r.furnished, min_rent_period = r.min_rent_period,
      max_guests = r.max_guests, map_url = r.map_url, permit_no = r.permit_no, available_from = r.available_from,
      status = r.status, is_new = r.is_new, is_published = r.is_published,
      show_on_home = r.show_on_home, home_order = coalesce(r.home_order, 0)
    where id = pid;
  else
    insert into public.properties (
      id, code, title, description, city_id, area_id, type_id, bedrooms, bathrooms, area_sqft, floor,
      year_built, furnished, min_rent_period, max_guests, map_url, permit_no, available_from,
      status, is_new, is_published, show_on_home, home_order
    ) values (
      pid, r.code, r.title, coalesce(r.description, ''), r.city_id, r.area_id, r.type_id, r.bedrooms, r.bathrooms,
      r.area_sqft, r.floor, r.year_built, r.furnished, r.min_rent_period, r.max_guests, r.map_url, r.permit_no,
      r.available_from, r.status, r.is_new, r.is_published, r.show_on_home, coalesce(r.home_order, 0)
    );
  end if;

  delete from public.property_prices where property_id = pid;
  insert into public.property_prices (property_id, rental_term_id, amount)
  select pid, (x ->> 'rental_term_id')::uuid, (x ->> 'amount')::numeric
  from jsonb_array_elements(coalesce(prices, '[]'::jsonb)) x;

  delete from public.property_amenities where property_id = pid;
  insert into public.property_amenities (property_id, amenity_id)
  select pid, a from unnest(coalesce(amenity_ids, '{}'::uuid[])) a;

  -- الصور: يُحذف سطر كل صورة لم تعد بالقائمة، وتُضاف الجديدة، ويُحدَّث الترتيب
  delete from public.property_images
  where property_id = pid
    and id not in (select (x ->> 'id')::uuid from jsonb_array_elements(coalesce(images, '[]'::jsonb)) x);
  insert into public.property_images (id, property_id, sort_order, path_640, path_1080, path_1600, width, height)
  select (x ->> 'id')::uuid, pid, (x ->> 'sort_order')::int, x ->> 'path_640', x ->> 'path_1080', x ->> 'path_1600',
         (x ->> 'width')::int, (x ->> 'height')::int
  from jsonb_array_elements(coalesce(images, '[]'::jsonb)) x
  on conflict (id) do update set sort_order = excluded.sort_order
  where public.property_images.property_id = pid;

  return pid;
end $$;
revoke all on function public.save_property(jsonb, jsonb, uuid[], jsonb) from public, anon;
grant execute on function public.save_property(jsonb, jsonb, uuid[], jsonb) to authenticated;

-- ترتيب الخيارات بالسحب: كل الترتيب بعملية واحدة
create function public.reorder_options(kind text, ids uuid[])
returns void
language plpgsql security invoker set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if kind not in ('cities', 'areas', 'property_types', 'rental_terms', 'amenities') then
    raise exception 'bad_kind';
  end if;
  execute format(
    'update public.%I t set sort_order = o.n from unnest($1) with ordinality as o(id, n) where t.id = o.id', kind
  ) using ids;
end $$;
revoke all on function public.reorder_options(text, uuid[]) from public, anon;
grant execute on function public.reorder_options(text, uuid[]) to authenticated;

-- ترتيب شريط الرئيسية
create function public.reorder_home(ids uuid[])
returns void
language plpgsql security invoker set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  update public.properties p set home_order = o.n
  from unnest(ids) with ordinality as o(id, n)
  where p.id = o.id;
end $$;
revoke all on function public.reorder_home(uuid[]) from public, anon;
grant execute on function public.reorder_home(uuid[]) to authenticated;

-- ============================================================================
-- اسم ووصف العقار بالإنجليزي (اختياريان) — تحضير للنسخة الإنجليزية من الموقع.
-- باقي الحقول (السعر، الغرف، المدينة، النوع، المرافق…) مشتركة أو لها أسماء إنجليزية في جداول الخيارات.
-- ============================================================================

alter table public.properties
  add column title_en text not null default '' check (length(title_en) <= 200),
  add column description_en text not null default '' check (length(description_en) <= 5000);

-- دالة الحفظ نفسها (0004) مع الحقلين الجديدين
create or replace function public.save_property(p jsonb, prices jsonb, amenity_ids uuid[], images jsonb)
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
      title_en = coalesce(r.title_en, ''), description_en = coalesce(r.description_en, ''),
      city_id = r.city_id, area_id = r.area_id, type_id = r.type_id,
      bedrooms = r.bedrooms, bathrooms = r.bathrooms, area_sqft = r.area_sqft, floor = r.floor,
      year_built = r.year_built, furnished = r.furnished, min_rent_period = r.min_rent_period,
      max_guests = r.max_guests, map_url = r.map_url, permit_no = r.permit_no, available_from = r.available_from,
      status = r.status, is_new = r.is_new, is_published = r.is_published,
      show_on_home = r.show_on_home, home_order = coalesce(r.home_order, 0)
    where id = pid;
  else
    insert into public.properties (
      id, code, title, description, title_en, description_en, city_id, area_id, type_id, bedrooms, bathrooms, area_sqft, floor,
      year_built, furnished, min_rent_period, max_guests, map_url, permit_no, available_from,
      status, is_new, is_published, show_on_home, home_order
    ) values (
      pid, r.code, r.title, coalesce(r.description, ''), coalesce(r.title_en, ''), coalesce(r.description_en, ''), r.city_id, r.area_id, r.type_id, r.bedrooms, r.bathrooms,
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

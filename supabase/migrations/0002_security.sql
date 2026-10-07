-- ============================================================================
-- الحماية: RLS على كل الجداول + التخزين
-- الزوار (anon): قراءة المنشور والخيارات المفعّلة فقط. المسؤولون (جدول admins): كل شيء.
-- ============================================================================

-- هل المستخدم الحالي مسؤول؟ (security definer: يقرأ admins حتى لو RLS يمنع القراءة المباشرة)
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- الصلاحيات الأساسية — RLS هي التي تقرر فعلياً
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage on sequence public.property_code_seq to authenticated;

alter table public.cities enable row level security;
alter table public.areas enable row level security;
alter table public.property_types enable row level security;
alter table public.rental_terms enable row level security;
alter table public.amenities enable row level security;
alter table public.properties enable row level security;
alter table public.property_prices enable row level security;
alter table public.property_images enable row level security;
alter table public.property_amenities enable row level security;
alter table public.settings enable row level security;
alter table public.admins enable row level security;

-- ---------- الخيارات: الزائر يرى المفعّل فقط، المسؤول يرى ويعدّل الكل ----------
do $$
declare t text;
begin
  foreach t in array array['cities', 'areas', 'property_types', 'rental_terms', 'amenities'] loop
    execute format('create policy %I on public.%I for select to anon, authenticated using (is_active or public.is_admin())', t || '_read', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_admin())', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())', t || '_delete', t);
  end loop;
end $$;

-- ---------- العقارات: الزائر يرى المنشور فقط ----------
create policy properties_read on public.properties for select to anon, authenticated
  using (is_published or public.is_admin());
create policy properties_insert on public.properties for insert to authenticated with check (public.is_admin());
create policy properties_update on public.properties for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy properties_delete on public.properties for delete to authenticated using (public.is_admin());

-- الأسعار والصور والمرافق: تتبع عقارها
do $$
declare t text;
begin
  foreach t in array array['property_prices', 'property_images', 'property_amenities'] loop
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (
         public.is_admin() or exists (select 1 from public.properties p where p.id = property_id and p.is_published))',
      t || '_read', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_admin())', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())', t || '_delete', t);
  end loop;
end $$;

-- ---------- الإعدادات: قراءة للكل، تعديل للمسؤول ----------
create policy settings_read on public.settings for select to anon, authenticated using (true);
create policy settings_update on public.settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- المسؤولون: كل مستخدم يرى سطره فقط؛ الإضافة من SQL/سكربت الدعوة فقط ----------
create policy admins_read_self on public.admins for select to authenticated using (user_id = auth.uid());

-- ---------- التخزين ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('property-images', 'property-images', true, 5242880, array['image/webp']),
  ('area-covers', 'area-covers', true, 5242880, array['image/webp'])
on conflict (id) do nothing;

-- القراءة العامة تتم عبر الرابط العام للـbucket (public). الرفع والتعديل والحذف للمسؤولين فقط.
create policy images_admin_select on storage.objects for select to authenticated
  using (bucket_id in ('property-images', 'area-covers') and public.is_admin());
create policy images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('property-images', 'area-covers') and public.is_admin());
create policy images_admin_update on storage.objects for update to authenticated
  using (bucket_id in ('property-images', 'area-covers') and public.is_admin())
  with check (bucket_id in ('property-images', 'area-covers') and public.is_admin());
create policy images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id in ('property-images', 'area-covers') and public.is_admin());

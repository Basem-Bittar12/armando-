-- ============================================================================
-- أرماندو القاضي — الجداول الأساسية
-- الخيارات (مدن، مناطق، أنواع عقار، أنواع إيجار، مرافق) + العقارات وأسعارها وصورها ومرافقها
-- + الإعدادات + المسؤولون. الحماية (RLS) في 0002_security.sql.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------- الخيارات: اسم عربي + إنجليزي + ترتيب + مفعّل/موقوف ----------
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null check (length(trim(name_ar)) > 0),
  name_en text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete restrict,
  name_ar text not null check (length(trim(name_ar)) > 0),
  name_en text not null default '',
  -- صورة الغلاف لقسم «اكتشف المكان» (مسار داخل bucket area-covers)
  cover_path text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index areas_city_idx on public.areas (city_id);

create table public.property_types (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null check (length(trim(name_ar)) > 0),
  name_en text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.rental_terms (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null check (length(trim(name_ar)) > 0),
  name_en text not null default '',
  -- نص الوحدة بجانب السعر: «درهم / شهري»
  unit_ar text not null check (length(trim(unit_ar)) > 0),
  unit_en text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null check (length(trim(name_ar)) > 0),
  name_en text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- العقارات ----------
create sequence public.property_code_seq start 200;

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  -- AK-xxx تلقائي، قابل للتعديل، لا يتكرر
  code text not null unique
    default ('AK-' || lpad(nextval('public.property_code_seq')::text, 3, '0'))
    check (code ~ '^[A-Za-z0-9][A-Za-z0-9-]{1,19}$'),
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  city_id uuid not null references public.cities (id) on delete restrict,
  area_id uuid references public.areas (id) on delete restrict,
  type_id uuid not null references public.property_types (id) on delete restrict,
  bedrooms int not null default 0 check (bedrooms between 0 and 50),       -- 0 = استوديو
  bathrooms int not null default 1 check (bathrooms between 0 and 50),
  area_sqft int check (area_sqft > 0),
  floor text,
  year_built int check (year_built between 1900 and 2100),
  furnished boolean not null default false,
  min_rent_period text,
  max_guests int check (max_guests > 0),
  map_url text check (map_url is null or map_url ~* '^https?://'),
  permit_no text,
  available_from text,
  status text not null default 'متاح' check (status in ('متاح', 'محجوز', 'مؤجر')),
  is_new boolean not null default false,
  is_published boolean not null default false,
  show_on_home boolean not null default false,
  home_order int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index properties_published_idx on public.properties (is_published);
create index properties_home_idx on public.properties (show_on_home, home_order);

-- سعر لكل نوع إيجار (شهري وسنوي معاً ممكن)
create table public.property_prices (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  rental_term_id uuid not null references public.rental_terms (id) on delete restrict,
  amount numeric(12, 0) not null check (amount > 0),
  unique (property_id, rental_term_id)
);

-- الصور بترتيب؛ الأولى = الغلاف. ثلاث نسخ WebP (640/1080/1600 عرض) داخل bucket property-images
create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  sort_order int not null default 0,
  path_640 text not null,
  path_1080 text not null,
  path_1600 text not null,
  width int,
  height int,
  created_at timestamptz not null default now()
);
create index property_images_property_idx on public.property_images (property_id, sort_order);

create table public.property_amenities (
  property_id uuid not null references public.properties (id) on delete cascade,
  amenity_id uuid not null references public.amenities (id) on delete restrict,
  primary key (property_id, amenity_id)
);

-- ---------- الإعدادات (صف واحد) ----------
create table public.settings (
  id int primary key default 1 check (id = 1),
  home_count int not null default 6 check (home_count between 1 and 24)
);
insert into public.settings (id, home_count) values (1, 6);

-- ---------- المسؤولون (مربوطون بحسابات Supabase Auth) ----------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------- قواعد ----------
-- المنطقة لازم تكون تابعة لنفس مدينة العقار
create function public.check_property_area() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.area_id is not null and not exists (
    select 1 from public.areas a where a.id = new.area_id and a.city_id = new.city_id
  ) then
    raise exception 'area_city_mismatch' using hint = 'المنطقة ليست تابعة لمدينة العقار';
  end if;
  return new;
end $$;

create trigger properties_area_city before insert or update of area_id, city_id on public.properties
  for each row execute function public.check_property_area();

-- لا يتجاوز عدد «معروض بالرئيسية» إعداد home_count
create function public.check_home_limit() returns trigger
language plpgsql set search_path = public as $$
declare
  limit_count int;
  current_count int;
begin
  if new.show_on_home and (tg_op = 'INSERT' or not old.show_on_home) then
    select home_count into limit_count from public.settings where id = 1;
    select count(*) into current_count from public.properties where show_on_home and id <> new.id;
    if current_count >= limit_count then
      raise exception 'home_limit_reached' using hint = 'وصلت لحد عدد العقارات بالرئيسية';
    end if;
    -- الجديد بالرئيسية يدخل آخر الترتيب
    if new.home_order = 0 then
      select coalesce(max(home_order), 0) + 1 into new.home_order from public.properties where show_on_home;
    end if;
  end if;
  return new;
end $$;

create trigger properties_home_limit before insert or update of show_on_home on public.properties
  for each row execute function public.check_home_limit();

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger properties_touch before update on public.properties
  for each row execute function public.touch_updated_at();

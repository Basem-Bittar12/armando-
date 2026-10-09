-- عنوان المكتب وساعات العمل بالإنجليزي (اختياريان) — للنسخة الإنجليزية من الموقع. فاضي = يُعرض العربي.
alter table public.settings
  add column address_en text not null default '' check (length(address_en) <= 300),
  add column hours_en text not null default '' check (length(hours_en) <= 200);

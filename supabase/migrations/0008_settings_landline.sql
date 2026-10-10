-- رقم الهاتف الأرضي للمكتب (اختياري) — يظهر بالفوتر وصفحة التواصل وقائمة التلفون. فاضي = ما بيظهر.
alter table public.settings
  add column landline text not null default '' check (length(landline) <= 40);

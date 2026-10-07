-- ============================================================================
-- الخيارات المبدئية: دبي فقط ومناطقها من البيانات الحالية، أنواع العقار والإيجار والمرافق الحالية.
-- (العقارات التجريبية تُنقل بسكربت scripts/seed-demo.ts لأنها تحتاج رفع صور)
-- ============================================================================

insert into public.cities (name_ar, name_en, sort_order) values ('دبي', 'Dubai', 1);

insert into public.areas (city_id, name_ar, name_en, sort_order)
select c.id, v.name_ar, v.name_en, v.sort_order
from public.cities c
cross join (values
  ('وسط مدينة دبي', 'Downtown Dubai', 1),
  ('البرشاء', 'Al Barsha', 2),
  ('الخليج التجاري', 'Business Bay', 3)
) as v (name_ar, name_en, sort_order)
where c.name_ar = 'دبي';

insert into public.property_types (name_ar, name_en, sort_order) values
  ('شقة', 'Apartment', 1),
  ('فيلا', 'Villa', 2),
  ('استوديو', 'Studio', 3),
  ('تاون هاوس', 'Townhouse', 4);

insert into public.rental_terms (name_ar, name_en, unit_ar, unit_en, sort_order) values
  ('شهري', 'Monthly', 'درهم / شهري', 'AED / month', 1),
  ('سنوي', 'Yearly', 'درهم / سنوي', 'AED / year', 2);

-- «مفروشة بالكامل» صارت حقلاً بالعقار (furnished) وليست مرفقاً
insert into public.amenities (name_ar, name_en, sort_order) values
  ('موقف سيارة', 'Parking', 1),
  ('مسبح مشترك', 'Shared pool', 2),
  ('مسبح خاص', 'Private pool', 3),
  ('حديقة خاصة', 'Private garden', 4),
  ('صالة رياضية', 'Gym', 5),
  ('أمن 24 ساعة', '24h security', 6),
  ('شرفة', 'Balcony', 7),
  ('غرفة خادمة', 'Maid''s room', 8),
  ('قريب من المترو', 'Near metro', 9),
  ('إطلالة بحرية', 'Sea view', 10),
  ('مجمع مغلق', 'Gated community', 11);

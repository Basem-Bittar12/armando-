-- صورة مشاركة JPEG لكل صورة عقار (…-og.jpg): واتساب لا يعرض معاينة WebP دائماً
update storage.buckets
set allowed_mime_types = array['image/webp', 'image/jpeg']
where id = 'property-images';

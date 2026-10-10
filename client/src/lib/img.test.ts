/**
 * مسار الصور /img: ما يُسمح به (buckets العامة فقط، بلا تلاعب بالمسار) والرابط الاحتياطي المباشر.
 */
import { describe, expect, it } from "vitest";
import { IMG_CACHE_CONTROL, imgUrl, storagePathFromImg } from "@shared/img";
import { toDirectImageUrls } from "./imgFallback";

describe("مسار /img", () => {
  const path = "a63e28e6-38d7-488e-9adc-fcf63f627201/587b2923-f7b3-49e4-b7e9-3e17ac03acfd-1080.webp";

  it("رابط الصورة نسبي على موقعنا، ويُخزَّن سنة", () => {
    expect(imgUrl("property-images", path)).toBe(`/img/property-images/${path}`);
    expect(IMG_CACHE_CONTROL).toContain("max-age=31536000");
    expect(IMG_CACHE_CONTROL).toContain("immutable");
  });

  it("يسمح فقط بصور العقارات وأغلفة المناطق", () => {
    expect(storagePathFromImg(`/img/property-images/${path}`)).toBe(`property-images/${path}`);
    expect(storagePathFromImg("/img/area-covers/abc/def.webp")).toBe("area-covers/abc/def.webp");
    for (const bad of [
      "/img/private/abc/def.webp",
      "/img/property-images",
      "/img/property-images/",
      "/img/property-images/../../rest/v1/settings",
      "/img/property-images/..%2F..%2Fsecret",
      "/img/property-images/a//b.webp",
      "/img/property-images/%E0%A4%A",
      "/storage/v1/object/public/property-images/x.webp",
    ]) {
      expect(storagePathFromImg(bad), bad).toBeNull();
    }
  });

  it("الاحتياط يبدّل روابط /img في src وsrcset إلى Supabase مباشرة", () => {
    const origin = "https://armando.example";
    const srcset = `/img/property-images/a-640.webp 640w, /img/property-images/a-1080.webp 1080w`;
    const out = toDirectImageUrls(srcset, origin);
    expect(out).not.toContain("/img/");
    expect(out.match(/\/storage\/v1\/object\/public\/property-images\//g)).toHaveLength(2);
    expect(toDirectImageUrls(`${origin}/img/area-covers/x.webp`, origin)).toMatch(/\/storage\/v1\/object\/public\/area-covers\/x\.webp$/);
    // روابط أخرى لا تُمس
    expect(toDirectImageUrls("https://images.unsplash.com/photo?w=800", origin)).toBe("https://images.unsplash.com/photo?w=800");
  });
});

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// شيمات بيئة jsdom فقط (غير مستخدمة في المتصفح الحقيقي)
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

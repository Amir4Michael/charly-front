// أدوات موحّدة للتعامل مع أرقام الهاتف — تُستخدم بدل تكرار المنطق في كل Component
// تدعم صيغ الأرقام المصرية الشائعة: 01xxxxxxxxx / +2012xxxxxxxx / 002012xxxxxxxx

/** يحذف كل شيء غير رقمي (يحتفظ بعلامة + في البداية فقط أثناء التنظيف الأول) */
export function cleanPhoneDigits(raw) {
  if (!raw) return '';
  return String(raw).trim().replace(/[^\d+]/g, '');
}

/** يحوّل أي صيغة مصرية إلى الصيغة الدولية بدون '+' (مثال: 201012345678) — مطلوبة لروابط واتساب */
export function toEgyptInternational(raw) {
  let digits = cleanPhoneDigits(raw).replace(/\+/g, '');
  if (!digits) return '';
  if (digits.startsWith('0020')) digits = digits.slice(2); // 0020xxxxxxxxxx -> 20xxxxxxxxxx
  if (digits.startsWith('20') && digits.length >= 12) return digits;
  if (digits.startsWith('0')) return `20${digits.slice(1)}`; // 01xxxxxxxxx -> 201xxxxxxxxx
  if (digits.length === 10) return `20${digits}`; // 1xxxxxxxxx بدون صفر البداية
  return digits;
}

/** رابط اتصال مباشر بالرقم كما هو مُدخل (يعمل مع tel: بأي صيغة محلية أو دولية) */
export function telHref(raw) {
  const digits = cleanPhoneDigits(raw);
  return digits ? `tel:${digits}` : '';
}

/** رابط فتح واتساب لمحادثة مع الرقم، مع رسالة نصية اختيارية جاهزة مسبقًا */
export function whatsappHref(raw, message = '') {
  const intl = toEgyptInternational(raw);
  if (!intl) return '';
  const base = `https://wa.me/${intl}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** تحقق بسيط من أن الرقم يحتوي على عدد أرقام معقول */
export function isValidPhone(raw) {
  const digits = cleanPhoneDigits(raw).replace(/\+/g, '');
  return digits.length >= 8;
}

/** صيغة عرض بسيطة للرقم (بدون تغيير جوهري، فقط لإزالة أي مسافات زائدة) */
export function formatPhoneDisplay(raw) {
  return cleanPhoneDigits(raw) || '—';
}

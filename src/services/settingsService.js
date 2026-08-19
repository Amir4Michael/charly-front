import { apiGet, apiPut } from '@/lib/apiClient';
import { DEFAULT_SETTINGS } from '@/data/mockData';

/**
 * الإعدادات تُقرأ في أكثر من 10 صفحات بشكل متزامن ومباشر داخل الـrender/الطباعة
 * (مثال: {getSettings().factoryName})، وتتغيّر نادرًا جدًا (فقط من صفحة الإعدادات).
 * بدل تحويل كل تلك الصفحات لنمط useEffect/useState (تعديل كبير غير ضروري لبيانات
 * شبه ثابتة)، نحتفظ بذاكرة تخزين مؤقت على مستوى الموديول تُملأ فور تحميل التطبيق،
 * وتبقى getSettings() متزامنة تمامًا كما تتوقعها كل الصفحات الحالية دون أي تعديل فيها.
 *
 * ⚠️ ملاحظة صادقة: أول Render قبل اكتمال أول طلب حقيقي سيعرض القيم الافتراضية
 * (DEFAULT_SETTINGS) لحظيًا، ثم تنعكس البيانات الحقيقية في أول تنقّل/إعادة رسم لاحقة.
 * لضمان بيانات محدَّثة يقينًا (كصفحة الإعدادات نفسها)، استخدم getSettingsAsync().
 */
let cache = DEFAULT_SETTINGS;
let fetchPromise = null;

function ensureLoaded() {
  if (!fetchPromise) {
    fetchPromise = apiGet('/settings')
      .then((data) => {
        cache = data;
        return cache;
      })
      .catch(() => {
        // فشل الجلب (مثلاً قبل تسجيل الدخول، حيث المسار محمي) — لا نُثبّت هذا الفشل كنتيجة نهائية،
        // بل نسمح بإعادة المحاولة لاحقًا (خصوصًا بعد نجاح تسجيل الدخول، انظر refreshSettings أدناه)
        fetchPromise = null;
        return cache;
      });
  }
  return fetchPromise;
}

// يبدأ التحميل فور استيراد هذا الملف لأول مرة، حتى تكون البيانات الحقيقية جاهزة بأقرب وقت
ensureLoaded();

/** قراءة متزامنة فورية — تطابق التعاقد القديم تمامًا لكل الصفحات التي تستخدمها للعرض فقط */
export const getSettings = () => cache;

/** نسخة تنتظر اكتمال التحميل الحقيقي فعليًا — تُستخدم في SettingsPage نفسها */
export const getSettingsAsync = () => ensureLoaded();

/** يجبر إعادة المحاولة فورًا — يُستدعى من useAuth بعد نجاح تسجيل الدخول، لأن أول محاولة
 * تحميل (قبل توفر Token) لا بد أنها فشلت بما أن مسار /api/settings محمي بالكامل */
export const refreshSettings = () => {
  fetchPromise = null;
  return ensureLoaded();
};

export const saveSettings = async (settings) => {
  const updated = await apiPut('/settings', settings);
  cache = updated;
  return updated;
};

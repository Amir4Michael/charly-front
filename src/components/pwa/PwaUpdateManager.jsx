import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // فحص كل ساعة عن نسخة جديدة

/**
 * يسجّل الـ Service Worker (لو مدعوم) ويتابع صدور نسخة جديدة من التطبيق.
 *
 * مهم جدًا: مفيش أي reload تلقائي أو مفاجئ هنا — لو المستخدم لسه بيكتب تقرير يومي،
 * تحديث الصفحة فجأة ممكن يضيّع بياناته. بدل كده بنعرض إشعار واضح وبسيط
 * فيه زرار "تحديث الآن" يتحكم فيه المستخدم بنفسه.
 */
export default function PwaUpdateManager() {
  const toastShownRef = useRef(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // فحص دوري خفيف عن وجود نسخة جديدة من الـ Service Worker في الخلفية
      setInterval(() => {
        registration.update().catch(() => {});
      }, UPDATE_CHECK_INTERVAL_MS);
    },
    onRegisterError() {
      // فشل تسجيل الـ Service Worker (مثلًا متصفح قديم) — التطبيق يفضل شغال عادي بدون PWA caching
    },
  });

  useEffect(() => {
    if (!needRefresh || toastShownRef.current) return;
    toastShownRef.current = true;

    toast('يتوفر تحديث جديد لتطبيق Charly Group', {
      description: 'اضغط "تحديث الآن" لتفعيل أحدث نسخة. احفظ أي تقرير مفتوح أولًا قبل الضغط.',
      duration: Infinity,
      action: {
        label: 'تحديث الآن',
        onClick: () => updateServiceWorker(true),
      },
    });
  }, [needRefresh, updateServiceWorker]);

  return null;
}
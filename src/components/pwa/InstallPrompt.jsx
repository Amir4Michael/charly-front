import React, { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/common';

const DISMISS_KEY = 'charly_pwa_install_dismissed_at';
// لو المستخدم ضغط "ليس الآن"، منعرضش عليه تاني قبل ما تعدي المدة دي (يوم بيوم مش بيزعجوه في كل فتح)
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 14; // 14 يوم

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator?.standalone === true // iOS Safari القديم
  );
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIosDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS الحديث بيبعت User-Agent زي الديسكتوب، فبنتأكد كمان من دعم اللمس
  const isIpadOS13Plus = /Macintosh/.test(ua) && 'ontouchend' in document;
  return isIosDevice || isIpadOS13Plus;
}

function wasRecentlyDismissed() {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt)) return false;
  return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
}

function markDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // localStorage قد يكون غير متاح (وضع خاص) — تجاهل بأمان
  }
}

/**
 * بانر تثبيت التطبيق (Charly Group) — احترافي وغير مزعج:
 * - على Android/Chrome/Edge (يدعم beforeinstallprompt): يظهر زر "تثبيت التطبيق" فعلي.
 * - على iOS Safari (لا يدعم beforeinstallprompt إطلاقًا): يظهر تعليمات "Share ثم Add to Home Screen" فقط.
 * - لا يظهر أبدًا لو التطبيق شغال بالفعل في Standalone Mode (يعني متثبّت).
 * - لو المستخدم ضغط "ليس الآن"، مش هيتعرض تاني قبل مرور فترة تهدئة معقولة.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState(null); // 'android' | 'ios'

  useEffect(() => {
    if (isStandaloneMode()) return undefined;

    if (isIOS()) {
      if (!wasRecentlyDismissed()) {
        setPlatform('ios');
        setVisible(true);
      }
      return undefined;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!wasRecentlyDismissed()) {
        setPlatform('android');
        setVisible(true);
      }
    };

    const handleAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      markDismissed();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    markDismissed();
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // سواء وافق أو رفض، مبقاش المتصفح هيسمح بإعادة استخدام نفس الـ prompt تاني
    setDeferredPrompt(null);
    setVisible(false);
    markDismissed();
  };

  return (
    <div
      dir="rtl"
      className="no-print fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]"
    >
      <div className="app-card flex w-full max-w-md items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {platform === 'ios' ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">تثبيت تطبيق Charly Group</p>
          {platform === 'ios' ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              لإضافة التطبيق إلى جهازك: اضغط زر المشاركة{' '}
              <Share className="inline h-3.5 w-3.5 align-text-bottom" /> ثم اختر
              «Add to Home Screen» (أضف إلى الشاشة الرئيسية).
            </p>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              ثبّت التطبيق على جهازك للوصول إليه بشكل أسرع وبدون شريط المتصفح.
            </p>
          )}

          <div className="mt-3 flex gap-2">
            {platform === 'android' && (
              <Button className="h-9 px-3 text-xs" onClick={handleInstall}>
                تثبيت التطبيق
              </Button>
            )}
            <Button className="h-9 px-3 text-xs" variant="secondary" onClick={handleDismiss}>
              {platform === 'ios' ? 'فهمت' : 'ليس الآن'}
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="إغلاق"
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
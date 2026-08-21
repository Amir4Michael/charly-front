import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, Field, TextInput } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { getLoginCandidates } from '@/services/authService';

export default function LoginPage() {
  // ==================== LOGIC (محفوظ بالكامل بدون أي تغيير) ====================
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getLoginCandidates()
      .then((list) => {
        setCandidates(list);
        if (list.length === 1) setUsername(list[0].username);
      })
      .catch(() => setError('تعذّر الاتصال بالخادم، تأكد من تشغيل الـBackend'))
      .finally(() => setLoadingCandidates(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username) {
      setError('يجب اختيار المستخدم');
      return;
    }
    setLoading(true);
    try {
      await signIn(username, password);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // =======================================================================

  return (
    <>
      <Helmet>
        <title>تسجيل الدخول — نظام الإدارة</title>
        <meta
          name="description"
          content="صفحة تسجيل الدخول إلى نظام إدارة وتشغيل مصنع كربونات الكالسيوم."
        />
      </Helmet>

      {/* الشاشة الرئيسية: تصميم فاخر، مريح للعين، ومتجاوب بالكامل للموبايل والتابلت */}
      <div className="relative min-h-[100dvh] w-full bg-[#0b0f17] text-slate-100 flex flex-col justify-between items-center p-4 sm:p-8 overflow-hidden font-sans selection:bg-primary selection:text-white">

        {/* خلفية هندسية مخصصة (Subtle Engineering Grid Pattern + Ambient Glow) */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-gradient-to-tr from-primary/20 via-blue-600/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

        {/* هامش علوي مريح */}
        <div className="w-full pt-2" />

        {/* ==================== الكارت الرئيسي المطور ==================== */}
        <main className="relative z-10 w-full max-w-sm sm:max-w-md my-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-[#111827]/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6 transition-all duration-300"
          >
            {/* الشعار المطور مع الإضاءة والهالة الزجاجية */}
            <div className="text-center space-y-4">
              <div className="relative inline-flex items-center justify-center p-4 rounded-3xl bg-slate-900/90 border border-slate-700/50 shadow-2xl group transition-transform duration-300 hover:scale-[1.03]">
                {/* توهج خلف الشعار */}
                <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-md transition-opacity group-hover:opacity-100 opacity-60" />
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="relative z-10 h-16 w-auto object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement.innerHTML = '<span className="text-2xl">⚡</span>';
                  }}
                />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  تسجيل الدخول
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">
                  اختر حسابك الشخصي وأدخل كلمة المرور
                </p>
              </div>
            </div>

            {/* قسم اختيار المستخدم (User Selection Cards) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  المستخدم
                </span>
              </div>

              {loadingCandidates ? (
                /* Skeleton Loading بأسلوب سلس */
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="h-12 animate-pulse rounded-2xl bg-slate-800/60" />
                  <div className="h-12 animate-pulse rounded-2xl bg-slate-800/60" />
                </div>
              ) : candidates.length ? (
                /* كروت اختيار تفاعلية وسريعة الاستجابة للموبايل */
                <div className="grid grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                  {candidates.map((c) => {
                    const isSelected = username === c.username;
                    return (
                      <button
                        key={c.username}
                        type="button"
                        onClick={() => setUsername(c.username)}
                        className={`group relative flex items-center justify-between p-3 rounded-2xl text-right transition-all duration-200 border outline-none active:scale-95 ${
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30 font-bold'
                            : 'bg-slate-950/70 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* رمز الحرف الأول */}
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-colors ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                            }`}
                          >
                            {c.name ? c.name.charAt(0) : 'U'}
                          </div>
                          <span className="text-xs sm:text-sm truncate leading-tight">
                            {c.name}
                          </span>
                        </div>

                        {/* أيقونة صح متفاعلة للمستخدم المحدد */}
                        {isSelected && (
                          <svg
                            className="h-4 w-4 shrink-0 text-white animate-in zoom-in-50 duration-150"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* حالة التنبيه */
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center leading-relaxed">
                  لا يوجد مستخدمون نشطون، تأكد من تشغيل seed:users في الـBackend
                </div>
              )}
            </div>

            {/* حقل كلمة المرور */}
            <div className="space-y-1.5">
              <Field label="كلمة المرور" error={error}>
                <TextInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  className="h-12 rounded-2xl bg-slate-950/90 border-slate-800/90 text-white placeholder:text-slate-600 focus:border-primary focus:ring-1 focus:ring-primary text-sm text-right transition-all"
                />
              </Field>
            </div>

            {/* زر دخول النظام */}
            <Button
              type="submit"
              loading={loading}
              className="h-12 w-full rounded-2xl text-sm font-extrabold shadow-xl shadow-primary/25 transition-all active:scale-[0.98] hover:shadow-primary/40"
            >
              دخول النظام
            </Button>
          </form>
        </main>

        {/* ==================== شارة التوقيع الفخمة ==================== */}
        <footer className="relative z-10 w-full py-3 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-sm">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] text-slate-400 font-medium">
              تطوير وتنفيذ:
            </span>
            <span className="text-xs font-bold text-slate-200 tracking-wide">
              المهندس أنطونيوس سامح
            </span>
          </div>
        </footer>

      </div>
    </>
  );
}
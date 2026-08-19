import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, Field, TextInput } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { getSettings } from '@/services/settingsService';
import { getLoginCandidates } from '@/services/authService';

export default function LoginPage() {
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

  return (
    <>
      <Helmet>
        <title>تسجيل الدخول — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="صفحة تسجيل الدخول إلى نظام إدارة وتشغيل مصنع كربونات الكالسيوم." />
      </Helmet>
      <div className="grid min-h-[100dvh] lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
          <p className="text-sm">{getSettings().factoryName}</p>
          <div>
            <h2 className="text-3xl font-bold leading-snug text-white">
              نظام  وتشغيل
              <br />
              مصنع كربونات الكالسيوم
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              متابعة التقارير اليومية، الورديات، الخامات، الإنتاج والتعبئة، التحميل والمصاريف في مكان واحد.
            </p>
          </div>
          <p className="text-xs text-sidebar-foreground/60">المرحلة الأولى — التشغيل</p>
        </div>

        <div className="flex items-center justify-center p-6">
          <form onSubmit={handleSubmit} className="app-card w-full max-w-md p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-foreground">تسجيل الدخول</h1>
            <p className="mt-1 text-sm text-muted-foreground">اختر اسمك وأدخل كلمة المرور للدخول إلى النظام</p>

            <div className="mt-6">
              <span className="field-label">المستخدم</span>
              {loadingCandidates ? (
                <p className="text-sm text-muted-foreground">جاري تحميل قائمة المستخدمين...</p>
              ) : candidates.length ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {candidates.map((c) => (
                    <button
                      key={c.username}
                      type="button"
                      onClick={() => setUsername(c.username)}
                      className={
                        username === c.username
                          ? 'rounded-md border border-primary bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground'
                          : 'rounded-md border border-border bg-card px-3 py-2.5 text-sm hover:bg-secondary'
                      }
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-destructive">لا يوجد مستخدمون نشطون، تأكد من تشغيل seed:users في الـBackend</p>
              )}
            </div>

            <div className="mt-4">
              <Field label="كلمة المرور" error={error}>
                <TextInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  autoFocus
                />
              </Field>
            </div>

            <Button type="submit" loading={loading} className="mt-6 w-full">
              دخول
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}

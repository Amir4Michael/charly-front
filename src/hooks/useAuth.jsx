import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '@/services/authService';
import { setUnauthorizedHandler } from '@/lib/apiClient';
import { refreshSettings } from '@/services/settingsService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // لو أي طلب API فشل نهائيًا بعد محاولة تجديد الجلسة، نسجّل خروج المستخدم محليًا
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  useEffect(() => {
    // محاولة استعادة الجلسة تلقائيًا عبر httpOnly refresh cookie عند تحميل التطبيق
    // (بدون هذا، أي تحديث للصفحة كان سيسجّل خروج المستخدم فورًا لأن الـAccess Token في الذاكرة فقط)
    authService
      .refreshSession()
      .then((u) => {
        setUser(u);
        refreshSettings(); // أول محاولة تحميل للإعدادات (عند استيراد settingsService) كانت قبل توفر Token فلا بد أنها فشلت — أعد المحاولة الآن
      })
      .catch(() => setUser(null))
      .finally(() => setInitializing(false));
  }, []);

  const signIn = useCallback(async (username, password) => {
    const u = await authService.login(username, password);
    setUser(u);
    refreshSettings();
    return u;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const role = user?.role || 'viewer';
  const isAdmin = role === 'admin';

  const value = useMemo(
    () => ({
      // نفس شكل session القديم للتوافق مع MainLayout.jsx وأي مكان آخر يقرأ session.user.name
      session: user ? { user: { name: user.name }, role: user.role } : null,
      user,
      isAuthenticated: Boolean(user),
      initializing,
      role,
      isAdmin,
      // المشاهد يمكنه العرض فقط — بدون إضافة أو تعديل أو حذف
      canManage: isAdmin,
      signIn,
      signOut,
    }),
    [user, initializing, role, isAdmin, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth يجب استخدامه داخل AuthProvider');
  return ctx;
}

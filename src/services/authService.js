import { apiGet, apiPost, apiPatch, setAccessToken } from '@/lib/apiClient';

export const ROLES = {
  admin: { key: 'admin', label: 'مدير' },
  viewer: { key: 'viewer', label: 'مشاهد فقط' },
};

/** قائمة المستخدمين النشطين لعرضها في Dropdown اختيار المستخدم بصفحة الدخول */
export const getLoginCandidates = () => apiGet('/auth/login-users');

export const login = async (username, password) => {
  const data = await apiPost('/auth/login', { username, password });
  setAccessToken(data.accessToken);
  return data.user; // { id, name, username, role }
};

/** يحاول استعادة الجلسة تلقائيًا عبر httpOnly refresh cookie (يُستدعى عند تحميل التطبيق) */
export const refreshSession = async () => {
  const data = await apiPost('/auth/refresh');
  setAccessToken(data.accessToken);
  return data.user;
};

export const logout = async () => {
  try {
    await apiPost('/auth/logout');
  } finally {
    setAccessToken(null);
  }
};

export const changePassword = (currentPassword, newPassword) =>
  apiPatch('/auth/change-password', { currentPassword, newPassword });

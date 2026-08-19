import { apiGet, apiPost, apiDelete } from '@/lib/apiClient';

export const getMaterials = () => apiGet('/materials');

/** يُعيد جلب القائمة الكاملة المحدَّثة بعد الإضافة، للحفاظ على نفس تعاقد الدالة القديم
 * (كانت تُرجع كل شيء {rawTypes, fineness, ...} مباشرة من localStorage) */
export const addToList = async (listKey, value) => {
  await apiPost('/materials', { category: listKey, value });
  return getMaterials();
};

export const removeFromList = async (listKey, value) => {
  await apiDelete(`/materials/${listKey}/${encodeURIComponent(value)}`);
  return getMaterials();
};

export const getInventoryReport = ({ from, to } = {}) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiGet(`/materials/inventory-report${qs ? `?${qs}` : ''}`);
};

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/apiClient';

export const listQuarries = () => apiGet('/quarries');
export const listQuarryNames = async () => (await listQuarries()).map((q) => q.name);

export const getQuarry = (id) => apiGet(`/quarries/${id}`);
export const getQuarryByName = async (name) => {
  const list = await listQuarries();
  return list.find((q) => q.name === name) || null;
};
export const getQuarryStatement = (id, { from, to } = {}) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiGet(`/quarries/${id}/statement${qs ? `?${qs}` : ''}`);
};

export const saveQuarry = (quarry) =>
  quarry.id ? apiPut(`/quarries/${quarry.id}`, quarry) : apiPost('/quarries', quarry);

export const deleteQuarry = (id) => apiDelete(`/quarries/${id}`);

/** يبحث عن كسارة بنفس الاسم بالضبط عبر الـAPI الحقيقي، وإن لم توجد يُنشئها — نفس منطق findOrCreateCustomer */
export const findOrCreateQuarry = async (name) => {
  const trimmed = String(name).trim();
  const list = await listQuarries();
  const existing = list.find((q) => q.name === trimmed);
  if (existing) return existing;
  return saveQuarry({ name: trimmed });
};

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/apiClient';

export const listTrucks = () => apiGet('/trucks');
export const listTruckNames = async () => (await listTrucks()).map((t) => t.name);

export const getTruck = (id) => apiGet(`/trucks/${id}`);
export const getTruckByName = async (name) => {
  const list = await listTrucks();
  return list.find((t) => t.name === name) || null;
};
export const getTruckStatement = (id, { from, to } = {}) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiGet(`/trucks/${id}/statement${qs ? `?${qs}` : ''}`);
};

export const saveTruck = (truck) =>
  truck.id ? apiPut(`/trucks/${truck.id}`, truck) : apiPost('/trucks', truck);

export const deleteTruck = (id) => apiDelete(`/trucks/${id}`);

/** يبحث عن قلاب بنفس الاسم بالضبط عبر الـAPI الحقيقي، وإن لم يوجد يُنشئه — نفس منطق findOrCreateCustomer/Quarry */
export const findOrCreateTruck = async (name) => {
  const trimmed = String(name).trim();
  const list = await listTrucks();
  const existing = list.find((t) => t.name === trimmed);
  if (existing) return existing;
  return saveTruck({ name: trimmed });
};

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/apiClient';

export const listWorkers = () => apiGet('/workers');
export const listWorkerNames = async () => (await listWorkers()).map((w) => w.name);

export const getWorker = (id) => apiGet(`/workers/${id}`);
export const getWorkerByName = async (name) => {
  const list = await listWorkers();
  return list.find((w) => w.name === name) || null;
};
export const getWorkerStatement = (id, { from, to } = {}) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiGet(`/workers/${id}/statement${qs ? `?${qs}` : ''}`);
};

export const saveWorker = (worker) =>
  worker.id ? apiPut(`/workers/${worker.id}`, worker) : apiPost('/workers', worker);

export const deleteWorker = (id) => apiDelete(`/workers/${id}`);

/** يبحث عن عامل بنفس الاسم بالضبط عبر الـAPI الحقيقي، وإن لم يوجد يُنشئه — نفس منطق findOrCreateCustomer/Quarry/Truck */
export const findOrCreateWorker = async (name, extra = {}) => {
  const trimmed = String(name).trim();
  const list = await listWorkers();
  const existing = list.find((w) => w.name === trimmed);
  if (existing) return existing;
  return saveWorker({ name: trimmed, ...extra });
};

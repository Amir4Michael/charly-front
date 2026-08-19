import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/apiClient';

export const listCustomers = () => apiGet('/customers');
export const listCustomerNames = async () => (await listCustomers()).map((c) => c.name);

export const getCustomer = (id) => apiGet(`/customers/${id}`);
export const getCustomerStatement = (id, { from, to } = {}) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiGet(`/customers/${id}/statement${qs ? `?${qs}` : ''}`);
};

export const saveCustomer = (customer) =>
  customer.id ? apiPut(`/customers/${customer.id}`, customer) : apiPost('/customers', customer);

export const deleteCustomer = (id) => apiDelete(`/customers/${id}`);

/**
 * يبحث عن عميل بنفس الاسم بالضبط عبر الـAPI الحقيقي، وإن لم يوجد يُنشئه — نفس سلوك
 * findOrCreateCustomer القديم المعتمد على localStorage، لكن الآن على نفس مصدر البيانات
 * الحقيقي الذي تعرضه CustomersPage/PeoplePage، حتى لا تتكوّن "نسخة موازية" من العملاء
 * أثناء مرحلة الترحيل التدريجي (DailyReportFormPage لسه بيحفظ عبر reportsService المحلي مؤقتًا).
 */
export const findOrCreateCustomer = async (name) => {
  const trimmed = String(name).trim();
  const list = await listCustomers();
  const existing = list.find((c) => c.name === trimmed);
  if (existing) return existing;
  return saveCustomer({ name: trimmed });
};

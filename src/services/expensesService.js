import { apiGet, apiPost, apiDelete } from '@/lib/apiClient';

export const listExpenses = ({ from, to, category } = {}) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (category) params.set('category', category);
  const qs = params.toString();
  return apiGet(`/expenses${qs ? `?${qs}` : ''}`);
};

/** لا يوجد تعديل لمصروف مستقل في الفرونت الحالي (إضافة وحذف فقط) — الباك اند أيضًا بلا PUT لنفس السبب */
export const saveExpense = (expense) => apiPost('/expenses', expense);

export const deleteExpense = (id) => apiDelete(`/expenses/${id}`);

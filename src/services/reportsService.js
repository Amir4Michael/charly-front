import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/apiClient';
import { listQuarryNames } from './quarriesService';
import { listCustomerNames } from './customersService';

// ——— التقارير اليومية ———
// limit=1000: كل صفحات الفرونت الحالية تجلب كل التقارير دفعة واحدة وتُصفّي محليًا
// (سلوك موروث من localStorage القديم)، ولا توجد صفحة تدعم Pagination فعليًا بعد.
export const listReports = async ({ from, to } = {}) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  params.set('limit', '1000');
  return apiGet(`/reports/daily?${params.toString()}`);
};

export const getReport = (id) => apiGet(`/reports/daily/${id}`);

export const saveReport = (report) =>
  report.id ? apiPut(`/reports/daily/${report.id}`, report) : apiPost('/reports/daily', report);

export const deleteReport = (id) => apiDelete(`/reports/daily/${id}`);

// الكسارات — يُستخدم في نموذج التقرير اليومي
export const listCrushers = () => listQuarryNames();

export const addCrusher = async (name) => {
  const { saveQuarry } = await import('./quarriesService');
  await saveQuarry({ name, owner: '', phone: '', address: '', notes: '' });
  return listCrushers();
};

// العملاء — يُستخدم في نموذج التقرير اليومي
export const listCustomers = () => listCustomerNames();

export const getWeeklySchedule = (weekStart) => apiGet(`/schedules/weekly?weekStart=${weekStart}`);

export const saveWeeklySchedule = (schedule) => apiPut('/schedules/weekly', schedule);
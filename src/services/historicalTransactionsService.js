import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/apiClient';

// المسار الأساسي لكل نوع كيان (يطابق back/src/routes/*.js)
const BASE_PATHS = {
  customer: (id) => `/customers/${id}`,
  truck: (id) => `/trucks/${id}`,
  quarry: (id) => `/quarries/${id}`,
  supplier: (supplierType, id) => `/suppliers/${supplierType}/${id}`,
};

function basePath(entityType, id, supplierType) {
  if (entityType === 'supplier') return BASE_PATHS.supplier(supplierType, id);
  return BASE_PATHS[entityType](id);
}

export const listHistoricalTransactions = (entityType, id, supplierType) =>
  apiGet(`${basePath(entityType, id, supplierType)}/historical-transactions`);

export const addHistoricalTransaction = (entityType, id, data, supplierType) =>
  apiPost(`${basePath(entityType, id, supplierType)}/historical-transactions`, data);

export const updateHistoricalTransaction = (entityType, id, txId, data, supplierType) =>
  apiPut(`${basePath(entityType, id, supplierType)}/historical-transactions/${txId}`, data);

export const deleteHistoricalTransaction = (entityType, id, txId, supplierType) =>
  apiDelete(`${basePath(entityType, id, supplierType)}/historical-transactions/${txId}`);

// خيارات الاتجاه — تُعرض في نموذج إضافة/تعديل معاملة قديمة، والنص يوضّح المعنى بدل رمز مجرد
export const DIRECTION_OPTIONS = [
  { value: 'له', label: 'له (لصالحه / دفعة أو رصيد مستحق له)' },
  { value: 'عليه', label: 'عليه (مستحق عليه / عملية أو دين)' },
];

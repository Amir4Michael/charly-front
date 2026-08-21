import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/apiClient';

export const SUPPLIER_TYPE_LABELS = {
  shukayer: { title: 'موردو الشكاير', singular: 'مورد شكاير', searchHint: 'ابحث باسم المورد أو جهة الاتصال...' },
  woodenPallets: { title: 'موردو البالتات الخشب', singular: 'مورد بالتات خشب', searchHint: 'ابحث باسم المورد أو جهة الاتصال...' },
  jumbo: { title: 'موردو الجامبو', singular: 'مورد جامبو', searchHint: 'ابحث باسم المورد أو جهة الاتصال...' },
};

export const listSuppliers = (type) => apiGet(`/suppliers/${type}`);

export const getSupplier = (type, id) => apiGet(`/suppliers/${type}/${id}`);

export const saveSupplier = (type, supplier) =>
  supplier.id ? apiPut(`/suppliers/${type}/${supplier.id}`, supplier) : apiPost(`/suppliers/${type}`, supplier);

export const deleteSupplier = (type, id) => apiDelete(`/suppliers/${type}/${id}`);
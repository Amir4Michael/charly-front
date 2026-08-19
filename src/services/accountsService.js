import { apiGet } from '@/lib/apiClient';

export const getAccountsOverview = () => apiGet('/accounts/overview');

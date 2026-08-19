import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '@/lib/apiClient';

export const listUsers = () => apiGet('/users');

export const saveUser = (user) =>
  user.id ? apiPut(`/users/${user.id}`, user) : apiPost('/users', user);

export const deleteUser = (id) => apiDelete(`/users/${id}`);

export const toggleUserStatus = async (id) => {
  await apiPatch(`/users/${id}/toggle-status`);
  return listUsers();
};

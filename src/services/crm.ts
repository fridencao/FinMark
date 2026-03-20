import api from './api';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  idNumber?: string;
  accounts?: any[];
}

export async function getCustomer(customerId: string) {
  return api.get(`/crm/customers/${customerId}`);
}

export async function getCustomerAccounts(customerId: string) {
  return api.get(`/crm/customers/${customerId}/accounts`);
}

export async function getCustomerTransactions(customerId: string, options?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.limit) params.append('limit', options.limit.toString());
  return api.get(`/crm/customers/${customerId}/transactions?${params}`);
}

export async function searchCustomers(query?: {
  name?: string;
  phone?: string;
  idNumber?: string;
  accountNumber?: string;
}) {
  const params = new URLSearchParams();
  if (query?.name) params.append('name', query.name);
  if (query?.phone) params.append('phone', query.phone);
  if (query?.idNumber) params.append('idNumber', query.idNumber);
  if (query?.accountNumber) params.append('accountNumber', query.accountNumber);
  return api.get(`/crm/customers/search?${params}`);
}

export async function syncCustomers(since?: string) {
  const params = since ? `?since=${since}` : '';
  return api.post(`/crm/customers/sync${params}`);
}

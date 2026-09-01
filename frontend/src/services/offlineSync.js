import api from './api';

const OFFLINE_SALES_KEY = 'eco_pos_offline_sales_queue';

export function saveOfflineSale(saleData) {
  const existing = getOfflineSales();
  const newQueue = [...existing, { ...saleData, offlineTimestamp: new Date().toISOString() }];
  localStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(newQueue));
  return newQueue;
}

export function getOfflineSales() {
  const data = localStorage.getItem(OFFLINE_SALES_KEY);
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function clearOfflineSales() {
  localStorage.removeItem(OFFLINE_SALES_KEY);
}

export async function syncOfflineSalesWithBackend() {
  const queue = getOfflineSales();
  if (queue.length === 0) return { count: 0 };

  try {
    const res = await api.post('/pos/sales/sync', { offlineSales: queue });
    clearOfflineSales();
    return { count: queue.length, message: res.data.message };
  } catch (error) {
    console.error('Failed to sync offline sales:', error);
    throw error;
  }
}

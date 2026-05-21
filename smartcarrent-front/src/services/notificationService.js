import { api } from '../api/client';

export async function listNotifications(params = {}) {
  const { data } = await api.get('/notifications', { params: { per_page: 30, ...params } });
  return data;
}

export async function markNotificationAsRead(notificationId) {
  const { data } = await api.patch(`/notifications/${notificationId}/read`);
  return data;
}

export async function markAllNotificationsAsRead() {
  const { data } = await api.patch('/notifications/read-all');
  return data;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getActiveNotifications } from './databaseService';

const dismissedKey = (userId) => `notif_dismissed_${userId ?? 'guest'}`;

export async function getDismissedNotificationIds(userId) {
  try {
    const raw = await AsyncStorage.getItem(dismissedKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number) : [];
  } catch {
    return [];
  }
}

export async function dismissNotification(userId, notificationId) {
  const ids = await getDismissedNotificationIds(userId);
  if (!ids.includes(notificationId)) {
    ids.push(notificationId);
    await AsyncStorage.setItem(dismissedKey(userId), JSON.stringify(ids));
  }
}

export async function loadNotificationsForUser(userId) {
  const res = await getActiveNotifications();
  if (!res.success) return { notifications: [], unreadCount: 0, popupNotification: null };
  const dismissed = await getDismissedNotificationIds(userId);
  const notifications = res.data || [];
  const unread = notifications.filter((n) => !dismissed.includes(n.id));
  const popup = unread.find((n) => n.showAsPopup === 1) || unread[0] || null;
  return {
    notifications,
    unreadCount: unread.length,
    popupNotification: popup,
    dismissedIds: dismissed,
  };
}

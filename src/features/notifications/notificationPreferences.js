import { StorageService } from '../../core/storage/storageService';

/**
 * Preferences only. No local or push notification is ever actually
 * scheduled or sent by this build — matching the Flutter source exactly
 * (it deliberately omits flutter_local_notifications/Firebase for the
 * same reason). This exists so a future real integration has real user
 * preferences to read, and so the UI can be honest about current
 * capability. The browser Notification API is not used here either:
 * requesting permission and silently doing nothing with it would be
 * more misleading than not requesting it at all.
 */
const DEFAULT_PREFERENCES = { studyReminderEnabled: false, studyReminderTime: '19:00', weeklyReviewReminderEnabled: false };

export function loadNotificationPreferences() {
  const json = StorageService.readJson(StorageService.keys.notificationPreferences);
  return json ? { ...DEFAULT_PREFERENCES, ...json } : DEFAULT_PREFERENCES;
}
export function saveNotificationPreferences(preferences) {
  StorageService.writeJson(StorageService.keys.notificationPreferences, preferences);
}

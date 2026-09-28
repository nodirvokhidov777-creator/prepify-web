/** The approved manual-sales contact for PREPIFY PRO purchases. A real
 * business contact, not a payment processor — no payment is completed
 * by opening this link; it only starts a conversation. */
export const TELEGRAM_HANDLE = '@V0khidov';
export const TELEGRAM_URL = 'https://t.me/V0khidov';

/** Builds the deep link Telegram uses to open a chat with a prefilled
 * (not sent) draft message. `deviceRefId` is included so the person
 * fulfilling the order knows which local installation to activate. */
export function buildTelegramPurchaseUrl(deviceRefId) {
  const message = `Hello! I'd like to purchase PREPIFY PRO. My account email or user ID is: ${deviceRefId}`;
  return `${TELEGRAM_URL}?text=${encodeURIComponent(message)}`;
}

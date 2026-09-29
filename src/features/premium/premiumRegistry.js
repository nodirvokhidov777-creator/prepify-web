import { StorageService } from '../../core/storage/storageService';
import { normalizeCustomerId } from '../../../shared/customerId.js';

/** Single source of truth for the displayed PRO price. Change it here
 * only — every screen that shows a price imports this rather than
 * hardcoding its own copy, so the app can never show two different
 * prices at once. No annual plan, discount, or extra fee exists; this
 * is the only price PREPIFY currently charges. */
export const PREMIUM_MONTHLY_PRICE_USD = 4.99;
export const PREMIUM_MONTHLY_PRICE_DISPLAY = '$4.99/month';

export const PremiumFeature = {
  ADVANCED_ANALYTICS: 'advancedAnalytics', UNLIMITED_MOCK_EXAMS: 'unlimitedMockExams',
  FULL_JOURNEY_INSIGHTS: 'fullJourneyInsights', DATA_EXPORT: 'dataExport', PREMIUM_CONTENT_LIBRARY: 'premiumContentLibrary',
};

/**
 * ENTITLEMENT MODEL — read before changing anything here.
 *
 * Whether a customer has PRO is decided ONLY by the server (GET
 * /api/entitlement, backed by Redis). The browser never stores "isPro":
 * nothing in localStorage can grant, extend or prove access. The only thing
 * kept locally is the customer ID below, which is an identifier, not a
 * permission. See docs/PREMIUM_ENTITLEMENT.md for the full design, the
 * setup steps, and the limits of this approach (notably that Premium
 * content itself is still bundled into the public JavaScript).
 */
export function isFeatureUnlocked(_feature, entitlements) {
  return entitlements.isPro === true;
}

const ID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randomSegment(length) {
  const bytes = new Uint32Array(length);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes); // cryptographically secure
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 2 ** 32); // very old browsers only
  }
  return Array.from(bytes, (n) => ID_ALPHABET[n % 36]).join('');
}

/**
 * The customer ID: an anonymous identifier generated once per browser and
 * reused thereafter. Customers quote it when buying, and the server keys
 * their entitlement by it. It is NOT a login: anyone who has this value can
 * look up that account's status, so it should be handled like a receipt
 * number rather than kept confidential. Existing IDs are always preserved
 * exactly as stored.
 */
export function loadOrCreateDeviceRefId() {
  const existing = StorageService.readJson(StorageService.keys.deviceRefId);
  if (typeof existing?.id === 'string' && existing.id) return existing.id;
  const id = `PRP-${Date.now().toString(36).toUpperCase().padStart(8, '0').slice(-8)}-${randomSegment(6)}`;
  StorageService.writeJson(StorageService.keys.deviceRefId, { id });
  return id;
}

/** Adopts an ID entered through the restore-access flow. Validated first so
 * a malformed value can never replace a good stored ID.
 * Note: this ID is a lookup key, not a login credential — anyone who knows
 * it can query its status, so it should be handled like a receipt number. */
export function setDeviceRefId(rawId) {
  const id = normalizeCustomerId(rawId);
  if (!id) throw new Error('Invalid PREPIFY ID.');
  StorageService.writeJson(StorageService.keys.deviceRefId, { id });
  return id;
}

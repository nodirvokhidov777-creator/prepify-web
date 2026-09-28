import { StorageService } from '../../core/storage/storageService';

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

export function loadEntitlements() {
  const json = StorageService.readJson(StorageService.keys.proEntitlement);
  return { isPro: json?.isPro === true };
}

/**
 * SECURITY NOTE — read before wiring up any real activation mechanism:
 *
 * This app has no backend and no real user-account/auth system — every
 * value here lives in this one browser's localStorage. That means:
 *
 * 1. There is currently no way to build a genuinely secure "admin panel"
 *    in this frontend alone. Any client-side toggle for Premium — no
 *    matter how it's hidden or gated in the UI — can be flipped by any
 *    user directly via browser devtools (calling this very function, or
 *    editing localStorage by hand). This function exists for local
 *    development/testing only and must never be exposed as a
 *    user-reachable button or menu item in the shipped app.
 * 2. Real, secure Premium activation requires a backend: a server that
 *    holds the actual source of truth for who has paid, an
 *    authenticated way for this client to ask "am I entitled?" (e.g. a
 *    signed token or session tied to a real account), and an admin
 *    surface that runs server-side, not in this bundle.
 * 3. Until that backend exists, Premium here is activated manually and
 *    out-of-band (via the Telegram flow in ProUpgradeScreen): the
 *    person managing sales receives a payment and a `deviceRefId` (see
 *    below), and would need a real backend/database to actually flip
 *    that specific device's entitlement remotely. Without one, this
 *    function is the only way this codebase can set `isPro` at all —
 *    which is why it must stay a manual, local, developer-only call.
 */
export function setProForTesting(isPro) {
  return StorageService.writeJson(StorageService.keys.proEntitlement, { isPro });
}

export function isFeatureUnlocked(_feature, entitlements) {
  return entitlements.isPro === true;
}

/**
 * A persistent, anonymous, local identifier — the closest honest
 * equivalent to "your account" this app can offer without any real
 * authentication. Generated once per browser/device and reused
 * thereafter, so a user can quote it when purchasing manually via
 * Telegram, and (once a real backend exists) it becomes the natural key
 * an admin system would use to target a specific installation. This is
 * NOT a secure account identifier — it lives in localStorage, is
 * visible to the user, and can be cleared or duplicated. It is only a
 * reference string for manual, human-mediated activation.
 */
export function loadOrCreateDeviceRefId() {
  const existing = StorageService.readJson(StorageService.keys.deviceRefId);
  if (existing?.id) return existing.id;
  const id = `PRP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  StorageService.writeJson(StorageService.keys.deviceRefId, { id });
  return id;
}

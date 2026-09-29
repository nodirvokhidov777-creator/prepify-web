import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { attemptRestore, fetchEntitlement, resolveClientAccess } from './entitlementApi.js';
import { loadOrCreateDeviceRefId, setDeviceRefId } from './premiumRegistry';

/**
 * Server-verified PRO status for the whole app. State lives in memory only:
 * it is fetched from the backend on load, on tab re-focus and on demand, and
 * is never read from or written to localStorage.
 *
 * Failure behaviour: if the backend is unreachable the app stays fully usable
 * on the free tier. PRO is never granted by default; the only thing kept
 * through an outage is a result the server itself confirmed earlier in this
 * session, and a monthly plan is still cut off at its own expiry time.
 */
const FREE_DEFAULT = Object.freeze({
  isPro: false, loading: false, unavailable: false, plan: null, accessStatus: null, expiresAt: null,
  customerId: '', refresh: async () => {}, restore: async () => ({ ok: false, reason: 'unavailable' }),
});

const EntitlementContext = createContext(FREE_DEFAULT);

export function EntitlementProvider({ children }) {
  const [customerId, setCustomerId] = useState(() => loadOrCreateDeviceRefId());
  const [state, setState] = useState({ loading: true, unavailable: false, verified: null });
  const idRef = useRef(customerId);

  const check = useCallback(async (id) => {
    try {
      const result = await fetchEntitlement(id);
      if (idRef.current !== id) return; // the ID changed (restore) while this was in flight
      setState({ loading: false, unavailable: false, verified: result });
    } catch {
      if (idRef.current !== id) return;
      setState((previous) => ({ loading: false, unavailable: true, verified: previous.verified }));
    }
  }, []);

  const refresh = useCallback(() => check(idRef.current), [check]);

  useEffect(() => {
    check(idRef.current);
    const onVisible = () => { if (document.visibilityState === 'visible') check(idRef.current); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [check]);

  const restore = useCallback(async (rawId) => {
    const outcome = await attemptRestore(rawId, { adopt: setDeviceRefId });
    if (outcome.ok) {
      idRef.current = outcome.customerId;
      setCustomerId(outcome.customerId);
      setState({ loading: false, unavailable: false, verified: outcome.result });
    }
    return outcome;
  }, []);

  const value = useMemo(() => {
    const access = resolveClientAccess(state.verified, Date.now());
    return {
      isPro: access.isPro,
      plan: access.plan,
      accessStatus: access.status,
      expiresAt: access.expiresAt,
      loading: state.loading && !state.verified,
      unavailable: state.unavailable,
      customerId, refresh, restore,
    };
  }, [state, customerId, refresh, restore]);

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlements() {
  return useContext(EntitlementContext);
}

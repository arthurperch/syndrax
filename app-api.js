// app-api.js — data layer for the Syndrax app (onboarding + dashboard).
// Talks to the cloud API as the signed-in Cognito user. If the API is
// unreachable or not yet deployed, it transparently falls back to localStorage
// so the experience is fully usable during launch and upgrades seamlessly once
// the backend is live.
import { getSession } from '/auth-cognito.js';

const API_BASE =
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://api.syndrax.io';

const LS_PROFILE = 'syndrax_profile_v1';
const LS_MARKETS = 'syndrax_marketplaces_v1';

function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

async function api(path, opts = {}) {
  const session = getSession();
  if (!session) throw new Error('not signed in');
  const res = await fetch(API_BASE + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + session.idToken,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json().catch(() => ({}));
}

// True when an error means "API not available" (so we should use the local copy).
function isOffline(e) {
  return e instanceof TypeError /* network */ || e.status === 503 || e.status === 404;
}

// ── Profile ──────────────────────────────────────────────────────────────────
export async function getProfile() {
  try {
    return await api('/api/profile');
  } catch (e) {
    if (isOffline(e)) return lsGet(LS_PROFILE, { onboarding_complete: false });
    throw e;
  }
}

export async function saveProfile(patch) {
  // Always keep a local mirror so onboarding never loses progress.
  const merged = { ...lsGet(LS_PROFILE, {}), ...patch };
  lsSet(LS_PROFILE, merged);
  try {
    return await api('/api/profile', { method: 'PUT', body: JSON.stringify(patch) });
  } catch (e) {
    if (isOffline(e)) return merged;
    throw e;
  }
}

// ── Marketplaces ─────────────────────────────────────────────────────────────
// Shape: { accounts: [{ id, marketplace, label, deviceId, status, eligibility }] }
export async function getMarketplaces() {
  try {
    return await api('/api/marketplaces');
  } catch (e) {
    if (isOffline(e)) return { accounts: lsGet(LS_MARKETS, []) };
    throw e;
  }
}

export async function addMarketplaceAccount(account) {
  const local = lsGet(LS_MARKETS, []);
  const rec = { id: 'mk_' + Math.random().toString(36).slice(2, 9), status: 'connected', ...account };
  lsSet(LS_MARKETS, [...local, rec]);
  try {
    return await api('/api/marketplaces', { method: 'POST', body: JSON.stringify(account) });
  } catch (e) {
    if (isOffline(e)) return rec;
    throw e;
  }
}

export async function removeMarketplaceAccount(id) {
  lsSet(LS_MARKETS, lsGet(LS_MARKETS, []).filter((a) => a.id !== id));
  try {
    return await api('/api/marketplaces/' + encodeURIComponent(id), { method: 'DELETE' });
  } catch (e) {
    if (isOffline(e)) return { ok: true };
    throw e;
  }
}

// ── Audit (server is authoritative; local is the fallback) ────────────────────
export async function getAudit() {
  try {
    return await api('/api/audit');
  } catch (e) {
    if (isOffline(e)) return null; // caller computes a local audit via plans.js
    throw e;
  }
}

window.SyndraxApp = { getProfile, saveProfile, getMarketplaces, addMarketplaceAccount, removeMarketplaceAccount, getAudit };

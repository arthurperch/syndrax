// Syndrax plan + marketplace model — SINGLE SOURCE OF TRUTH for the website.
// Keep this in sync with the cloud (src/config/plans.ts + marketplaces.ts) and
// the extension (src/services/plans.ts). The shape is intentionally identical so
// the same risk-audit logic runs on web, API, and extension.
//
// Core thesis encoded here: multiple marketplace accounts sharing ONE device/IP
// is what gets sellers restricted. Plan limits are framed as SAFETY, and the
// upgrade pitch is "scale without bans" via device/IP isolation (relay/fleet).

// Plan enum (standardized): none | trial | business | growth | enterprise
export const PLAN_ORDER = ['none', 'trial', 'business', 'growth', 'enterprise'];

export const PLAN_LABEL = {
  none: 'No plan yet',
  trial: 'Free trial',
  business: 'Business',
  growth: 'Growth',
  enterprise: 'Enterprise',
};

export const PLAN_PRICE = {
  none: '',
  trial: 'Free for 7 days',
  business: '$50/mo',
  growth: '$99/mo',
  enterprise: '$200/mo',
};

// Infinity is JSON-unsafe; we use null to mean "unlimited" and treat it as ∞.
export const UNLIMITED = null;

export const PLAN_LIMITS = {
  none:       { maxDevices: 0, maxAccountsPerMarketplace: 0, remote: false, teamSeats: 1 },
  trial:      { maxDevices: 1, maxAccountsPerMarketplace: 1, remote: false, teamSeats: 1 },
  business:   { maxDevices: 1, maxAccountsPerMarketplace: 1, remote: false, teamSeats: 1 },
  growth:     { maxDevices: 3, maxAccountsPerMarketplace: 3, remote: true,  teamSeats: 3 },
  enterprise: { maxDevices: UNLIMITED, maxAccountsPerMarketplace: UNLIMITED, remote: true, teamSeats: UNLIMITED },
};

// Human one-liners used on the plan cards / upgrade nudges.
export const PLAN_TAGLINE = {
  trial: 'Experience the dashboard — one account on this device.',
  business: 'One marketplace account, this device only. Safe and simple.',
  growth: 'Up to 3 devices and 3 accounts per marketplace — stack marketplaces freely, with remote dispatch.',
  enterprise: 'Unlimited devices and accounts, full remote fleet with screen control, team, white-label.',
};

// What the next paid tier unlocks (used by the upgrade CTA copy).
export function nextPlan(plan) {
  if (plan === 'trial' || plan === 'business' || plan === 'none') return 'growth';
  if (plan === 'growth') return 'enterprise';
  return null;
}

export function isUnlimited(v) { return v === UNLIMITED || v === Infinity; }

// ── Marketplaces ─────────────────────────────────────────────────────────────
// status: 'live'   → fully wired automations (eBay today)
//         'beta'   → connectable on this device, partial support
//         'soon'   → selectable, "coming soon"
// access: 'open'   → anyone can connect
//         'gated'  → requires eligibility (EIN + sales history + application),
//                    e.g. Walmart. Syndrax guides + helps apply.
//         'source' → a sourcing platform (buy side), not a sell channel
export const MARKETPLACES = [
  { id: 'ebay',     name: 'eBay',                status: 'live', access: 'open',   color: '#e53238' },
  { id: 'etsy',     name: 'Etsy',                status: 'soon', access: 'open',   color: '#f1641e' },
  { id: 'poshmark', name: 'Poshmark',            status: 'soon', access: 'open',   color: '#a01441' },
  { id: 'mercari',  name: 'Mercari',             status: 'soon', access: 'open',   color: '#5454d4' },
  { id: 'depop',    name: 'Depop',               status: 'soon', access: 'open',   color: '#ff2300' },
  { id: 'grailed',  name: 'Grailed',             status: 'soon', access: 'open',   color: '#000000' },
  { id: 'vinted',   name: 'Vinted',              status: 'soon', access: 'open',   color: '#09b1ba' },
  { id: 'whatnot',  name: 'Whatnot',             status: 'soon', access: 'open',   color: '#fbe04b' },
  { id: 'shopify',  name: 'Shopify',             status: 'soon', access: 'open',   color: '#95bf47' },
  { id: 'facebook', name: 'Facebook Marketplace',status: 'soon', access: 'open',   color: '#1877f2' },
  { id: 'walmart',  name: 'Walmart Marketplace', status: 'soon', access: 'gated',  color: '#0071dc' },
  { id: 'amazon',   name: 'Amazon',              status: 'beta', access: 'source', color: '#ff9900' },
];

export function marketplace(id) { return MARKETPLACES.find((m) => m.id === id) || null; }

// Inline brand marks (CSP-safe — inline SVG, no external img). Returned as an
// HTML string to drop inside a brand-colored chip. Falls back to a monogram
// (handled by the caller) when a brand has no bespoke glyph.
export const MARKETPLACE_LOGOS = {
  amazon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15.5c4.6 3 11.4 3 16 0"/><path d="M16.8 14.7l2.4.2-.5 2.4"/></svg>',
  walmart:
    '<svg viewBox="0 0 24 24" fill="#fff"><g><rect x="11" y="2" width="2" height="7" rx="1"/><rect x="11" y="15" width="2" height="7" rx="1"/><rect x="2" y="11" width="7" height="2" rx="1"/><rect x="15" y="11" width="7" height="2" rx="1"/><rect x="5.4" y="5.4" width="2" height="7" rx="1" transform="rotate(-45 6.4 8.9)"/><rect x="16.6" y="11.1" width="2" height="7" rx="1" transform="rotate(-45 17.6 14.6)"/></g></svg>',
  shopify:
    '<svg viewBox="0 0 24 24" fill="#fff"><path d="M8 7V6a4 4 0 0 1 8 0v1h2.2l1.3 13.5a1 1 0 0 1-1 1.1H5.5a1 1 0 0 1-1-1.1L5.8 7H8zm2 0h4V6a2 2 0 1 0-4 0v1z"/></svg>',
  facebook:
    '<svg viewBox="0 0 24 24" fill="#fff"><path d="M13.5 21v-8h2.5l.5-3h-3V8.2c0-.9.3-1.5 1.6-1.5H17V4.1A21 21 0 0 0 14.7 4C12.4 4 10.8 5.4 10.8 8v2H8.3v3h2.5v8h2.7z"/></svg>',
  ebay:
    '<svg viewBox="0 0 48 20"><text x="0" y="15" font-family="Arial, sans-serif" font-size="16" font-weight="800" font-style="italic"><tspan fill="#e53238">e</tspan><tspan fill="#0064d2">b</tspan><tspan fill="#f5af02">a</tspan><tspan fill="#86b817">y</tspan></text></svg>',
  etsy:
    '<svg viewBox="0 0 24 24" fill="#fff"><path d="M9 5.5h7.5v2H14v9h2.5v2H9v-2h2.3v-9H9z" opacity="0"/><text x="12" y="17" text-anchor="middle" font-family="Georgia, serif" font-size="15" font-weight="800" fill="#fff">E</text></svg>',
  poshmark:
    '<svg viewBox="0 0 24 24"><text x="12" y="17" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="800" fill="#fff">P</text></svg>',
};

export function marketplaceLogo(id) { return MARKETPLACE_LOGOS[id] || null; }

// Eligibility guidance for gated marketplaces. `profile` carries { ein, salesProof }.
export function eligibility(marketplaceId, profile = {}) {
  const mk = marketplace(marketplaceId);
  if (!mk || mk.access !== 'gated') return { status: 'open', message: '' };
  if (marketplaceId === 'walmart') {
    const hasEin = !!(profile.ein && String(profile.ein).trim());
    const hasSales = !!profile.salesProof;
    if (hasEin && hasSales) {
      return { status: 'eligible', message: 'You meet the basics for Walmart. We can help you apply and get approved.' };
    }
    if (hasEin) {
      return { status: 'building', message: 'Walmart requires proof of sales. Keep selling on eBay — your sales history can seed the application. We’ll help you apply once you qualify.' };
    }
    return { status: 'not_eligible', message: 'Walmart requires a registered business (EIN) and proof of sales. Add your EIN and grow your eBay sales — Syndrax guides you through the whole approval.' };
  }
  return { status: 'not_eligible', message: 'This marketplace requires approval. Syndrax will guide you through eligibility.' };
}

// ── Risk audit (the upgrade engine) ──────────────────────────────────────────
// Shared logic — also implemented identically on the API (source of truth) and
// the extension. Given the plan and the user's current footprint, return findings.
//
//   plan:               'business' | 'growth' | ...
//   accountsByMarketplace: { ebay: 2, poshmark: 1, ... }  (account counts)
//   devices:            [{ id, name }]                      (connected devices)
//   accountsPerDevice:  { 'dev-abc': 2, ... }   (optional — same-IP detection)
//
// Returns: { level: 'ok'|'warn'|'block', findings: [{level, title, detail, upgradeTo}] }
export function runAudit({ plan = 'none', accountsByMarketplace = {}, devices = [], accountsPerDevice = {} } = {}) {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.none;
  const findings = [];

  // 1) Accounts per marketplace vs limit
  if (!isUnlimited(limits.maxAccountsPerMarketplace)) {
    for (const [mk, count] of Object.entries(accountsByMarketplace)) {
      if (count > limits.maxAccountsPerMarketplace) {
        findings.push({
          level: 'warn',
          title: `${marketplace(mk)?.name || mk}: ${count} accounts on ${PLAN_LABEL[plan]}`,
          detail: `Your plan allows ${limits.maxAccountsPerMarketplace} ${marketplace(mk)?.name || mk} account${limits.maxAccountsPerMarketplace === 1 ? '' : 's'}. Marketplaces flag linked accounts on one device/IP — this raises restriction risk. ${PLAN_LABEL[nextPlan(plan)]} isolates each account on its own device/IP.`,
          upgradeTo: nextPlan(plan),
        });
      }
    }
  }

  // 2) Devices vs limit
  if (!isUnlimited(limits.maxDevices) && devices.length > limits.maxDevices) {
    findings.push({
      level: 'warn',
      title: `${devices.length} devices on ${PLAN_LABEL[plan]}`,
      detail: `Your plan covers ${limits.maxDevices} device${limits.maxDevices === 1 ? '' : 's'}. Add more on ${PLAN_LABEL[nextPlan(plan)]} to spread accounts across separate IPs.`,
      upgradeTo: nextPlan(plan),
    });
  }

  // 3) Same-device/IP stacking (the real ban driver)
  for (const [dev, count] of Object.entries(accountsPerDevice)) {
    if (count > 1) {
      const dname = devices.find((d) => d.id === dev)?.name || 'this device';
      findings.push({
        level: 'warn',
        title: `${count} accounts on ${dname}`,
        detail: `Running ${count} marketplace accounts from the same device/IP is the #1 cause of linked-account restrictions. Syndrax isolates accounts across devices on ${PLAN_LABEL[nextPlan(plan) || 'growth']} — that’s how we keep you un-restricted.`,
        upgradeTo: nextPlan(plan) || 'growth',
      });
    }
  }

  // 4) Remote attempted on a local-only plan (soft block, surfaced by caller)
  // handled where remote is requested; included for completeness.

  const level = findings.length === 0 ? 'ok' : 'warn';
  return { level, findings };
}

// Expose globally for non-module scripts/inline use.
if (typeof window !== 'undefined') {
  window.SyndraxPlans = {
    PLAN_ORDER, PLAN_LABEL, PLAN_PRICE, PLAN_LIMITS, PLAN_TAGLINE, UNLIMITED,
    MARKETPLACES, marketplace, marketplaceLogo, eligibility, runAudit, nextPlan, isUnlimited,
  };
}

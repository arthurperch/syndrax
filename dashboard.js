// dashboard.js — renders the simple, tier-aware /app dashboard.
// Reads plan from billing, profile + marketplaces from app-api, and runs the
// shared risk audit (server authoritative, local fallback via plans.js).
import { getSession, signOut } from '/auth-cognito.js';
import { getStatus, openPortal, startCheckout } from '/billing.js';
import { getProfile, getMarketplaces, getAudit } from '/app-api.js';
import {
  PLAN_LABEL, PLAN_PRICE, PLAN_TAGLINE, PLAN_LIMITS,
  MARKETPLACES, marketplace, eligibility, runAudit, nextPlan, isUnlimited,
} from '/plans.js';

const session = getSession();
if (!session) location.replace('/login');

const alertEl = document.getElementById('appAlert');
function showAlert(msg, type = 'error') { alertEl.textContent = msg; alertEl.className = 'auth-alert ' + type; }

// Identity
let email = '';
try { email = JSON.parse(atob(session.idToken.split('.')[1])).email || ''; } catch {}
document.getElementById('topEmail').textContent = email;
const firstName = (email.split('@')[0] || 'there').replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
document.getElementById('greeting').textContent = `Welcome back, ${firstName}`;

document.getElementById('signOut').onclick = () => { signOut(); location.href = '/login'; };

// Post-checkout success banner
if (new URLSearchParams(location.search).get('status') === 'success') {
  showAlert('Payment received — welcome aboard! Your plan is active.', 'success');
}

let plan = 'none';
let profile = {};
let accounts = [];

async function load() {
  // Plan
  try {
    const s = await getStatus();
    plan = s.plan || 'none';
    renderPlan(s);
  } catch (e) { renderPlan({ plan: 'none', status: 'none' }); }

  // First-time users → onboarding
  try { profile = await getProfile(); } catch { profile = {}; }
  if (!profile.onboarding_complete && plan === 'none') { location.replace('/onboarding'); return; }

  document.getElementById('topPlan').textContent = PLAN_LABEL[plan] || plan;
  document.getElementById('topPlan').className = 'app-plan-chip plan-' + plan;
  document.getElementById('subline').textContent = PLAN_TAGLINE[plan] || 'Here’s everything running under your account.';

  // Marketplaces
  try { const mk = await getMarketplaces(); accounts = mk.accounts || []; } catch { accounts = []; }
  renderMarketplaces();

  // Devices (extension handshake)
  renderDevice();

  // Audit (server first, local fallback)
  let audit = null;
  try { audit = await getAudit(); } catch {}
  if (!audit) audit = runAudit(buildAuditInput());
  renderAudit(audit);
}

function buildAuditInput() {
  const accountsByMarketplace = {};
  const accountsPerDevice = {};
  for (const a of accounts) {
    accountsByMarketplace[a.marketplace] = (accountsByMarketplace[a.marketplace] || 0) + 1;
    const d = a.deviceId || 'this-device';
    accountsPerDevice[d] = (accountsPerDevice[d] || 0) + 1;
  }
  const devices = [...new Set(accounts.map(a => a.deviceId || 'this-device'))].map(id => ({ id, name: id === 'this-device' ? 'This device' : id }));
  return { plan, accountsByMarketplace, accountsPerDevice, devices };
}

function renderPlan(s) {
  document.getElementById('planName').textContent = `${PLAN_LABEL[s.plan] || s.plan}${PLAN_PRICE[s.plan] ? ' — ' + PLAN_PRICE[s.plan] : ''}`;
  const bits = [];
  if (s.status && s.status !== 'none') bits.push('Status: ' + s.status);
  if (s.trial_ends_at) {
    const days = Math.max(0, Math.ceil((new Date(s.trial_ends_at) - Date.now()) / 86400000));
    bits.push(`Trial ends ${new Date(s.trial_ends_at).toLocaleDateString()} (${days} day${days === 1 ? '' : 's'} left)`);
  } else if (s.current_period_end) {
    bits.push('Renews ' + new Date(s.current_period_end).toLocaleDateString());
  }
  document.getElementById('planMeta').textContent = bits.join(' · ');

  const btns = document.getElementById('planBtns');
  btns.innerHTML = '';
  const has = s.plan && s.plan !== 'none';
  const np = nextPlan(s.plan);
  if (!has) {
    const b = mkBtn('Start 7-day free trial', () => startCheckout('business').catch(e => showAlert(e.message)));
    btns.appendChild(b);
  } else {
    btns.appendChild(mkBtn('Manage billing', () => openPortal().catch(e => showAlert(e.message)), 'ghost'));
  }
  if (np) btns.appendChild(mkBtn(`Upgrade to ${PLAN_LABEL[np]}`, () => startCheckout(np).catch(e => showAlert(e.message))));
}

function renderMarketplaces() {
  const limit = PLAN_LIMITS[plan]?.maxAccountsPerMarketplace;
  const counts = {};
  accounts.forEach(a => counts[a.marketplace] = (counts[a.marketplace] || 0) + 1);
  document.getElementById('mkSummary').textContent = accounts.length
    ? `· ${accounts.length} account${accounts.length === 1 ? '' : 's'} connected`
    : '· none yet';

  const grid = document.getElementById('mkGrid');
  grid.innerHTML = '';
  MARKETPLACES.forEach(m => {
    const n = counts[m.id] || 0;
    const el = document.createElement('a');
    el.className = 'mk-tile' + (n ? ' selected' : '');
    el.href = '/onboarding';
    const badge = m.access === 'gated' ? 'gated' : m.status;
    const badgeLabel = m.access === 'gated' ? 'Gated' : m.status === 'live' ? 'Live' : m.status === 'beta' ? 'Beta' : 'Soon';
    const overLimit = !isUnlimited(limit) && n > limit;
    el.innerHTML = `
      <span class="mk-badge ${badge}">${badgeLabel}</span>
      <span class="mk-dot" style="background:${m.color}">${m.name[0]}</span>
      <div class="mk-name">${m.name}</div>
      <div class="mk-status">${n ? '' : (m.access === 'source' ? 'Sourcing' : 'Connect →')}</div>
      ${n ? `<div class="mk-count" style="${overLimit ? 'color:#fcd34d' : ''}">${n}${isUnlimited(limit) ? '' : ' / ' + limit} account${n === 1 ? '' : 's'}${overLimit ? ' ⚠️' : ''}</div>` : ''}`;
    grid.appendChild(el);
    if (m.access === 'gated' && (n || profile.ein)) {
      const elig = eligibility(m.id, { ein: profile.ein });
      if (elig.message) {
        const note = document.createElement('div');
        note.className = 'eligibility ' + (elig.status === 'eligible' ? 'eligible' : '');
        note.style.gridColumn = '1 / -1';
        note.innerHTML = `<b>${m.name}:</b> ${elig.message}`;
        grid.appendChild(note);
      }
    }
  });
}

function renderDevice() {
  const apply = () => {
    const ext = window.SyndraxExt || { installed: false };
    const box = document.getElementById('devStatus');
    const btns = document.getElementById('devBtns');
    if (ext.installed) {
      box.className = 'device-status connected';
      box.querySelector('.ds-icon').textContent = '✓';
      document.getElementById('devTitle').textContent = 'This device is connected';
      document.getElementById('devSub').textContent = `Extension v${ext.version || ''} — ready to run automations on this IP.`;
      btns.innerHTML = '';
    } else {
      box.className = 'device-status missing';
      box.querySelector('.ds-icon').textContent = '🧩';
      document.getElementById('devTitle').textContent = 'Extension not detected';
      document.getElementById('devSub').textContent = 'Install the Syndrax extension to run automations on this device.';
      btns.innerHTML = '';
      const a = document.createElement('a');
      a.className = 'app-btn'; a.textContent = 'Add to Chrome';
      a.href = 'https://chromewebstore.google.com/detail/mgapfpdkkihbeehfkgoajhealmgpnglo';
      a.target = '_blank'; a.rel = 'noopener';
      btns.appendChild(a);
    }
  };
  apply();
  document.addEventListener('syndrax-ext', apply);
}

function renderAudit(audit) {
  const box = document.getElementById('auditBox');
  const ok = audit.level === 'ok';
  box.innerHTML = `<div class="audit ${ok ? 'ok' : 'warn'}">
    <div class="audit-head">${ok ? '✓ You’re running safely' : '⚠️ ' + audit.findings.length + ' thing' + (audit.findings.length === 1 ? '' : 's') + ' to review'}</div>
    ${ok ? '<div class="audit-finding"><div class="f-detail">Your accounts are within safe limits for ' + (PLAN_LABEL[plan] || plan) + '. Syndrax keeps each account isolated on its own device/IP to avoid linked-account restrictions.</div></div>'
        : audit.findings.map(f => `<div class="audit-finding"><div class="f-title">${f.title}</div><div class="f-detail">${f.detail}</div>${f.upgradeTo ? `<div class="app-btn-row"><button class="app-btn sm" data-up="${f.upgradeTo}">Upgrade to ${PLAN_LABEL[f.upgradeTo]}</button></div>` : ''}</div>`).join('')}
  </div>`;
  box.querySelectorAll('[data-up]').forEach(b => b.onclick = () => startCheckout(b.dataset.up).catch(e => showAlert(e.message)));
}

function mkBtn(label, onClick, variant) {
  const b = document.createElement('button');
  b.className = 'app-btn' + (variant === 'ghost' ? ' ghost' : '');
  b.textContent = label; b.onclick = onClick;
  return b;
}

// Open extension dashboard (best-effort: ping then deep-link).
document.getElementById('openExt').onclick = () => {
  const ext = window.SyndraxExt;
  if (ext && ext.installed && ext.id) {
    window.open(`chrome-extension://${ext.id}/dashboard.html`, '_blank');
  } else {
    showAlert('Install the Syndrax extension first, then reopen this page.', 'error');
  }
};

load();

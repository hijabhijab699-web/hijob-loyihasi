/**
 * Options page — sign the extension into the admin backend. Mirrors the
 * admin-web login flow but stores the JWT in chrome.storage.local so the
 * service worker can attach it to subsequent /admin/* requests.
 */

const DEFAULT_API_BASE = 'http://localhost:4000/api/v1';

const apiBaseInput = document.getElementById('api-base');
const identifierInput = document.getElementById('identifier');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login');
const logoutBtn = document.getElementById('logout');
const statusEl = document.getElementById('status');
const logoutStatusEl = document.getElementById('logout-status');
const loggedInEl = document.getElementById('logged-in');
const loggedOutEl = document.getElementById('logged-out');
const whoEl = document.getElementById('who');

function setStatus(el, text, kind) {
  el.textContent = text;
  el.className = `status ${kind}`;
}

async function load() {
  const { apiBase, accessToken, user } = await chrome.storage.local.get(['apiBase', 'accessToken', 'user']);
  apiBaseInput.value = apiBase || DEFAULT_API_BASE;
  if (accessToken && user) {
    loggedInEl.style.display = '';
    loggedOutEl.style.display = 'none';
    whoEl.textContent = user.fullName || `@${user.username}`;
  } else {
    loggedInEl.style.display = 'none';
    loggedOutEl.style.display = '';
  }
}

apiBaseInput.addEventListener('change', async () => {
  await chrome.storage.local.set({ apiBase: apiBaseInput.value.trim() || DEFAULT_API_BASE });
});

loginBtn.addEventListener('click', async () => {
  const apiBase = apiBaseInput.value.trim() || DEFAULT_API_BASE;
  const identifier = identifierInput.value.trim();
  const password = passwordInput.value;
  if (!identifier || !password) {
    setStatus(statusEl, 'Login va parolni kiriting', 'err');
    return;
  }
  loginBtn.disabled = true;
  setStatus(statusEl, 'Kirilyapti…', '');
  try {
    const res = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.user?.role !== 'admin' && data.user?.role !== 'moderator') {
      throw new Error(`Role ${data.user?.role} admin huquqlariga ega emas`);
    }
    await chrome.storage.local.set({
      apiBase,
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      user: data.user,
    });
    setStatus(statusEl, 'Kirildi ✓', 'ok');
    passwordInput.value = '';
    await load();
    // Nudge the service worker to refresh the badge right away.
    chrome.runtime.sendMessage({ type: 'refresh' }).catch(() => {});
  } catch (e) {
    setStatus(statusEl, e?.message ?? 'xato', 'err');
  } finally {
    loginBtn.disabled = false;
  }
});

logoutBtn.addEventListener('click', async () => {
  await chrome.storage.local.remove(['accessToken', 'refreshToken', 'user', 'lastKnownCount']);
  setStatus(logoutStatusEl, 'Chiqildi', 'ok');
  chrome.action.setBadgeText({ text: '' });
  await load();
});

load();

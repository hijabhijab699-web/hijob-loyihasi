/**
 * N24:31 popup — thin UI over the background queue loop.
 *
 * The actual work (polling pending, driving ChatGPT, uploading results)
 * lives in background.js. This popup only toggles the Auto flag, triggers
 * a one-shot run, and shows the status snapshot the worker publishes.
 */

const autoToggle = document.getElementById('auto-toggle');
const refreshBtn = document.getElementById('refresh');
const startOneBtn = document.getElementById('start-one');
const stopBtn = document.getElementById('stop');
const baseGridBtn = document.getElementById('base-grid');
const openOptionsBtn = document.getElementById('open-options');
const footerOptionsBtn = document.getElementById('footer-options');
const authEl = document.getElementById('auth-missing');
const controlsEl = document.getElementById('controls');
const logSectionEl = document.getElementById('log-section');
const qEl = document.getElementById('metric-queued');
const fEl = document.getElementById('metric-finished');
const xEl = document.getElementById('metric-failed');
const dotEl = document.getElementById('state-dot');
const stateTextEl = document.getElementById('state-text');
const logEl = document.getElementById('log');

async function hasToken() {
  const { accessToken } = await chrome.storage.local.get('accessToken');
  return !!accessToken;
}

async function render() {
  const ok = await hasToken();
  if (!ok) {
    authEl.classList.remove('hidden');
    controlsEl.classList.add('hidden');
    logSectionEl.classList.add('hidden');
    return;
  }
  authEl.classList.add('hidden');
  controlsEl.classList.remove('hidden');
  logSectionEl.classList.remove('hidden');

  const res = await chrome.runtime.sendMessage({ type: 'getStatus' });
  const s = res?.status ?? {};
  autoToggle.checked = !!s.auto;
  qEl.textContent = s.queued ?? 0;
  fEl.textContent = s.finished ?? 0;
  xEl.textContent = s.failed ?? 0;
  const state = s.state ?? 'idle';
  stateTextEl.textContent = state === 'running' ? 'ishlayapti' : state === 'stopped' ? 'to\'xtatilgan' : 'bo\'sh';
  dotEl.className = `state-dot ${state}`;
  if (state === 'running') {
    stopBtn.classList.remove('hidden');
    startOneBtn.disabled = true;
    baseGridBtn.disabled = true;
  } else {
    stopBtn.classList.add('hidden');
    startOneBtn.disabled = false;
    baseGridBtn.disabled = false;
  }
  logEl.innerHTML = '';
  (s.log ?? []).forEach((line) => {
    const li = document.createElement('li');
    li.textContent = line;
    if (line.includes('✓')) li.className = 'ok';
    else if (line.includes('✗')) li.className = 'err';
    logEl.appendChild(li);
  });
}

autoToggle.addEventListener('change', async () => {
  await chrome.runtime.sendMessage({ type: 'setAuto', enabled: autoToggle.checked });
  await render();
});

startOneBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'startOne' });
  setTimeout(render, 500);
});

stopBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'stop' });
  setTimeout(render, 500);
});

baseGridBtn.addEventListener('click', async () => {
  const res = await chrome.runtime.sendMessage({ type: 'baseGrid' });
  if (!res?.ok) alert(res?.error ?? 'Boshlanmadi');
  setTimeout(render, 500);
});

const sliceLastGridBtn = document.getElementById('slice-last-grid');
sliceLastGridBtn?.addEventListener('click', async () => {
  const res = await chrome.runtime.sendMessage({ type: 'sliceLastBaseGrid' });
  if (!res?.ok) alert(res?.error ?? 'Boshlanmadi');
  setTimeout(render, 500);
});

refreshBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'refreshBadge' });
  await render();
});

openOptionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
footerOptionsBtn.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Poll the status while the popup is open — the worker updates
// chrome.storage.local on every log line, which is cheap to read.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes['n2431.status']) {
    render();
  }
});

render();
setInterval(render, 2000);

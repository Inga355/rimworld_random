import { TerminalAudio } from './terminal-audio.js';

const form = document.querySelector('.terminal-form');
const consolePanel = document.querySelector('.console');
const screen = document.querySelector('.screen');
const lever = document.querySelector('.lever');
const modules = [...form.querySelectorAll('input[name="dlc"]')];
const moduleCount = document.querySelector('#module-count');
const terminalLog = document.querySelector('#terminal-log');
const routeStatus = document.querySelector('#route-status');
const readout = document.querySelector('.readout');
const soundToggle = document.querySelector('#sound-toggle');
const effectsToggle = document.querySelector('#effects-toggle');
const volume = document.querySelector('#volume');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const audio = new TerminalAudio();
const preferenceKey = 'rimworld-terminal-atmosphere';
const bootDialog = document.querySelector('.boot-dialog');
let bootPending = false;
const timers = new Set();
const lifecycleId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
let effectsPreferred = true;
let pending = false;
soundToggle.checked = false;

try {
    const saved = JSON.parse(localStorage.getItem(preferenceKey) || '{}');
    if (typeof saved.volume === 'number' && Number.isFinite(saved.volume)) {
        volume.value = Math.max(0, Math.min(100, saved.volume));
    }
    if (typeof saved.effects === 'boolean') effectsPreferred = saved.effects;
} catch { /* Preferences are optional when storage is blocked. */ }

function savePreferences() {
    try {
        localStorage.setItem(preferenceKey, JSON.stringify({ volume: Number(volume.value), effects: effectsPreferred }));
    } catch { /* Keep the live controls usable without storage. */ }
}

function updateModuleCount() {
    moduleCount.textContent = `${modules.filter(module => module.checked).length} / ${modules.length}`;
}

function setLog(...messages) {
    terminalLog.replaceChildren(...messages.map(message => {
        const line = document.createElement('p');
        line.textContent = message;
        return line;
    }));
}

async function copySeed(button) {
    const value = button.dataset.copyValue;
    try {
        await navigator.clipboard.writeText(value);
    } catch {
        const field = document.createElement('textarea');
        field.value = value;
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.append(field);
        field.select();
        document.execCommand('copy');
        field.remove();
    }
    button.classList.remove('is-copied');
    void button.offsetWidth;
    button.classList.add('is-copied');
    button.title = 'Seed copied';
    button.setAttribute('aria-label', 'Seed copied');
    setLog('Seed copied.', 'Awaiting input...');
    window.setTimeout(() => {
        button.title = 'Copy seed';
        button.setAttribute('aria-label', 'Copy seed');
    }, 1400);
}

document.querySelector('.readout-list').addEventListener('click', event => {
    const button = event.target.closest('.copy-seed');
    if (button) void copySeed(button);
});

function signalLifecycle(action) {
    const data = new Blob([JSON.stringify({ action, id: lifecycleId })], { type: 'application/json' });
    if (action === 'disconnect' && navigator.sendBeacon) {
        navigator.sendBeacon('/lifecycle', data);
        return;
    }
    fetch('/lifecycle', { method: 'POST', body: data, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
}
signalLifecycle('connect');
const lifecycleTimer = window.setInterval(() => signalLifecycle('heartbeat'), 2000);

function stopAtmosphere() {
    timers.forEach(timer => window.clearTimeout(timer));
    timers.clear();
    consolePanel.classList.remove('light-flicker');
    screen.classList.remove('screen-flicker');
}

function schedule(kind, minimum, maximum) {
    const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (document.hidden) return;
        if (kind === 'lamp') consolePanel.classList.add('light-flicker');
        if (kind === 'crt') screen.classList.add('screen-flicker');
        audio.play(kind === 'mechanical' ? (Math.random() < 0.7 ? 'click' : 'hiss') : kind);
        schedule(kind, minimum, maximum);
    }, (minimum + Math.random() * (maximum - minimum)) * 1000);
    timers.add(timer);
}

function startAtmosphere() {
    stopAtmosphere();
    if (document.hidden || bootPending) return;
    if (effectsToggle.checked && !reducedMotion.matches) {
        schedule('lamp', 7, 16);
        schedule('crt', 22, 45);
    }
    if (soundToggle.checked) schedule('mechanical', 5, 13);
}

consolePanel.addEventListener('animationend', event => {
    if (event.animationName === 'lamp-falter') consolePanel.classList.remove('light-flicker');
    if (event.animationName === 'crt-falter') screen.classList.remove('screen-flicker');
});

function updateEffects() {
    effectsToggle.checked = effectsPreferred && !reducedMotion.matches;
    effectsToggle.disabled = reducedMotion.matches;
    effectsToggle.parentElement.title = reducedMotion.matches
        ? 'Effects disabled by reduced motion setting' : 'Light and screen effects';
    startAtmosphere();
}

async function resumeAudio(fadeIn = false) {
    try {
        await audio.enable(fadeIn);
        if (document.hidden || !soundToggle.checked) audio.pause();
    } catch {
        audio.disable();
        soundToggle.checked = false;
        setLog('Audio unavailable.', 'Terminal ready.');
    }
}

soundToggle.addEventListener('change', async () => {
    if (soundToggle.checked) {
        soundToggle.disabled = true;
        await resumeAudio();
        soundToggle.disabled = false;
    } else {
        audio.disable();
    }
    startAtmosphere();
});

function updateVolumeDisplay() {
    const value = Number(volume.value);
    volume.title = `Volume: ${value}%`;
    volume.setAttribute('aria-valuetext', `${value}%`);
    document.querySelectorAll('.volume-segments span').forEach((segment, index) => {
        segment.classList.toggle('is-lit', index < Math.ceil(value / 10));
    });
}

// Map the entire strip to the range, including its zero and maximum endpoints.
function setVolumeFromPointer(event) {
    const bounds = volume.getBoundingClientRect();
    volume.value = Math.round(Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)) * 100);
    volume.dispatchEvent(new Event('input', { bubbles: true }));
}
volume.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    volume.focus();
    volume.setPointerCapture(event.pointerId);
    setVolumeFromPointer(event);
});
volume.addEventListener('pointermove', event => {
    if (volume.hasPointerCapture(event.pointerId)) setVolumeFromPointer(event);
});

volume.addEventListener('input', () => {
    audio.setVolume(Number(volume.value) / 100);
    updateVolumeDisplay();
    savePreferences();
});

effectsToggle.addEventListener('change', () => {
    effectsPreferred = effectsToggle.checked;
    savePreferences();
    updateEffects();
});
reducedMotion.addEventListener('change', updateEffects);

modules.forEach(module => module.addEventListener('change', () => {
    updateModuleCount();
    audio.play('click');
}));

form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    pending = true;
    const url = new URL(form.action || window.location.href);
    url.search = new URLSearchParams(new FormData(form)).toString();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    lever.disabled = true;
    document.querySelector('.dlc-panel').disabled = true;
    form.classList.add('is-pulling');
    readout.setAttribute('aria-busy', 'true');
    routeStatus.textContent = 'COLONY ROUTE / GENERATING';
    setLog('Generating new route...');
    audio.play('lever');

    try {
        const [response] = await Promise.all([
            fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store', signal: controller.signal }),
            new Promise(resolve => window.setTimeout(resolve, reducedMotion.matches ? 0 : 320)),
        ]);
        if (!response.ok) throw new Error('Route generation failed');
        const result = await response.json();
        if (typeof result.readout !== 'string') throw new Error('Invalid route response');
        // HTML is rendered and escaped by our same-origin Jinja template.
        document.querySelector('.readout-list').innerHTML = result.readout;
        readout.scrollTop = 0;
        routeStatus.textContent = 'COLONY ROUTE / READY';
        setLog('New route generated.', 'Awaiting input...', 'Stand by.');
        window.history.replaceState(null, '', url);
    } catch {
        routeStatus.textContent = 'ROUTE / CONNECTION LOST';
        setLog('Connection lost.', 'Pull to retry.');
    } finally {
        window.clearTimeout(timeout);
        pending = false;
        lever.disabled = false;
        document.querySelector('.dlc-panel').disabled = false;
        form.classList.remove('is-pulling');
        readout.setAttribute('aria-busy', 'false');
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopAtmosphere();
        audio.pause();
    } else {
        if (soundToggle.checked) void resumeAudio();
        startAtmosphere();
    }
});

window.addEventListener('pagehide', () => {
    window.clearInterval(lifecycleTimer);
    signalLifecycle('disconnect');
    stopAtmosphere();
    audio.pause();
});
window.addEventListener('pageshow', () => {
    if (!pending) {
        lever.disabled = false;
        form.classList.remove('is-pulling');
    }
    updateModuleCount();
    if (soundToggle.checked && !document.hidden) void resumeAudio();
    startAtmosphere();
});

audio.setVolume(Number(volume.value) / 100);
updateVolumeDisplay();
document.querySelector('.service-controls').hidden = false;
function positionBootDialog() {
    const bounds = screen.getBoundingClientRect();
    const consoleBounds = consolePanel.getBoundingClientRect();
    const mobile = window.matchMedia('(max-width: 900px)').matches;
    const glass = mobile ? bounds : {
        left: consoleBounds.left + consoleBounds.width * 0.171,
        top: consoleBounds.top + consoleBounds.height * 0.106,
        width: consoleBounds.width * 0.433,
        height: consoleBounds.height * 0.545,
    };
    for (const key of ['left', 'top', 'width', 'height']) {
        document.body.style.setProperty(`--glass-${key}`, `${glass[key]}px`);
    }
    Object.assign(bootDialog.style, {
        position: 'fixed', left: `${bounds.left}px`, top: `${bounds.top}px`,
        width: `${bounds.width}px`, height: `${bounds.height}px`,
        right: 'auto', bottom: 'auto',
    });
}
window.addEventListener('resize', positionBootDialog);
window.addEventListener('scroll', positionBootDialog, { passive: true });
bootPending = true;
document.body.classList.add('boot-pending');
bootDialog.showModal();
positionBootDialog();

async function finishBoot(withSound) {
    if (!bootPending) return;
    bootPending = false;
    bootDialog.close();
    document.body.classList.remove('boot-pending');
    soundToggle.focus({ preventScroll: true });
    if (withSound) {
        soundToggle.checked = true;
        soundToggle.disabled = true;
        await resumeAudio(true);
        soundToggle.disabled = false;
        audio.play('boot');
    }
    startAtmosphere();
}
document.querySelector('#boot-start').addEventListener('click', () => void finishBoot(true));
document.querySelector('#boot-silent').addEventListener('click', () => void finishBoot(false));
bootDialog.addEventListener('cancel', event => {
    event.preventDefault();
    void finishBoot(false);
});
updateEffects();

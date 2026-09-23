const form = document.querySelector('.terminal-form');
const lever = document.querySelector('.lever');
const modules = [...form.querySelectorAll('input[name="dlc"]')];
const moduleCount = document.querySelector('#module-count');
const terminalLog = document.querySelector('#terminal-log');
const initialLog = terminalLog.innerHTML;

function updateModuleCount() {
    moduleCount.textContent = `${modules.filter(module => module.checked).length} / ${modules.length}`;
}

modules.forEach(module => module.addEventListener('change', updateModuleCount));

form.addEventListener('submit', event => {
    event.preventDefault();
    if (lever.disabled) return;
    lever.disabled = true;
    form.classList.add('is-pulling');
    terminalLog.textContent = 'Generating new route...';

    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 320;
    window.setTimeout(() => HTMLFormElement.prototype.submit.call(form), delay);
});

// Back/forward navigation can restore the page with its previous busy state.
window.addEventListener('pageshow', () => {
    lever.disabled = false;
    form.classList.remove('is-pulling');
    terminalLog.innerHTML = initialLog;
    updateModuleCount();
});

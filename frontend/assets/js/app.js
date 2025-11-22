
const API_BASE_URL = window.__API_BASE_URL ?? "http://localhost:5000";
const dropdownTrigger = document.querySelector('[data-dropdown="file"]');
const dropdownMenu = document.querySelector('[data-dropdown-menu="file"]');
const modalTriggers = document.querySelectorAll('[data-modal-target]');
const consoleTabs = document.querySelectorAll('[data-console-tab]');
const consolePanels = document.querySelectorAll('[data-console-panel]');
const passwordInput = document.querySelector('[data-password]');
const strengthMeter = document.querySelector('[data-strength-meter]');
const suggestionButton = document.querySelector('[data-run-suggestion]');
const suggestionListPanel = document.querySelector('[data-console-panel="suggestion"] .suggestion-list');
const consoleLogPanel = document.querySelector('[data-console-panel="console"]');
const userCodeBlock = document.querySelector('[data-user-code]');
const shortcuts = {
    save: ['s', true],
    quickOpen: ['p', true],
    runSuggestion: ['Enter', true],
    undo: ['z', true],
    redo: ['y', true],
};

const getJwtToken = () => localStorage.getItem('kingpins.jwt');

const appendConsoleMessage = (message) => {
    if (!consoleLogPanel) return;
    const log = document.createElement('div');
    log.className = 'progress-log';
    log.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    consoleLogPanel.appendChild(log);
};

const postWithAuth = async (endpoint, payload) => {
    const token = getJwtToken();
    if (!token) {
        appendConsoleMessage('Missing JWT. Please login again.');
        throw new Error('Missing JWT');
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || 'API call failed');
    }
    return response.json();
};

function toggleDropdown() {
    dropdownMenu?.classList.toggle('open');
    dropdownTrigger?.setAttribute('aria-expanded', dropdownMenu?.classList.contains('open'));
}

dropdownTrigger?.addEventListener('click', toggleDropdown);
document.addEventListener('click', (event) => {
    if (!dropdownTrigger || !dropdownMenu) return;
    if (!dropdownTrigger.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.classList.remove('open');
        dropdownTrigger.setAttribute('aria-expanded', 'false');
    }
});

modalTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
        const targetId = trigger.dataset.modalTarget;
        const modal = document.getElementById(targetId);
        modal?.classList.add('active');
    });
});

document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal') || event.target.hasAttribute('data-modal-close')) {
            modal.classList.remove('active');
        }
    });
});

consoleTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.consoleTab;
        consoleTabs.forEach((t) => t.classList.remove('active'));
        consolePanels.forEach((panel) => {
            panel.hidden = panel.dataset.consolePanel !== target;
        });
        tab.classList.add('active');
    });
});

const updateStrengthMeter = (value = '') => {
    if (!strengthMeter) return;
    const levels = strengthMeter.querySelectorAll('span');
    const rules = [/.{8,}/, /[A-Z]/, /[0-9]/, /[@$!%*?&#]/];
    const score = rules.reduce((acc, rule) => acc + Number(rule.test(value)), 0);
    levels.forEach((segment, index) => {
        segment.classList.toggle('active', index < score);
    });
};

passwordInput?.addEventListener('input', (event) => {
    updateStrengthMeter(event.target.value);
});

document.addEventListener('keydown', (event) => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const metaCombo = event.metaKey || (isMac && event.ctrlKey);
    const ctrlCombo = event.ctrlKey;

    const matchesShortcut = ([key, needsCtrl]) => {
        const base = needsCtrl ? (isMac ? metaCombo : ctrlCombo) : true;
        return base && event.key === key;
    };

    if (matchesShortcut(shortcuts.save)) {
        event.preventDefault();
        console.log('Save triggered');
        // TODO: integrate with Firestore-backed drafts save endpoint
    }

    if (matchesShortcut(shortcuts.quickOpen)) {
        event.preventDefault();
        document.getElementById('fileModal')?.classList.add('active');
    }

    if (matchesShortcut(shortcuts.runSuggestion)) {
        event.preventDefault();
        runSuggestionPipeline();
    }

    if (matchesShortcut(shortcuts.undo)) {
        console.log('Undo requested');
    }

    if (matchesShortcut(shortcuts.redo)) {
        console.log('Redo requested');
    }
});

async function runSuggestionPipeline() {
    if (!suggestionListPanel) return;
    const code = userCodeBlock?.innerText?.trim();
    if (!code) {
        appendConsoleMessage('No code loaded for linting.');
        return;
    }

    const placeholder = document.createElement('div');
    placeholder.className = 'suggestion-item';
    placeholder.innerHTML = `<strong>[pending]</strong> Running CodeT5-small inference…`;
    suggestionListPanel.prepend(placeholder);

    try {
        appendConsoleMessage('Running lint checks…');
        const lintResponse = await postWithAuth('/api/lint', { code, language: 'javascript' });
        appendConsoleMessage('Lint complete. Requesting suggestions…');

        const suggestionResponse = await postWithAuth('/api/suggest', {
            code,
            lintReport: lintResponse.lintReport ?? [],
            language: 'javascript',
        });

        const suggestions = suggestionResponse.suggestions?.suggestions ?? [];
        if (!suggestions.length) {
            placeholder.innerHTML = '<strong>No suggestions</strong> Clean code!';
            return;
        }

        suggestionListPanel.innerHTML = suggestions
            .map(
                (item) => `
                <div class="suggestion-item">
                    <strong>${item.ruleId ?? 'rule'}</strong> ${item.explanation ?? 'See diff panel'}
                    <small>Confidence: ${item.confidence ?? 'n/a'}</small>
                </div>`
            )
            .join('');
        appendConsoleMessage('Suggestions updated.');
    } catch (error) {
        console.error(error);
        placeholder.innerHTML = `<strong>Error</strong> ${error.message}`;
        appendConsoleMessage(error.message);
    }
}

const applySuggestion = (action) => {
    console.log(`Apply action: ${action}`);
    // TODO: merge diff into user editor via Monaco editor API
};

document.querySelectorAll('[data-apply]').forEach((button) => {
    button.addEventListener('click', () => {
        applySuggestion(button.dataset.apply);
    });
});

suggestionButton?.addEventListener('click', () => {
    runSuggestionPipeline();
});

// Placeholder diff data for mockup
const diffLines = [
    { type: 'removed', text: '- console.log("debug");', tooltip: 'Removed stray debug log' },
    { type: 'modified', text: '~ const result = lint(code);', tooltip: 'Normalized spacing' },
    { type: 'added', text: '+ const formatted = formatter(result);', tooltip: 'Add formatter pipeline' },
];

const diffContainer = document.querySelector('[data-diff]');
if (diffContainer) {
    diffContainer.innerHTML = diffLines
        .map(
            ({ type, text, tooltip }) => `
            <div class="diff-line ${type}">
                <span class="tooltip">${tooltip}</span>
                <code>${text}</code>
            </div>
        `
        )
        .join('');
}

window.addEventListener('DOMContentLoaded', () => {
    updateStrengthMeter(passwordInput?.value ?? '');
});

window.runSuggestionPipeline = runSuggestionPipeline;


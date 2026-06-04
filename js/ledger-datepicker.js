/**
 * LedgerDatePicker v3 — Premium Calendar
 * - Fixed nav button close-on-click bug (stopPropagation)
 * - Added month & year inline <select> dropdowns in header
 * - Clean "Void" dark aesthetic
 */
export class LedgerDatePicker {
    constructor(nativeInput, options = {}) {
        if (!nativeInput || nativeInput._ledgerDPInstance) return;
        nativeInput._ledgerDPInstance = this;

        this.native = nativeInput;
        this.isOpen = false;

        const raw = nativeInput.value;
        const parsed = raw ? new Date(raw + 'T12:00:00') : new Date();
        this.selected = new Date(parsed);
        this.view = new Date(parsed.getFullYear(), parsed.getMonth(), 1);

        this._build();
        this._attach();
    }

    _build() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'ldp-wrapper';

        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        this.trigger.className = 'ldp-trigger';
        this.trigger.innerHTML = `
            <span class="ldp-trigger-value">${this._fmt(this.selected)}</span>
            <span class="ldp-trigger-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2.5"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                </svg>
            </span>
        `;
        this.triggerValue = this.trigger.querySelector('.ldp-trigger-value');

        this.panel = document.createElement('div');
        this.panel.className = 'ldp-panel';
        this.panel.setAttribute('role', 'dialog');
        this.panel.setAttribute('aria-modal', 'true');

        this.wrapper.appendChild(this.trigger);
        this.wrapper.appendChild(this.panel);
    }

    _attach() {
        this.native.style.display = 'none';
        this.native.parentNode.insertBefore(this.wrapper, this.native);
        this.wrapper.appendChild(this.native);

        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Close on outside click, but not when clicking inside the panel
        document.addEventListener('click', (e) => {
            if (!this.wrapper.contains(e.target)) this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });

        this._renderPanel();
    }

    _fmt(date) {
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const y = date.getFullYear();
        return `${m} / ${d} / ${y}`;
    }

    _isoDate(date) {
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${date.getFullYear()}-${m}-${d}`;
    }

    _same(a, b) {
        return a.getFullYear() === b.getFullYear() &&
               a.getMonth() === b.getMonth() &&
               a.getDate() === b.getDate();
    }

    _renderPanel() {
        const y = this.view.getFullYear();
        const m = this.view.getMonth();
        const today = new Date();

        const firstDow = new Date(y, m, 1).getDay();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const MONTHS = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];

        // Build month options
        const monthOpts = MONTHS.map((name, i) =>
            `<option value="${i}" ${i === m ? 'selected' : ''}>${name}</option>`
        ).join('');

        // Build year options (10 years back, 10 ahead)
        let yearOpts = '';
        for (let yr = y - 10; yr <= y + 10; yr++) {
            yearOpts += `<option value="${yr}" ${yr === y ? 'selected' : ''}>${yr}</option>`;
        }

        // Build day cells
        let cells = '';
        for (let i = 0; i < firstDow; i++) {
            cells += `<span class="ldp-cell ldp-empty"></span>`;
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(y, m, day);
            const iso = this._isoDate(date);
            const isToday = this._same(date, today);
            const isSelected = this._same(date, this.selected);
            let cls = 'ldp-cell ldp-day';
            if (isToday) cls += ' ldp-today';
            if (isSelected) cls += ' ldp-selected';
            cells += `<span class="${cls}" data-iso="${iso}" tabindex="0" role="button">${day}</span>`;
        }

        this.panel.innerHTML = `
            <div class="ldp-header">
                <button class="ldp-nav ldp-prev" type="button" aria-label="Previous month">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div class="ldp-month-year">
                    <select class="ldp-month-select" aria-label="Month">${monthOpts}</select>
                    <select class="ldp-year-select" aria-label="Year">${yearOpts}</select>
                </div>
                <button class="ldp-nav ldp-next" type="button" aria-label="Next month">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
            </div>
            <div class="ldp-weekdays">
                ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<span>${d}</span>`).join('')}
            </div>
            <div class="ldp-grid">${cells}</div>
        `;

        // Nav buttons — stopPropagation prevents the document click-outside from firing
        this.panel.querySelector('.ldp-prev').addEventListener('click', (e) => {
            e.stopPropagation();
            this.view = new Date(y, m - 1, 1);
            this._renderPanel();
        });

        this.panel.querySelector('.ldp-next').addEventListener('click', (e) => {
            e.stopPropagation();
            this.view = new Date(y, m + 1, 1);
            this._renderPanel();
        });

        // Month dropdown
        this.panel.querySelector('.ldp-month-select').addEventListener('change', (e) => {
            e.stopPropagation();
            this.view = new Date(y, parseInt(e.target.value), 1);
            this._renderPanel();
        });

        // Year dropdown
        this.panel.querySelector('.ldp-year-select').addEventListener('change', (e) => {
            e.stopPropagation();
            this.view = new Date(parseInt(e.target.value), m, 1);
            this._renderPanel();
        });

        // Day selection
        this.panel.querySelectorAll('.ldp-day').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this._select(el.dataset.iso);
            });
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this._select(el.dataset.iso);
                }
            });
        });
    }

    _select(iso) {
        this.selected = new Date(iso + 'T12:00:00');
        this.native.value = iso;
        this.native.dispatchEvent(new Event('change', { bubbles: true }));
        this.triggerValue.textContent = this._fmt(this.selected);
        this.close();
        this._renderPanel();
    }

    sync() {
        if (this.native.value) {
            this.selected = new Date(this.native.value + 'T12:00:00');
            this.view = new Date(this.selected.getFullYear(), this.selected.getMonth(), 1);
            this.triggerValue.textContent = this._fmt(this.selected);
            this._renderPanel();
        }
    }

    toggle() { this.isOpen ? this.close() : this.open(); }

    open() {
        if (this.isOpen) return;
        document.querySelectorAll('.ldp-panel.ldp-open').forEach(p => {
            p.classList.remove('ldp-open');
            const w = p.closest('.ldp-wrapper');
            if (w) w.classList.remove('ldp-is-open');
        });
        this.isOpen = true;
        this.wrapper.classList.add('ldp-is-open');
        this.panel.classList.add('ldp-open');
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.wrapper.classList.remove('ldp-is-open');
        this.panel.classList.remove('ldp-open');
    }
}

export function initLedgerDatePickers(parent = document) {
    parent.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input._ledgerDPInstance) new LedgerDatePicker(input);
    });
}

export function syncDatePicker(input) {
    if (input._ledgerDPInstance) input._ledgerDPInstance.sync();
}

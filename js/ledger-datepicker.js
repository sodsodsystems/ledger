/**
 * LedgerDatePicker v4
 * - Text field is typeable (MM/DD/YYYY). Validates on blur/Enter.
 * - Calendar panel only opens via the calendar icon button.
 * - Left/right nav buttons fixed (stopPropagation).
 * - Inline month/year <select> dropdowns.
 */
import { LedgerCustomSelect } from './custom-select.js';

export class LedgerDatePicker {
    constructor(nativeInput) {
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

    /* ── Build DOM ───────────────────────────────── */
    _build() {
        // Outer wrapper
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'ldp-wrapper';

        // The visible "input row" — text field + icon button
        this.row = document.createElement('div');
        this.row.className = 'ldp-trigger-row';

        // Text input for manual date entry
        this.textInput = document.createElement('input');
        this.textInput.type = 'text';
        this.textInput.className = 'ldp-text-input';
        this.textInput.placeholder = 'MM / DD / YYYY';
        this.textInput.value = this._fmt(this.selected);
        this.textInput.autocomplete = 'off';
        this.textInput.spellcheck = false;

        // Calendar icon button
        this.iconBtn = document.createElement('button');
        this.iconBtn.type = 'button';
        this.iconBtn.className = 'ldp-icon-btn';
        this.iconBtn.setAttribute('aria-label', 'Open calendar');
        this.iconBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2.5"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
            </svg>`;

        this.row.appendChild(this.textInput);
        this.row.appendChild(this.iconBtn);

        // Calendar panel
        this.panel = document.createElement('div');
        this.panel.className = 'ldp-panel';
        this.panel.setAttribute('role', 'dialog');
        this.panel.setAttribute('aria-modal', 'true');

        this.wrapper.appendChild(this.row);
        this.wrapper.appendChild(this.panel);
    }

    /* ── Attach events ───────────────────────────── */
    _attach() {
        // Hide native input, insert wrapper before it
        this.native.style.display = 'none';
        this.native.parentNode.insertBefore(this.wrapper, this.native);
        this.wrapper.appendChild(this.native);

        // Only the icon opens the calendar
        this.iconBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Text input — allow typing but DON'T open the calendar
        this.textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this._parseAndApply(this.textInput.value);
                this.textInput.blur();
            } else if (e.key === 'Escape') {
                this.close();
            }
        });

        this.textInput.addEventListener('blur', () => {
            this._parseAndApply(this.textInput.value);
        });

        // Close panel on outside click
        document.addEventListener('click', (e) => {
            if (!this.wrapper.contains(e.target)) this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });

        this._renderPanel();
    }

    /* ── Helpers ─────────────────────────────────── */
    _fmt(date) {
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${m} / ${d} / ${date.getFullYear()}`;
    }

    _isoDate(date) {
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${date.getFullYear()}-${m}-${d}`;
    }

    _same(a, b) {
        return a.getFullYear() === b.getFullYear() &&
               a.getMonth()    === b.getMonth()    &&
               a.getDate()     === b.getDate();
    }

    /**
     * Try to parse a string like "MM/DD/YYYY", "MM-DD-YYYY", "YYYY-MM-DD", etc.
     * If valid, update state. If invalid, revert text to current selected.
     */
    _parseAndApply(raw) {
        const str = raw.trim().replace(/\s/g, '');
        // Try common formats
        let date = null;

        // MM/DD/YYYY or MM-DD-YYYY
        const mdy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
        if (mdy) date = new Date(+mdy[3], +mdy[1] - 1, +mdy[2], 12);

        // YYYY-MM-DD
        const ymd = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
        if (!date && ymd) date = new Date(+ymd[1], +ymd[2] - 1, +ymd[3], 12);

        if (date && !isNaN(date)) {
            this.selected = date;
            this.view = new Date(date.getFullYear(), date.getMonth(), 1);
            this.native.value = this._isoDate(date);
            this.native.dispatchEvent(new Event('change', { bubbles: true }));
            this.textInput.value = this._fmt(date);
            this._renderPanel();
        } else {
            // Revert to last valid date
            this.textInput.value = this._fmt(this.selected);
        }
    }

    /* ── Calendar render ─────────────────────────── */
    _renderPanel() {
        const y = this.view.getFullYear();
        const m = this.view.getMonth();
        const today = new Date();
        const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

        // Build month options
        const monthOpts = MONTHS.map((name, i) =>
            `<option value="${i}" ${i === m ? 'selected' : ''}>${name}</option>`
        ).join('');

        // Build year options (5 years back, 5 ahead)
        let yearOpts = '';
        for (let yr = y - 5; yr <= y + 5; yr++) {
            yearOpts += `<option value="${yr}" ${yr === y ? 'selected' : ''}>${yr}</option>`;
        }

        const firstDow   = new Date(y, m, 1).getDay();
        const daysInMonth = new Date(y, m + 1, 0).getDate();

        // Build day cells
        let cells = '';
        for (let i = 0; i < firstDow; i++) {
            cells += `<span class="ldp-cell ldp-empty"></span>`;
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(y, m, day);
            const iso  = this._isoDate(date);
            const isToday    = this._same(date, today);
            const isSelected = this._same(date, this.selected);
            let cls = 'ldp-cell ldp-day';
            if (isToday)    cls += ' ldp-today';
            if (isSelected) cls += ' ldp-selected';
            cells += `<span class="${cls}" data-iso="${iso}" tabindex="0" role="button">${day}</span>`;
        }

        this.panel.innerHTML = `
            <div class="ldp-header">
                <button class="ldp-nav ldp-prev" type="button" aria-label="Previous month">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div class="ldp-month-year">
                    <div class="ldp-select-wrap">
                        <select class="ldp-month-select" aria-label="Month">${monthOpts}</select>
                    </div>
                    <div class="ldp-select-wrap">
                        <select class="ldp-year-select" aria-label="Year">${yearOpts}</select>
                    </div>
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

        // Nav buttons
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

        // Month / Year dropdowns
        this.panel.querySelector('.ldp-month-select').addEventListener('change', (e) => {
            e.stopPropagation();
            this.view = new Date(y, parseInt(e.target.value), 1);
            this._renderPanel();
        });
        this.panel.querySelector('.ldp-year-select').addEventListener('change', (e) => {
            e.stopPropagation();
            this.view = new Date(parseInt(e.target.value), m, 1);
            this._renderPanel();
        });

        // Day cells
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

        // Initialize custom selects for the header dropdowns
        const mSelect = this.panel.querySelector('.ldp-month-select');
        const ySelect = this.panel.querySelector('.ldp-year-select');
        
        if (mSelect) {
            new LedgerCustomSelect(mSelect);
            // Ensure the custom select container doesn't close the LDP
            mSelect.closest('.ledger-select-container').addEventListener('click', e => e.stopPropagation());
        }
        if (ySelect) {
            new LedgerCustomSelect(ySelect);
            ySelect.closest('.ledger-select-container').addEventListener('click', e => e.stopPropagation());
        }
    }

    _select(iso) {
        this.selected = new Date(iso + 'T12:00:00');
        this.view     = new Date(this.selected.getFullYear(), this.selected.getMonth(), 1);
        this.native.value = iso;
        this.native.dispatchEvent(new Event('change', { bubbles: true }));
        this.textInput.value = this._fmt(this.selected);
        this.close();
        this._renderPanel();
    }

    sync() {
        if (this.native.value) {
            this.selected = new Date(this.native.value + 'T12:00:00');
            this.view     = new Date(this.selected.getFullYear(), this.selected.getMonth(), 1);
            this.textInput.value = this._fmt(this.selected);
            this._renderPanel();
        }
    }

    toggle() { this.isOpen ? this.close() : this.open(); }

    open() {
        if (this.isOpen) return;
        document.querySelectorAll('.ldp-panel.ldp-open').forEach(p => {
            p.classList.remove('ldp-open');
            const w = p.closest('.ldp-wrapper');
            if (w) { w.classList.remove('ldp-is-open'); w._ldpInst && (w._ldpInst.isOpen = false); }
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

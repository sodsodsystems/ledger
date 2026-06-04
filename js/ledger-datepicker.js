/**
 * LedgerDatePicker - A premium calendar component following Apple HIG.
 * Designed specifically for the "Void" dark theme.
 */
export class LedgerDatePicker {
    constructor(inputElement, options = {}) {
        if (!inputElement) return;
        if (inputElement.dataset.ledgerPickerInitialized) return;
        inputElement.dataset.ledgerPickerInitialized = "true";

        this.input = inputElement;
        this.options = {
            format: options.format || 'YYYY-MM-DD',
            onSelect: options.onSelect || null,
            ...options
        };

        this.isOpen = false;
        this.now = new Date();
        this.selectedDate = this.input.value ? new Date(this.input.value) : new Date();
        this.viewDate = new Date(this.selectedDate);

        this._init();
    }

    _init() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'ledger-datepicker-container';
        
        // Hide native input and create trigger
        this.input.type = 'hidden';
        this.trigger = document.createElement('div');
        this.trigger.className = 'ledger-select-trigger ledger-datepicker-trigger';
        this.trigger.tabIndex = 0;
        this.trigger.innerHTML = `
            <span class="ledger-datepicker-value">${this._formatDate(this.selectedDate)}</span>
            <svg class="ledger-datepicker-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
        `;
        this.valueDisplay = this.trigger.querySelector('.ledger-datepicker-value');

        this.picker = document.createElement('div');
        this.picker.className = 'ledger-datepicker-popup';
        
        this.input.parentNode.insertBefore(this.container, this.input);
        this.container.appendChild(this.trigger);
        this.container.appendChild(this.picker);
        this.container.appendChild(this.input);

        this._bindEvents();
        this._render();
    }

    _bindEvents() {
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        document.addEventListener('click', () => this.close());
        this.picker.addEventListener('click', (e) => e.stopPropagation());

        this.trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.container.classList.add('open');
        this._render();
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.container.classList.remove('open');
    }

    _formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    _render() {
        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(this.viewDate);

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let html = `
            <div class="ledger-dp-header">
                <button class="ledger-dp-prev">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <div class="ledger-dp-title">${monthName} ${year}</div>
                <button class="ledger-dp-next">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>
            <div class="ledger-dp-weekdays">
                ${['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => `<span>${d}</span>`).join('')}
            </div>
            <div class="ledger-dp-grid">
        `;

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            html += `<span class="ledger-dp-day empty"></span>`;
        }

        const today = new Date();
        today.setHours(0,0,0,0);

        for (let d = 1; d <= daysInMonth; d++) {
            const current = new Date(year, month, d);
            const isSelected = this._isSameDay(current, this.selectedDate);
            const isToday = this._isSameDay(current, today);
            
            html += `<span class="ledger-dp-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" data-date="${this._formatDate(current)}">${d}</span>`;
        }

        html += `</div>`;
        this.picker.innerHTML = html;

        this.picker.querySelector('.ledger-dp-prev').onclick = (e) => {
            this.viewDate.setMonth(this.viewDate.getMonth() - 1);
            this._render();
        };

        this.picker.querySelector('.ledger-dp-next').onclick = (e) => {
            this.viewDate.setMonth(this.viewDate.getMonth() + 1);
            this._render();
        };

        this.picker.querySelectorAll('.ledger-dp-day:not(.empty)').forEach(el => {
            el.onclick = () => {
                this._selectDate(new Date(el.dataset.date));
                this.close();
            };
        });
    }

    _isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() && 
               d1.getMonth() === d2.getMonth() && 
               d1.getDate() === d2.getDate();
    }

    _selectDate(date) {
        this.selectedDate = date;
        this.input.value = this._formatDate(date);
        this.valueDisplay.textContent = this.input.value;
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
        if (this.options.onSelect) this.options.onSelect(this.input.value);
    }
}

export function initLedgerDatePickers(parent = document) {
    const inputs = parent.querySelectorAll('input[type="date"]:not([data-ledger-picker-initialized])');
    inputs.forEach(input => new LedgerDatePicker(input));
}

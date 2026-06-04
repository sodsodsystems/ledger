/**
 * LedgerCustomSelect - A premium dropdown component that transforms native <select> elements.
 * Following Apple HIG and the Ledger "Void" aesthetic.
 */
export class LedgerCustomSelect {
    constructor(selectElement, options = {}) {
        if (!selectElement || selectElement.tagName !== 'SELECT') {
            console.error('LedgerCustomSelect: Element must be a SELECT tag', selectElement);
            return;
        }

        this.nativeSelect = selectElement;
        this.options = {
            placeholder: options.placeholder || 'Select an option',
            ...options
        };

        this.isOpen = false;
        this.focusedIndex = -1;
        
        this._init();
    }

    _init() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'ledger-select-container';
        if (this.nativeSelect.id) this.container.id = `ledger-select-${this.nativeSelect.id}`;

        // Create trigger
        this.trigger = document.createElement('div');
        this.trigger.className = 'ledger-select-trigger';
        this.trigger.tabIndex = 0;
        this.trigger.innerHTML = `
            <span class="ledger-select-text"></span>
            <svg class="ledger-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        `;
        this.selectedText = this.trigger.querySelector('.ledger-select-text');

        // Create menu
        this.menu = document.createElement('div');
        this.menu.className = 'ledger-select-menu';

        // Hide native select
        this.nativeSelect.classList.add('ledger-native-hidden');
        this.nativeSelect.parentNode.insertBefore(this.container, this.nativeSelect);
        this.container.appendChild(this.trigger);
        this.container.appendChild(this.menu);
        this.container.appendChild(this.nativeSelect);

        this._updateMenu();
        this._bindEvents();
        this._syncWithNative();

        // Observe changes to native select (e.g. if options are dynamically added)
        this.observer = new MutationObserver(() => this._updateMenu());
        this.observer.observe(this.nativeSelect, { childList: true });
    }

    _updateMenu() {
        this.menu.innerHTML = '';
        const options = Array.from(this.nativeSelect.options);
        
        // Handle Groups
        let currentGroup = null;

        options.forEach((opt, index) => {
            if (opt.parentNode.tagName === 'OPTGROUP' && opt.parentNode !== currentGroup) {
                currentGroup = opt.parentNode;
                const label = document.createElement('div');
                label.className = 'ledger-select-group-label';
                label.textContent = currentGroup.label;
                this.menu.appendChild(label);
            }

            const item = document.createElement('div');
            item.className = 'ledger-select-option';
            if (opt.selected) item.classList.add('selected');
            item.dataset.index = index;
            item.dataset.value = opt.value;
            
            const checkIcon = `
                <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            
            item.innerHTML = `<span>${opt.text}</span>${checkIcon}`;
            
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this._select(index);
                this.close();
            });

            this.menu.appendChild(item);
        });

        this._syncWithNative();
    }

    _bindEvents() {
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        document.addEventListener('click', () => this.close());

        this.trigger.addEventListener('keydown', (e) => this._handleKeydown(e));
        
        this.nativeSelect.addEventListener('change', () => this._syncWithNative());
    }

    _syncWithNative() {
        const selectedOption = this.nativeSelect.options[this.nativeSelect.selectedIndex];
        if (selectedOption) {
            this.selectedText.textContent = selectedOption.text;
            
            // Update menu selection visually
            const menuItems = this.menu.querySelectorAll('.ledger-select-option');
            menuItems.forEach((item, idx) => {
                item.classList.toggle('selected', idx === this.nativeSelect.selectedIndex);
            });
        } else {
            this.selectedText.textContent = this.options.placeholder;
        }
    }

    _select(index) {
        this.nativeSelect.selectedIndex = index;
        this.nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        this._syncWithNative();
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        if (this.isOpen) return;
        
        // Close all other instances first
        document.querySelectorAll('.ledger-select-container.open').forEach(el => {
            if (el !== this.container) el.classList.remove('open');
        });

        this.isOpen = true;
        this.container.classList.add('open');
        this.trigger.setAttribute('aria-expanded', 'true');
        
        // Focus selected item
        this.focusedIndex = this.nativeSelect.selectedIndex;
        this._updateFocusedItem();
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.container.classList.remove('open');
        this.trigger.setAttribute('aria-expanded', 'false');
        this.focusedIndex = -1;
        this._updateFocusedItem();
    }

    _handleKeydown(e) {
        if (!this.isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.open();
            }
            return;
        }

        const items = Array.from(this.menu.querySelectorAll('.ledger-select-option'));
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusedIndex = (this.focusedIndex + 1) % items.length;
                this._updateFocusedItem();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.focusedIndex = (this.focusedIndex - 1 + items.length) % items.length;
                this._updateFocusedItem();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (this.focusedIndex !== -1) {
                    this._select(this.focusedIndex);
                    this.close();
                }
                break;
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
            case 'Tab':
                this.close();
                break;
        }
    }

    _updateFocusedItem() {
        const items = this.menu.querySelectorAll('.ledger-select-option');
        items.forEach((item, idx) => {
            item.classList.toggle('focused', idx === this.focusedIndex);
            if (idx === this.focusedIndex) {
                item.scrollIntoView({ block: 'nearest' });
            }
        });
    }
}

// Global helper to initialize all selects
export function initCustomSelects(parent = document) {
    const selects = parent.querySelectorAll('select:not(.ledger-native-hidden)');
    const instances = [];
    selects.forEach(s => {
        instances.push(new LedgerCustomSelect(s));
    });
    return instances;
}

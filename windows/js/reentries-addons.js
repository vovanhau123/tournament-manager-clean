class ReentriesAddons {
    constructor() {
        // Load data from database before initializing UI
        this.loadReentriesData().then(() => {
            this.initializeElements();
            this.setupEventListeners();
        });
    }

    async loadReentriesData() {
        try {
            const data = await window.api.getReentriesData();
            if (data) {
                // Update UI with data from database
                this.updateUI(data);
            }
        } catch (error) {
            console.error('Error loading reentries data:', error);
        }
    }

    updateUI(data) {
        // Update UI with data from database
        if (this.allowReentryToggle) {
            this.allowReentryToggle.checked = Boolean(data.allow_reentry);
            this.reentryLimitGroup?.classList.toggle('hidden', !data.allow_reentry);
        }

        if (this.reentryLimitInput) {
            this.reentryLimitInput.value = data.reentry_limit;
        }

        if (this.allowAddonsToggle) {
            this.allowAddonsToggle.checked = Boolean(data.allow_addon);
            this.addonOptionsGroup?.classList.toggle('hidden', !data.allow_addon);
        }

        if (this.addonPriceInput) {
            this.addonPriceInput.value = data.addon_price.toFixed(2);
        }

        if (this.addonChipsInput) {
            this.addonChipsInput.value = data.addon_chips;
        }
    }

    initializeElements() {
        // Get elements
        this.allowReentryToggle = document.getElementById('allowReentry');
        this.reentryLimitGroup = document.querySelector('.reentry-limit');
        this.reentryLimitInput = this.reentryLimitGroup?.querySelector('input');
        
        this.allowAddonsToggle = document.getElementById('allowAddons');
        this.addonOptionsGroup = document.querySelector('.addon-options');
        this.addonPriceInput = this.addonOptionsGroup?.querySelector('.form-group:first-child input');
        this.addonChipsInput = this.addonOptionsGroup?.querySelector('.form-group:last-child input');
    }

    setupEventListeners() {
        // Handle reentry toggle
        if (this.allowReentryToggle) {
            this.allowReentryToggle.addEventListener('change', () => {
                const allow_reentry = this.allowReentryToggle.checked ? 1 : 0;
                this.reentryLimitGroup?.classList.toggle('hidden', !this.allowReentryToggle.checked);
                
                // Reset and hide reentry limit when turned off
                if (!this.allowReentryToggle.checked && this.reentryLimitInput) {
                    this.reentryLimitInput.value = '1';
                }

                // Save changes
                this.saveReentriesData({
                    allow_reentry,
                    reentry_limit: parseInt(this.reentryLimitInput?.value || '1')
                });
            });
        }

        // Handle reentry limit change
        if (this.reentryLimitInput) {
            this.reentryLimitInput.addEventListener('change', () => {
                this.saveReentriesData({
                    reentry_limit: parseInt(this.reentryLimitInput.value)
                });
            });
        }

        // Handle addons toggle
        if (this.allowAddonsToggle) {
            this.allowAddonsToggle.addEventListener('change', () => {
                const allow_addon = this.allowAddonsToggle.checked ? 1 : 0;
                this.addonOptionsGroup?.classList.toggle('hidden', !this.allowAddonsToggle.checked);
                
                // Reset and hide addon options when turned off
                if (!this.allowAddonsToggle.checked) {
                    if (this.addonPriceInput) this.addonPriceInput.value = '5.00';
                    if (this.addonChipsInput) this.addonChipsInput.value = '5000';
                }

                // Save changes
                this.saveReentriesData({
                    allow_addon,
                    addon_price: parseFloat(this.addonPriceInput?.value || '5.00'),
                    addon_chips: parseInt(this.addonChipsInput?.value || '5000')
                });
            });
        }

        // Handle addon price change
        if (this.addonPriceInput) {
            this.addonPriceInput.addEventListener('change', () => {
                this.saveReentriesData({
                    addon_price: parseFloat(this.addonPriceInput.value)
                });
            });
        }

        // Handle addon chips change
        if (this.addonChipsInput) {
            this.addonChipsInput.addEventListener('change', () => {
                this.saveReentriesData({
                    addon_chips: parseInt(this.addonChipsInput.value)
                });
            });
        }

        // Handle number increase/decrease buttons
        const numberInputs = document.querySelectorAll('.step:nth-child(2) .number-input');
        numberInputs.forEach(wrapper => {
            const input = wrapper.querySelector('input');
            const decreaseBtn = wrapper.querySelector('.decrease');
            const increaseBtn = wrapper.querySelector('.increase');

            if (decreaseBtn && increaseBtn && input) {
                decreaseBtn.addEventListener('click', () => this.handleNumberChange(input, false));
                increaseBtn.addEventListener('click', () => this.handleNumberChange(input, true));
            }
        });
    }

    handleNumberChange(input, isIncrease) {
        if (!input) return;

        const step = parseFloat(input.step) || 1;
        const min = parseFloat(input.min) || 0;
        let currentValue = parseFloat(input.value) || 0;
        let newValue;

        if (isIncrease) {
            newValue = currentValue + step;
        } else {
            newValue = Math.max(currentValue - step, min);
        }

        // Update input value
        input.value = newValue.toFixed(input.step.includes('.') ? 2 : 0);

        // Save corresponding changes
        if (input === this.reentryLimitInput) {
            this.saveReentriesData({ reentry_limit: newValue });
        } else if (input === this.addonPriceInput) {
            this.saveReentriesData({ addon_price: newValue });
        } else if (input === this.addonChipsInput) {
            this.saveReentriesData({ addon_chips: newValue });
        }
    }

    async saveReentriesData(changes) {
        try {
            console.log('Saving reentries changes:', changes);
            await window.api.saveReentriesData(changes);
            console.log('Reentries changes saved successfully');
        } catch (error) {
            console.error('Error saving reentries changes:', error);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ReentriesAddons();
});
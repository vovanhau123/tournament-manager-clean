class TournamentInfo {
    constructor() {
        this.currentStep = 1;
        this.steps = document.querySelectorAll('.step');
        this.tournamentData = {
            name: '',
            location: '',
            buy_in_price: 10.00,
            starting_stack: 10000,
            currency: 'USD',
            charge_rake: 0,
            rake_amount: 0
        };
        
        // Thêm CSS cho trường lỗi
        const style = document.createElement('style');
        style.textContent = `
            input.error {
                border-color: red !important;
                background-color: #fff0f0 !important;
                color: #000000 !important;
            }
            input.error:focus {
                box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.2) !important;
            }
            input.error::placeholder {
                color: rgba(255, 0, 0, 0.5) !important;
            }
        `;
        document.head.appendChild(style);
        
        // Load dữ liệu từ database trước khi khởi tạo UI
        this.loadTournamentData().then(() => {
            this.initializeNavigation();
            this.setupMainFormHandlers();
            this.initializeFormValues();
        });
           
        // Lưu trữ instance vào window để các file khác có thể truy cập
        window.tournamentInfo = this;
    }

    async loadTournamentData() {
        try {
            const data = await window.api.getTournamentData();
            if (data) {
                this.tournamentData = {
                    ...this.tournamentData,
                    ...data
                };
                console.log('Loaded tournament data:', this.tournamentData);
            }
        } catch (error) {
            console.error('Error loading tournament data:', error);
        }
    }

    initializeNavigation() {
        this.nextBtn = document.querySelector('.next-btn');
        this.navigation = document.querySelector('.navigation');
        this.backBtn = document.createElement('button');
        this.backBtn.className = 'back-btn';
        this.backBtn.textContent = 'Quay lại';
        this.navigation.insertBefore(this.backBtn, this.nextBtn);
        this.backBtn.style.display = 'none';

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                if (this.currentStep === 1) {
                    // Kiểm tra các trường bắt buộc ở bước 1
                    const errors = [];
                    
                    if (!this.tournamentData.name?.trim()) {
                        errors.push('Tên giải đấu');
                        this.nameInput?.classList.add('error');
                    } else {
                        this.nameInput?.classList.remove('error');
                    }
                    
                    if (!this.tournamentData.starting_stack || this.tournamentData.starting_stack <= 0) {
                        errors.push('Starting stack');
                        this.startingStackInput?.classList.add('error');
                    } else {
                        this.startingStackInput?.classList.remove('error');
                    }

                    if (errors.length > 0) {
                        const errorMessage = errors.length === 1 
                            ? `Vui lòng nhập ${errors[0]}`
                            : `Vui lòng nhập các thông tin sau:\n• ${errors.join('\n• ')}`;
                        notifications.showToast(errorMessage, 'error');
                        return;
                    }
                }

                if (this.currentStep < this.steps.length) {
                    this.goToStep(this.currentStep + 1);
                }
            });
        }

        this.backBtn.addEventListener('click', () => {
            // Xóa dashboard nếu đang hiển thị
            const dashboard = document.getElementById('dashboard');
            if (dashboard) {
                dashboard.remove();
                this.nextBtn.style.display = 'block';
            }
            
            if (this.currentStep > 1) {
                this.goToStep(this.currentStep - 1);
            }
        });
    }

    setupMainFormHandlers() {
        // Xử lý các nút tăng/giảm số trong form chính
        const mainFormInputs = document.querySelectorAll('.step:first-child .number-input');
        mainFormInputs.forEach(wrapper => {
            const input = wrapper.querySelector('input');
            const decreaseBtn = wrapper.querySelector('.decrease');
            const increaseBtn = wrapper.querySelector('.increase');

            if (input && input.classList.contains('buy-in-input')) {
                this.buyInInput = input;
            } else if (input && input.classList.contains('starting-stack-input')) {
                this.startingStackInput = input;
            } else if (input && input.classList.contains('rake-amount-input')) {
                this.rakeAmountInput = input;
            }

            decreaseBtn?.addEventListener('click', () => this.handleNumberChange(input, false));
            increaseBtn?.addEventListener('click', () => this.handleNumberChange(input, true));
        });

        // Xử lý toggle phí/rake
        const feeToggle = document.querySelector('.step:first-child .switch-group input[type="checkbox"]');
        const feeGroup = document.querySelector('.fee-group');

        if (feeToggle && feeGroup) {
            feeToggle.addEventListener('change', () => {
                feeGroup.classList.toggle('hidden', !feeToggle.checked);
            });
        }
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

        // Cập nhật giá trị input
        input.value = newValue.toFixed(input.step.includes('.') ? 2 : 0);

        // Cập nhật tournamentData
        if (input.classList.contains('buy-in-input')) {
            this.tournamentData.buy_in_price = newValue;
            console.log('Updated buy_in_price:', newValue);
        } else if (input.classList.contains('starting-stack-input')) {
            this.tournamentData.starting_stack = newValue;
            console.log('Updated starting_stack:', newValue);
        } else if (input.classList.contains('rake-amount-input')) {
            this.tournamentData.rake_amount = newValue;
            console.log('Updated rake_amount:', newValue);
        }

        // Lưu vào database
        this.saveTournamentData();
    }

    goToStep(step) {
        // Ẩn tất cả các bước và form content
        this.steps.forEach((stepElement, index) => {
            stepElement.classList.remove('active');
            stepElement.classList.remove('collapsed');
            
            const formContent = stepElement.querySelector('.form-content');
            if (formContent) {
                formContent.classList.add('hidden');
            }
        });

        // Hiển thị bước mới và các bước trước đó
        for (let i = 0; i < step; i++) {
            const stepElement = this.steps[i];
            if (i === step - 1) {
                // Bước hiện tại
                stepElement.classList.add('active');
                stepElement.classList.remove('collapsed');
                
                // Hiển thị form content của bước hiện tại
                const formContent = stepElement.querySelector('.form-content');
                if (formContent) {
                    formContent.classList.remove('hidden');
                }
                
                // Hiển thị tất cả các form và input của bước hiện tại
                const forms = stepElement.querySelectorAll('form');
                forms.forEach(form => form.style.display = 'block');
                
                const formElements = stepElement.querySelectorAll('input, select, textarea, .form-group, .form-control');
                formElements.forEach(element => element.style.display = '');
            } else {
                // Các bước trước đó
                stepElement.classList.add('collapsed');
                stepElement.classList.remove('active');
            }
        }
        
        this.currentStep = step;
        
        // Cập nhật hiển thị nút Quay lại
        if (this.currentStep > 1) {
            this.backBtn.style.display = 'block';
        } else {
            this.backBtn.style.display = 'none';
        }
    }

    initializeFormValues() {
        // Lấy các elements
        this.nameInput = document.getElementById('tournamentName');
        this.locationInput = document.getElementById('location');
        this.buyInInput = document.querySelector('.step:first-child .form-row .number-input:first-child input');
        this.startingStackInput = document.querySelector('.step:first-child .form-row .number-input:last-child input');
        this.currencySelect = document.querySelector('.currency-select select');
        this.chargeRakeToggle = document.querySelector('.step:first-child .switch-group input[type="checkbox"]');
        this.rakeAmountInput = document.querySelector('.fee-group .number-input input');
        this.feeGroup = document.querySelector('.fee-group');

        // Kiểm tra và đặt giá trị ban đầu
        if (this.nameInput) {
            this.nameInput.value = this.tournamentData.name;
            this.nameInput.addEventListener('input', () => {
                this.tournamentData.name = this.nameInput.value;
                this.saveTournamentData();
            });
        }

        if (this.locationInput) {
            this.locationInput.value = this.tournamentData.location;
            this.locationInput.addEventListener('input', () => {
                this.tournamentData.location = this.locationInput.value;
                this.saveTournamentData();
            });
        }

        if (this.buyInInput) {
            this.buyInInput.value = this.tournamentData.buy_in_price.toFixed(2);
            this.buyInInput.addEventListener('change', () => {
                this.tournamentData.buy_in_price = parseFloat(this.buyInInput.value);
                this.saveTournamentData();
            });
            this.buyInInput.addEventListener('input', () => {
                this.tournamentData.buy_in_price = parseFloat(this.buyInInput.value) || 0;
                this.saveTournamentData();
            });
        }

        if (this.startingStackInput) {
            this.startingStackInput.value = this.tournamentData.starting_stack;
            this.startingStackInput.addEventListener('change', () => {
                this.tournamentData.starting_stack = parseInt(this.startingStackInput.value);
                this.saveTournamentData();
            });
            this.startingStackInput.addEventListener('input', () => {
                this.tournamentData.starting_stack = parseInt(this.startingStackInput.value) || 0;
                this.saveTournamentData();
            });
        }

        if (this.currencySelect) {
            this.currencySelect.value = this.tournamentData.currency;
            this.currencySelect.addEventListener('change', () => {
                this.tournamentData.currency = this.currencySelect.value;
                this.saveTournamentData();
            });
        }

        if (this.chargeRakeToggle) {
            this.chargeRakeToggle.checked = Boolean(this.tournamentData.charge_rake);
            this.chargeRakeToggle.addEventListener('change', () => {
                this.tournamentData.charge_rake = this.chargeRakeToggle.checked ? 1 : 0;
                if (this.feeGroup) {
                    this.feeGroup.classList.toggle('hidden', !this.chargeRakeToggle.checked);
                }
                if (!this.chargeRakeToggle.checked && this.rakeAmountInput) {
                    this.tournamentData.rake_amount = 0;
                    this.rakeAmountInput.value = '0.00';
                }
                this.saveTournamentData();
            });
        }

        if (this.rakeAmountInput) {
            this.rakeAmountInput.value = this.tournamentData.rake_amount.toFixed(2);
            this.rakeAmountInput.addEventListener('change', () => {
                this.tournamentData.rake_amount = parseFloat(this.rakeAmountInput.value);
                this.saveTournamentData();
            });
        }

        // Hiển thị/ẩn fee group dựa trên trạng thái ban đầu
        if (this.feeGroup) {
            this.feeGroup.classList.toggle('hidden', !Boolean(this.tournamentData.charge_rake));
        }
    }

    async saveTournamentData() {
        try {
            console.log('Saving tournament data:', this.tournamentData);
            await window.api.saveTournamentData(this.tournamentData);
            console.log('Tournament data saved successfully');
        } catch (error) {
            console.error('Error saving tournament data:', error);
        }
    }
}

// Khởi tạo khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    new TournamentInfo();
});
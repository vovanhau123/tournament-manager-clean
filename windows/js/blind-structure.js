class BlindStructure {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadBlindStructure();
        this.updateTotalDuration();
    }

    initializeElements() {
        // Default values elements
        this.defaultDuration = document.querySelector('.default-values input[value="15"]');
        this.defaultBreak = document.querySelector('.default-values input[value="10"]');
        this.defaultAnteSelect = document.querySelector('.ante-select');
        this.defaultIncrease = document.querySelector('.default-values input[value="25"]');

        // Table elements
        this.tableBody = document.querySelector('.table-body');
        this.autoUpdateToggle = document.querySelector('.auto-update input[type="checkbox"]');

        // Buttons
        this.addLevelBtns = document.querySelectorAll('.add-level');
        this.addBreakBtns = document.querySelectorAll('.add-break');
        this.resetBtn = document.querySelector('.action-btn.reset');
        this.saveBtn = document.querySelector('.action-btn.save');
        this.exportBtn = document.querySelector('.action-btn.export');

        // Setup number input controls
        document.querySelectorAll('.number-input').forEach(container => {
            const input = container.querySelector('input');
            const decreaseBtn = container.querySelector('.decrease');
            const increaseBtn = container.querySelector('.increase');

            if (input && decreaseBtn && increaseBtn) {
                decreaseBtn.addEventListener('click', () => {
                    const step = parseFloat(input.step) || 1;
                    const min = parseFloat(input.min) || 0;
                    const newValue = Math.max(min, parseFloat(input.value) - step);
                    input.value = newValue;
                    input.dispatchEvent(new Event('input'));
                });

                increaseBtn.addEventListener('click', () => {
                    const step = parseFloat(input.step) || 1;
                    const max = parseFloat(input.max) || Infinity;
                    const newValue = Math.min(max, parseFloat(input.value) + step);
                    input.value = newValue;
                    input.dispatchEvent(new Event('input'));
                });
            }
        });

        // Thêm event listener cho ante select
        this.defaultAnteSelect.addEventListener('change', () => {
            this.updateAllAnteValues();
        });
    }

    setupEventListeners() {
        // Add level/break buttons
        this.addLevelBtns.forEach(btn => {
            btn.addEventListener('click', () => this.addLevel());
        });

        this.addBreakBtns.forEach(btn => {
            btn.addEventListener('click', () => this.addBreak());
        });

        // Reset and Save buttons
        this.resetBtn?.addEventListener('click', () => this.resetStructure());
        this.saveBtn?.addEventListener('click', () => this.saveStructure());
        this.exportBtn?.addEventListener('click', () => this.exportStructure());

        // Table input changes
        if (this.tableBody) {
            this.tableBody.addEventListener('input', async (e) => {
                if (e.target.tagName === 'INPUT') {
                    // Cập nhật tính toán nếu auto update được bật
                    if (this.autoUpdateToggle?.checked) {
                this.updateCalculations();
                    }

                    // Lấy thông tin về row và các input
                    const row = e.target.closest('.table-row');
                    if (!row) return;

                    try {
                        // Lấy tất cả input trong row
                        const inputs = row.querySelectorAll('input');
                        const isBreak = row.classList.contains('break');
                        const handleText = row.querySelector('.handle').textContent.replace('≡', '').trim();
                        
                        // Tạo dữ liệu để cập nhật
                        const updateData = {
                            level_number: isBreak ? 0 : parseInt(handleText),
                            duration_minutes: parseInt(inputs[0].value) || 0,
                            is_break: isBreak,
                            small_blind: isBreak ? 0 : (parseInt(inputs[1]?.value) || 0),
                            big_blind: isBreak ? 0 : (parseInt(inputs[2]?.value) || 0),
                            ante: isBreak ? 0 : (parseInt(inputs[3]?.value) || 0)
                        };

                        // Lưu vào database
                        await this.saveStructure();
                        console.log('Đã cập nhật dữ liệu:', updateData);
                    } catch (error) {
                        console.error('Lỗi khi cập nhật giá trị:', error);
                    }
            }
        });

        // Delete buttons
            this.tableBody.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const row = e.target.closest('.table-row');
                if (row) {
                        try {
                            const isBreak = row.classList.contains('break');
                            const handleText = row.querySelector('.handle').textContent.replace('≡', '').trim();
                            
                            // Nếu là break thì gửi id của break, còn không thì gửi số level
                            const itemToDelete = {
                                isBreak: isBreak,
                                level: isBreak ? 0 : parseInt(handleText)
                            };

                            // Xóa trong database trước
                            await window.api.deleteBlindLevel(itemToDelete);
                            
                            // Nếu xóa database thành công thì xóa trên giao diện
                    row.remove();
                            
                            // Cập nhật lại số thứ tự và thời gian
                    this.updateLevelNumbers();
                    this.updateTotalDuration();
                            
                            // Lưu lại cấu trúc mới sau khi xóa
                            await this.saveStructure();
                        } catch (error) {
                            console.error('Lỗi khi xóa:', error);
                            alert('Có lỗi khi xóa. Vui lòng thử lại.');
                        }
                    }
                }
            });
        }

        // Make rows draggable
        this.setupDragAndDrop();
    }

    async addLevel() {
        try {
            // Lấy giá trị mặc định từ giao diện (đã ở dạng phút)
            const defaultDurationMinutes = parseInt(this.defaultDuration?.value) || 15;
            
            // Tạo dữ liệu cho database (chuyển sang giây)
            const levelData = {
                level_number: this.getNextLevelNumber(),
                duration_minutes: defaultDurationMinutes * 60,  // Chuyển sang giây khi lưu vào DB
                small_blind: 25,
                big_blind: 50,
                ante: 0
            };

            // Nếu có level trước đó, tính toán giá trị mới
        const lastLevel = this.getLastLevel();
            if (lastLevel) {
                const inputs = lastLevel.querySelectorAll('input');
                if (inputs && inputs.length >= 3) {
                    const lastSmallBlind = parseInt(inputs[1].value) || 25;
                    levelData.small_blind = Math.round(lastSmallBlind * 1.25); // Tăng 25% mặc định
                    levelData.big_blind = levelData.small_blind * 2;
                    
                    // Set ante dựa trên loại ante được chọn
                    const anteType = this.defaultAnteSelect.value;
                    switch (anteType) {
                        case 'big-blind':
                            levelData.ante = levelData.big_blind;
                            break;
                        case 'small-blind':
                            levelData.ante = levelData.small_blind;
                            break;
                        case 'Custom':
                            levelData.ante = parseInt(inputs[3]?.value) || 0;
                            break;
                        case 'none':
                            levelData.ante = 0;
                            break;
                    }
                }
            }

            // Lưu vào database
            await window.api.addBlindLevel(levelData);

            // Tạo giao diện
        const newLevel = document.createElement('div');
        newLevel.className = 'table-row';
        newLevel.setAttribute('draggable', 'true');

        newLevel.innerHTML = `
                <div class="col handle">≡ ${levelData.level_number}</div>
                <div class="col"><input type="number" value="${defaultDurationMinutes}"></div>
                <div class="col"><input type="number" value="${levelData.small_blind}"></div>
                <div class="col"><input type="number" value="${levelData.big_blind}"></div>
                <div class="col"><input type="number" value="${levelData.ante}"></div>
            <div class="col"><input type="number" value=""></div>
            <div class="col"><button class="delete-btn">×</button></div>
        `;

            if (this.tableBody) {
        this.tableBody.appendChild(newLevel);
        this.updateTotalDuration();
            }
        } catch (error) {
            console.error('Lỗi khi thêm level:', error);
        }
    }

    async deleteLevel(levelNumber) {
        try {
            await window.api.deleteBlindLevel(levelNumber);
        } catch (error) {
            console.error('Lỗi khi xóa level:', error);
        }
    }

    getLastLevel() {
        if (!this.tableBody) return null;
        const rows = Array.from(this.tableBody.querySelectorAll('.table-row:not(.break)'));
        return rows[rows.length - 1];
    }

    getNextLevelNumber() {
        if (!this.tableBody) return 1;
        const levels = this.tableBody.querySelectorAll('.table-row:not(.break)');
        return levels.length + 1;
    }

    updateLevelNumbers() {
        if (!this.tableBody) return;
        let levelNumber = 1;
        this.tableBody.querySelectorAll('.table-row').forEach(row => {
            const handleElement = row.querySelector('.handle');
            if (!row.classList.contains('break')) {
                handleElement.textContent = `≡ ${levelNumber++}`;
            } else {
                handleElement.textContent = '≡ Break';
            }
        });
    }

    async updateTotalDuration() {
        if (!this.tableBody) return;
        
        try {
            // Lấy dữ liệu từ database
            const blindStructure = await window.api.getBlindStructure();
            
            // Tính tổng số phút từ duration_minutes
        let totalMinutes = 0;
            blindStructure.forEach(item => {
                // duration_minutes trong DB đang là giây, cần chia 60 để ra phút
                totalMinutes += Math.floor((item.duration_minutes || 0) / 60);
        });

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
            const durationElement = document.querySelector('.duration');
            if (durationElement) {
                durationElement.textContent = `⏱ Tổng thời gian: ${hours}:${minutes.toString().padStart(2, '0')} giờ`;
            }
        } catch (error) {
            console.error('Lỗi khi tính tổng thời gian:', error);
        }
    }

    setupDragAndDrop() {
        if (!this.tableBody) return;
        let draggedItem = null;

        this.tableBody.querySelectorAll('.table-row').forEach(row => {
            row.addEventListener('dragstart', () => {
                draggedItem = row;
                setTimeout(() => row.style.display = 'none', 0);
            });

            row.addEventListener('dragend', async () => {
                setTimeout(async () => {
                    row.style.display = '';
                    draggedItem = null;
                    
                    // Sau khi kéo thả xong, lưu lại cấu trúc mới
                    try {
                        await this.saveStructure();
                        // Tải lại dữ liệu để cập nhật số thứ tự
                        await this.loadBlindStructure();
                    } catch (error) {
                        console.error('Lỗi khi lưu cấu trúc sau khi kéo thả:', error);
                    }
                }, 0);
            });

            row.addEventListener('dragover', e => {
                e.preventDefault();
                const afterElement = this.getDragAfterElement(this.tableBody, e.clientY);
                if (draggedItem) {
                if (afterElement == null) {
                    this.tableBody.appendChild(draggedItem);
                } else {
                    this.tableBody.insertBefore(draggedItem, afterElement);
                    }
                }
            });
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.table-row:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    async resetStructure() {
        if (confirm('Bạn có chắc muốn đặt lại cấu trúc mù không?')) {
            try {
                // Lấy tournament_id hiện tại
                const tournament = await window.api.getTournamentData();
                
                // Xóa toàn bộ dữ liệu trong bảng blind_structure
                await window.api.resetBlindStructure();

                // Xóa dữ liệu trên giao diện
                if (this.tableBody) {
                    this.tableBody.innerHTML = '';
                }

                // Cập nhật tổng thời gian
                this.updateTotalDuration();
            } catch (error) {
                console.error('Lỗi khi reset cấu trúc:', error);
                alert('Có lỗi xảy ra khi reset cấu trúc. Vui lòng thử lại.');
            }
        }
    }

    async saveStructure() {
        try {
            const levels = [];
            let currentLevel = 1;
            if (this.tableBody) {
                // Lưu theo thứ tự hiện tại trên giao diện
                this.tableBody.querySelectorAll('.table-row').forEach(row => {
                    const inputs = row.querySelectorAll('input');
                    // Chuyển đổi từ min sang giây khi lưu vào database
                    const durationMinutes = parseInt(inputs[0].value) || 0;
                    const durationSeconds = durationMinutes * 60;
                    const isBreak = row.classList.contains('break');

                    if (isBreak) {
                        // Nếu là break
                        levels.push({
                            level_number: 0,
                            duration_minutes: durationSeconds, // Lưu vào DB dưới dạng giây
                            is_break: true,
                            small_blind: 0,
                            big_blind: 0,
                            ante: 0
                        });
                    } else {
                        // Nếu là level thường
                        levels.push({
                            level_number: currentLevel++,
                            duration_minutes: durationSeconds, // Lưu vào DB dưới dạng giây
                            is_break: false,
                            small_blind: parseInt(inputs[1].value) || 0,
                            big_blind: parseInt(inputs[2].value) || 0,
                            ante: parseInt(inputs[3].value) || 0
                        });
                    }
                });
            }

            // Lưu vào database
            await window.api.saveBlindStructure(levels);
            console.log('Đã lưu cấu trúc thành công:', levels);

            // Cập nhật lại số thứ tự trên giao diện
            this.updateLevelNumbers();
        } catch (error) {
            console.error('Lỗi khi lưu cấu trúc:', error);
            throw error;
        }
    }

    exportStructure() {
        // Implement export functionality
        console.log('Exporting structure...');
    }

    updateCalculations() {
        this.updateTotalDuration();
    }

    async loadBlindStructure() {
        try {
            console.log('Bắt đầu load blind structure...');
            // Lấy dữ liệu blind structure từ database
            const blindStructure = await window.api.getBlindStructure();
            console.log('Dữ liệu nhận được:', blindStructure);
            
            // Xóa tất cả các level hiện tại trên giao diện
            if (this.tableBody) {
                this.tableBody.innerHTML = '';
            }

            // Kiểm tra xem có dữ liệu không
            if (!blindStructure || blindStructure.length === 0) {
                console.log('Không có dữ liệu blind structure');
                return;
            }

            // Thêm từng level/break vào giao diện
            blindStructure.forEach(item => {
                console.log('Đang thêm item:', item);
                const newRow = document.createElement('div');
                newRow.setAttribute('draggable', 'true');

                // Chuyển đổi từ giây sang min để hiển thị
                const durationMinutes = Math.floor((item.duration_minutes || 0) / 60);

                if (item.is_break) {
                    // Nếu là break
                    newRow.className = 'table-row break';
                    newRow.innerHTML = `
                        <div class="col handle">≡ Break</div>
                        <div class="col"><input type="number" value="${durationMinutes}"></div>
                        <div class="col">-</div>
                        <div class="col">-</div>
                        <div class="col">-</div>
                        <div class="col">-</div>
                        <div class="col"><button class="delete-btn">×</button></div>
                    `;
                } else {
                    // Nếu là level thường
                    newRow.className = 'table-row';
                    newRow.innerHTML = `
                        <div class="col handle">≡ ${item.level}</div>
                        <div class="col"><input type="number" value="${durationMinutes}"></div>
                        <div class="col"><input type="number" value="${item.small_blind || 0}"></div>
                        <div class="col"><input type="number" value="${item.big_blind || 0}"></div>
                        <div class="col"><input type="number" value="${item.ante || 0}"></div>
                        <div class="col"><input type="number" value=""></div>
                        <div class="col"><button class="delete-btn">×</button></div>
                    `;
                }

                if (this.tableBody) {
                    this.tableBody.appendChild(newRow);
                }
            });

            // Cập nhật tổng thời gian
            this.updateTotalDuration();
            
            // Thiết lập lại drag and drop
            this.setupDragAndDrop();
            console.log('Hoàn thành load blind structure');
        } catch (error) {
            console.error('Lỗi khi load blind structure:', error);
        }
    }

    async addBreak() {
        try {
            // Lấy giá trị break duration mặc định (đã ở dạng min)
            const breakDurationMinutes = parseInt(this.defaultBreak?.value) || 10;
            
            // Tạo dữ liệu cho database (chuyển sang giây)
            const breakData = {
                level_number: 0,
                duration_minutes: breakDurationMinutes * 60, // Chuyển sang giây khi lưu vào DB
                is_break: true,
                small_blind: 0,
                big_blind: 0,
                ante: 0
            };

            // Lưu vào database
            await window.api.addBlindLevel(breakData);

            // Tạo giao diện (hiển thị ở dạng min)
            const newBreak = document.createElement('div');
            newBreak.className = 'table-row break';
            newBreak.setAttribute('draggable', 'true');

            newBreak.innerHTML = `
                <div class="col handle">≡ Break</div>
                <div class="col"><input type="number" value="${breakDurationMinutes}"></div>
                <div class="col">-</div>
                <div class="col">-</div>
                <div class="col">-</div>
                <div class="col">-</div>
                <div class="col"><button class="delete-btn">×</button></div>
            `;

            if (this.tableBody) {
                this.tableBody.appendChild(newBreak);
                this.updateTotalDuration();
                this.setupDragAndDrop();
            }
        } catch (error) {
            console.error('Lỗi khi thêm break:', error);
            alert('Có lỗi khi thêm break. Vui lòng thử lại.');
        }
    }

    async updateAllAnteValues() {
        if (!this.tableBody) return;

        const anteType = this.defaultAnteSelect.value;
        const rows = this.tableBody.querySelectorAll('.table-row:not(.break)');

        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            const smallBlind = parseInt(inputs[1]?.value) || 0;
            const bigBlind = parseInt(inputs[2]?.value) || 0;
            const anteInput = inputs[3];

            if (anteInput) {
                switch (anteType) {
                    case 'big-blind':
                        anteInput.value = bigBlind;
                        break;
                    case 'small-blind':
                        anteInput.value = smallBlind;
                        break;
                    case 'Custom':
                        // Giữ nguyên giá trị hiện tại
                        break;
                    case 'none':
                        anteInput.value = 0;
                        break;
                }
            }
        });

        // Lưu cập nhật vào database
        await this.saveStructure();
    }
}

// Khởi tạo khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    window.blindStructure = new BlindStructure();
});
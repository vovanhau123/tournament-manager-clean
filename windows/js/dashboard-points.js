/**
 * dashboard-points.js
 * Module quản lý điểm số trong dashboard
 */

class DashboardPoints {
    constructor() {
        this.pointConfig = null;
    }

    /**
     * Tải cấu hình điểm từ database
     * @returns {Promise<Object>} - Cấu hình điểm
     */
    async loadPointConfig() {
        try {
            this.pointConfig = await window.api.getPointConfig();
            return this.pointConfig;
        } catch (error) {
            console.error('Error loading point configuration:', error);
            return null;
        }
    }

    /**
     * Update points display on UI
     * @param {HTMLElement} container - Dashboard container
     */
    async updatePointsDisplay(container) {
        await this.loadPointConfig();
        
        if (this.pointConfig && container) {
            const pointValues = container.querySelectorAll('.point-value');
            const pointInputs = container.querySelectorAll('.point-input');
            
            pointValues.forEach(value => {
                const type = value.dataset.type;
                const dbKey = this.getDbKeyFromType(type);
                if (this.pointConfig[dbKey] !== undefined) {
                    value.textContent = this.pointConfig[dbKey];
                }
            });
            
            pointInputs.forEach(input => {
                const type = input.dataset.type;
                const dbKey = this.getDbKeyFromType(type);
                if (this.pointConfig[dbKey] !== undefined) {
                    input.value = this.pointConfig[dbKey];
                }
            });
        }
    }

    /**
     * Chuyển đổi loại UI thành khóa database
     * @param {string} type - Loại từ UI
     * @returns {string} Khóa trong database
     */
    getDbKeyFromType(type) {
        switch (type) {
            case 'win1_sng':
                return 'win1_sng_points';
            case 'win2_sng':
                return 'win2_sng_points';
            case 'win3_sng':
                return 'win3_sng_points';
            case 'win1_tour':
                return 'win1_tour_points';
            case 'win2_tour':
                return 'win2_tour_points';
            case 'win3_tour':
                return 'win3_tour_points';
            default:
                return type;
        }
    }

    /**
     * Gắn các sự kiện cho phần cài đặt điểm
     * @param {HTMLElement} container - Dashboard container
     */
    attachPointsEvents(container) {
        const editPointsBtn = container.querySelector('.edit-points-btn');
        const pointValues = container.querySelectorAll('.point-value');
        const pointInputs = container.querySelectorAll('.point-input');
        
        if (editPointsBtn) {
            editPointsBtn.addEventListener('click', async () => {
                const isEditing = editPointsBtn.textContent === 'Save';
                
                if (isEditing) {
                    // Lưu các giá trị mới
                    const newConfig = {};
                    pointInputs.forEach(input => {
                        const type = input.dataset.type;
                        // Chuyển đổi tên trường để khớp với database
                        const dbKey = this.getDbKeyFromType(type);
                        newConfig[dbKey] = parseInt(input.value) || 0;
                    });

                    try {
                        console.log("Đang gửi cấu hình điểm mới:", newConfig);
                        // Cập nhật vào database
                        await window.api.updatePointConfig(newConfig);
                        this.pointConfig = newConfig;
                        
                        // Cập nhật hiển thị
                        pointValues.forEach(value => {
                            const type = value.dataset.type;
                            const dbKey = this.getDbKeyFromType(type);
                            value.textContent = newConfig[dbKey];
                            value.style.display = 'block';
                        });
                        
                        pointInputs.forEach(input => {
                            input.style.display = 'none';
                        });
                        
                        editPointsBtn.textContent = 'Chỉnh sửa';

                        // Cập nhật lại danh sách người chơi vì điểm đã thay đổi
                        if (window.DashboardPlayers) {
                            const playersManager = new window.DashboardPlayers();
                            const standingsBody = container.querySelector('.standings-body');
                            await playersManager.updatePlayersList(standingsBody);
                        }
                    } catch (error) {
                        console.error('Error updating point configuration:', error);
                        notifications.showConfirm('Lỗi', 'Đã xảy ra lỗi khi cập nhật điểm. Bạn có muốn thử lại không?').then(confirmed => {
                            if (confirmed) {
                                editPointsBtn.click();
                            }
                        });
                    }
                } else {
                    // Chuyển sang chế độ chỉnh sửa
                    pointValues.forEach(value => {
                        const type = value.dataset.type;
                        const input = container.querySelector(`.point-input[data-type="${type}"]`);
                        value.style.display = 'none';
                        input.value = value.textContent;
                        input.style.display = 'inline-block';
                    });
                    
                    editPointsBtn.textContent = 'Save';
                }
            });
        }
    }
}

// Export class
window.DashboardPoints = DashboardPoints; 
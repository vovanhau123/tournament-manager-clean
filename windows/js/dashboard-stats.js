/**
 * dashboard-stats.js
 * Module quản lý thống kê và counter trong dashboard
 */

class DashboardStats {
    constructor() {
        this.entriesCount = 0;
        this.playersLeftCount = 0;
        this.reentriesCount = 0;
        this.addonsCount = 0;
    }

    /**
     * Tải dữ liệu thống kê từ database
     * @returns {Promise<Object>} - Dữ liệu thống kê
     */
    async loadStats() {
        try {
            const stats = await window.api.getTournamentStats();
            if (stats && stats[0]) {
                this.entriesCount = stats[0].total_entries || 0;
                this.playersLeftCount = stats[0].players_left || 0;
                this.reentriesCount = stats[0].reentries || 0;
                this.addonsCount = stats[0].addons || 0;
                return stats[0];
            }
            return null;
        } catch (error) {
            console.error('Error loading tournament statistics:', error);
            return null;
        }
    }

    /**
     * Update counter display
     * @param {HTMLElement} container - Dashboard container
     */
    async updateCounterDisplay(container) {
        await this.loadStats();
        
        const counterControls = container.querySelectorAll('.counter-control');
        counterControls.forEach(control => {
            const valueSpan = control.querySelector('.counter-value');
            const label = control.querySelector('.counter-label').textContent.toLowerCase();
            if (valueSpan) {
                switch(label) {
                    case 'entries':
                        valueSpan.textContent = this.entriesCount;
                        break;
                    case 're-entries':
                        valueSpan.textContent = this.reentriesCount;
                        break;
                    case 'players left':
                        valueSpan.textContent = this.playersLeftCount;
                        break;
                    case 'addons':
                        valueSpan.textContent = this.addonsCount;
                        break;
                }
            }
        });

        // Update display for total_chips and average_stack
        const stats = await this.loadStats();
        if (stats) {
            const totalChipsElement = container.querySelector('.stat-value[data-stat="total-chips"]');
            const averageStackElement = container.querySelector('.stat-value[data-stat="average-stack"]');
            const currentLevelElement = container.querySelector('.stat-value[data-stat="current-level"]');
            
            if (totalChipsElement) {
                totalChipsElement.textContent = (stats.total_chips || 0).toLocaleString();
            }
            if (averageStackElement) {
                averageStackElement.textContent = (stats.average_stack || 0).toLocaleString();
            }
            if (currentLevelElement && stats.current_level) {
                currentLevelElement.textContent = stats.current_level;
            }
        }
    }

    /**
     * Cập nhật thống kê khi counter thay đổi
     * @param {string} type - Loại counter ('entries', 're-entries', 'players-left', 'addons')
     * @param {number} newValue - Giá trị mới
     * @param {HTMLElement} container - Dashboard container
     */
    async updateStats(type, newValue, container) {
        let updateData = {};

        switch(type) {
            case 'entries':
                this.entriesCount = newValue;
                if (this.playersLeftCount > this.entriesCount) {
                    this.playersLeftCount = this.entriesCount;
                }
                updateData = {
                    total_entries: this.entriesCount,
                    players_left: this.playersLeftCount
                };
                break;

            case 're-entries':
                this.reentriesCount = newValue;
                updateData = { reentries: this.reentriesCount };
                break;

            case 'players-left':
                if (newValue > this.entriesCount) {
                    newValue = this.entriesCount;
                }
                this.playersLeftCount = newValue;
                updateData = { players_left: this.playersLeftCount };
                
                // Lấy số lượng players hiện tại
                const currentPlayers = await window.api.getPlayers();
                const currentCount = currentPlayers.length;
                
                if (newValue > currentCount) {
                    // Thêm players mới
                    const playersToAdd = newValue - currentCount;
                    for (let i = 0; i < playersToAdd; i++) {
                        await window.api.addPlayer({});
                    }
                    // Cập nhật lại danh sách người chơi
                    if (window.DashboardPlayers) {
                        const playersManager = new window.DashboardPlayers();
                        const standingsBody = container.querySelector('.standings-body');
                        await playersManager.updatePlayersList(standingsBody);
                    }
                }
                break;

            case 'addons':
                this.addonsCount = newValue;
                updateData = { addons: this.addonsCount };
                break;
        }

        try {
            // Cập nhật dữ liệu vào database
            await window.api.updateTournamentStats(updateData);
            
            // Cập nhật hiển thị
            await this.updateCounterDisplay(container);
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }

    /**
     * Gắn sự kiện cho các counter
     * @param {HTMLElement} container - Dashboard container
     */
    attachCounterEvents(container) {
        const counterControls = container.querySelectorAll('.counter-control');
        
        counterControls.forEach(control => {
            const decreaseBtn = control.querySelector('.decrease');
            const increaseBtn = control.querySelector('.increase');
            const valueSpan = control.querySelector('.counter-value');
            const label = control.querySelector('.counter-label').textContent.toLowerCase();
            
            decreaseBtn.addEventListener('click', () => {
                const currentValue = parseInt(valueSpan.textContent) || 0;
                if (currentValue > 0) {
                    const newValue = currentValue - 1;
                    valueSpan.textContent = newValue;
                    this.updateStats(label.replace(' ', '-'), newValue, container);
                }
            });

            increaseBtn.addEventListener('click', () => {
                const currentValue = parseInt(valueSpan.textContent) || 0;
                const newValue = currentValue + 1;
                valueSpan.textContent = newValue;
                this.updateStats(label.replace(' ', '-'), newValue, container);
            });
        });

        // Xử lý rebuy stack
        const rebuyStackInput = container.querySelector('#rebuyStackInput');
        if (rebuyStackInput) {
            // Load giá trị hiện tại từ database
            window.api.query(
                'SELECT rebuy_stack FROM tournament_stats ORDER BY id DESC LIMIT 1'
            ).then(result => {
                if (result && result[0]) {
                    rebuyStackInput.value = result[0].rebuy_stack || 0;
                }
            }).catch(error => {
                console.error('Error loading rebuy stack value:', error);
            });

            // Xử lý sự kiện khi người dùng nhập xong
            rebuyStackInput.addEventListener('change', async (e) => {
                const value = parseInt(e.target.value) || 0;
                
                try {
                    await window.api.query(
                        'UPDATE tournament_stats SET rebuy_stack = ? WHERE id = (SELECT id FROM tournament_stats ORDER BY id DESC LIMIT 1)',
                        [value]
                    );
                    console.log('Rebuy stack updated successfully:', value);
                } catch (error) {
                    console.error('Error updating rebuy stack:', error);
                }
            });
        }
    }
}

// Export class
window.DashboardStats = DashboardStats; 
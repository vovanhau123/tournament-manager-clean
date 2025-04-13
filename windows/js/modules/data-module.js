/**
 * Module quản lý việc tải và cập nhật dữ liệu
 */
import { formatNumber, formatCurrency } from './utils.js';

export class DataManager {
    /**
     * Khởi tạo DataManager
     * @param {Object} elements - Các phần tử DOM cần thiết
     */
    constructor(elements) {
        this.elements = elements;
        this.tournamentData = null;
        this.tournamentStats = null;
        this.blindStructure = [];
        this.updateInterval = null;
    }

    /**
     * Tải dữ liệu ban đầu
     * @returns {Promise<Object>} Dữ liệu giải đấu đã tải
     */
    async loadInitialData() {
        try {
            console.log('Bắt đầu tải dữ liệu tournament...');
            
            // Tải dữ liệu giải đấu
            this.tournamentData = await window.api.getTournamentData();
            console.log('Dữ liệu tournament nhận được:', this.tournamentData);
            
            // Tải cấu trúc mức cược
            this.blindStructure = await window.api.getBlindStructure();
            console.log('Dữ liệu blind structure:', this.blindStructure);
            
            // Tải thống kê giải đấu
            this.tournamentStats = await window.api.getTournamentStats();
            
            // Cập nhật giao diện
            this.updateDisplay();
            
            // Trả về dữ liệu đã tải
            return {
                tournamentData: this.tournamentData,
                blindStructure: this.blindStructure,
                tournamentStats: this.tournamentStats
            };
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu tournament:', error);
            throw error;
        }
    }

    /**
     * Bắt đầu cập nhật định kỳ
     * @param {number} interval - Thời gian giữa các lần cập nhật (ms)
     */
    startPeriodicUpdates(interval = 5000) {
        // Dừng interval cũ nếu có
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Thiết lập interval mới
        this.updateInterval = setInterval(() => this.updateStats(), interval);
    }

    /**
     * Cập nhật thống kê
     */
    async updateStats() {
        try {
            // Lấy dữ liệu từ tournament_stats
            this.tournamentStats = await window.api.getTournamentStats();
            
            // Lấy dữ liệu từ tournament_info để có buy_in_price nếu cần
            if (!this.tournamentData || !this.tournamentData.buy_in_price) {
                this.tournamentData = await window.api.getTournamentData();
            }
            
            // Cập nhật giao diện
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Lỗi khi cập nhật thống kê:', error);
        }
    }

    /**
     * Cập nhật giao diện hiển thị
     */
    updateDisplay() {
        // Cập nhật thống kê
        this.updateStatsDisplay();
        
        // Cập nhật thông tin giải đấu
        this.updateTournamentInfo();
    }

    /**
     * Cập nhật giao diện hiển thị thống kê
     */
    updateStatsDisplay() {
        if (!this.tournamentStats || !this.tournamentStats[0]) return;
        
        const stats = this.tournamentStats[0];
        
        // Cập nhật thông tin players
        if (this.elements.playersElement) {
            this.elements.playersElement.textContent = `${stats.players_left || 0}/${stats.total_entries || 0}`;
        }
        
        // Cập nhật thông tin stack
        if (this.elements.avgStackElement) {
            this.elements.avgStackElement.textContent = formatNumber(stats.average_stack || 0);
        }
        
        if (this.elements.totalStackElement) {
            this.elements.totalStackElement.textContent = formatNumber(stats.total_chips || 0);
        }
        
        // Cập nhật thông tin buy-in và rebuy
        if (this.elements.buyInElement && this.tournamentData && this.tournamentData.buy_in_price !== undefined) {
            this.elements.buyInElement.textContent = formatCurrency(this.tournamentData.buy_in_price);
        }
        
        if (this.elements.rebuyElement) {
            this.elements.rebuyElement.textContent = stats.reentries || 0;
        }

        // Cập nhật thông tin stack bên phải
        if (this.elements.startingStackElement && this.tournamentData && this.tournamentData.starting_stack) {
            this.elements.startingStackElement.textContent = formatNumber(this.tournamentData.starting_stack);
        }
        
        // Cập nhật rebuy stack từ tournament_stats
        if (this.elements.rebuyStackElement && stats.rebuy_stack !== undefined) {
            this.elements.rebuyStackElement.textContent = formatNumber(stats.rebuy_stack || 0);
        }
    }

    /**
     * Cập nhật thông tin giải đấu
     */
    updateTournamentInfo() {
        if (!this.tournamentData) return;
        
        // Cập nhật entries info
        if (this.elements.totalEntriesElement) {
            const entriesInfo = `Total entries: ${this.tournamentData.total_entries || 0}<br>
                           Players left: ${this.tournamentData.players_left || 0}<br>
                           Reentries: ${this.tournamentData.reentries || 0}<br>
                           Addons: ${this.tournamentData.addons || 0}`;
            this.elements.totalEntriesElement.innerHTML = entriesInfo;
        }

        // Cập nhật buyin info
        if (this.elements.buyinInfoElement && 
            typeof this.tournamentData.buy_in_price !== 'undefined' && 
            typeof this.tournamentData.starting_stack !== 'undefined') {
            
            const buyinInfo = `Buyin: ${formatCurrency(this.tournamentData.buy_in_price)}<br>
                             Startstack: ${formatNumber(this.tournamentData.starting_stack)}<br>
                             Total Chips: ${formatNumber(this.tournamentData.total_chips || 0)}<br>
                             Average Stack: ${formatNumber(this.tournamentData.average_stack || 0)}<br>
                             Allowed reentries: ${this.tournamentData.allowed_reentries || 1}<br>
                             (Re)entry still possible: ${this.tournamentData.reentry_possible ? 'YES' : 'NO'}<br>
                             (Re)entry until level: ${this.tournamentData.reentry_until_level || 5}`;
            this.elements.buyinInfoElement.innerHTML = buyinInfo;
        }
    }

    /**
     * Cập nhật thông tin khi có dữ liệu mới
     * @param {Object} data - Dữ liệu giải đấu mới
     */
    updateWithNewData(data) {
        if (!data) return;
        
        // Cập nhật dữ liệu nội bộ
        this.tournamentData = { ...this.tournamentData, ...data };
        
        // Cập nhật giao diện
        this.updateTournamentInfo();
    }

    /**
     * Hủy bỏ quá trình cập nhật định kỳ
     */
    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
} 
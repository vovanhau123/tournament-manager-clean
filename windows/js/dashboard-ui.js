/**
 * dashboard-ui.js
 * Module tạo giao diện dashboard
 */

class DashboardUI {
    constructor() {
        this.dashboard = null;
    }

    /**
     * Tạo dashboard
     * @param {boolean} showAddonsButton - True nếu nên hiển thị nút addons
     * @returns {HTMLElement} - Dashboard element
     */
    async createDashboard(showAddonsButton) {
        // Tạo container cho dashboard
        this.dashboard = document.createElement('div');
        this.dashboard.id = 'dashboard';
        this.dashboard.className = 'dashboard';
        
        // Tạo phần đầu dashboard
        const dashboardTop = document.createElement('div');
        dashboardTop.className = 'dashboard-top';
        
        // Tạo phần thông tin thống kê
        const statsGroup = document.createElement('div');
        statsGroup.className = 'stats-group';
        statsGroup.innerHTML = `
            <div class="card-header">
                <h3>Statistics of tournament</h3>
                        </div>
            <div class="counter-container">
                <div class="counter-row">
                    <div class="counter-control">
                        <div class="counter-header">
                            <span class="counter-label">Entries</span>
                        </div>
                        <div class="counter-body">
                            <button class="decrease">-</button>
                            <span class="counter-value">0</span>
                            <button class="increase">+</button>
                        </div>
                    </div>
                    <div class="counter-control">
                        <div class="counter-header">
                            <span class="counter-label">Re-entries</span>
                    </div>
                        <div class="counter-body">
                            <button class="decrease">-</button>
                            <span class="counter-value">0</span>
                            <button class="increase">+</button>
                        </div>
                    </div>
                    </div>
                <div class="counter-row">
                            <div class="counter-control">
                        <div class="counter-header">
                            <span class="counter-label">Players Left</span>
                        </div>
                        <div class="counter-body">
                            <button class="decrease">-</button>
                                    <span class="counter-value">0</span>
                            <button class="increase">+</button>
                                </div>
                            </div>
                            ${showAddonsButton ? `
                            <div class="counter-control">
                        <div class="counter-header">
                            <span class="counter-label">Addons</span>
                        </div>
                        <div class="counter-body">
                            <button class="decrease">-</button>
                                    <span class="counter-value">0</span>
                            <button class="increase">+</button>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                <div class="rebuy-stack-container">
                    <div class="rebuy-stack-header">
                        <span>Rebuy Stack</span>
                    </div>
                    <div class="rebuy-stack-input-container">
                        <input type="number" id="rebuyStackInput" min="0" value="0">
                    </div>
                </div>
            </div>
            <div class="other-stats">
                <div class="stat-row">
                    <div class="stat-label">Total chips:</div>
                    <div class="stat-value" data-stat="total-chips">0</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Average Stack:</div>
                    <div class="stat-value" data-stat="average-stack">0</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Current level:</div>
                    <div class="stat-value" data-stat="current-level">0</div>
                </div>
            </div>
        `;
        
        // Tạo phần điều khiển
        const controls = document.createElement('div');
        controls.className = 'controls';
        controls.innerHTML = `
            <div class="card-header">
                <h3>Control the tournament</h3>
            </div>
                <div class="control-buttons">
                <button class="control-btn start-tournament">Start the tournament</button>
                    <button class="control-btn pause-tournament">Pause</button>
                <button class="control-btn show-leaderboard">Show the transcript</button>
                <button class="control-btn end-tournament">End of the tournament</button>
            </div>
        `;
        
        // Tạo phần cài đặt điểm
        const pointsSetup = document.createElement('div');
        pointsSetup.className = 'points-setup';
        pointsSetup.innerHTML = `
            <div class="card-header">
                <h3>Point configuration</h3>
                <button class="edit-points-btn">Edit</button>
            </div>
            <div class="points-grid">
                <div class="points-column">
                <div class="point-row">
                    <div class="point-label">1st Place SNG:</div>
                    <div class="point-value" data-type="win1_sng">0</div>
                    <input type="number" class="point-input" data-type="win1_sng" style="display: none;">
                </div>
                <div class="point-row">
                    <div class="point-label">2nd Place SNG:</div>
                    <div class="point-value" data-type="win2_sng">0</div>
                    <input type="number" class="point-input" data-type="win2_sng" style="display: none;">
                </div>
                <div class="point-row">
                    <div class="point-label">3rd Place SNG:</div>
                    <div class="point-value" data-type="win3_sng">0</div>
                    <input type="number" class="point-input" data-type="win3_sng" style="display: none;">
                </div>
                </div>
                <div class="points-column">
                <div class="point-row">
                        <div class="point-label">1st Place Tour:</div>
                    <div class="point-value" data-type="win1_tour">0</div>
                    <input type="number" class="point-input" data-type="win1_tour" style="display: none;">
                </div>
                <div class="point-row">
                        <div class="point-label">2nd Place Tour:</div>
                    <div class="point-value" data-type="win2_tour">0</div>
                    <input type="number" class="point-input" data-type="win2_tour" style="display: none;">
                </div>
                <div class="point-row">
                        <div class="point-label">3rd Place Tour:</div>
                    <div class="point-value" data-type="win3_tour">0</div>
                    <input type="number" class="point-input" data-type="win3_tour" style="display: none;">
                    </div>
                </div>
            </div>
        `;
        
        // Thêm thông tin thống kê và điều khiển vào phần đầu dashboard
        dashboardTop.appendChild(statsGroup);
        dashboardTop.appendChild(controls);
        dashboardTop.appendChild(pointsSetup);
        
        // Tạo phần bảng xếp hạng
        const standings = document.createElement('div');
        standings.className = 'standings';
        standings.innerHTML = `
            <div class="card-header">
                <h3>Player Rankings</h3>
            </div>
            <div class="standings-grid">
                <div class="standings-column-headers">
                    <div class="col stt">STT</div>
                    <div class="col avatar"></div>
                    <div class="col player">PLAYERS</div>
                    <div class="col win">Win 1 S&G</div>
                    <div class="col win">Win 2 S&G</div>
                    <div class="col win">Win 3 S&G</div>
                    <div class="col win">Win 1 Tour</div>
                    <div class="col win">Win 2 Tour</div>
                    <div class="col win">Win 3 Tour</div>
                    <div class="col points">Point</div>
                                <div class="col status">Status</div>
                    <div class="col actions">Operation</div>
                            </div>
                            <div class="standings-body">
                    <!-- Player rows will be inserted here dynamically -->
                </div>
            </div>
        `;

        // Thêm các phần vào dashboard
        this.dashboard.appendChild(dashboardTop);
        this.dashboard.appendChild(standings);
        
        // Thêm styles cho dashboard
        this.addDashboardStyles();
        
        return this.dashboard;
    }

    /**
     * Thêm styles cho dashboard
     */
    addDashboardStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Import font */
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
            
            /* Dashboard styles */
            .dashboard {
                display: flex;
                flex-direction: column;
                gap: 24px;
                padding: 24px;
                background: #0f172a;
                color: #f8fafc;
                border-radius: 16px;
                font-family: 'Roboto', sans-serif;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                max-width: 1200px;
                margin: 0 auto;
            }

            /* Top section */
            .dashboard-top {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 24px;
            }
            
            /* Card common styling */
            .stats-group, .controls, .points-setup, .standings {
                background: #1e293b;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            
            .stats-group:hover, .controls:hover, .points-setup:hover, .standings:hover {
                transform: translateY(-4px);
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
            }
            
            /* Card headers */
            .card-header {
                background: #334155;
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #475569;
            }
            
            .card-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #e2e8f0;
            }

            /* Counter styles */
            .counter-container {
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .counter-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 16px;
            }

            .counter-control {
                background: #334155;
                border-radius: 8px;
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .counter-header {
                text-align: center;
            }

            .counter-label {
                font-size: 13px;
                color: #cbd5e1;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .counter-body {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .counter-value {
                font-size: 22px;
                font-weight: 600;
                color: #f1f5f9;
            }
            
            .counter-body button {
                background: #475569;
                color: white;
                border: none;
                border-radius: 6px;
                width: 32px;
                height: 32px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .counter-body button:hover {
                background: #64748b;
            }
            
            .counter-body button:active {
                transform: scale(0.95);
            }
            
            /* Rebuy Stack styles */
            .rebuy-stack-container {
                background: #334155;
                border-radius: 8px;
                padding: 12px;
                margin-top: 4px;
            }
            
            .rebuy-stack-header {
                margin-bottom: 12px;
                text-align: center;
            }
            
            .rebuy-stack-header span {
                font-size: 13px;
                color: #cbd5e1;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .rebuy-stack-input-container {
                display: flex;
                justify-content: center;
            }
            
            #rebuyStackInput {
                width: 100%;
                padding: 10px;
                background: #475569;
                border: 1px solid #64748b;
                border-radius: 6px;
                color: white;
                text-align: center;
                font-size: 18px;
            }
            
            #rebuyStackInput:focus {
                border-color: #3b82f6;
                outline: none;
            }
            
            /* Other stats styles */
            .other-stats {
                padding: 0 20px 20px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .stat-row {
                display: flex;
                justify-content: space-between;
                padding: 10px;
                background: #334155;
                border-radius: 6px;
            }
            
            .stat-label {
                color: #cbd5e1;
                font-weight: 500;
                font-size: 14px;
            }
            
            .stat-value {
                font-weight: 600;
                font-size: 14px;
                color: #f1f5f9;
            }
            
            /* Control styles */
            .control-buttons {
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                flex-grow: 1;
            }
            
            .control-btn {
                padding: 12px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 15px;
                font-weight: 600;
                transition: all 0.2s;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .control-btn:hover {
                background: #2563eb;
                transform: translateY(-2px);
            }
            
            .control-btn:active {
                transform: translateY(0);
            }
            
            .control-btn.start-tournament {
                background: #10b981;
            }
            
            .control-btn.start-tournament:hover {
                background: #059669;
            }
            
            .control-btn.end-tournament {
                background: #ef4444;
            }
            
            .control-btn.end-tournament:hover {
                background: #dc2626;
            }
            
            .control-btn.show-leaderboard.active {
                background: #8b5cf6;
            }
            
            .control-btn.show-leaderboard.active:hover {
                background: #7c3aed;
            }
            
            /* Points styles */
            .points-setup .card-header .edit-points-btn {
                padding: 6px 12px;
                background: #475569;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
            }
            
            .points-setup .card-header .edit-points-btn:hover {
                background: #64748b;
            }

            .points-grid {
                padding: 20px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                gap: 16px;
            }
            
            .points-column {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .point-row {
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 12px;
                background: #334155;
                border-radius: 8px;
            }

            .point-label {
                color: #cbd5e1;
                font-weight: 500;
                font-size: 14px;
            }

            .point-value {
                font-weight: 600;
                background: rgba(59, 130, 246, 0.2);
                padding: 6px 12px;
                border-radius: 6px;
                color: #60a5fa;
                text-align: center;
            }

            .point-input {
                width: 100%;
                padding: 8px;
                background: #475569;
                border: 1px solid #64748b;
                border-radius: 6px;
                color: white;
                text-align: center;
                font-size: 14px;
            }
            
            .point-input:focus {
                border-color: #3b82f6;
                outline: none;
            }
            
            /* Standings styles */
            .standings {
                margin-top: 0;
            }
            
            .standings-grid {
                width: 100%;
                overflow-x: auto;
            }
            
            .standings-column-headers {
                display: flex;
                background: #334155;
                padding: 12px 0;
                font-weight: 600;
                color: #93c5fd;
                border-bottom: 1px solid #475569;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-size: 12px;
                position: sticky;
                top: 0;
                z-index: 10;
            }
            
            .standings-column-headers .col {
                padding: 0 12px;
                text-align: center;
            }
            
            .standings-body {
                max-height: 400px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: #64748b #334155;
            }
            
            .standings-body::-webkit-scrollbar {
                width: 6px;
            }
            
            .standings-body::-webkit-scrollbar-track {
                background: #334155;
            }
            
            .standings-body::-webkit-scrollbar-thumb {
                background-color: #64748b;
                border-radius: 10px;
            }
            
            .standings-row {
                display: flex;
                padding: 12px 0;
                border-bottom: 1px solid #475569;
                align-items: center;
                transition: background-color 0.2s;
            }
            
            .standings-row:hover {
                background: #475569;
            }
            
            .standings-row .col {
                padding: 0 12px;
                text-align: center;
            }
            
            .col.stt {
                width: 40px;
                flex: 0 0 40px;
                font-weight: 600;
                color: #cbd5e1;
            }
            
            .col.avatar {
                width: 60px;
                flex: 0 0 60px;
            }
            
            .col.player {
                flex: 1;
                text-align: left;
                min-width: 120px;
            }
            
            .col.win {
                width: 70px;
                flex: 0 0 70px;
            }
            
            .col.points {
                width: 70px;
                flex: 0 0 70px;
                font-weight: 700;
                color: #93c5fd;
                font-size: 16px;
            }
            
            .col.status {
                width: 110px;
                flex: 0 0 110px;
            }
            
            .col.actions {
                width: 110px;
                flex: 0 0 110px;
            }
            
            .avatar-img {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                background-color: #475569;
                border: 2px solid #64748b;
                transition: transform 0.2s;
            }
            
            .avatar-img:hover {
                transform: scale(1.1);
                border-color: #3b82f6;
            }

            .player-name {
                font-weight: 600;
                cursor: pointer;
                transition: color 0.2s;
                color: #f1f5f9;
            }
            
            .player-name:hover {
                color: #3b82f6;
            }
            
            .player-name:after {
                content: '✏️';
                font-size: 12px;
                margin-left: 5px;
                opacity: 0;
                transition: opacity 0.2s;
            }
            
            .player-name:hover:after {
                opacity: 1;
            }
            
            .player-name-input {
                width: 100%;
                padding: 8px;
                background: #475569;
                border: 1px solid #64748b;
                border-radius: 6px;
                color: white;
                font-size: 14px;
            }
            
            .player-name-input:focus {
                border-color: #3b82f6;
                outline: none;
            }
            
            .win-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 28px;
                height: 28px;
                background: #3b82f6;
                color: white;
                border-radius: 14px;
                font-size: 13px;
                font-weight: 600;
                transition: transform 0.2s;
            }

            .win-badge.editable {
                cursor: pointer;
                position: relative;
            }
            
            .win-badge.editable:hover {
                transform: scale(1.1);
                background: #2563eb;
            }
            
            .win-badge.editable:after {
                content: '+';
                position: absolute;
                top: -5px;
                right: -5px;
                background: #f59e0b;
                color: white;
                border-radius: 50%;
                width: 14px;
                height: 14px;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.2s;
            }
            
            .win-badge.editable:hover:after {
                opacity: 1;
            }
            
            .win-input {
                width: 45px;
                padding: 6px;
                background: #475569;
                border: 1px solid #64748b;
                border-radius: 6px;
                color: white;
                text-align: center;
                font-size: 13px;
            }
            
            .win-input:focus {
                border-color: #3b82f6;
                outline: none;
            }
            
            .status-badge {
                display: inline-block;
                padding: 6px 10px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .status-playing {
                background: #10b981;
                color: white;
            }
            
            .status-eliminated {
                background: #ef4444;
                color: white;
            }
            
            .actions-container {
                display: flex;
                justify-content: center;
                gap: 6px;
            }
            
            .action-btn {
                padding: 8px 12px;
                background: #475569;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 11px;
                transition: all 0.2s;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                min-width: 85px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            
            .action-btn.delete {
                background: #ef4444;
            }
            
            .action-btn.restore {
                background: #10b981;
            }
            
            .action-btn.remove {
                background: #64748b;
                min-width: 40px;
                padding: 8px;
            }
            
            .action-btn:hover {
                transform: translateY(-2px);
                filter: brightness(110%);
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            }
            
            .action-btn:active {
                transform: translateY(0);
                filter: brightness(90%);
            }
            
            .action-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            
            .action-btn svg {
                width: 16px;
                height: 16px;
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .dashboard {
                    padding: 16px;
                }
                
                .dashboard-top {
                    grid-template-columns: 1fr;
                }
                
                .counter-row {
                    grid-template-columns: 1fr;
                }
                
                .points-grid {
                    grid-template-columns: 1fr;
                }
                
                .standings-grid {
                    font-size: 12px;
                }
                
                .col.win {
                    width: 50px;
                    flex: 0 0 50px;
                }
                
                .col.actions {
                    width: 90px;
                    flex: 0 0 90px;
                }
                
                .action-btn {
                    padding: 4px 6px;
                    font-size: 10px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Export class
window.DashboardUI = DashboardUI; 
/**
 * Module quản lý bảng xếp hạng
 */
import { addStyleToDocument } from './utils.js';

export class LeaderboardManager {
    /**
     * Khởi tạo LeaderboardManager
     * @param {Object} elements - Các phần tử DOM của bảng xếp hạng
     */
    constructor(elements) {
        this.elements = elements;
        this.leaderboardVisible = false;
        this.autoHideTimer = null;
        this.stylesheet = null;
    }

    /**
     * Hiển thị bảng xếp hạng
     */
    async showLeaderboard() {
        try {
            // Lấy dữ liệu người chơi từ database
            const players = await window.api.getPlayers();
            
            if (players && players.length > 0) {
                // LỌC BỎ người chơi đã bị loại
                const activePlayers = players.filter(player => player.status !== 'Đã bị loại' && player.status !== 'Eliminated');
                
                // Sắp xếp người chơi theo điểm (giảm dần)
                activePlayers.sort((a, b) => (b.points || 0) - (a.points || 0));
                
                // Xóa dữ liệu cũ
                this.elements.leaderboardBody.innerHTML = '';
                
                // Thiết lập lại cấu trúc bảng điểm theo yêu cầu
                const leaderboardHeader = document.querySelector('.leaderboard-header');
                leaderboardHeader.innerHTML = `
                    <div class="lb-col stt">STT</div>
                    <div class="lb-col avatar">Avatar</div>
                    <div class="lb-col player">Players</div>
                    <div class="lb-col win1_sng">Win 1<br>S&G</div>
                    <div class="lb-col win2_sng">Win 2<br>S&G</div>
                    <div class="lb-col win3_sng">Win 3<br>S&G</div>
                    <div class="lb-col win1_tour">Win 1<br>Tour</div>
                    <div class="lb-col win2_tour">Win 2<br>Tour</div>
                    <div class="lb-col win3_tour">Win 3<br>Tour</div>
                    <div class="lb-col points">Points</div>
                `;
                
                // Thêm style cho bảng
                this.addLeaderboardStyles();
                
                // Thêm tiêu đề bảng
                const leaderboardContainer = document.querySelector('.leaderboard-container');
                if (leaderboardContainer) {
                    // Xóa tiêu đề cũ nếu có
                    const oldTitle = leaderboardContainer.querySelector('.leaderboard-title');
                    if (oldTitle) {
                        oldTitle.remove();
                    }
                    
                    // Thêm tiêu đề mới
                    const titleElement = document.createElement('div');
                    titleElement.className = 'leaderboard-title';
                    titleElement.textContent = 'Tournament rankings';
                    leaderboardContainer.insertBefore(titleElement, leaderboardContainer.firstChild);
                }
                
                // Thêm dữ liệu với hiệu ứng
                activePlayers.forEach((player, index) => {
                    const row = document.createElement('div');
                    row.className = 'leaderboard-row';
                    
                    // Sử dụng avatar nếu có hoặc biểu tượng mặc định
                    const avatar = player.avatar ? player.avatar : 'https://via.placeholder.com/32';
                    
                    row.innerHTML = `
                        <div class="lb-col stt">${index + 1}</div>
                        <div class="lb-col avatar">
                            <img src="${avatar}" class="avatar-image" alt="${player.name || 'Player'} avatar">
                        </div>
                        <div class="lb-col player">${player.name || `Player ${index + 1}`}</div>
                        <div class="lb-col win1_sng"><span class="win-value">${player.win1_sng || 0}</span></div>
                        <div class="lb-col win2_sng"><span class="win-value">${player.win2_sng || 0}</span></div>
                        <div class="lb-col win3_sng"><span class="win-value">${player.win3_sng || 0}</span></div>
                        <div class="lb-col win1_tour"><span class="win-value">${player.win1_tour || 0}</span></div>
                        <div class="lb-col win2_tour"><span class="win-value">${player.win2_tour || 0}</span></div>
                        <div class="lb-col win3_tour"><span class="win-value">${player.win3_tour || 0}</span></div>
                        <div class="lb-col points">${(player.points || 0)}</div>
                    `;
                    
                    this.elements.leaderboardBody.appendChild(row);
                });
                
                // Hiển thị overlay với toàn màn hình
                this.elements.leaderboardOverlay.classList.add('show');
                this.leaderboardVisible = true;
                document.body.style.overflow = 'hidden'; // Ngăn cuộn trang khi hiển thị bảng điểm
                
                // Tự động ẩn sau 30 giây nếu không có tương tác
                this.autoHideTimer = setTimeout(() => {
                    if (this.leaderboardVisible) {
                        this.hideLeaderboard();
                    }
                }, 30000);
            }
        } catch (error) {
            console.error('Lỗi khi hiển thị bảng điểm:', error);
        }
    }

    /**
     * Ẩn bảng xếp hạng
     */
    hideLeaderboard() {
        // Thêm hiệu ứng thoát
        this.elements.leaderboardOverlay.classList.add('hiding');
        
        // Đợi hiệu ứng hoàn thành rồi mới ẩn hoàn toàn
        setTimeout(() => {
            this.elements.leaderboardOverlay.classList.remove('show');
            this.elements.leaderboardOverlay.classList.remove('hiding');
            this.leaderboardVisible = false;
            document.body.style.overflow = ''; // Khôi phục cuộn trang
            
            // Xóa bộ đếm tự động ẩn
            if (this.autoHideTimer) {
                clearTimeout(this.autoHideTimer);
            }
            
            // Xóa dữ liệu sau khi ẩn để chuẩn bị cho lần hiển thị tiếp theo
            setTimeout(() => {
                if (!this.leaderboardVisible) {
                    this.elements.leaderboardBody.innerHTML = '';
                }
            }, 500);
        }, 300);
        
        // Thêm style cho hiệu ứng ẩn
        addStyleToDocument(`
            .leaderboard-overlay.hiding {
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .leaderboard-overlay.hiding .leaderboard-container {
                transform: scale(0.95);
                transition: transform 0.3s;
            }
        `);
    }

    /**
     * Thêm styles cho bảng xếp hạng
     */
    addLeaderboardStyles() {
        // Xóa stylesheet cũ nếu có
        if (this.stylesheet) {
            document.head.removeChild(this.stylesheet);
        }
        
        // Thêm style mới
        this.stylesheet = addStyleToDocument(`
            .leaderboard-container {
                max-width: 95%;
                height: 90vh;
                overflow-y: auto;
                animation: fadeZoomIn 0.5s ease-out;
                background: linear-gradient(to bottom, rgba(18, 23, 30, 0.95), rgba(22, 30, 40, 0.95));
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 10px;
                position: relative;
            }
            
            /* Tùy chỉnh thanh cuộn cho trình duyệt hiện đại */
            .leaderboard-container::-webkit-scrollbar {
                width: 12px;
            }
            
            .leaderboard-container::-webkit-scrollbar-track {
                background: rgba(10, 15, 20, 0.5);
                border-radius: 8px;
                margin: 10px 0;
            }
            
            .leaderboard-container::-webkit-scrollbar-thumb {
                background: linear-gradient(to bottom, #3e6496, #2c4a72);
                border-radius: 8px;
                border: 2px solid rgba(10, 15, 20, 0.5);
            }
            
            .leaderboard-container::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(to bottom, #4b78b5, #3a5f91);
            }
            
            /* Firefox */
            .leaderboard-container {
                scrollbar-width: thin;
                scrollbar-color: #3e6496 rgba(10, 15, 20, 0.5);
            }
            
            @keyframes fadeZoomIn {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            @keyframes fadeSlideDown {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .leaderboard-header {
                background: linear-gradient(to right, #162232, #1c2c3d);
                border-radius: 8px;
                padding: 15px 5px;
                margin-bottom: 10px;
                border-bottom: 2px solid rgba(62, 100, 150, 0.5);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            
            .leaderboard-header, .leaderboard-row {
                grid-template-columns: 50px 60px minmax(150px, 1fr) repeat(6, minmax(60px, 70px)) minmax(80px, 100px);
                gap: 5px;
            }
            
            .leaderboard-row {
                animation: fadeSlideDown 0.5s ease-out forwards;
                opacity: 0;
                background: rgba(34, 46, 60, 0.8);
                border-radius: 8px;
                margin-bottom: 6px;
                padding: 12px 5px;
                transition: transform 0.2s, box-shadow 0.2s;
                border-left: 3px solid transparent;
            }
            
            .leaderboard-row:hover {
                transform: translateX(5px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                background: rgba(40, 54, 70, 0.9);
                border-left: 3px solid #48bb78;
            }
            
            /* Độ trễ cho từng hàng */
            .leaderboard-row:nth-child(1) { 
                animation-delay: 0.1s; 
                background: linear-gradient(to right, rgba(62, 100, 150, 0.3), rgba(45, 70, 110, 0.3));
            }
            .leaderboard-row:nth-child(2) { 
                animation-delay: 0.15s; 
                background: linear-gradient(to right, rgba(62, 100, 150, 0.2), rgba(45, 70, 110, 0.2));
            }
            .leaderboard-row:nth-child(3) { 
                animation-delay: 0.2s; 
                background: linear-gradient(to right, rgba(62, 100, 150, 0.1), rgba(45, 70, 110, 0.1));
            }
            .leaderboard-row:nth-child(4) { animation-delay: 0.25s; }
            .leaderboard-row:nth-child(5) { animation-delay: 0.3s; }
            .leaderboard-row:nth-child(6) { animation-delay: 0.35s; }
            .leaderboard-row:nth-child(7) { animation-delay: 0.4s; }
            .leaderboard-row:nth-child(8) { animation-delay: 0.45s; }
            .leaderboard-row:nth-child(9) { animation-delay: 0.5s; }
            .leaderboard-row:nth-child(10) { animation-delay: 0.55s; }
            .leaderboard-row:nth-child(n+11) { animation-delay: 0.6s; }
            
            .leaderboard-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.85);
                z-index: 1000;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: opacity 0.5s;
                opacity: 0;
                pointer-events: none;
                backdrop-filter: blur(8px);
            }
            
            .leaderboard-overlay::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle at center, transparent, rgba(0, 0, 0, 0.9));
                z-index: -1;
            }
            
            .leaderboard-overlay.show {
                opacity: 1;
                pointer-events: auto;
            }
            
            /* Thêm responsive cho các kích thước màn hình khác nhau */
            @media (max-width: 1200px) {
                .leaderboard-header, .leaderboard-row {
                    grid-template-columns: 40px 60px minmax(120px, 1fr) repeat(6, 60px) 80px;
                    font-size: 14px;
                }
            }
            
            @media (max-width: 900px) {
                .leaderboard-header, .leaderboard-row {
                    grid-template-columns: 40px 50px minmax(100px, 1fr) repeat(6, 50px) 70px;
                    font-size: 13px;
                    padding: 6px 3px;
                }
                
                .avatar-image {
                    width: 28px;
                    height: 28px;
                }
                
                .win-value {
                    width: 22px;
                    height: 22px;
                    font-size: 12px;
                }
            }
            
            .lb-col {
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .lb-col.stt {
                font-weight: 600;
                background-color: #0e1c2d;
                border-radius: 8px;
                width: 36px;
                height: 36px;
                margin: 0 auto;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            }
            
            .lb-col.avatar {
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .avatar-image {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                object-fit: cover;
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
                border: 2px solid rgba(255, 255, 255, 0.2);
            }
            
            .lb-col.player {
                text-align: left;
                padding-left: 10px;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                color: #e2e8f0;
            }
            
            .lb-col.points {
                font-weight: bold;
                color: #48bb78;
                font-size: 16px;
                text-shadow: 0 0 10px rgba(72, 187, 120, 0.5);
            }
            
            .leaderboard-row:nth-child(1) .lb-col.stt,
            .leaderboard-row:nth-child(2) .lb-col.stt,
            .leaderboard-row:nth-child(3) .lb-col.stt {
                background: linear-gradient(135deg, #3e6496, #2c4a72);
            }
            
            .leaderboard-row:nth-child(1) .lb-col.stt {
                border: 2px solid #ffd700;
                color: #ffd700;
            }
            
            .leaderboard-row:nth-child(2) .lb-col.stt {
                border: 2px solid #c0c0c0;
                color: #c0c0c0;
            }
            
            .leaderboard-row:nth-child(3) .lb-col.stt {
                border: 2px solid #cd7f32;
                color: #cd7f32;
            }
            
            .lb-col.win1_sng, .lb-col.win2_sng, .lb-col.win3_sng,
            .lb-col.win1_tour, .lb-col.win2_tour, .lb-col.win3_tour {
                font-size: 14px;
            }
            
            .win-value {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: linear-gradient(135deg, rgba(72, 187, 120, 0.2), rgba(56, 161, 105, 0.2));
                color: #48bb78;
                font-weight: 600;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(72, 187, 120, 0.3);
                text-shadow: 0 0 5px rgba(72, 187, 120, 0.5);
            }
            
            /* Tiêu đề bảng */
            .leaderboard-title {
                color: white;
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 20px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                letter-spacing: 1px;
            }
        `);
    }
} 
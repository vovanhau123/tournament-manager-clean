/**
 * File chính kết nối các module và quản lý trạng thái tổng thể của live tournament
 */
import { TimerManager } from './modules/timer-module.js';
import { DataManager } from './modules/data-module.js';
import { LeaderboardManager } from './modules/leaderboard-module.js';
import { UIControlsManager } from './modules/ui-controls.js';
import { formatTime, formatCurrency, formatNumber } from './modules/utils.js';

class LiveTournament {
    constructor() {
        // Khởi tạo các thuộc tính
        this.initializeElements();
        
        // Khởi tạo các module
        this.dataManager = new DataManager(this.elements);
        this.timerManager = new TimerManager(this.elements);
        this.leaderboardManager = new LeaderboardManager(this.elements);
        this.uiControlsManager = new UIControlsManager(this.elements);
        
        // Thiết lập các sự kiện
        this.setupEventListeners();
        
        // Tải dữ liệu ban đầu
        this.loadTournamentData();
        
        // Đặt trạng thái mặc định
        this.leaderboardVisible = false;
        
        // Bắt đầu cập nhật dữ liệu định kỳ
        this.dataManager.startPeriodicUpdates(5000);
        
        // Tải và hiển thị tên giải đấu
        this.loadTournamentName();
    }

    /**
     * Khởi tạo các phần tử DOM cần thiết
     */
    initializeElements() {
        // Lấy các elements từ DOM
        this.elements = {
            // Timer elements
            timerElement: document.querySelector('.main-timer'),
            levelElement: document.querySelector('.level'),
            blindsElement: document.querySelector('.blinds'),
            nextBreakElement: document.querySelector('.break-time'),
            breakButton: document.querySelector('.break-button'),
            nextUpText: document.querySelector('.next-up div'),
            nextBlindsElement: document.querySelector('.next-blinds'),
            anteElement: document.querySelector('.ante'),
            
            // Title element
            tournamentTitleElement: document.querySelector('.tournament-title'),
            
            // Stats elements
            totalEntriesElement: document.querySelector('.entries-info'),
            buyinInfoElement: document.querySelector('.buyin-info'),
            playersElement: document.querySelector('.stat-group:nth-child(1) .stat-value'),
            avgStackElement: document.querySelector('.stat-group:nth-child(2) .stat-value'),
            totalStackElement: document.querySelector('.stat-group:nth-child(3) .stat-value'),
            buyInElement: document.querySelector('.stat-group:nth-child(4) .stat-value'),
            rebuyElement: document.querySelector('.stat-group:nth-child(5) .stat-value'),
            startingStackElement: document.querySelector('.stack-info:nth-child(1) .stack-value'),
            rebuyStackElement: document.querySelector('.stack-info:nth-child(2) .stack-value'),

            // Leaderboard elements
            leaderboardOverlay: document.querySelector('.leaderboard-overlay'),
            leaderboardBody: document.querySelector('.leaderboard-body'),
            
            // Control elements
            minimizeButton: document.querySelector('.minimize-button'),
            fullscreenButton: document.querySelector('.fullscreen-button')
        };
    }

    /**
     * Thiết lập các sự kiện
     */
    setupEventListeners() {
        // Thiết lập sự kiện nhận dữ liệu từ main process
        window.api.onTournamentData((data) => {
            console.log('Received tournament data:', data);
            this.dataManager.updateWithNewData(data);
            
            // Cập nhật lại tên giải đấu nếu có thay đổi
            if (data.name) {
                this.updateTournamentTitle(data.name);
            }
        });

        // Thiết lập sự kiện điều khiển timer
        window.api.onTimerControl((action) => {
            console.log('Received timer control:', action);
            if (action === 'start' || action === 'resume') {
                this.timerManager.startTimer();
            } else if (action === 'pause') {
                this.timerManager.pauseTimer();
            }
        });

        // Thiết lập sự kiện hiển thị bảng điểm
        window.api.onLeaderboardCommand((action) => {
            console.log('Received leaderboard command:', action);
            if (action === 'show') {
                this.showLeaderboard();
            } else if (action === 'hide') {
                this.hideLeaderboard();
            }
        });

        // Thiết lập sự kiện click bảng điểm
        this.elements.leaderboardOverlay.addEventListener('click', (event) => {
            if (event.target === this.elements.leaderboardOverlay) {
                this.hideLeaderboard();
            }
        });

        // Thiết lập sự kiện phím ESC để ẩn bảng điểm
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.leaderboardVisible) {
                this.hideLeaderboard();
            }
        });
        
        // Thiết lập các nút điều khiển UI
        this.uiControlsManager.setupControlButtons();
    }

    /**
     * Tải dữ liệu ban đầu cho giải đấu
     */
    async loadTournamentData() {
        try {
            // Tải dữ liệu từ dataManager
            const data = await this.dataManager.loadInitialData();
            
            // Thiết lập dữ liệu cho timerManager
            this.timerManager.updateTournamentData({
                blindStructure: data.blindStructure,
                duration: data.tournamentData?.duration || 0
            });
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu tournament:', error);
        }
    }
    
    /**
     * Tải và hiển thị tên giải đấu
     */
    async loadTournamentName() {
        try {
            // Gọi API mới để lấy tên giải đấu
            const tournamentName = await window.api.getTournamentName();
            console.log('Loaded tournament name:', tournamentName);
            
            // Cập nhật tên trên giao diện
            this.updateTournamentTitle(tournamentName);
        } catch (error) {
            console.error('Lỗi khi tải tên giải đấu:', error);
        }
    }
    
    /**
     * Cập nhật tiêu đề giải đấu trên giao diện
     * @param {string} title - Tên giải đấu
     */
    updateTournamentTitle(title) {
        if (this.elements.tournamentTitleElement && title) {
            this.elements.tournamentTitleElement.textContent = title;
        }
    }

    /**
     * Hiển thị bảng xếp hạng
     */
    async showLeaderboard() {
        await this.leaderboardManager.showLeaderboard();
        this.leaderboardVisible = true;
    }

    /**
     * Ẩn bảng xếp hạng
     */
    hideLeaderboard() {
        this.leaderboardManager.hideLeaderboard();
        this.leaderboardVisible = false;
    }
}

// Khởi tạo khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', async function() {
    // Khởi tạo các elements
    const levelElement = document.querySelector('.level');
    const timerElement = document.querySelector('.main-timer');
    const blindsElement = document.querySelector('.blinds');
    const anteElement = document.querySelector('.ante');
    const nextBlindsElement = document.querySelector('.next-blinds');
    const tournamentTitleElement = document.querySelector('.tournament-title');
    
    // Lấy đúng các elements thống kê
    const playersElement = document.querySelector('.stat-group:nth-child(1) .stat-value');
    const avgStackElement = document.querySelector('.stat-group:nth-child(2) .stat-value');
    const totalStackElement = document.querySelector('.stat-group:nth-child(3) .stat-value');
    const buyInElement = document.querySelector('.stat-group:nth-child(4) .stat-value');
    const rebuyElement = document.querySelector('.stat-group:nth-child(5) .stat-value');
    
    // Lấy đúng các elements stack
    const startingStackElement = document.querySelector('.stack-info:nth-child(1) .stack-value');
    const rebuyStackElement = document.querySelector('.stack-info:nth-child(2) .stack-value');

    // Khởi tạo tất cả giá trị mặc định là 0
    playersElement.textContent = '0/0';
    avgStackElement.textContent = '0';
    totalStackElement.textContent = '0';
    buyInElement.textContent = '0';
    rebuyElement.textContent = '0';
    startingStackElement.textContent = '0';
    rebuyStackElement.textContent = '0';
    levelElement.textContent = 'Level 0';
    blindsElement.textContent = 'BLINDS: 0 - 0';
    anteElement.textContent = 'ANTE: 0';
    nextBlindsElement.textContent = '';

    try {
        // Load tournament name
        const tournamentName = await window.api.getTournamentName();
        if (tournamentName) {
            tournamentTitleElement.textContent = tournamentName;
        }
        
        // Load tournament stats
        const stats = await window.api.getTournamentStats();
        if (stats && stats[0]) {
            playersElement.textContent = `${stats[0].players_left || 0}/${stats[0].total_entries || 0}`;
            avgStackElement.textContent = (stats[0].average_stack || 0).toLocaleString();
            totalStackElement.textContent = (stats[0].total_chips || 0).toLocaleString();
            rebuyElement.textContent = (stats[0].reentries || 0).toString();
        }

        // Load tournament data
        const tournamentData = await window.api.getTournamentData();
        if (tournamentData) {
            buyInElement.textContent = (tournamentData.buy_in_price || 0).toLocaleString();
            startingStackElement.textContent = (tournamentData.starting_stack || 0).toLocaleString();
            rebuyStackElement.textContent = (tournamentData.rebuy_stack || 0).toLocaleString();
        }

        // Load blind structure
        const blindStructure = await window.api.getBlindStructure();
        if (blindStructure && blindStructure.length > 0) {
            const currentLevel = blindStructure[0];
            levelElement.textContent = `Level ${currentLevel.level || 0}`;
            blindsElement.textContent = `BLINDS: ${(currentLevel.small_blind || 0).toLocaleString()} - ${(currentLevel.big_blind || 0).toLocaleString()}`;
            anteElement.textContent = `ANTE: ${(currentLevel.ante || 0).toLocaleString()}`;
            
            // Set timer
            const remainingSeconds = currentLevel.duration_minutes || 0;
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            // Set next level info if available
            if (blindStructure.length > 1) {
                const nextLevel = blindStructure[1];
                if (nextLevel.is_break) {
                    nextBlindsElement.textContent = 'Break';
                } else {
                    nextBlindsElement.textContent = `NEXT BLIND: ${(nextLevel.small_blind || 0).toLocaleString()} - ${(nextLevel.big_blind || 0).toLocaleString()} (${(nextLevel.ante || 0).toLocaleString()})`;
                }
            }
        }

        // Khởi tạo đối tượng LiveTournament
        const liveTournament = new LiveTournament();

        // Xử lý nhận màu nền từ dashboard
        window.api.onBackgroundColorChange((color) => {
            console.log('Nhận màu nền từ dashboard:', color);
            document.body.style.backgroundColor = color;

            // Lưu màu vào localStorage để giữ nguyên khi tải lại trang
            localStorage.setItem('liveTournamentBackgroundColor', color);
        });

        // Xử lý nhận ảnh nền từ dashboard
        window.api.onBackgroundImageChange((imageUrl) => {
            console.log('Nhận ảnh nền từ dashboard:', imageUrl);
            
            // Nếu có ảnh
            if (imageUrl && imageUrl.trim() !== '') {
                document.body.style.backgroundImage = `url("${imageUrl}")`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundRepeat = 'no-repeat';
                
                // Lưu URL ảnh vào localStorage để giữ nguyên khi tải lại trang
                localStorage.setItem('liveTournamentBackgroundImage', imageUrl);
            } else {
                // Nếu không có ảnh, xóa background image
                document.body.style.backgroundImage = 'none';
                localStorage.removeItem('liveTournamentBackgroundImage');
            }
        });
        
        // Xử lý nhận video nền từ dashboard
        window.api.onBackgroundVideoChange((videoData) => {
            console.log('Nhận video nền từ dashboard:', videoData);
            
            if (videoData && videoData.url && videoData.url.trim() !== '') {
                applyBackgroundVideo(videoData.url, videoData.type);
                
                // Lưu thông tin video vào localStorage
                localStorage.setItem('liveTournamentBackgroundVideoUrl', videoData.url);
                localStorage.setItem('liveTournamentBackgroundVideoType', videoData.type);
            } else {
                // Nếu không có video, xóa background video
                removeBackgroundVideo();
                localStorage.removeItem('liveTournamentBackgroundVideoUrl');
                localStorage.removeItem('liveTournamentBackgroundVideoType');
            }
        });

        // Khôi phục màu nền từ localStorage khi tải trang (nếu có)
        const savedColor = localStorage.getItem('liveTournamentBackgroundColor');
        if (savedColor) {
            document.body.style.backgroundColor = savedColor;
        }

        // Khôi phục ảnh nền từ localStorage khi tải trang (nếu có)
        const savedImageUrl = localStorage.getItem('liveTournamentBackgroundImage');
        if (savedImageUrl) {
            document.body.style.backgroundImage = `url("${savedImageUrl}")`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
        }
        
        // Khôi phục video nền từ localStorage khi tải trang (nếu có)
        const savedVideoUrl = localStorage.getItem('liveTournamentBackgroundVideoUrl');
        const savedVideoType = localStorage.getItem('liveTournamentBackgroundVideoType');
        if (savedVideoUrl && savedVideoType) {
            applyBackgroundVideo(savedVideoUrl, savedVideoType);
        }
    } catch (error) {
        console.error('Lỗi khi load dữ liệu ban đầu:', error);
    }
    
    /**
     * Áp dụng video nền cho màn hình live tournament
     * @param {string} videoUrl - URL của video
     * @param {string} videoType - Loại video ('youtube' hoặc 'local')
     */
    function applyBackgroundVideo(videoUrl, videoType) {
        // Xóa video nền cũ (nếu có)
        removeBackgroundVideo();
        
        // Xóa ảnh nền (nếu có)
        document.body.style.backgroundImage = 'none';
        localStorage.removeItem('liveTournamentBackgroundImage');
        
        // Tạo và áp dụng video nền
        let videoElement;
        
        if (videoType === 'youtube') {
            // Xử lý URL YouTube để lấy ID video
            const videoId = getYoutubeVideoId(videoUrl);
            if (!videoId) {
                console.error('URL YouTube không hợp lệ:', videoUrl);
                return;
            }
            
            // Tạo iframe cho video YouTube
            videoElement = document.createElement('iframe');
            videoElement.id = 'backgroundVideo';
            videoElement.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0`;
            videoElement.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            videoElement.allowFullscreen = true;
        } else {
            // Tạo video element cho video local
            videoElement = document.createElement('video');
            videoElement.id = 'backgroundVideo';
            videoElement.src = videoUrl;
            videoElement.autoplay = true;
            videoElement.loop = true;
            videoElement.muted = true;
            videoElement.playsinline = true;
        }
        
        // Thiết lập style cho video element
        videoElement.style.position = 'fixed';
        videoElement.style.top = '0';
        videoElement.style.left = '0';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';
        videoElement.style.zIndex = '-1';
        
        // Thêm video vào body
        document.body.insertBefore(videoElement, document.body.firstChild);
        
        console.log(`Đã áp dụng video nền: ${videoUrl} (${videoType})`);
    }
    
    /**
     * Xóa video nền
     */
    function removeBackgroundVideo() {
        const videoElement = document.getElementById('backgroundVideo');
        if (videoElement) {
            videoElement.remove();
        }
        console.log('Đã xóa video nền');
    }
    
    /**
     * Lấy ID video từ URL YouTube
     * @param {string} url - URL YouTube
     * @returns {string|null} - ID video hoặc null nếu không hợp lệ
     */
    function getYoutubeVideoId(url) {
        // Pattern cho các dạng URL YouTube phổ biến
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([^&#]+)/i,
            /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?&#]+)/i,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?&#]+)/i
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        
        return null;
    }
}); 
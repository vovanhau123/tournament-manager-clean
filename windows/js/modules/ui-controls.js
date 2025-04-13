/**
 * Module quản lý giao diện người dùng và các nút điều khiển
 */

export class UIControlsManager {
    /**
     * Khởi tạo UIControlsManager
     * @param {Object} elements - Các phần tử DOM cần xử lý
     */
    constructor(elements) {
        this.elements = elements;
        this.isFullscreen = false;
    }

    /**
     * Thiết lập các sự kiện cho các nút điều khiển
     */
    setupControlButtons() {
        // Xử lý nút ẩn cửa sổ
        if (this.elements.minimizeButton) {
            this.elements.minimizeButton.addEventListener('click', () => {
                window.api.minimizeWindow();
            });
        }
        
        // Xử lý nút phóng to toàn màn hình
        if (this.elements.fullscreenButton) {
            this.elements.fullscreenButton.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        // Thêm sự kiện cho phím tắt
        document.addEventListener('keydown', (event) => {
            // Phím ESC để thoát khỏi chế độ toàn màn hình
            if (event.key === 'Escape' && document.fullscreenElement) {
                document.exitFullscreen()
                    .then(() => {
                        this.updateFullscreenButtonIcon(false);
                    })
                    .catch(err => {
                        console.error('Lỗi khi thoát toàn màn hình:', err);
                    });
            }
            
            // Phím F11 để chuyển đổi chế độ toàn màn hình
            if (event.key === 'F11') {
                event.preventDefault();
                this.toggleFullscreen();
            }
        });
    }

    /**
     * Chuyển đổi chế độ toàn màn hình
     */
    toggleFullscreen() {
        if (document.fullscreenElement) {
            // Đang ở chế độ toàn màn hình, thoát ra
            document.exitFullscreen()
                .then(() => {
                    this.isFullscreen = false;
                    this.updateFullscreenButtonIcon(false);
                })
                .catch((err) => {
                    console.error('Lỗi khi thoát toàn màn hình:', err);
                });
        } else {
            // Chuyển sang chế độ toàn màn hình
            document.documentElement.requestFullscreen()
                .then(() => {
                    this.isFullscreen = true;
                    this.updateFullscreenButtonIcon(true);
                })
                .catch((err) => {
                    console.error('Lỗi khi chuyển sang toàn màn hình:', err);
                });
        }
    }

    /**
     * Cập nhật biểu tượng nút fullscreen
     * @param {boolean} isFullscreen - Trạng thái toàn màn hình
     */
    updateFullscreenButtonIcon(isFullscreen) {
        if (!this.elements.fullscreenButton) return;
        
        if (isFullscreen) {
            this.elements.fullscreenButton.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            this.elements.fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
        }
    }

    /**
     * Thiết lập thanh tiêu đề của ứng dụng
     * @param {string} title - Tiêu đề hiển thị
     */
    setTournamentTitle(title) {
        const tournamentTitle = document.querySelector('.tournament-title');
        if (tournamentTitle && title) {
            tournamentTitle.textContent = title;
        }
    }
} 
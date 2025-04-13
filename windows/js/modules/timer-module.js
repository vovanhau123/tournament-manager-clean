/**
 * Module quản lý timer và chuyển đổi cấp độ
 */
import { formatTime } from './utils.js';

export class TimerManager {
    /**
     * Khởi tạo TimerManager
     * @param {Object} elements - Các phần tử DOM cần thiết
     * @param {Object} tournamentData - Dữ liệu ban đầu của giải đấu
     */
    constructor(elements, tournamentData = {}) {
        this.elements = elements;
        this.blindStructure = tournamentData.blindStructure || [];
        this.timer = null;
        this.remainingSeconds = 0;
        this.isPaused = true;
        this.currentLevelIndex = 0;
        this.isBreak = false;
        this.onLevelChange = null; // Callback được gọi khi level thay đổi
        this.hasStarted = false; // Biến mới để theo dõi nếu giải đấu đã bắt đầu
    }

    /**
     * Cập nhật dữ liệu giải đấu
     * @param {Object} data - Dữ liệu mới của giải đấu
     */
    updateTournamentData(data) {
        if (data.blindStructure) {
            this.blindStructure = data.blindStructure;
        }

        // Cập nhật timer nếu chưa bắt đầu và chưa có thời gian
        if (this.isPaused && this.remainingSeconds === 0 && data.duration) {
            this.remainingSeconds = data.duration;
            this.updateTimerDisplay();
        }
    }

    /**
     * Bắt đầu hoặc tiếp tục timer
     */
    startTimer() {
        if (this.isPaused) {
            this.isPaused = false;
            
            // Nếu chưa bắt đầu giải đấu, thiết lập level đầu tiên
            if (!this.hasStarted && this.blindStructure.length > 0) {
                this.hasStarted = true;
                this.setupFirstLevel();
            }
            
            if (!this.timer) {
                this.timer = setInterval(() => {
                    if (this.remainingSeconds > 0) {
                        this.remainingSeconds--;
                        this.updateTimerDisplay();
                    } else {
                        // Khi hết giờ, chuyển sang level tiếp theo
                        this.moveToNextLevel();
                    }
                }, 1000);
            }
        }
    }

    /**
     * Thiết lập level đầu tiên của giải đấu
     */
    setupFirstLevel() {
        if (this.blindStructure.length > 0) {
            const firstLevel = this.blindStructure[0];
            
            // Cập nhật giao diện dựa trên loại (break hoặc level)
            if (firstLevel.is_break) {
                this.isBreak = true;
                this.elements.levelElement.textContent = 'Break';
                this.elements.blindsElement.style.visibility = 'hidden';
                if (this.elements.breakButton) {
                    this.elements.breakButton.style.backgroundColor = '#ff8c00';
                }
            } else {
                this.isBreak = false;
                this.elements.levelElement.textContent = `Level ${firstLevel.level}`;
                this.elements.blindsElement.textContent = `BLINDS: ${firstLevel.small_blind.toLocaleString()} - ${firstLevel.big_blind.toLocaleString()}`;
                if (this.elements.anteElement) {
                    this.elements.anteElement.textContent = `ANTE: ${firstLevel.ante.toLocaleString()}`;
                }
                if (this.elements.breakButton) {
                    this.elements.breakButton.style.backgroundColor = '#2a2a2a';
                }
            }

            // Thiết lập thời gian cho level đầu tiên
            this.remainingSeconds = firstLevel.duration_minutes;
            this.updateTimerDisplay();
            
            // Cập nhật "Next up"
            this.updateNextLevelInfo();
            
            // Gọi callback nếu có
            if (typeof this.onLevelChange === 'function') {
                this.onLevelChange(firstLevel, this.currentLevelIndex);
            }
        }
    }

    /**
     * Tạm dừng timer
     */
    pauseTimer() {
        this.isPaused = true;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Cập nhật hiển thị timer
     */
    updateTimerDisplay() {
        if (!this.elements.timerElement) return;
        
        const totalMinutes = Math.floor(this.remainingSeconds / 60);
        const seconds = this.remainingSeconds % 60;
        this.elements.timerElement.textContent = formatTime(totalMinutes, seconds);
        
        // Cập nhật next break time
        if (!this.isBreak && this.elements.nextBreakElement) {
            this.elements.nextBreakElement.textContent = formatTime(totalMinutes, seconds);
        }
    }

    /**
     * Chuyển sang level tiếp theo
     */
    async moveToNextLevel() {
        this.currentLevelIndex++;
        
        // Kiểm tra xem còn level tiếp theo không
        if (this.currentLevelIndex < this.blindStructure.length) {
            const nextLevel = this.blindStructure[this.currentLevelIndex];
            
            // Cập nhật giao diện dựa trên loại (break hoặc level)
            if (nextLevel.is_break) {
                this.isBreak = true;
                this.elements.levelElement.textContent = 'Break';
                this.elements.blindsElement.style.visibility = 'hidden';
                if (this.elements.breakButton) {
                    this.elements.breakButton.style.backgroundColor = '#ff8c00';
                }
            } else {
                this.isBreak = false;
                this.elements.levelElement.textContent = `Level ${nextLevel.level}`;
                this.elements.blindsElement.textContent = `BLINDS: ${nextLevel.small_blind.toLocaleString()} - ${nextLevel.big_blind.toLocaleString()}`;
                if (this.elements.anteElement) {
                    this.elements.anteElement.textContent = `ANTE: ${nextLevel.ante.toLocaleString()}`;
                }
                if (this.elements.breakButton) {
                    this.elements.breakButton.style.backgroundColor = '#2a2a2a';
                }
            }

            // Sử dụng giá trị giây trực tiếp từ database
            this.remainingSeconds = nextLevel.duration_minutes;
            console.log('Next level duration (seconds):', this.remainingSeconds);
            this.updateTimerDisplay();

            // Cập nhật "Next up"
            this.updateNextLevelInfo();

            // Tiếp tục timer
            this.startTimer();
            
            // Gọi callback nếu có
            if (typeof this.onLevelChange === 'function') {
                this.onLevelChange(nextLevel, this.currentLevelIndex);
            }
        } else {
            // Kết thúc giải đấu
            this.pauseTimer();
            this.elements.levelElement.textContent = 'Tournament End';
            this.elements.blindsElement.style.visibility = 'hidden';
            if (this.elements.nextUpText) {
                this.elements.nextUpText.textContent = '';
            }
            if (this.elements.breakButton) {
                this.elements.breakButton.style.display = 'none';
            }
        }
    }

    /**
     * Cập nhật thông tin cấp độ tiếp theo
     */
    updateNextLevelInfo() {
        if (!this.elements.nextUpText || !this.elements.nextBlindsElement) return;
        
        if (this.currentLevelIndex + 1 < this.blindStructure.length) {
            const upcomingLevel = this.blindStructure[this.currentLevelIndex + 1];
            if (upcomingLevel.is_break) {
                this.elements.nextUpText.textContent = 'Break';
                this.elements.nextBlindsElement.textContent = '';
            } else {
                this.elements.nextUpText.textContent = `Level ${upcomingLevel.level}`;
                this.elements.nextBlindsElement.textContent = `NEXT BLIND: ${upcomingLevel.small_blind.toLocaleString()} - ${upcomingLevel.big_blind.toLocaleString()} (${upcomingLevel.ante.toLocaleString()})`;
            }
        } else {
            this.elements.nextUpText.textContent = 'Tournament End';
            this.elements.nextBlindsElement.textContent = '';
            if (this.elements.breakButton) {
                this.elements.breakButton.style.display = 'none';
            }
        }
    }

    /**
     * Đặt callback cho sự kiện thay đổi cấp độ
     * @param {Function} callback - Hàm callback
     */
    setLevelChangeCallback(callback) {
        this.onLevelChange = callback;
    }
    
    /**
     * Hủy timer khi không sử dụng nữa
     */
    destroy() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Reset timer và trở về level đầu tiên
     */
    resetTimer() {
        this.pauseTimer();
        this.currentLevelIndex = 0;
        this.hasStarted = false;
        this.remainingSeconds = 0;
        
        if (this.blindStructure.length > 0) {
            this.setupFirstLevel();
        }
    }
} 
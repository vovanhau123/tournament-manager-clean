/**
 * dashboard-controls.js
 * Module quản lý các nút điều khiển trong dashboard
 */

class DashboardControls {
    constructor() {
        this.tournamentStatus = 'pending'; // pending, live, paused, ended
        this.leaderboardVisible = false; // Theo dõi trạng thái hiển thị của bảng điểm
    }

    /**
     * Gắn các sự kiện cho các nút điều khiển
     * @param {HTMLElement} container - Dashboard container
     */
    attachControlEvents(container) {
        const startBtn = container.querySelector('.start-tournament');
        const pauseBtn = container.querySelector('.pause-tournament');
        const endBtn = container.querySelector('.end-tournament');
        const showLeaderboardBtn = container.querySelector('.show-leaderboard');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startTournament();
            });
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                const isPaused = pauseBtn.textContent === 'Resume';
                pauseBtn.textContent = isPaused ? 'Pause' : 'Resume';
                this.pauseTournament(isPaused);
            });
        }
        
        if (showLeaderboardBtn) {
            showLeaderboardBtn.addEventListener('click', () => {
                if (this.leaderboardVisible) {
                    this.hideLeaderboard();
                    showLeaderboardBtn.textContent = 'Show Leaderboard';
                    showLeaderboardBtn.classList.remove('active');
                } else {
                    this.showLeaderboard();
                    showLeaderboardBtn.textContent = 'Hide Leaderboard';
                    showLeaderboardBtn.classList.add('active');
                }
                this.leaderboardVisible = !this.leaderboardVisible;
            });
        }
        
        if (endBtn) {
            endBtn.addEventListener('click', async () => {
                const confirmed = await this.confirmEndTournament();
                if (confirmed) {
                    await this.endTournament();
                }
            });
        }
    }

    /**
     * Bắt đầu giải đấu
     */
    startTournament() {
        try {
            window.api.startLiveTournament({
                startTime: new Date(),
                status: 'live'
            });
            window.api.sendTimerControl('start');
            this.tournamentStatus = 'live';
            console.log('Tournament started');
        } catch (error) {
            console.error('Error starting tournament:', error);
        }
    }

    /**
     * Tạm dừng/tiếp tục giải đấu
     * @param {boolean} resume - true nếu tiếp tục, false nếu tạm dừng
     */
    pauseTournament(resume) {
        try {
            window.api.sendTimerControl(resume ? 'resume' : 'pause');
            this.tournamentStatus = resume ? 'live' : 'paused';
            console.log(resume ? 'Tournament resumed' : 'Tournament paused');
        } catch (error) {
            console.error('Error pausing/resuming tournament:', error);
        }
    }

    /**
     * Hiển thị dialog xác nhận kết thúc giải đấu
     * @returns {Promise<boolean>} - true nếu người dùng xác nhận
     */
    async confirmEndTournament() {
        try {
            return await notifications.showConfirm(
                'End Tournament',
                'Are you sure you want to end the tournament? All data will be reset.'
            );
        } catch (error) {
            console.error('Error showing confirmation dialog:', error);
            return false;
        }
    }

    /**
     * Kết thúc giải đấu và reset dữ liệu
     */
    async endTournament() {
        try {
            // Reset database
            await window.api.resetDatabase();
            
            // Hiển thị thông báo thành công và reload sau khi người dùng xác nhận
            await notifications.showConfirm(
                'Success',
                'Tournament has ended and data has been reset.'
            );
            
            // Tải lại trang
            window.location.reload();
        } catch (error) {
            console.error('Error ending tournament:', error);
            const retry = await notifications.showConfirm(
                'Error',
                'An error occurred while ending the tournament. Do you want to try again?'
            );
            if (retry) {
                await this.endTournament();
            }
        }
    }

    /**
     * Hiển thị bảng điểm trên màn hình live tournament
     */
    async showLeaderboard() {
        try {
            console.log('Sending show leaderboard command...');
            await window.api.sendLeaderboardCommand('show');
            this.leaderboardVisible = true;
            console.log('Show leaderboard command sent successfully');
        } catch (error) {
            console.error('Error showing leaderboard:', error);
            await notifications.showConfirm('Error', 'An error occurred while showing the leaderboard. Do you want to try again?')
                .then(retry => {
                    if (retry) {
                        this.showLeaderboard();
                    }
                });
        }
    }

    /**
     * Ẩn bảng điểm trên màn hình live tournament
     */
    async hideLeaderboard() {
        try {
            console.log('Sending hide leaderboard command...');
            await window.api.sendLeaderboardCommand('hide');
            this.leaderboardVisible = false;
            console.log('Hide leaderboard command sent successfully');
        } catch (error) {
            console.error('Error hiding leaderboard:', error);
            await notifications.showConfirm('Error', 'An error occurred while hiding the leaderboard. Do you want to try again?')
                .then(retry => {
                    if (retry) {
                        this.hideLeaderboard();
                    }
                });
        }
    }
}

// Export class
window.DashboardControls = DashboardControls; 
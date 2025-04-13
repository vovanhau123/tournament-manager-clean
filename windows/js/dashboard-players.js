/**
 * dashboard-players.js
 * Module quản lý danh sách người chơi trong dashboard
 */

class DashboardPlayers {
    constructor() {
        this.players = [];
    }

    /**
     * Tải danh sách người chơi từ database
     * @returns {Promise<Array>} - Danh sách người chơi
     */
    async loadPlayers() {
        try {
            this.players = await window.api.getPlayers();
            return this.players;
        } catch (error) {
            console.error('Error loading player list:', error);
            return [];
        }
    }

    /**
     * Tạo row HTML cho người chơi
     * @param {Object} player - Thông tin người chơi
     * @param {number} index - Vị trí của người chơi trong danh sách
     * @returns {string} - HTML của row
     */
    createPlayerRow(player, index) {
        const statusClass = player.status === 'Playing' ? 'status-playing' : 'status-eliminated';
        const isEliminated = player.status === 'Eliminated';
        
        return `
            <div class="standings-row">
                <div class="col stt">${index + 1}</div>
                <div class="col avatar">
                    <input type="file" class="avatar-input" accept="image/*" style="display: none;">
                    <img src="${player.avatar}" alt="Avatar" class="avatar-img" data-player-id="${player.id}">
                </div>
                <div class="col player" data-player-id="${player.id}">
                    <span class="player-name">${player.name}</span>
                    <input type="text" class="player-name-input" value="${player.name}" style="display: none;">
                </div>
                <div class="col win" data-win-type="win1_sng">
                    <span class="win-badge editable">${player.win1_sng || 0}</span>
                    <input type="number" class="win-input" value="${player.win1_sng || 0}" min="0" style="display: none;">
                </div>
                <div class="col win" data-win-type="win2_sng">
                    <span class="win-badge editable">${player.win2_sng || 0}</span>
                    <input type="number" class="win-input" value="${player.win2_sng || 0}" min="0" style="display: none;">
                </div>
                <div class="col win" data-win-type="win3_sng">
                    <span class="win-badge editable">${player.win3_sng || 0}</span>
                    <input type="number" class="win-input" value="${player.win3_sng || 0}" min="0" style="display: none;">
                </div>
                <div class="col win" data-win-type="win1_tour">
                    <span class="win-badge editable">${player.win1_tour || 0}</span>
                    <input type="number" class="win-input" value="${player.win1_tour || 0}" min="0" style="display: none;">
                </div>
                <div class="col win" data-win-type="win2_tour">
                    <span class="win-badge editable">${player.win2_tour || 0}</span>
                    <input type="number" class="win-input" value="${player.win2_tour || 0}" min="0" style="display: none;">
                </div>
                <div class="col win" data-win-type="win3_tour">
                    <span class="win-badge editable">${player.win3_tour || 0}</span>
                    <input type="number" class="win-input" value="${player.win3_tour || 0}" min="0" style="display: none;">
                </div>
                <div class="col points">${(player.points || 0).toLocaleString()}</div>
                <div class="col status">
                    <span class="status-badge ${statusClass}">${player.status || 'Playing'}</span>
                </div>
                <div class="col actions">
                    <div class="actions-container">
                        ${player.status === 'Playing' ? 
                            `<button class="action-btn delete" data-player-id="${player.id}">ELIMINATE</button>` :
                            `<button class="action-btn restore" data-player-id="${player.id}">RESTORE</button>`
                        }
                        <button class="action-btn remove" data-player-id="${player.id}" title="Remove player" ${!isEliminated ? 'disabled' : ''}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16" height="16" fill="currentColor">
                                <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Cập nhật danh sách người chơi lên UI
     * @param {HTMLElement} container - Container chứa danh sách người chơi
     */
    async updatePlayersList(container) {
        try {
            await this.loadPlayers();
            
            if (container) {
                container.innerHTML = '';
                this.players.forEach((player, index) => {
                    const playerRow = this.createPlayerRow(player, index);
                    container.insertAdjacentHTML('beforeend', playerRow);
                });
                
                this.attachPlayerEventListeners(container);
            }
        } catch (error) {
            console.error('Error updating player list:', error);
        }
    }

    /**
     * Gắn các sự kiện cho danh sách người chơi
     * @param {HTMLElement} container - Container chứa danh sách người chơi
     */
    attachPlayerEventListeners(container) {
        // Gắn event listeners cho avatar
        const avatarImages = container.querySelectorAll('.avatar-img');
        avatarImages.forEach(img => {
            img.style.cursor = 'pointer';
            img.title = 'Click to change avatar';
            
            img.addEventListener('click', function() {
                const fileInput = this.parentElement.querySelector('.avatar-input');
                fileInput.click();
            });
        });

        // Gắn event listeners cho input avatar
        const fileInputs = container.querySelectorAll('.avatar-input');
        fileInputs.forEach(input => {
            input.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const playerId = input.parentElement.querySelector('.avatar-img').dataset.playerId;
                    
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        const base64Image = e.target.result;
                        try {
                            await window.api.updatePlayerAvatar(playerId, base64Image);
                            
                            const avatarImg = document.querySelector(`.avatar-img[data-player-id="${playerId}"]`);
                            if (avatarImg) {
                                avatarImg.src = base64Image;
                            }
                        } catch (error) {
                            console.error('Error updating avatar:', error);
                            notifications.showConfirm('Error', 'An error occurred while updating the avatar. Do you want to try again?').then(confirmed => {
                                if (confirmed) {
                                    reader.readAsDataURL(file);
                                }
                            });
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        });

        // Gắn event listeners cho chỉnh sửa tên
        const playerNames = container.querySelectorAll('.player-name');
        playerNames.forEach(nameSpan => {
            nameSpan.addEventListener('click', function() {
                const playerCell = this.parentElement;
                const input = playerCell.querySelector('.player-name-input');
                const playerId = playerCell.dataset.playerId;
                
                this.style.display = 'none';
                input.style.display = 'block';
                input.focus();
                input.select();

                const saveChanges = async () => {
                    const newName = input.value.trim();
                    if (newName) {
                        try {
                            await window.api.updatePlayerName(playerId, newName);
                            
                            this.textContent = newName;
                            this.style.display = 'block';
                            input.style.display = 'none';
                        } catch (error) {
                            console.error('Error updating name:', error);
                            notifications.showConfirm('Error', 'An error occurred while updating the name. Do you want to try again?').then(confirmed => {
                                if (confirmed) {
                                    saveChanges();
                                }
                            });
                        }
                    } else {
                        input.value = this.textContent;
                        this.style.display = 'block';
                        input.style.display = 'none';
                    }
                };

                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveChanges();
                    }
                });

                input.addEventListener('blur', saveChanges);
            });
        });

        // Gắn event listeners cho chỉnh sửa điểm
        const winBadges = container.querySelectorAll('.win-badge.editable');
        winBadges.forEach(badge => {
            badge.addEventListener('click', function() {
                const winCell = this.parentElement;
                const input = winCell.querySelector('.win-input');
                const playerId = winCell.closest('.standings-row').querySelector('.avatar-img').dataset.playerId;
                const winType = winCell.dataset.winType;
                
                this.style.display = 'none';
                input.style.display = 'inline-block';
                input.focus();
                input.select();

                const saveChanges = async () => {
                    const newValue = parseInt(input.value) || 0;
                    if (newValue >= 0) {
                        try {
                            const result = await window.api.updatePlayerScore(playerId, winType, newValue);
                            
                            this.textContent = newValue;
                            const pointsCell = winCell.closest('.standings-row').querySelector('.col.points');
                            pointsCell.textContent = result.points.toLocaleString();

                            // Sắp xếp lại bảng theo points
                            const dashboardPlayers = new DashboardPlayers();
                            await dashboardPlayers.updatePlayersList(container);
                        } catch (error) {
                            console.error('Error updating score:', error);
                            notifications.showConfirm('Error', 'An error occurred while updating the score. Do you want to try again?').then(confirmed => {
                                if (confirmed) {
                                    saveChanges();
                                }
                            });
                        }
                    }
                    
                    this.style.display = 'inline-flex';
                    input.style.display = 'none';
                };

                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveChanges();
                    }
                });

                input.addEventListener('blur', saveChanges);
            });
        });

        // Gắn event listeners cho các nút thao tác
        const actionButtons = container.querySelectorAll('.action-btn');
        actionButtons.forEach(button => {
            button.addEventListener('click', async function() {
                const playerId = this.dataset.playerId;
                const isDelete = this.classList.contains('delete');
                const isRemove = this.classList.contains('remove');
                const playerRow = this.closest('.standings-row');
                const playerStatus = playerRow.querySelector('.status-badge').textContent;

                if (isRemove) {
                    // Chỉ cho phép xóa người chơi đã bị loại
                    if (playerStatus !== 'Eliminated') {
                        notifications.showConfirm(
                            'Cannot Remove',
                            'You can only remove players who have been eliminated from the tournament.'
                        );
                        return;
                    }

                    // Hiển thị dialog xác nhận trước khi xóa
                    const confirmed = await notifications.showConfirm(
                        'Remove Player',
                        'Are you sure you want to remove this player? This action cannot be undone.'
                    );

                    if (confirmed) {
                        try {
                            // Gọi API để xóa người chơi
                            await window.api.deletePlayer(playerId);
                            
                            // Cập nhật lại danh sách người chơi
                            const dashboardPlayers = new DashboardPlayers();
                            await dashboardPlayers.updatePlayersList(container);
                        } catch (error) {
                            console.error('Error removing player:', error);
                            notifications.showConfirm('Error', 'An error occurred while removing the player. Do you want to try again?').then(confirmed => {
                                if (confirmed) {
                                    this.click();
                                }
                            });
                        }
                    }
                } else {
                    // Xử lý loại bỏ/thêm lại người chơi
                    const newStatus = isDelete ? 'Eliminated' : 'Playing';
                    try {
                        console.log('Updating status:', { playerId, newStatus });
                        if (!playerId) {
                            throw new Error('Player ID not found');
                        }
                        
                        const result = await window.api.updatePlayerStatus(playerId, newStatus);
                        
                        if (result && result.success) {
                            console.log('Status updated successfully:', result);
                            const dashboardPlayers = new DashboardPlayers();
                            await dashboardPlayers.updatePlayersList(container);
                        } else {
                            throw new Error('Could not update status');
                        }
                    } catch (error) {
                        console.error('Error updating status:', error);
                        notifications.showConfirm('Error', 'An error occurred while updating the status. Do you want to try again?').then(confirmed => {
                            if (confirmed) {
                                this.click();
                            }
                        });
                    }
                }
            });
        });
    }
}

// Export class
window.DashboardPlayers = DashboardPlayers; 
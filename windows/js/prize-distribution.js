class PrizeDistribution {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // Lấy container của prize distribution
        this.container = document.querySelector('.prize-content');
        if (!this.container) return;

        // Xóa nội dung cũ
        this.container.innerHTML = '';
        this.container.classList.remove('hidden'); // Đảm bảo nội dung luôn hiển thị

        // Tạo section Players
        const playersSection = document.createElement('div');
        playersSection.className = 'players-section';

        // Tạo tiêu đề Players
        const playersTitle = document.createElement('h3');
        playersTitle.textContent = 'Players';
        playersTitle.className = 'section-title';

        // Tạo phần Total Players
        const totalPlayersGroup = document.createElement('div');
        totalPlayersGroup.className = 'form-group';

        const totalPlayersLabel = document.createElement('label');
        totalPlayersLabel.textContent = 'Total Players';

        const totalPlayersInput = document.createElement('div');
        totalPlayersInput.className = 'number-input';
        totalPlayersInput.innerHTML = `
            <button class="decrease">-</button>
            <input type="number" id="totalPlayers" value="0" min="0">
            <button class="increase">+</button>
        `;

        // Thêm các phần tử vào DOM
        totalPlayersGroup.appendChild(totalPlayersLabel);
        totalPlayersGroup.appendChild(totalPlayersInput);

        playersSection.appendChild(playersTitle);
        playersSection.appendChild(totalPlayersGroup);

        this.container.appendChild(playersSection);

        // Lưu các elements để sử dụng sau
        this.totalPlayersInput = totalPlayersInput.querySelector('input');
        this.decreaseBtn = totalPlayersInput.querySelector('.decrease');
        this.increaseBtn = totalPlayersInput.querySelector('.increase');
    }

    setupEventListeners() {
        if (!this.totalPlayersInput) return;

        // Xử lý sự kiện cho nút tăng/giảm
        this.decreaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(this.totalPlayersInput.value) || 0;
            if (currentValue > 0) {
                this.totalPlayersInput.value = currentValue - 1;
                this.updateTotalPlayers();
            }
        });

        this.increaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(this.totalPlayersInput.value) || 0;
            this.totalPlayersInput.value = currentValue + 1;
            this.updateTotalPlayers();
        });

        // Xử lý sự kiện khi nhập trực tiếp vào input
        this.totalPlayersInput.addEventListener('input', () => {
            this.updateTotalPlayers();
        });
    }

    updateTotalPlayers() {
        const totalPlayers = parseInt(this.totalPlayersInput.value) || 0;
        console.log('Total players updated:', totalPlayers);
        // Thêm logic xử lý khi số lượng người chơi thay đổi ở đây
    }
}

// Khởi tạo khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    window.prizeDistribution = new PrizeDistribution();
});

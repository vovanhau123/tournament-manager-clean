const notifications = {
    showToast: function(message, type = 'info') {
        // Xóa toast cũ nếu có
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        // Tạo toast mới
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        
        // Icon based on type
        let icon = '';
        switch(type) {
            case 'success':
                icon = '✓';
                break;
            case 'error':
                icon = '✕';
                break;
            case 'warning':
                icon = '!';
                break;
            default:
                icon = 'i';
        }

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
        `;

        document.body.appendChild(toast);

        // Animation khi hiện
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Tự động ẩn sau 3 giây
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    },

    showConfirm: function(title, message) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'confirm-dialog-overlay';
            dialog.innerHTML = `
                <div class="confirm-dialog">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="dialog-buttons">
                        <button class="dialog-button cancel-button">Hủy</button>
                        <button class="dialog-button confirm-button">Xác nhận</button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            // Animation khi hiện
            setTimeout(() => {
                dialog.classList.add('show');
            }, 10);

            // Xử lý các nút
            const confirmBtn = dialog.querySelector('.confirm-button');
            const cancelBtn = dialog.querySelector('.cancel-button');

            confirmBtn.onclick = () => {
                dialog.classList.remove('show');
                setTimeout(() => {
                    dialog.remove();
                    resolve(true);
                }, 300);
            };

            cancelBtn.onclick = () => {
                dialog.classList.remove('show');
                setTimeout(() => {
                    dialog.remove();
                    resolve(false);
                }, 300);
            };
        });
    }
};

// Export để sử dụng ở các file khác
window.notifications = notifications; 
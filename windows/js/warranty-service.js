/**
 * warranty-service.js
 * Service để lấy dữ liệu bảo hành từ API
 */

class WarrantyService {
    /**
     * Lấy dữ liệu bảo hành từ API
     * @param {Object} requestData - Dữ liệu gửi đến API (tùy chỉnh theo yêu cầu)
     * @returns {Promise} Promise chứa dữ liệu bảo hành
     */
    static async getWarrantyData(requestData = {}) {
        try {
            // Trong môi trường phát triển, sử dụng dữ liệu mẫu
            if (this.isDevelopmentMode()) {
                console.log('Sử dụng dữ liệu mẫu trong môi trường phát triển');
                const response = await fetch('../api/warranty-data.json');
                if (response.ok) {
                    return await response.json();
                }
                return this.getFallbackData();
            }

            // Trong môi trường thực tế, gọi API thực
            const apiUrl = 'https://jason.io.vn/api/warranty-details'; // Thay đổi URL này theo API thực tế
            const apiKey = this.getApiKey();
            const signature = this.calculateSignature(requestData, apiKey);

            // Chuẩn bị headers
            const headers = {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
                'X-Signature': signature
            };

            // Gọi API với phương thức POST
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData)
            });

            // Kiểm tra nếu response không thành công
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // Parse dữ liệu JSON
            const data = await response.json();

            // Trả về dữ liệu
            return data;
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu bảo hành:', error);

            // Trả về dữ liệu mẫu trong trường hợp lỗi
            return this.getFallbackData();
        }
    }

    /**
     * Kiểm tra xem có đang ở môi trường phát triển hay không
     * @returns {boolean} True nếu đang ở môi trường phát triển
     */
    static isDevelopmentMode() {
        // Đây là cách đơn giản để kiểm tra môi trường phát triển
        // Bạn có thể thay đổi điều kiện này tùy theo dự án của bạn
        return window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.protocol === 'file:';
    }

    /**
     * Lấy API key
     * @returns {string} API key
     */
    static getApiKey() {
        // Trong môi trường thực tế, bạn có thể lấy API key từ cấu hình hoặc biến môi trường
        // Đây chỉ là ví dụ
        return 'pk_live_hKSnv7AEqDRDG6ttw3hFmlhuj8h7wNfkQgfwoN5V';
    }

    /**
     * Tính toán chữ ký cho request
     * @param {Object} data - Dữ liệu gửi đến API
     * @param {string} apiKey - API key
     * @returns {string} Chữ ký đã được tính toán
     */
    static calculateSignature(data, apiKey) {
        // Trong môi trường thực tế, bạn sẽ cần một thuật toán mã hóa để tính toán chữ ký
        // Đây chỉ là ví dụ đơn giản
        const jsonStr = JSON.stringify(data);
        // Trong thực tế, bạn sẽ sử dụng một thuật toán mã hóa như HMAC-SHA256
        // Ví dụ: return CryptoJS.HmacSHA256(jsonStr, apiKey).toString();
        return 'calculated-signature';
    }

    /**
     * Dữ liệu mẫu trong trường hợp không thể kết nối với API
     * @returns {Object} Dữ liệu mẫu
     */
    static getFallbackData() {
        return {
            company: {
                name: "Poker Pro",
                address: "Quận 7, TP.HCM",
                phone: "+84 91 5055 660",
                email: "support@dichvuweb.store"
            },
            warranty: {
                title: "Phiếu Bảo Hành",
                terms: "Chúng tôi cam kết bảo hành tất cả các sản phẩm trong thời gian sở hữu của khách hàng. Công ty sẽ sửa chữa và thay thế các linh kiện bị lỗi mà không tính thêm phí cho chủ sở hữu sản phẩm."
            },
            customer: {
                name: "Nguyễn Tuấn Vũ",
                address: "Tân Bình, TP.HCM",
                phone: "+84 34 7118 188",
                email: "NA/N"
            },
            product: {
                model: "PP-2025",
                serial: "PKP-18866233NTV",
                manufacturer: "Poker Pro",
                warrantyStartDate: new Date().toLocaleDateString('vi-VN'),
                warrantyEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('vi-VN')
            },
            signatures: {
                date: new Date().toLocaleDateString('vi-VN')
            }
        };
    }

    /**
     * Định dạng ngày từ chuỗi ISO date (YYYY-MM-DD) sang định dạng DD/MM/YYYY
     * @param {string} isoDate - Chuỗi ngày theo định dạng ISO
     * @returns {string} Ngày đã được định dạng
     */
    static formatDate(isoDate) {
        if (!isoDate) return '';

        try {
            const date = new Date(isoDate);
            return date.toLocaleDateString('vi-VN');
        } catch (error) {
            console.error('Lỗi khi định dạng ngày:', error);
            return isoDate;
        }
    }
}

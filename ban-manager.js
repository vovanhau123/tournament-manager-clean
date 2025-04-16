const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { app } = require('electron');

class BanManager {
    constructor() {
        this.apiKey = '';
        // Sử dụng Buffer để đảm bảo độ dài key đúng 32 bytes
        this.encryptionKey = crypto.scryptSync('your-secret-key', 'salt', 32);
        this.signatureKey = crypto.scryptSync('your-signature-key', 'salt', 32);
        this.banFilePath = path.join(app.getPath('userData'), 'ban_status.dat');
        this.api = axios.create({
            baseURL: 'https://jason.io.vn/api',
            timeout: 3000 // Giảm timeout xuống 3 giây
        });
    }

    // Tạo chữ ký cho request API
    generateSignature(data) {
        const hmac = crypto.createHmac('sha256', this.apiKey);
        hmac.update(JSON.stringify(data));
        return hmac.digest('hex');
    }

    // Mã hóa dữ liệu
    encryptData(data) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
            let encrypted = cipher.update(JSON.stringify(data));
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            return {
                iv: iv.toString('hex'),
                encryptedData: encrypted.toString('hex')
            };
        } catch (error) {
            console.error('Lỗi khi mã hóa dữ liệu:', error);
            throw error;
        }
    }

    // Giải mã dữ liệu
    decryptData(encryptedData) {
        try {
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const encryptedText = Buffer.from(encryptedData.encryptedData, 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return JSON.parse(decrypted.toString());
        } catch (error) {
            console.error('Lỗi khi giải mã dữ liệu:', error);
            return { isBanned: false };
        }
    }

    // Tạo chữ ký cho dữ liệu
    createSignature(data) {
        const hmac = crypto.createHmac('sha256', this.signatureKey);
        hmac.update(JSON.stringify(data));
        return hmac.digest('hex');
    }

    // Kiểm tra chữ ký
    verifySignature(data, signature) {
        try {
            const expectedSignature = this.createSignature(data);
            return crypto.timingSafeEqual(
                Buffer.from(signature, 'hex'),
                Buffer.from(expectedSignature, 'hex')
            );
        } catch (error) {
            console.error('Lỗi khi xác thực chữ ký:', error);
            return false;
        }
    }

    // Lưu trạng thái cấm
    saveBanStatus(data) {
        try {
            // Tạo chữ ký
            const signature = this.createSignature(data);

            // Mã hóa dữ liệu
            const encryptedData = this.encryptData(data);

            // Lưu cả dữ liệu mã hóa và chữ ký
            const saveData = {
                ...encryptedData,
                signature
            };

            // Tạo thư mục nếu chưa tồn tại
            const dir = path.dirname(this.banFilePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Lưu vào file
            fs.writeFileSync(this.banFilePath, JSON.stringify(saveData));
            console.log('Đã lưu trạng thái cấm thành công');
            return true;
        } catch (error) {
            console.error('Lỗi khi lưu trạng thái cấm:', error);
            return false;
        }
    }

    // Đọc trạng thái cấm
    readBanStatus() {
        try {
            if (!fs.existsSync(this.banFilePath)) {
                console.log('Không tìm thấy file trạng thái cấm');
                return { isBanned: false };
            }

            // Đọc dữ liệu đã lưu
            const savedData = JSON.parse(fs.readFileSync(this.banFilePath, 'utf8'));

            // Kiểm tra chữ ký
            const { signature, ...dataWithoutSignature } = savedData;
            if (!this.verifySignature(dataWithoutSignature, signature)) {
                console.error('Chữ ký không hợp lệ');
                return { isBanned: false };
            }

            // Giải mã dữ liệu
            const decryptedData = this.decryptData(savedData);

            // Kiểm tra ngày hết hạn
            if (decryptedData.isBanned && decryptedData.banExpiry) {
                const expiryDate = new Date(decryptedData.banExpiry);
                const now = new Date();
                
                if (now > expiryDate) {
                    console.log('Lệnh cấm đã hết hạn');
                    return { isBanned: false };
                }
            }

            return decryptedData;
        } catch (error) {
            console.error('Lỗi khi đọc trạng thái cấm:', error);
            return { isBanned: false };
        }
    }

    // Kiểm tra trạng thái với retry
    async checkStatus(maxRetries = 2) { // Giảm số lần retry xuống 2
        let retryCount = 0;
        
        while (retryCount < maxRetries) {
            try {
                console.log(`Đang kiểm tra trạng thái (lần ${retryCount + 1}/${maxRetries})`);
                
                // Đọc trạng thái offline trước
                const offlineStatus = this.readBanStatus();
                if (offlineStatus.isBanned) {
                    console.log('Phát hiện trạng thái cấm từ cache');
                    return offlineStatus;
                }

                // Gửi thêm thông tin về thiết bị và ứng dụng
                const data = {
                    appVersion: app.getVersion(),
                    platform: process.platform,
                    osVersion: process.getSystemVersion(),
                    timestamp: new Date().toISOString()
                };
                
                const signature = this.generateSignature(data);

                const response = await this.api.post('/check-status', data, {
                    headers: {
                        'X-API-Key': this.apiKey,
                        'X-Signature': signature
                    }
                });

                if (response.data) {
                    // Lưu trạng thái đã mã hóa
                    await this.saveBanStatus(response.data);
                    return response.data;
                }

                return { isBanned: false };
            } catch (error) {
                retryCount++;
                console.error(`Lỗi khi kiểm tra trạng thái (lần ${retryCount}):`, error);

                if (retryCount === maxRetries) {
                    console.log('Đã hết số lần thử, chuyển sang đọc trạng thái offline');
                    return this.readBanStatus();
                }

                // Giảm thời gian chờ giữa các lần retry
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return { isBanned: false };
    }
}

module.exports = BanManager;
/**
 * Module chứa các hàm tiện ích cho ứng dụng
 */

/**
 * Định dạng thời gian thành chuỗi MM:SS
 * @param {number} minutes - Số phút
 * @param {number} seconds - Số giây
 * @returns {string} Chuỗi thời gian định dạng MM:SS
 */
export function formatTime(minutes, seconds) {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Định dạng số tiền
 * @param {number} amount - Số tiền cần định dạng
 * @returns {string} Chuỗi số tiền đã định dạng
 */
export function formatCurrency(amount) {
    // Vì Intl.NumberFormat tự động xử lý số như cents (1 USD = 100 cents)
    // Nên ta nhân với 100 để hiển thị đúng giá trị USD
    const value = amount * 100;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * Định dạng số có dấu phân cách hàng nghìn
 * @param {number} number - Số cần định dạng
 * @returns {string} Chuỗi số đã định dạng
 */
export function formatNumber(number) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}

/**
 * Kiểm tra xem phần tử DOM có tồn tại không
 * @param {string} selector - CSS selector của phần tử cần kiểm tra
 * @returns {boolean} True nếu phần tử tồn tại, ngược lại là false
 */
export function elementExists(selector) {
    return document.querySelector(selector) !== null;
}

/**
 * Thêm style vào document
 * @param {string} cssText - Nội dung CSS cần thêm
 * @returns {HTMLStyleElement} Phần tử style đã thêm
 */
export function addStyleToDocument(cssText) {
    const style = document.createElement('style');
    style.textContent = cssText;
    document.head.appendChild(style);
    return style;
}
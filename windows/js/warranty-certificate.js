/**
 * warranty-certificate.js
 * Xử lý hiển thị và in phiếu bảo hành
 */

document.addEventListener('DOMContentLoaded', function() {
    // Lấy các phần tử DOM
    const showWarrantyBtn = document.getElementById('showWarrantyBtn');
    const warrantyPopup = document.getElementById('warrantyPopup');
    const closeWarrantyBtn = document.getElementById('closeWarrantyBtn');
    const printWarrantyBtn = document.getElementById('printWarrantyBtn');

    // Tạo đường dẫn đến hình ảnh con dấu
    const stampImage = document.querySelector('.stamp-image');
    if (stampImage) {
        // Kiểm tra xem hình ảnh có tồn tại không
        stampImage.onerror = function() {
            console.log('Không tìm thấy file moc.png, sử dụng Canvas để tạo mộc');
            // Nếu hình ảnh không tồn tại, tạo hình ảnh con dấu bằng Canvas
            createWarrantyStamp();
        };

        // Thử tìm các đường dẫn khác nếu đường dẫn hiện tại không hoạt động
        stampImage.addEventListener('error', function() {
            // Thử các đường dẫn khác
            const paths = [
                'assets/moc.png',
                '../assets/moc.png',
                '../../assets/moc.png',
                './assets/moc.png',
                '/assets/moc.png'
            ];

            // Thử từng đường dẫn
            for (const path of paths) {
                const img = new Image();
                img.onload = function() {
                    console.log('Đã tìm thấy file moc.png tại:', path);
                    stampImage.src = path;
                };
                img.src = path;
            }
        }, { once: true });
    }

    // Biến lưu trữ dữ liệu bảo hành
    let warrantyData = null;

    // Lấy dữ liệu bảo hành khi trang được tải
    loadWarrantyData();

    // Hàm lấy dữ liệu bảo hành từ API
    async function loadWarrantyData() {
        try {
            // Chuẩn bị dữ liệu gửi đến API
            const requestData = {
                // Bạn có thể thêm các thông tin cần thiết ở đây
                // Ví dụ: productId, serialNumber, customerId, v.v.
                requestType: 'warranty_info',
                timestamp: new Date().toISOString()
            };

            // Lấy dữ liệu từ service
            warrantyData = await WarrantyService.getWarrantyData(requestData);
            console.log('Dữ liệu bảo hành đã được tải:', warrantyData);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu bảo hành:', error);
        }
    }

    // Hiển thị phiếu bảo hành khi di chuột vào biểu tượng hoặc khi nhấp vào
    if (showWarrantyBtn) {
        // Hiển thị khi di chuột vào
        showWarrantyBtn.addEventListener('mouseenter', async function() {
            warrantyPopup.classList.add('show');
            await fillWarrantyData();
            adjustWarrantyPosition();
        });

        // Hiển thị khi nhấp vào (cho thiết bị di động và để giữ phiếu hiển thị)
        showWarrantyBtn.addEventListener('click', async function(e) {
            e.preventDefault(); // Ngăn chặn hành vi mặc định
            warrantyPopup.classList.add('show');
            await fillWarrantyData();
            adjustWarrantyPosition();
        });
    }

    // Đóng phiếu bảo hành khi nhấn nút đóng
    closeWarrantyBtn?.addEventListener('click', function() {
        warrantyPopup.classList.add('hide');

        // Xóa class show sau khi animation kết thúc
        setTimeout(() => {
            warrantyPopup.classList.remove('show');
            warrantyPopup.classList.remove('hide');
        }, 300);
    });

    // In phiếu bảo hành khi nhấn nút in
    printWarrantyBtn?.addEventListener('click', function() {
        window.print();
    });

    // Đóng phiếu bảo hành khi nhấn bên ngoài
    warrantyPopup?.addEventListener('click', function(e) {
        if (e.target === warrantyPopup) {
            closeWarrantyBtn.click();
        }
    });

    // Đóng phiếu bảo hành khi di chuột ra khỏi biểu tượng và phiếu
    document.addEventListener('mouseover', function(e) {
        // Kiểm tra xem chuột có nằm trên biểu tượng hoặc phiếu không
        const isOverIcon = e.target === showWarrantyBtn || showWarrantyBtn.contains(e.target);
        const isOverPopup = warrantyPopup.contains(e.target);

        // Nếu chuột không nằm trên biểu tượng hoặc phiếu, ẩn phiếu
        if (!isOverIcon && !isOverPopup && warrantyPopup.classList.contains('show')) {
            // Chỉ ẩn khi di chuột ra khỏi cả hai
            closeWarrantyBtn.click();
        }
    });

    // Xử lý responsive khi thay đổi kích thước màn hình
    window.addEventListener('resize', function() {
        if (warrantyPopup.classList.contains('show')) {
            // Đảm bảo phiếu bảo hành luôn hiển thị đúng vị trí khi thay đổi kích thước màn hình
            adjustWarrantyPosition();
        }
    });

    // Hàm điều chỉnh vị trí phiếu bảo hành
    function adjustWarrantyPosition() {
        // Đảm bảo phiếu bảo hành không bị tràn ra ngoài màn hình
        const certificate = warrantyPopup.querySelector('.warranty-certificate');
        const popup = warrantyPopup;

        // Đặt lại scroll về đầu khi hiển thị
        if (popup) {
            popup.scrollTop = 0;
        }

        // Đặt lại scroll của trang về đầu
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // Đảm bảo phiếu bảo hành hiển thị đúng trên mọi thiết bị
        setTimeout(() => {
            // Đặt lại kích thước của popup dựa trên kích thước màn hình
            if (window.innerWidth <= 576) {
                // Trên thiết bị di động, đảm bảo phiếu bảo hành vừa với màn hình
                if (certificate) {
                    certificate.style.maxHeight = 'none';
                }
            }
        }, 100);
    }

    // Hàm tạo hình ảnh con dấu bằng Canvas
    function createWarrantyStamp() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 500;
            canvas.height = 500;
            const ctx = canvas.getContext('2d');

            // Vẽ nền tròn
            ctx.beginPath();
            ctx.arc(250, 250, 240, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fill();
            ctx.strokeStyle = '#c00';
            ctx.lineWidth = 10;
            ctx.stroke();

            // Vẽ vòng tròn trong
            ctx.beginPath();
            ctx.arc(250, 250, 220, 0, Math.PI * 2);
            ctx.strokeStyle = '#c00';
            ctx.lineWidth = 5;
            ctx.stroke();

            // Vẽ vòng tròn trong nữa
            ctx.beginPath();
            ctx.arc(250, 250, 200, 0, Math.PI * 2);
            ctx.strokeStyle = '#c00';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Vẽ chữ "POKER PRO" ở trên
            ctx.font = 'bold 40px Arial';
            ctx.fillStyle = '#c00';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Vẽ chữ theo đường tròn
            const text = 'POKER PRO';
            const radius = 180;

            // Vẽ chữ ở trên
            ctx.save();
            ctx.translate(250, 250);
            ctx.rotate(-Math.PI / 2);
            for (let i = 0; i < text.length; i++) {
                const angle = i * Math.PI / (text.length - 1);
                ctx.save();
                ctx.rotate(angle);
                ctx.fillText(text[i], 0, -radius);
                ctx.restore();
            }
            ctx.restore();

            // Vẽ chữ "VIETNAM" ở dưới
            const text2 = 'VIETNAM';
            ctx.save();
            ctx.translate(250, 250);
            ctx.rotate(Math.PI / 2);
            for (let i = 0; i < text2.length; i++) {
                const angle = i * Math.PI / (text2.length - 1);
                ctx.save();
                ctx.rotate(angle);
                ctx.fillText(text2[i], 0, -radius);
                ctx.restore();
            }
            ctx.restore();

            // Vẽ ngôi sao ở giữa
            drawStar(ctx, 250, 250, 5, 100, 50);

            // Vẽ chữ "OFFICIAL" ở giữa ngôi sao
            ctx.font = 'bold 30px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('OFFICIAL', 250, 250);

            // Chuyển canvas thành URL hình ảnh
            const dataURL = canvas.toDataURL('image/png');

            // Gán URL cho hình ảnh con dấu
            if (stampImage) {
                stampImage.src = dataURL;
                console.log('Đã tạo mộc bằng Canvas thành công');
            }
        } catch (error) {
            console.error('Lỗi khi tạo hình ảnh con dấu:', error);
        }
    }

    // Hàm vẽ ngôi sao
    function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        // Gradient cho ngôi sao
        const starGradient = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
        starGradient.addColorStop(0, '#ffdd00');
        starGradient.addColorStop(1, '#ff9900');

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }

        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();

        // Đổ bóng cho ngôi sao
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Tô màu ngôi sao
        ctx.fillStyle = starGradient;
        ctx.fill();

        // Xóa đổ bóng trước khi vẽ viền
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Thêm hiệu ứng ánh sáng
        ctx.beginPath();
        ctx.arc(cx - outerRadius/4, cy - outerRadius/4, innerRadius/4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    }

    // Hàm điền thông tin từ dữ liệu API
    async function fillWarrantyData() {
        // Nếu chưa có dữ liệu, thử tải lại
        if (!warrantyData) {
            await loadWarrantyData();
        }

        // Nếu vẫn không có dữ liệu, sử dụng dữ liệu mẫu
        if (!warrantyData) {
            fillSampleData();
            return;
        }

        // Lấy các phần tử hiển thị
        const customerNameDisplay = document.getElementById('customerNameDisplay');
        const addressDisplay = document.getElementById('addressDisplay');
        const modelDisplay = document.getElementById('modelDisplay');
        const serialDisplay = document.getElementById('serialDisplay');
        const manufacturerDisplay = document.getElementById('manufacturerDisplay');
        const startDateDisplay = document.getElementById('startDateDisplay');
        const endDateDisplay = document.getElementById('endDateDisplay');

        // Lấy thông tin công ty
        const companyInfo = document.querySelector('.company-info');
        if (companyInfo && warrantyData.company) {
            companyInfo.innerHTML = `
                <h2>${warrantyData.company.name || 'Company Name'}</h2>
                <p>${warrantyData.company.address || 'Address'}</p>
                <p>${warrantyData.company.phone || 'Phone'}</p>
                <p>${warrantyData.company.email || 'Email'}</p>
            `;
        }

        // Lấy tiêu đề phiếu bảo hành
        const warrantyTitle = document.querySelector('.warranty-title h1');
        if (warrantyTitle && warrantyData.warranty) {
            warrantyTitle.textContent = warrantyData.warranty.title || 'Warranty Certificate';
        }

        // Lấy điều khoản bảo hành
        const warrantyTerms = document.querySelector('.warranty-terms p');
        if (warrantyTerms && warrantyData.warranty) {
            warrantyTerms.textContent = warrantyData.warranty.terms || '';
        }

        // Điền thông tin khách hàng và sản phẩm
        if (customerNameDisplay && warrantyData.customer) {
            customerNameDisplay.textContent = warrantyData.customer.name || '';
        }

        if (addressDisplay && warrantyData.customer) {
            addressDisplay.textContent = warrantyData.customer.address || '';
        }

        if (modelDisplay && warrantyData.product) {
            modelDisplay.textContent = warrantyData.product.model || '';
        }

        if (serialDisplay && warrantyData.product) {
            serialDisplay.textContent = warrantyData.product.serial || '';
        }

        if (manufacturerDisplay && warrantyData.product) {
            manufacturerDisplay.textContent = warrantyData.product.manufacturer || '';
        }

        if (startDateDisplay && warrantyData.product) {
            startDateDisplay.textContent = WarrantyService.formatDate(warrantyData.product.warrantyStartDate) || '';
        }

        if (endDateDisplay && warrantyData.product) {
            endDateDisplay.textContent = WarrantyService.formatDate(warrantyData.product.warrantyEndDate) || '';
        }
    }

    // Hàm điền thông tin mẫu (sử dụng khi không có dữ liệu API)
    function fillSampleData() {
        // Lấy các phần tử hiển thị
        const customerNameDisplay = document.getElementById('customerNameDisplay');
        const addressDisplay = document.getElementById('addressDisplay');
        const modelDisplay = document.getElementById('modelDisplay');
        const serialDisplay = document.getElementById('serialDisplay');
        const manufacturerDisplay = document.getElementById('manufacturerDisplay');
        const startDateDisplay = document.getElementById('startDateDisplay');
        const endDateDisplay = document.getElementById('endDateDisplay');

        // Lấy ngày hiện tại
        const today = new Date();
        const startDate = formatDate(today);

        // Tính ngày hết hạn (12 tháng sau)
        const endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + 12);
        const formattedEndDate = formatDate(endDate);

        // Điền thông tin mẫu
        if (customerNameDisplay) customerNameDisplay.textContent = 'Nguyễn Văn A';
        if (addressDisplay) addressDisplay.textContent = 'Hà Nội, Việt Nam';
        if (modelDisplay) modelDisplay.textContent = 'ABC-123';
        if (serialDisplay) serialDisplay.textContent = 'XYZ-789';
        if (manufacturerDisplay) manufacturerDisplay.textContent = 'Poker Pro';
        if (startDateDisplay) startDateDisplay.textContent = startDate;
        if (endDateDisplay) endDateDisplay.textContent = formattedEndDate;
    }

    // Hàm định dạng ngày tháng
    function formatDate(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
});

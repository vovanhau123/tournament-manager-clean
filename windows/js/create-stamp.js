/**
 * create-stamp.js
 * Script để tạo file moc.png mẫu
 */

// Tạo một canvas element
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
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;
    
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
    ctx.fillStyle = '#c00';
    ctx.fill();
    ctx.strokeStyle = '#900';
    ctx.lineWidth = 2;
    ctx.stroke();
}

drawStar(ctx, 250, 250, 5, 100, 50);

// Vẽ chữ "OFFICIAL" ở giữa ngôi sao
ctx.font = 'bold 30px Arial';
ctx.fillStyle = 'white';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('OFFICIAL', 250, 250);

// Chuyển canvas thành URL hình ảnh
const dataURL = canvas.toDataURL('image/png');

// Tạo một thẻ a để tải xuống hình ảnh
const a = document.createElement('a');
a.href = dataURL;
a.download = 'moc.png';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);

console.log('Đã tạo file moc.png. Vui lòng lưu file này vào thư mục assets.');

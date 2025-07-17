function resizeCanvas() {
    const input = document.getElementById('canvasWidthInput');
    const width = parseInt(input.value, 10);
    if (isNaN(width) || width <= 0) {
        alert('正しい幅を入力してください。');
        return;
    }

    const canvas = document.getElementById('resultCanvas');
    const aspectRatio = 4 / 5;
    canvas.width = width;
    canvas.height = Math.round(width / aspectRatio);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    console.log(`Canvas resized to: ${canvas.width} x ${canvas.height}`);
}

function takePhoto() {
    const img = document.getElementById('receivedImage');
    const dateP = document.getElementById('date');
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');

    if (!img.src.startsWith('data:image/')) {
        alert('まだ画像が受信されていません。');
        return;
    }

    const aspectRatio = img.naturalWidth / img.naturalHeight;
    const widthInput = document.getElementById('canvasWidthInput');
    const targetWidth = parseInt(widthInput.value, 10);
    const targetHeight = Math.round(targetWidth / aspectRatio);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const gray = toGrayscale(imgData.data, canvas.width, canvas.height);
    const result = errorDiffusion1CH(gray, canvas.width, canvas.height);

    const outputData = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < result.length; i++) {
        outputData.data[i * 4 + 0] = result[i];
        outputData.data[i * 4 + 1] = result[i];
        outputData.data[i * 4 + 2] = result[i];
        outputData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(outputData, 0, 0);

    const now = new Date();
    dateP.textContent = `Date : ${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
}

function toGrayscale(array, width, height) {
    const output = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
        const r = array[i * 4];
        const g = array[i * 4 + 1];
        const b = array[i * 4 + 2];
        output[i] = (r + g + b) / 3 | 0;
    }
    return output;
}

function errorDiffusion1CH(u8array, width, height) {
    const buffer = new Int16Array(width * height).map((_, i) => u8array[i]);
    const output = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const oldPixel = buffer[idx];
            const newPixel = oldPixel >= 128 ? 255 : 0;
            const error = oldPixel - newPixel;
            output[idx] = newPixel;

            if (x + 1 < width) buffer[idx + 1] += (5 * error) / 16 | 0;
            if (x - 1 >= 0 && y + 1 < height) buffer[idx + width - 1] += (3 * error) / 16 | 0;
            if (y + 1 < height) buffer[idx + width] += (5 * error) / 16 | 0;
            if (x + 1 < width && y + 1 < height) buffer[idx + width + 1] += (3 * error) / 16 | 0;
        }
    }
    return output;
}

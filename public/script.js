const ws = new WebSocket(`wss://${location.host}`);

ws.onopen = () => {
  console.log("WebSocket connected on PC side");
};

ws.onmessage = (event) => {
  if (typeof event.data === "string" && event.data.startsWith("data:image/")) {
    const img = document.getElementById("receivedImage");
    img.src = event.data;
    img.style.display = "block";
    console.log("画像を受信しました");
  }
};

document.getElementById("btnRemoteTake").addEventListener("click", () => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send("takePhoto"); // iPhoneに撮影命令を送信
    console.log("撮影命令を送信しました");
  } else {
    alert("WebSocket接続が確立されていません");
  }
});

function resizeCanvas() {
  const input = document.getElementById("canvasWidthInput");
  const width = parseInt(input.value, 10);
  if (isNaN(width) || width <= 0) {
    alert("正しい幅を入力してください。");
    return;
  }

  const canvas = document.getElementById("resultCanvas");
  const aspectRatio = 4 / 5;
  canvas.width = width;
  canvas.height = Math.round(width / aspectRatio);

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  console.log(`Canvas resized to: ${canvas.width} x ${canvas.height}`);
}

function takePhoto() {
  const img = document.getElementById("receivedImage");
  const dateP = document.getElementById("date");
  const canvas = document.getElementById("resultCanvas");
  const ctx = canvas.getContext("2d");

  if (!img.src || !img.src.startsWith("data:image/")) {
    alert("まだ画像が受信されていません。");
    return;
  }
  if (!img.complete || img.naturalWidth === 0) {
    alert("画像の読み込みが完了していません。少し待ってから再度押してください。");
    return;
  }

  const aspectRatio = img.naturalWidth / img.naturalHeight;
  const widthInput = document.getElementById("canvasWidthInput");
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
  dateP.textContent = `Date : ${now.getFullYear()}/${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${now.getDate().toString().padStart(2, "0")} ${now
    .getHours()
    .toString()
    .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;
}

// --- toGrayscale と errorDiffusion1CH 関数はここに実装してください ---
// 省略（以前のコードを使ってください）

function printCanvas() {
  const originalCanvas = document.getElementById("resultCanvas");
  // m02s_print.js の printFromCanvas 関数呼び出し想定
  printFromCanvas(originalCanvas);
}

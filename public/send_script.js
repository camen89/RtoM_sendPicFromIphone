const ws = new WebSocket(`wss://${location.host}`);

ws.onopen = () => {
  console.log("WebSocket connected on iPhone side");
};

ws.onmessage = (event) => {
  if (event.data === "takePhoto") {
    send(); // PCからの撮影指示で撮影＆送信を実行
  }
};

navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  document.getElementById("camera").srcObject = stream;
});

function send() {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/png");
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(dataUrl);
    console.log("画像を送信しました");
  } else {
    alert("WebSocket接続が確立されていません");
  }
}

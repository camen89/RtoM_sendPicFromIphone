const ws = new WebSocket(`wss://${location.host}`);

let isCameraReady = false;
let videoStream = null;

ws.onopen = () => {
  console.log("WebSocket connected on iPhone side");
};

ws.onerror = (err) => {
  console.error("WebSocket error:", err);
};

ws.onclose = (event) => {
  console.log("WebSocket closed:", event);
};

ws.onmessage = (event) => {
  console.log("iPhone received message:", event.data);
  if (event.data === "takePhoto") {
    console.log("撮影指令を受信しました。カメラ準備確認後に撮影します。");
    waitForCameraAndSend();
  }
};

navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    videoStream = stream;
    const video = document.getElementById("camera");
    video.srcObject = stream;
    console.log("カメラ映像取得成功");
    video.onloadedmetadata = () => {
      isCameraReady = true;
      console.log("カメラ映像メタデータ取得、準備完了");
    };
  })
  .catch((err) => {
    console.error("カメラ映像取得失敗:", err);
    alert("カメラの使用を許可してください: " + err.message);
  });

function waitForCameraAndSend() {
  const maxWait = 5000; // 5秒待ってもカメラ準備できない場合は諦める
  const start = Date.now();

  const interval = setInterval(() => {
    const video = document.getElementById("camera");
    if (isCameraReady && video.videoWidth > 0) {
      clearInterval(interval);
      console.log("カメラ準備完了、送信します");
      send();
    } else if (Date.now() - start > maxWait) {
      clearInterval(interval);
      console.warn("カメラ準備が間に合いませんでした。撮影をスキップします");
    }
  }, 200);
}

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
    console.error("WebSocketが開いていません。送信できません。");
  }
}

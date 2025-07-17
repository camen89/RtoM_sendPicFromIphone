const ws = new WebSocket(`wss://${location.host}`);

ws.onopen = () => {
  console.log("WebSocket connected on iPhone side");
};

ws.onerror = (err) => {
  console.error("WebSocket error:", err);
};

ws.onclose = (event) => {
  console.log("WebSocket closed:", event);
  console.log(`Code: ${event.code}, Reason: ${event.reason}, WasClean: ${event.wasClean}`);
};

ws.onmessage = (event) => {
  console.log("iPhone received message:", event.data);
  if (event.data === "takePhoto") {
    console.log("撮影指令を受信しました。カメラ準備確認後に撮影します。");
    if (isCameraReady) {
      send();
    } else {
      console.warn("カメラ映像がまだ準備できていません。");
    }
  }
};

let isCameraReady = false;

// カメラ映像取得
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    const video = document.getElementById("camera");
    video.srcObject = stream;
    console.log("カメラ映像取得成功");

    video.onloadedmetadata = () => {
      console.log("カメラ映像メタデータ取得、準備完了");
      isCameraReady = true;
    };
  })
  .catch((err) => {
    console.error("カメラ映像取得失敗:", err);
    alert("カメラの使用を許可してください: " + err.message);
  });

function send() {
  const video = document.getElementById("camera");
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    console.warn("カメラ映像がまだ準備できていません。");
    return;
  }

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

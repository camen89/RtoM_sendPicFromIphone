const ws = new WebSocket(`wss://${location.host}`);
let isCameraReady = false;

ws.onopen = () => {
  console.log("WebSocket connected on iPhone side");
};

ws.onerror = (err) => {
  console.error("WebSocket error:", err);
};

ws.onclose = (event) => {
  console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
};

ws.onmessage = (event) => {
  if (typeof event.data === "string") {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "takePhoto") {
        console.log("撮影指令を受信しました。");
        if (isCameraReady) {
          takeAndSend();
        } else {
          console.warn("カメラ未準備。");
        }
      }
    } catch (e) {
      console.log("iPhone received unknown or invalid message, ignored.");
    }
  }
};

navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    const video = document.getElementById("camera");
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      console.log("カメラ映像メタデータ取得、準備完了");
      isCameraReady = true;
    };
    console.log("カメラ映像取得成功");
  })
  .catch((err) => {
    console.error("カメラ映像取得失敗:", err);
    alert("カメラの使用を許可してください: " + err.message);
  });

function takeAndSend() {
  requestAnimationFrame(() => {
    setTimeout(() => {
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
        ws.send(JSON.stringify({ type: "imageData", data: dataUrl }));
        console.log("画像を送信しました");
      } else {
        console.error("WebSocketが開いていません。送信できません。");
      }
    }, 100); // 100ms待ってから送信
  });
}

// 手動送信ボタンからも同じ関数を呼ぶ
function send() {
  if (isCameraReady) {
    takeAndSend();
  } else {
    console.warn("カメラ未準備。");
  }
}

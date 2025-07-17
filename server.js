const express = require('express');
const app = express();
const http = require('http').createServer(app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server: http });

app.use(express.static('public'));

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    // 文字列のみ中継、画像データ（data:image）含む文字列も除外
    if (typeof data === 'string' && !data.startsWith('data:image/')) {
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
    // 画像データは全員に送信（もしくはPCだけに送る）
    else if (typeof data === 'string' && data.startsWith('data:image/')) {
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
  });
});

const port = process.env.PORT || 3000;
http.listen(port, () => console.log(`Server running on port ${port}`));

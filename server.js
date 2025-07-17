const express = require('express');
const app = express();
const http = require('http').createServer(app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server: http });

app.use(express.static('public'));

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (data, isBinary) => {
    console.log('Received message:', isBinary ? 'Binary' : 'Text');

    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        if (isBinary) {
          client.send(data, { binary: true });
        } else {
          client.send(data.toString());
        }
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const port = process.env.PORT || 3000;
http.listen(port, () => console.log(`Server running on port ${port}`));

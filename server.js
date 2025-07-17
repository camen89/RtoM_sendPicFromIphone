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


function toGrayscale(inputData, width, height) {
  const grayArray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = inputData[i * 4 + 0];
    const g = inputData[i * 4 + 1];
    const b = inputData[i * 4 + 2];
    grayArray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return grayArray;
}

function errorDiffusion1CH(grayArray, width, height) {
  const output = new Uint8Array(width * height);
  const error = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      let val = grayArray[i] + error[i];
      const newVal = val < 128 ? 0 : 255;
      output[i] = newVal;
      const quantError = val - newVal;
      if (x + 1 < width) error[i + 1] += quantError * 7 / 16;
      if (y + 1 < height) {
        if (x > 0) error[i + width - 1] += quantError * 3 / 16;
        error[i + width] += quantError * 5 / 16;
        if (x + 1 < width) error[i + width + 1] += quantError * 1 / 16;
      }
    }
  }
  return output;
}


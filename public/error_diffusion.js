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

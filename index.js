const webcamEl = document.querySelector("#webcam");
const liveView = document.querySelector("#liveView");
const btnEnableWebcam = document.querySelector("#btnEnableWebcam");
const btnStopWebcam = document.querySelector("#btnStopWebcam");
const outputMessageEl = document.querySelector("#outputMessage");
const miniLogEl = document.querySelector("#miniLog");
const thresholdInput = document.querySelector("#threshold");
const thresholdVal = document.querySelector("#thresholdVal");
const toggleDetectionBtn = document.querySelector("#toggleDetection");
const statusText = document.querySelector("#statusText");
const bottomBlock = document.getElementById("bottomBlock");

const TIME_MAX = 60000;
const RESET_THRESHOLD = 1000;
const kitchenObjects = ["knife", "fork", "spoon", "bowl", "cup","toaster","oven",
  "refrigerator","dining table","sink","microwave","bottle","cell phone","apple",
  "banana","orange"];


let model = null;
let webcam = null;
let detectionEnabled = true;

let detectionHistory = []; // miniLog
let objectDetected = {}; // { class: {accumulated, lastSeen} }


thresholdInput.addEventListener("input", () => {
  thresholdVal.textContent = Number(thresholdInput.value).toFixed(2);
});
toggleDetectionBtn.addEventListener("click", () => {
  detectionEnabled = !detectionEnabled;
  toggleDetectionBtn.textContent = `Detección: ${detectionEnabled ? "ON" : "OFF"}`;
  logMini(`Detección ${detectionEnabled ? "activada" : "desactivada"}`);
});


const bottomStackId = '__bottom_stack__';
function ensureBottomStack() {
  let stack = document.getElementById(bottomStackId);
  if (!stack) {
    stack = document.createElement('div');
    stack.id = bottomStackId;
    stack.className = 'bottom-stack';
    bottomBlock.appendChild(stack);
  }
  return stack;
}
const bottomTimeouts = {};
function showBottomMessage(key, html, { autoHideSec = 6, persist = false, colorDot = null } = {}) {
  const stack = ensureBottomStack();
  let el = document.querySelector(`#bottom-${key}`);
  if (!el) {
    el = document.createElement('div');
    el.id = `bottom-${key}`;
    el.className = 'bottom-content small';
    el.innerHTML = `<div class="alert-dot"></div><div class="bottom-text">${html}</div>`;
    stack.appendChild(el);
  } else {
    el.querySelector('.bottom-text').innerHTML = html;
  }
  if (colorDot) el.querySelector('.alert-dot').style.background = colorDot;
  else el.querySelector('.alert-dot').style.background = '';
  bottomBlock.classList.remove('bottom-hidden');
  bottomBlock.classList.add('bottom-visible');
  if (bottomTimeouts[key]) clearTimeout(bottomTimeouts[key]);
  if (!persist && autoHideSec) {
    bottomTimeouts[key] = setTimeout(() => hideBottomMessage(key), autoHideSec*1000);
  }
}
function hideBottomMessage(key) {
  const el = document.querySelector(`#bottom-${key}`);
  if (el) el.remove();
  if (bottomTimeouts[key]) clearTimeout(bottomTimeouts[key]);
  const stack = document.getElementById(bottomStackId);
  if (!stack || stack.children.length === 0) {
    bottomBlock.classList.remove('bottom-visible');
    bottomBlock.classList.add('bottom-hidden');
  }
}
function hideAllBottomMessages() {
  const stack = document.getElementById(bottomStackId);
  if (stack) stack.remove();
  for (const k in bottomTimeouts) clearTimeout(bottomTimeouts[k]);
  bottomBlock.classList.remove('bottom-visible');
  bottomBlock.classList.add('bottom-hidden');
}

/* ---------- Mini-log ---------- */
function logMini(msg) {
  const t = new Date().toLocaleTimeString();
  miniLogEl.innerHTML = `<div>[${t}] ${msg}</div>` + miniLogEl.innerHTML;
}

/* ---------- Cámara y TFJS ---------- */
function initTFJS() { if (typeof tf === "undefined") throw new Error("TensorFlow.js not loaded"); }
function getUserMediaSupported() { return Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }
async function enableCam(e) {
  if (!model) return;
  e.target.disabled = true;
  statusText.textContent = "Cámara activa";
  try {
    webcam = await tf.data.webcam(webcamEl);
    outputMessageEl.innerText = "Webcam enabled! Detecting objects...";
    await predictWebcam();
  } catch (err) {
    console.error(err);
    outputMessageEl.innerText = "Webcam access denied.";
    statusText.textContent = "Error cámara";
    e.target.disabled = false;
  }
}
async function stopCam() {
  if (webcam) {
    try { webcam._webcamStream.getVideoTracks().forEach(t => t.stop()); } catch {}
    webcam = null;
    statusText.textContent = "Cámara parada";
    btnEnableWebcam.disabled = false;
    outputMessageEl.innerText = "Webcam parada.";
    hideAllBottomMessages();
  }
}

/* ---------- Carga modelo ---------- */
async function loadCocoSsdModel() {
  model = await cocoSsd.load();
  btnEnableWebcam.disabled = false;
  outputMessageEl.innerText = "Modelo cargado. Pulsa 'Habilitar cámara'.";
}

/* ---------- LÓGICA PRINCIPAL DE DETECCIÓN ---------- */
async function predictWebcam() {
  if (!model || !webcam) return;
  const objectsDOM = [];
  const THRESH = () => parseFloat(thresholdInput.value);

  while (webcam) {
    if (!detectionEnabled) { await tf.nextFrame(); continue; }

    const frame = await webcam.capture();
    const predictions = await model.detect(frame);

    const validPredictions = predictions.filter(p => p.score >= THRESH() && kitchenObjects.includes(p.class));
    const detectedSet = new Set(validPredictions.map(p => p.class));
    const now = Date.now();

    // actualizar objectDetected y acumular tiempo con decimales
    for (let p of validPredictions) {
      const id = p.class;
      if (!objectDetected[id]) objectDetected[id] = { accumulated: 0, lastSeen: now };
      else {
        const diff = now - objectDetected[id].lastSeen;
        if (diff < RESET_THRESHOLD) objectDetected[id].accumulated += diff;
        else objectDetected[id].accumulated = 0;
        objectDetected[id].lastSeen = now;
      }
    }

    // alertas específicas
    if (detectedSet.has('knife') && objectDetected['knife'].accumulated > TIME_MAX) {
      showBottomMessage('knife', '⚠️ Recuerda guardar el cuchillo en su sitio.', { autoHideSec: 5, persist: false, colorDot: '#ff4d4d' });
      logMini('Alerta cuchillo (tiempo límite excedido)');
    }

    if (detectedSet.has('cup') && detectedSet.has('bottle')) {
      showBottomMessage('cup_bottle', '¿Te gustaría tomar algo?', { autoHideSec: 4, persist: false, colorDot: '#419de9ff' });
      logMini('Detectado cup + bottle');
    }

    if (detectedSet.has('microwave')) {
      showBottomMessage('microwave', 'Recuerda no meter objetos metálicos en el microondas.', { autoHideSec: 4, persist: false, colorDot: '#ff0000ff' });
      logMini('Alerta microondas');
    }

    if (detectedSet.has('oven')) {
      showBottomMessage('oven', 'Recuerda no meter objetos de plástico en el horno.', { autoHideSec: 4, persist: false, colorDot: '#ff0000ff' });
      logMini('Alerta horno');
    }

    if (detectedSet.has('cell phone') && detectedSet.has('bottle')) {
      showBottomMessage('phone_bottle', '¡Cuidado que no caiga líquido encima del teléfono!', { autoHideSec: 4, persist: false, colorDot: '#ff0000ff' });
      logMini('Alerta phone + bottle');
    }

    if (detectedSet.has('apple')) {
      showBottomMessage('apple', 'Recuerda lavar la manzana antes de comertela.', { autoHideSec: 4, persist: false, colorDot: '#00ddffff' });
      logMini('Recordatorio manzana');
    }

    if ((detectedSet.has('banana') || detectedSet.has('orange')) && !detectedSet.has('apple')) {
      showBottomMessage('no_lavar', 'Esa fruta no hace falta que la laves antes de comértela', { autoHideSec: 4, persist: false, colorDot: '#00ddffff' });
      logMini('Recordatorio fruta sin lavar');
    }


    objectsDOM.forEach(obj => obj.remove());
    objectsDOM.length = 0;

    for (let pred of validPredictions) {
      const [x, y, w, h] = pred.bbox;

      const timeSec = ((objectDetected[pred.class]?.accumulated || 0)/1000).toFixed(1);
      const label = document.createElement("div");
      label.className = "video-label";
      label.style.left = `${x}px`;
      label.style.top = `${Math.max(0, y - 28)}px`;
      label.style.position = "absolute";
      label.textContent = `${pred.class} (${Math.round(pred.score*100)}%) - ${timeSec}s`;

      const high = document.createElement("div");
      high.className = "highlighter";
      high.style.left = `${x}px`;
      high.style.top = `${y}px`;
      high.style.width = `${w}px`;
      high.style.height = `${h}px`;
      high.style.border = `3px solid ${pred.class === 'knife' && objectDetected[pred.class].accumulated > TIME_MAX ? "#ff0000" : "lime"}`;
      high.style.zIndex = 7;
      high.style.borderRadius = "6px";

      webcamEl.parentElement.appendChild(high);
      webcamEl.parentElement.appendChild(label);
      objectsDOM.push(high, label);
    }

    for (const id in objectDetected) {
      if (!validPredictions.some(p => p.class === id)) {
        const diff = now - objectDetected[id].lastSeen;
        if (diff >= RESET_THRESHOLD) delete objectDetected[id];
        if (id === 'knife') hideBottomMessage('knife');
      }
    }

    validPredictions.forEach(p => detectionHistory.unshift({ class: p.class, score: Math.round(p.score*100) }));
    if (detectionHistory.length > 6) detectionHistory = detectionHistory.slice(0,6);
    miniLogEl.innerText = detectionHistory.map((d,i)=>`${i+1}. ${d.class} = ${d.score}%`).join("\n");

    frame.dispose();
    await tf.nextFrame();
  }
}

/* ---------- Inicialización de la app ---------- */
async function app() {
  if (!getUserMediaSupported()) { outputMessageEl.innerText = "Webcam not supported."; return; }
  btnEnableWebcam.addEventListener("click", enableCam);
  btnStopWebcam.addEventListener("click", stopCam);
  await loadCocoSsdModel();
}

/* ---------- Start ---------- */
(async function initApp() {
  try {
    initTFJS();
    await app();
  } catch (err) {
    console.error(err);
    outputMessageEl.innerText = err.message || "Error inicializando";
  }
})();
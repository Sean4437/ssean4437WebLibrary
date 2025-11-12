const dateField = document.getElementById("dateField");
const board = document.getElementById("whiteboard");
const boardContent = document.getElementById("whiteboardContent");
const boardImage = document.getElementById("boardImage");
const boardColorInput = document.getElementById("boardColor");
const textColorInput = document.getElementById("textColor");
const scaleControl = document.getElementById("scaleControl");
const scaleValue = document.getElementById("scaleValue");
const photoInput = document.getElementById("photoInput");
const clearImageButton = document.getElementById("clearImage");
const floatingBoard = document.getElementById("floatingBoard");
const floatingBoardBackdrop = document.getElementById("floatingBoardBackdrop");
const closeFloatingBoardButton = document.getElementById("closeFloatingBoard");
const openCameraButton = document.getElementById("openCamera");
const cameraPreview = document.getElementById("cameraPreview");
const capturePhotoButton = document.getElementById("capturePhoto");
const cameraStatus = document.getElementById("cameraStatus");

let cameraStream = null;
const captureCanvas = document.createElement("canvas");

const formatDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initDateField = () => {
  if (!dateField.value) {
    dateField.value = formatDateInputValue(new Date());
  }
};

const updateBoardColor = (color) => {
  board.style.setProperty("--board-bg", color);
};

const updateTextColor = (color) => {
  board.style.setProperty("--text-color", color);
  boardContent.style.color = color;
};

const updateScale = (value) => {
  const scale = Number(value) / 100;
  board.style.setProperty("--board-scale", scale.toString());
  scaleValue.textContent = `${value}%`;
};

const handlePhotoUpload = (event) => {
  const [file] = event.target.files;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    boardImage.src = loadEvent.target.result;
    boardImage.hidden = false;
    stopCamera();
    openFloatingBoard();
    cameraStatus.textContent = "已載入相簿照片，可直接在白板上筆記。";
  };
  reader.readAsDataURL(file);
};

const clearBoardImage = () => {
  boardImage.src = "";
  boardImage.hidden = true;
  photoInput.value = "";
};

const startCamera = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    cameraStatus.textContent = "此瀏覽器暫不支援相機存取，請改用備用上傳。";
    return;
  }

  cameraStatus.textContent = "相機啟動中…";
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });
    cameraPreview.srcObject = cameraStream;
    cameraStatus.textContent = "相機已啟動，按下「拍照」擷取影像。";
  } catch (error) {
    cameraStatus.textContent =
      "無法啟動相機，請確認權限或改用備用上傳。";
    console.error("startCamera error:", error);
  }
};

const stopCamera = () => {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  cameraPreview.srcObject = null;
  cameraStatus.textContent = "相機已關閉。";
};

const capturePhotoFromStream = () => {
  if (!cameraStream || !cameraPreview.videoWidth) {
    cameraStatus.textContent = "相機畫面尚未就緒，請稍候再試。";
    return;
  }

  captureCanvas.width = cameraPreview.videoWidth;
  captureCanvas.height = cameraPreview.videoHeight;
  const ctx = captureCanvas.getContext("2d");
  ctx.drawImage(
    cameraPreview,
    0,
    0,
    captureCanvas.width,
    captureCanvas.height
  );
  const imageDataUrl = captureCanvas.toDataURL("image/png");
  boardImage.src = imageDataUrl;
  boardImage.hidden = false;
  cameraStatus.textContent = "已擷取最新照片，可在白板上記錄重點。";
};

const openFloatingBoard = () => {
  floatingBoard.classList.remove("hidden");
  floatingBoard.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
};

const closeFloatingBoard = () => {
  floatingBoard.classList.add("hidden");
  floatingBoard.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
  stopCamera();
};

const handleOpenCameraButton = () => {
  openFloatingBoard();
  startCamera();
};

document.addEventListener("DOMContentLoaded", () => {
  initDateField();
  updateBoardColor(boardColorInput.value);
  updateTextColor(textColorInput.value);
  updateScale(scaleControl.value);

  boardColorInput.addEventListener("input", (event) =>
    updateBoardColor(event.target.value)
  );
  textColorInput.addEventListener("input", (event) =>
    updateTextColor(event.target.value)
  );
  scaleControl.addEventListener("input", (event) =>
    updateScale(event.target.value)
  );
  openCameraButton.addEventListener("click", handleOpenCameraButton);
  capturePhotoButton.addEventListener("click", capturePhotoFromStream);
  photoInput.addEventListener("change", handlePhotoUpload);
  clearImageButton.addEventListener("click", clearBoardImage);
  closeFloatingBoardButton.addEventListener("click", closeFloatingBoard);
  floatingBoardBackdrop.addEventListener("click", closeFloatingBoard);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !floatingBoard.classList.contains("hidden")) {
      closeFloatingBoard();
    }
  });
});

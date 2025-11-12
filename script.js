 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/script.js b/script.js
new file mode 100644
index 0000000000000000000000000000000000000000..7e97d0622598df5c817c651fad9cca4337c48c85
--- /dev/null
+++ b/script.js
@@ -0,0 +1,163 @@
+const dateInput = document.getElementById("session-date");
+const boardInput = document.getElementById("board-input");
+const whiteboard = document.getElementById("whiteboard");
+const whiteboardContent = document.getElementById("whiteboard-content");
+const boardColor = document.getElementById("board-color");
+const textColor = document.getElementById("text-color");
+const zoomSlider = document.getElementById("board-zoom");
+const zoomValue = document.getElementById("zoom-value");
+const startCameraBtn = document.getElementById("start-camera");
+const captureBtn = document.getElementById("capture-photo");
+const video = document.getElementById("camera-stream");
+const canvas = document.getElementById("capture-canvas");
+const photoPreview = document.getElementById("photo-preview");
+const shareUrl = document.getElementById("share-url");
+const copyUrlBtn = document.getElementById("copy-url");
+
+let mediaStream;
+
+captureBtn.disabled = true;
+
+function setTodayDate() {
+  if (!dateInput) return;
+  const today = new Date();
+  const year = today.getFullYear();
+  const month = String(today.getMonth() + 1).padStart(2, "0");
+  const day = String(today.getDate()).padStart(2, "0");
+  dateInput.value = `${year}-${month}-${day}`;
+}
+
+function updateWhiteboardContent() {
+  whiteboardContent.textContent = boardInput.value;
+}
+
+function updateBoardColor() {
+  whiteboard.style.backgroundColor = boardColor.value;
+}
+
+function updateTextColor() {
+  whiteboardContent.style.color = textColor.value;
+}
+
+function updateZoom() {
+  const scale = Number(zoomSlider.value) / 100;
+  whiteboard.style.transform = `scale(${scale})`;
+  zoomValue.textContent = `${zoomSlider.value}%`;
+}
+
+function updateShareUrl() {
+  if (!shareUrl) return;
+
+  const isFileProtocol = window.location.protocol === "file:";
+
+  if (isFileProtocol) {
+    shareUrl.textContent = "請先透過本機伺服器提供網址 (例如 http://192.168.x.x:8000)";
+    if (copyUrlBtn) {
+      copyUrlBtn.disabled = true;
+      copyUrlBtn.textContent = "無法複製";
+      copyUrlBtn.classList.add("button-disabled");
+    }
+    return;
+  }
+
+  const url = window.location.href;
+  shareUrl.textContent = url;
+  shareUrl.dataset.url = url;
+
+  if (!copyUrlBtn) return;
+
+  if (navigator.clipboard) {
+    copyUrlBtn.disabled = false;
+    copyUrlBtn.textContent = "複製網址";
+    copyUrlBtn.classList.remove("button-disabled");
+  } else {
+    copyUrlBtn.disabled = true;
+    copyUrlBtn.textContent = "裝置不支援複製";
+    copyUrlBtn.classList.add("button-disabled");
+  }
+}
+
+async function copyShareUrl() {
+  if (!shareUrl?.dataset.url || !navigator.clipboard || !copyUrlBtn) return;
+
+  try {
+    await navigator.clipboard.writeText(shareUrl.dataset.url);
+    copyUrlBtn.textContent = "已複製";
+    copyUrlBtn.classList.add("button-success");
+    setTimeout(() => {
+      copyUrlBtn.textContent = "複製網址";
+      copyUrlBtn.classList.remove("button-success");
+    }, 1500);
+  } catch (error) {
+    console.error("複製網址失敗", error);
+    copyUrlBtn.textContent = "複製失敗";
+    copyUrlBtn.classList.add("button-error");
+    setTimeout(() => {
+      copyUrlBtn.textContent = "複製網址";
+      copyUrlBtn.classList.remove("button-error");
+    }, 1500);
+  }
+}
+
+async function startCamera() {
+  if (!navigator.mediaDevices?.getUserMedia) {
+    alert("此裝置或瀏覽器不支援相機功能。");
+    return;
+  }
+
+  try {
+    mediaStream = await navigator.mediaDevices.getUserMedia({
+      video: {
+        facingMode: "environment",
+      },
+      audio: false,
+    });
+
+    video.srcObject = mediaStream;
+    startCameraBtn.disabled = true;
+    captureBtn.disabled = false;
+  } catch (error) {
+    console.error("無法啟動相機", error);
+    alert("啟動相機時發生問題，請確認權限或重新整理頁面。");
+    captureBtn.disabled = true;
+  }
+}
+
+function capturePhoto() {
+  if (!mediaStream) {
+    alert("請先啟動相機");
+    return;
+  }
+
+  const settings = mediaStream.getVideoTracks()[0]?.getSettings();
+  const width = settings?.width || video.videoWidth || 640;
+  const height = settings?.height || video.videoHeight || 480;
+
+  canvas.width = width;
+  canvas.height = height;
+
+  const context = canvas.getContext("2d");
+  context.drawImage(video, 0, 0, width, height);
+
+  photoPreview.src = canvas.toDataURL("image/png");
+  photoPreview.style.display = "block";
+}
+
+setTodayDate();
+updateWhiteboardContent();
+updateBoardColor();
+updateTextColor();
+updateZoom();
+updateShareUrl();
+
+boardInput.addEventListener("input", updateWhiteboardContent);
+boardColor.addEventListener("input", updateBoardColor);
+textColor.addEventListener("input", updateTextColor);
+zoomSlider.addEventListener("input", updateZoom);
+startCameraBtn.addEventListener("click", startCamera);
+captureBtn.addEventListener("click", capturePhoto);
+copyUrlBtn?.addEventListener("click", copyShareUrl);
+window.addEventListener("focus", updateShareUrl);
+window.addEventListener("beforeunload", () => {
+  mediaStream?.getTracks().forEach((track) => track.stop());
+});
 
EOF
)
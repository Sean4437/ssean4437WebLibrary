 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/script.js b/script.js
new file mode 100644
index 0000000000000000000000000000000000000000..afb6a21e1fe1fe0c6f0c205261f369059cd3cc51
--- /dev/null
+++ b/script.js
@@ -0,0 +1,165 @@
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
+function setTodayDate() {
+  if (!dateInput) return;
+  const now = new Date();
+  const yyyy = now.getFullYear();
+  const mm = String(now.getMonth() + 1).padStart(2, "0");
+  const dd = String(now.getDate()).padStart(2, "0");
+  dateInput.value = `${yyyy}-${mm}-${dd}`;
+}
+
+function syncWhiteboardText() {
+  whiteboardContent.textContent = boardInput.value;
+}
+
+function syncBoardColor() {
+  whiteboard.style.backgroundColor = boardColor.value;
+}
+
+function syncTextColor() {
+  whiteboardContent.style.color = textColor.value;
+}
+
+function syncZoom() {
+  const scale = Number(zoomSlider.value) / 100;
+  whiteboard.style.setProperty("--zoom", scale.toString());
+  zoomValue.textContent = `${zoomSlider.value}%`;
+}
+
+function updateShareUrl() {
+  if (!shareUrl) return;
+  const { protocol, href } = window.location;
+
+  if (protocol === "file:") {
+    shareUrl.textContent = "請透過本機伺服器提供網址，例如 http://192.168.x.x:8000";
+    copyUrlBtn?.classList.add("button-disabled");
+    if (copyUrlBtn) {
+      copyUrlBtn.disabled = true;
+      copyUrlBtn.textContent = "無法複製";
+    }
+    return;
+  }
+
+  shareUrl.textContent = href;
+  shareUrl.dataset.url = href;
+
+  if (!copyUrlBtn) return;
+
+  if (navigator.clipboard) {
+    copyUrlBtn.disabled = false;
+    copyUrlBtn.textContent = "複製網址";
+    copyUrlBtn.classList.remove("button-disabled", "button-error", "button-success");
+  } else {
+    copyUrlBtn.disabled = true;
+    copyUrlBtn.textContent = "裝置不支援複製";
+    copyUrlBtn.classList.add("button-disabled");
+  }
+}
+
+async function copyShareUrl() {
+  if (!shareUrl?.dataset.url || !navigator.clipboard || !copyUrlBtn) return;
+  try {
+    await navigator.clipboard.writeText(shareUrl.dataset.url);
+    copyUrlBtn.textContent = "已複製";
+    copyUrlBtn.classList.remove("button-error");
+    copyUrlBtn.classList.add("button-success");
+    setTimeout(() => {
+      copyUrlBtn.textContent = "複製網址";
+      copyUrlBtn.classList.remove("button-success");
+    }, 1600);
+  } catch (error) {
+    console.error("複製網址失敗", error);
+    copyUrlBtn.textContent = "複製失敗";
+    copyUrlBtn.classList.remove("button-success");
+    copyUrlBtn.classList.add("button-error");
+    setTimeout(() => {
+      copyUrlBtn.textContent = "複製網址";
+      copyUrlBtn.classList.remove("button-error");
+    }, 1600);
+  }
+}
+
+async function startCamera() {
+  if (!navigator.mediaDevices?.getUserMedia) {
+    alert("此裝置或瀏覽器不支援相機功能");
+    return;
+  }
+
+  try {
+    mediaStream = await navigator.mediaDevices.getUserMedia({
+      video: { facingMode: "environment" },
+      audio: false,
+    });
+
+    video.srcObject = mediaStream;
+    video.setAttribute("autoplay", "true");
+    video.setAttribute("playsinline", "true");
+
+    startCameraBtn.disabled = true;
+    captureBtn.disabled = false;
+  } catch (error) {
+    console.error("無法啟動相機", error);
+    alert("啟動相機失敗，請確認權限或重新整理頁面");
+  }
+}
+
+function capturePhoto() {
+  if (!mediaStream) {
+    alert("請先啟動相機");
+    return;
+  }
+
+  const track = mediaStream.getVideoTracks()[0];
+  const settings = track?.getSettings();
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
+  photoPreview.focus?.();
+}
+
+function cleanUpStream() {
+  mediaStream?.getTracks().forEach((track) => track.stop());
+}
+
+setTodayDate();
+syncWhiteboardText();
+syncBoardColor();
+syncTextColor();
+syncZoom();
+updateShareUrl();
+
+boardInput.addEventListener("input", syncWhiteboardText);
+boardColor.addEventListener("input", syncBoardColor);
+textColor.addEventListener("input", syncTextColor);
+zoomSlider.addEventListener("input", syncZoom);
+startCameraBtn.addEventListener("click", startCamera);
+captureBtn.addEventListener("click", capturePhoto);
+copyUrlBtn?.addEventListener("click", copyShareUrl);
+
+window.addEventListener("focus", updateShareUrl);
+window.addEventListener("beforeunload", cleanUpStream);
 
EOF
)
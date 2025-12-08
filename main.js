const takePhotoBtn = document.getElementById("takePhotoBtn");
      const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
      const takePhotoInput = document.getElementById("takePhotoInput");
      const uploadInput = document.getElementById("uploadInput");
      const photoLayer = document.getElementById("photoLayer");
      const photoImage = document.getElementById("photoImage");
      const placeholder = document.getElementById("placeholder");
      const whiteboardWrapper = document.getElementById("whiteboardWrapper");
      const whiteboard = document.getElementById("whiteboard");
      const captureArea = document.getElementById("captureArea");
      const boardScaleInput = document.getElementById("boardScale");
      const boardScaleValue = document.getElementById("boardScaleValue");
      const boardWidthInput = document.getElementById("boardWidth");
      const boardWidthValue = document.getElementById("boardWidthValue");
      const fontScaleInput = document.getElementById("fontScale");
      const fontScaleValue = document.getElementById("fontScaleValue");
      const boardRotationInput = document.getElementById("boardRotation");
      const boardRotationValue = document.getElementById("boardRotationValue");
      const boardColorInput = document.getElementById("boardColor");
      const boardOpacityInput = document.getElementById("boardOpacity");
      const boardOpacityValue = document.getElementById("boardOpacityValue");
      const textColorInput = document.getElementById("textColor");
      const lineColorInput = document.getElementById("lineColor");
      const coordinateFormatButton = document.getElementById("coordinateFormatButton");
      const coordinateFormatText = document.getElementById("coordinateFormatText");
      const displayCoordinateLatLon = document.getElementById("displayCoordinateLatLon");
      const displayCoordinateTwd = document.getElementById("displayCoordinateTwd");
      const exportSizeButtons = document.querySelectorAll("[data-export-size]");
      const downloadCoordinateHistoryBtn = document.getElementById("downloadCoordinateHistory");
      const clearCoordinateHistoryBtn = document.getElementById("clearCoordinateHistory");
      const boardVisibilityButton = document.getElementById("toggleBoardButton");
      const boardVisibilityLabel = document.getElementById("boardVisibilityLabel");
      const colorPresetButtons = document.querySelectorAll("[data-color-preset]");
      const clearBoardBtn = document.getElementById("clearBoardBtn");
      const exportBtn = document.getElementById("exportBtn");
      const toastMessage = document.getElementById("toastMessage");
      const photoWatermark = document.getElementById("photoWatermark");
      const photoCoordinate = document.getElementById("photoCoordinate");
      whiteboardWrapper.dataset.userPositioned = "false";
      const advancedControls = document.getElementById("advancedControls");
      const toggleAdvanced = document.getElementById("toggleAdvanced");

      const isMobileDevice = /android|iphone|ipad|ipod|mobile/i.test(
        (navigator.userAgent || "").toLowerCase()
      );
      const GEOLOCATION_TIMEOUT_MS = 15000;
      let lastPhotoMetadata = null;
      let lastPhotoExifBytes = null;
      let pendingCaptureCoordinatesPromise = null;

      const layoutIdentifier =
        document.body.dataset.layoutId ||
        (window.location.pathname.match(/layout(\d+)/)?.[1] && `layout${window.location.pathname.match(/layout(\d+)/)[1]}`) ||
        "layout";
      const buildStorageKey = (base) => `${base}_${layoutIdentifier}`;
      const FIELD_HISTORY_STORAGE_KEY = buildStorageKey("whiteboard_field_history");
      const FIELD_HISTORY_LIMIT = 20;
      const WHITEBOARD_VISIBILITY_STORAGE_KEY = buildStorageKey("whiteboard_visibility");
      const EXPORT_SIZE_STORAGE_KEY = buildStorageKey("whiteboard_export_size");
      const COORDINATE_HISTORY_STORAGE_KEY = buildStorageKey("whiteboard_coordinate_history");
      const COORDINATE_FORMAT_STORAGE_KEY = buildStorageKey("whiteboard_coordinate_format");
      const COORDINATE_FORMATS = {
        WGS84: "wgs84",
        TWD97: "twd97",
      };
      let coordinateFormat = COORDINATE_FORMATS.TWD97;
      const EXPORT_SIZE_SCALE = {
        small: 0.8,
        medium: 1,
        large: 1.5,
      };
      let exportSize = "large";
      let coordinateHistory = [];

      const formInputs = {
        projectName: document.getElementById("inputProjectName"),
        inspectionLocation: document.getElementById("inputInspectionLocation"),
        testResult: document.getElementById("inputTestResult"),
        testDate: document.getElementById("inputTestDate"),
        inspector: document.getElementById("inputInspector"),
      };

      const displayTargets = {
        projectName: document.getElementById("displayProjectName"),
        inspectionLocation: document.getElementById("displayInspectionLocation"),
        testResult: document.getElementById("displayTestResult"),
        testDate: document.getElementById("displayTestDate"),
        inspector: document.getElementById("displayInspector"),
      };
      const historyDropdowns = {
        projectName: document.getElementById("projectNameHistoryDropdown"),
        inspectionLocation: document.getElementById("inspectionLocationHistoryDropdown"),
        inspector: document.getElementById("inspectorHistoryDropdown"),
        testResult: document.getElementById("testResultHistoryDropdown"),
      };

      const formatWatermarkDate = (value) => {
        if (!value) return "日期未設定";
        const [year, month, day] = value.split("-");
        if (!year || !month || !day) return value;
        return `${year}/${month}/${day}`;
      };

      const updateWatermarkDate = () => {
        if (!photoWatermark) return;
        photoWatermark.textContent = formatWatermarkDate(formInputs.testDate.value);
      };

      const formatDecimalCoordinates = (latitude, longitude) => {
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
        return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      };

      const degToRad = (value) => (value * Math.PI) / 180;

      const convertToTwd97 = (latitude, longitude) => {
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
        try {
          const a = 6378137.0;
          const f = 1 / 298.257222101;
          const b = a * (1 - f);
          const e2 = (a * a - b * b) / (a * a);
          const ePrime2 = (a * a - b * b) / (b * b);
          const k0 = 0.9999;
          const lon0 = degToRad(121);
          const x0 = 250000;
          const y0 = 0;
          const latRad = degToRad(latitude);
          const lonRad = degToRad(longitude);
          const sinLat = Math.sin(latRad);
          const cosLat = Math.cos(latRad);
          const tanLat = Math.tan(latRad);
          const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
          const T = tanLat * tanLat;
          const C = ePrime2 * cosLat * cosLat;
          const A = (lonRad - lon0) * cosLat;
          const e4 = e2 * e2;
          const e6 = e4 * e2;
          const M =
            a *
            ((1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * latRad -
              ((3 * e2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) * Math.sin(2 * latRad) +
              ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * latRad) -
              ((35 * e6) / 3072) * Math.sin(6 * latRad));

          const x =
            x0 +
            k0 *
              N *
              (A +
                ((1 - T + C) * Math.pow(A, 3)) / 6 +
                ((5 - 18 * T + T * T + 72 * C - 58 * ePrime2) * Math.pow(A, 5)) / 120);

          const y =
            y0 +
            k0 *
              (M +
                N *
                  tanLat *
                  (Math.pow(A, 2) / 2 +
                    ((5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4)) / 24 +
                    ((61 - 58 * T + T * T + 600 * C - 330 * ePrime2) * Math.pow(A, 6)) / 720));
          return [x, y];
        } catch (error) {
          console.warn("TWD97 轉換失敗", error);
          return null;
        }
      };

      const formatTwdText = (x, y) => {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        return `X:${Math.round(x)} Y:${Math.round(y)}`;
      };

      const updateBoardVisibilityButton = (visible) => {
        if (!boardVisibilityButton || !boardVisibilityLabel) return;
        boardVisibilityButton.dataset.boardVisible = String(visible);
        boardVisibilityButton.setAttribute("aria-pressed", visible ? "true" : "false");
        boardVisibilityLabel.textContent = visible ? "白板開" : "白板關";
      };

      const setWhiteboardVisibility = (visible) => {
        if (!whiteboardWrapper) return;
        whiteboardWrapper.hidden = !visible;
        updateBoardVisibilityButton(visible);
        try {
          localStorage.setItem(WHITEBOARD_VISIBILITY_STORAGE_KEY, String(Boolean(visible)));
        } catch (error) {
          console.warn("儲存白板可見狀態失敗", error);
        }
      };

      const updateCoordinateFormatButton = () => {
        if (!coordinateFormatButton) return;
        const label = coordinateFormat === COORDINATE_FORMATS.TWD97 ? "TWD97" : "經緯";
        const description = coordinateFormat === COORDINATE_FORMATS.TWD97 ? "X / Y" : "Lat / Lng";
        coordinateFormatButton.setAttribute("aria-label", `座標顯示：${label} (${description})`);
        if (coordinateFormatText) {
          coordinateFormatText.textContent = label;
        }
      };

      const updateExportSizeButtons = () => {
        exportSizeButtons.forEach((button) => {
          const isActive = button.dataset.exportSize === exportSize;
          button.classList.toggle("is-active", isActive);
          button.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
      };

      const setExportSize = (size) => {
        if (!EXPORT_SIZE_SCALE[size]) return;
        exportSize = size;
        updateExportSizeButtons();
        try {
          localStorage.setItem(EXPORT_SIZE_STORAGE_KEY, size);
        } catch (error) {
          console.warn("儲存輸出尺寸失敗", error);
        }
      };

      const loadCoordinateHistory = () => {
        try {
          const raw = localStorage.getItem(COORDINATE_HISTORY_STORAGE_KEY);
          if (!raw) return [];
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          console.warn("讀取座標紀錄失敗", error);
          return [];
        }
      };

      const saveCoordinateHistory = () => {
        try {
          localStorage.setItem(COORDINATE_HISTORY_STORAGE_KEY, JSON.stringify(coordinateHistory));
        } catch (error) {
          console.warn("儲存座標紀錄失敗", error);
        }
      };

      const recordCoordinateHistory = () => {
        const gps = lastPhotoMetadata?.gps;
        if (!gps || typeof gps.latitude !== "number" || typeof gps.longitude !== "number") return;
        const twd = convertToTwd97(gps.latitude, gps.longitude);
        const record = {
          timestamp: new Date().toISOString(),
          latitude: Number(gps.latitude.toFixed(6)),
          longitude: Number(gps.longitude.toFixed(6)),
        };
        if (twd) {
          record.twdX = Math.round(twd[0]);
          record.twdY = Math.round(twd[1]);
        }
        coordinateHistory.push(record);
        saveCoordinateHistory();
      };

      const clearCoordinateHistory = () => {
        coordinateHistory = [];
        saveCoordinateHistory();
        showToast("座標紀錄已清除。", "success");
      };

      const downloadCoordinateHistory = () => {
        if (!coordinateHistory.length) {
          showToast("目前沒有座標紀錄。");
          return;
        }
        const rows = [
          ["timestamp", "latitude", "longitude", "twdX", "twdY"].join(","),
          ...coordinateHistory.map((item) =>
            [
              item.timestamp,
              item.latitude ?? "",
              item.longitude ?? "",
              item.twdX ?? "",
              item.twdY ?? "",
            ].join(",")
          ),
        ];
        const csv = rows.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `coordinate_history_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 0);
      };

      const resolveCoordinateText = () => {
        const gps = lastPhotoMetadata?.gps;
        if (!gps || typeof gps.latitude !== "number" || typeof gps.longitude !== "number") {
          return null;
        }
        if (coordinateFormat === COORDINATE_FORMATS.TWD97) {
          const twd = convertToTwd97(gps.latitude, gps.longitude);
          const twdText = twd ? formatTwdText(twd[0], twd[1]) : null;
          if (twdText) return twdText;
        }
        return formatDecimalCoordinates(gps.latitude, gps.longitude);
      };

      const updateCoordinateOverlay = () => {
        if (!photoCoordinate) return;
        const text = resolveCoordinateText();
        if (!text) {
          photoCoordinate.hidden = true;
          photoCoordinate.textContent = "";
          updateBoardCoordinateFields();
          return;
        }
        photoCoordinate.hidden = false;
        photoCoordinate.textContent = text;
        updateBoardCoordinateFields();
      };

      const setCoordinateFormat = (value) => {
        if (!Object.values(COORDINATE_FORMATS).includes(value)) return;
        coordinateFormat = value;
        try {
          localStorage.setItem(COORDINATE_FORMAT_STORAGE_KEY, value);
        } catch (error) {
          console.warn("儲存座標格式失敗", error);
        }
        updateCoordinateFormatButton();
        updateCoordinateOverlay();
      };

      const updateBoardCoordinateFields = () => {
        const gps =
          lastPhotoMetadata &&
          typeof lastPhotoMetadata.gps?.latitude === "number" &&
          !Number.isNaN(lastPhotoMetadata.gps.latitude) &&
          typeof lastPhotoMetadata.gps.longitude === "number" &&
          !Number.isNaN(lastPhotoMetadata.gps.longitude)
            ? lastPhotoMetadata.gps
            : null;
        if (displayCoordinateLatLon) {
          displayCoordinateLatLon.textContent = gps
            ? formatDecimalCoordinates(gps.latitude, gps.longitude)
            : "—";
        }
        if (displayCoordinateTwd) {
          if (!gps) {
            displayCoordinateTwd.textContent = "X：— Y：—";
          } else {
            const twd = convertToTwd97(gps.latitude, gps.longitude);
            displayCoordinateTwd.textContent = twd
              ? `X：${Math.round(twd[0])}　Y：${Math.round(twd[1])}`
              : "X：— Y：—";
          }
        }
      };

      const decimalToDmsRational = (value) => {
        const abs = Math.abs(value);
        const degrees = Math.floor(abs);
        const minutesFloat = (abs - degrees) * 60;
        const minutes = Math.floor(minutesFloat);
        const seconds = (minutesFloat - minutes) * 60;
        const toRational = (num) => [Math.round(num * 100), 100];
        return [
          [degrees, 1],
          [minutes, 1],
          toRational(seconds),
        ];
      };

      const toExifDateTime = (dateStr) =>
        `${dateStr.replace(/-/g, ":")} 00:00:00`;

      const applyExifToDataUrl = (dataUrl) => {
        if (!window.piexif) return dataUrl;
        try {
          if (lastPhotoExifBytes) {
            return piexif.insert(lastPhotoExifBytes, dataUrl);
          }
          if (!lastPhotoMetadata) return dataUrl;
          const zeroth = {};
          const exif = {};
          const gps = {};
          if (lastPhotoMetadata.date) {
            const dateTime = toExifDateTime(lastPhotoMetadata.date);
            zeroth[piexif.ImageIFD.DateTime] = dateTime;
            exif[piexif.ExifIFD.DateTimeOriginal] = dateTime;
            exif[piexif.ExifIFD.CreateDate] = dateTime;
          }
          if (lastPhotoMetadata.gps) {
            const { latitude, longitude } = lastPhotoMetadata.gps;
            if (
              typeof latitude === "number" &&
              !Number.isNaN(latitude) &&
              typeof longitude === "number" &&
              !Number.isNaN(longitude)
            ) {
              gps[piexif.GPSIFD.GPSLatitudeRef] = latitude >= 0 ? "N" : "S";
              gps[piexif.GPSIFD.GPSLatitude] = decimalToDmsRational(latitude);
              gps[piexif.GPSIFD.GPSLongitudeRef] = longitude >= 0 ? "E" : "W";
              gps[piexif.GPSIFD.GPSLongitude] = decimalToDmsRational(longitude);
            }
          }
          if (!Object.keys(zeroth).length && !Object.keys(exif).length && !Object.keys(gps).length) {
            return dataUrl;
          }
          const exifBytes = piexif.dump({
            "0th": zeroth,
            Exif: exif,
            GPS: gps,
          });
          return piexif.insert(exifBytes, dataUrl);
        } catch (error) {
          console.warn("EXIF 寫入失敗", error);
          return dataUrl;
        }
      };

      const dataUrlToBlob = (dataUrl) => {
        const [header, data] = dataUrl.split(",");
        const mimeMatch = header.match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
        const binary = atob(data);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          array[i] = binary.charCodeAt(i);
        }
        return new Blob([array], { type: mime });
      };

      const readFieldHistoryStore = () => {
        try {
          const raw = localStorage.getItem(FIELD_HISTORY_STORAGE_KEY);
          const parsed = raw ? JSON.parse(raw) : {};
          return typeof parsed === "object" && parsed ? parsed : {};
        } catch (error) {
          console.warn("讀取歷史資料失敗", error);
          return {};
        }
      };

      let fieldHistory = readFieldHistoryStore();

      const writeFieldHistoryStore = () => {
        try {
          localStorage.setItem(FIELD_HISTORY_STORAGE_KEY, JSON.stringify(fieldHistory));
        } catch (error) {
          console.warn("儲存歷史資料失敗", error);
        }
      };

      const getFieldHistory = (field) => {
        const list = fieldHistory[field];
        return Array.isArray(list) ? list : [];
      };

      const saveFieldHistory = (field, value) => {
        const trimmed = (value || "").trim();
        if (!trimmed) return;
        const current = getFieldHistory(field).filter((item) => item !== trimmed);
        current.unshift(trimmed);
        fieldHistory[field] = current.slice(0, FIELD_HISTORY_LIMIT);
        writeFieldHistoryStore();
        updateDropdownContent(field);
      };
      const renderHistoryDropdown = (field) => {
        const dropdown = historyDropdowns[field];
        if (!dropdown) return false;
        dropdown.innerHTML = "";
        const history = getFieldHistory(field);
        if (!history.length) return false;
        history.forEach((item) => {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = item;
          button.addEventListener("mousedown", (event) => {
            event.preventDefault();
            const targetInput = formInputs[field];
            if (!targetInput) return;
            targetInput.value = item;
            if (field === "testResult") {
              autoResizeTextarea(targetInput);
            }
            syncField(field);
            hideFieldHistory(field);
          });
          dropdown.appendChild(button);
        });
        return true;
      };

      const updateDropdownContent = (field) => {
        const dropdown = historyDropdowns[field];
        if (!dropdown) return;
        const wasVisible = dropdown.classList.contains("is-visible");
        const hasItems = renderHistoryDropdown(field);
        if (wasVisible && hasItems) {
          dropdown.classList.add("is-visible");
        } else if (!hasItems) {
          dropdown.classList.remove("is-visible");
        }
      };

      const refreshAllFieldHistoryUI = () => {
        Object.keys(historyDropdowns).forEach((field) => {
          renderHistoryDropdown(field);
          hideFieldHistory(field);
        });
      };

      const historyDropdownHideTimers = {};

      const showFieldHistory = (field) => {
        const dropdown = historyDropdowns[field];
        if (!dropdown) return;
        clearTimeout(historyDropdownHideTimers[field]);
        const hasItems = renderHistoryDropdown(field);
        if (hasItems) {
          dropdown.classList.add("is-visible");
        }
      };

      const hideFieldHistory = (field) => {
        const dropdown = historyDropdowns[field];
        if (!dropdown) return;
        dropdown.classList.remove("is-visible");
      };

      const scheduleHideFieldHistory = (field) => {
        clearTimeout(historyDropdownHideTimers[field]);
        historyDropdownHideTimers[field] = setTimeout(
          () => hideFieldHistory(field),
          120
        );
      };

      const formatDateInputValue = (date) => {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${date.getFullYear()}-${month}-${day}`;
      };

      const readFileAsDataURL = (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("failed to load file"));
          reader.readAsDataURL(file);
        });

      const requestCaptureCoordinates = () => {
        if (!navigator.geolocation) {
          pendingCaptureCoordinatesPromise = Promise.resolve(null);
          return pendingCaptureCoordinatesPromise;
        }
        pendingCaptureCoordinatesPromise = new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords || {};
              if (
                typeof latitude === "number" &&
                !Number.isNaN(latitude) &&
                typeof longitude === "number" &&
                !Number.isNaN(longitude)
              ) {
                resolve({ latitude, longitude });
              } else {
                resolve(null);
              }
            },
            (error) => {
              console.warn("定位失敗，無法寫入座標。", error);
              resolve(null);
            },
            { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 0 }
          );
        });
        return pendingCaptureCoordinatesPromise;
      };

      const consumePendingCaptureCoordinates = async () => {
        if (!pendingCaptureCoordinatesPromise) return null;
        try {
          return await pendingCaptureCoordinatesPromise;
        } catch (error) {
          console.warn("讀取定位資訊失敗", error);
          return null;
        } finally {
          pendingCaptureCoordinatesPromise = null;
        }
      };

      const asciiFromView = (view, start, length) => {
        let chars = "";
        for (let i = 0; i < length && start + i < view.byteLength; i += 1) {
          const code = view.getUint8(start + i);
          if (!code) break;
          chars += String.fromCharCode(code);
        }
        return chars.trim();
      };

      const normalizeExifDate = (value) => {
        if (!value) return null;
        const match = value.match(/^(\d{4}):?(\d{2}):?(\d{2})/);
        if (!match) return null;
        const [, year, month, day] = match;
        return `${year}-${month}-${day}`;
      };

      const TYPE_SIZES = {
        1: 1,
        2: 1,
        3: 2,
        4: 4,
        5: 8,
        7: 1,
      };

      const EXIF_DATE_TAGS = new Set([0x0132, 0x9003, 0x9004]);

      const GPS_TAGS = {
        LAT_REF: 0x0001,
        LAT: 0x0002,
        LON_REF: 0x0003,
        LON: 0x0004,
      };

      const readRationalArray = (view, offset, little, count) => {
        const result = [];
        for (let i = 0; i < count; i += 1) {
          const numerator = view.getUint32(offset + i * 8, little);
          const denominator = view.getUint32(offset + i * 8 + 4, little) || 1;
          result.push(numerator / denominator);
        }
        return result;
      };

      const convertGpsValuesToDecimal = (values, ref) => {
        if (!values || values.length < 3) return null;
        const decimal = values[0] + values[1] / 60 + values[2] / 3600;
        if (!ref) return decimal;
        const normalizedRef = ref.trim().toUpperCase();
        if (normalizedRef === "S" || normalizedRef === "W") {
          return -decimal;
        }
        return decimal;
      };

      const parseGpsIfd = (view, offset, base, little) => {
        if (offset <= 0 || offset + 2 > view.byteLength) return null;
        const entryCount = view.getUint16(offset, little);
        let latRef = null;
        let lonRef = null;
        let latValues = null;
        let lonValues = null;
        for (let i = 0; i < entryCount; i += 1) {
          const entryOffset = offset + 2 + i * 12;
          if (entryOffset + 12 > view.byteLength) break;
          const tag = view.getUint16(entryOffset, little);
          const type = view.getUint16(entryOffset + 2, little);
          const count = view.getUint32(entryOffset + 4, little);
          const valueSize = (TYPE_SIZES[type] || 0) * count;
          const rawValueOffset = entryOffset + 8;
          let valueOffset = rawValueOffset;
          if (valueSize > 4) {
            valueOffset = base + view.getUint32(rawValueOffset, little);
          }
          if (tag === GPS_TAGS.LAT_REF && type === 2) {
            latRef = asciiFromView(view, valueOffset, Math.min(count, 2));
          } else if (tag === GPS_TAGS.LON_REF && type === 2) {
            lonRef = asciiFromView(view, valueOffset, Math.min(count, 2));
          } else if (tag === GPS_TAGS.LAT && type === 5 && count >= 3) {
            latValues = readRationalArray(view, valueOffset, little, 3);
          } else if (tag === GPS_TAGS.LON && type === 5 && count >= 3) {
            lonValues = readRationalArray(view, valueOffset, little, 3);
          }
        }
        if (!latValues || !lonValues) return null;
        const latitude = convertGpsValuesToDecimal(latValues, latRef);
        const longitude = convertGpsValuesToDecimal(lonValues, lonRef);
        if (
          typeof latitude !== "number" ||
          Number.isNaN(latitude) ||
          typeof longitude !== "number" ||
          Number.isNaN(longitude)
        ) {
          return null;
        }
        return { latitude, longitude };
      };

      const parseIfdForMetadata = (view, offset, base, little, metadata = {}) => {
        if (offset <= 0 || offset + 2 > view.byteLength) return metadata;
        const entryCount = view.getUint16(offset, little);
        for (let i = 0; i < entryCount; i += 1) {
          const entryOffset = offset + 2 + i * 12;
          if (entryOffset + 12 > view.byteLength) break;
          const tag = view.getUint16(entryOffset, little);
          const type = view.getUint16(entryOffset + 2, little);
          const count = view.getUint32(entryOffset + 4, little);
          const valueSize = (TYPE_SIZES[type] || 0) * count;
          const rawValueOffset = entryOffset + 8;
          let valueOffset = rawValueOffset;
          if (valueSize > 4) {
            valueOffset = base + view.getUint32(rawValueOffset, little);
          }
          if (tag === 0x8769) {
            const pointer = base + view.getUint32(rawValueOffset, little);
            parseIfdForMetadata(view, pointer, base, little, metadata);
            continue;
          }
          if (tag === 0x8825) {
            const pointer = base + view.getUint32(rawValueOffset, little);
            const gps = parseGpsIfd(view, pointer, base, little);
            if (gps) {
              metadata.gps = gps;
            }
            continue;
          }
          if (tag === 0x0112 && type === 3 && count >= 1) {
            const orientation =
              valueSize > 2
                ? view.getUint16(valueOffset, little)
                : view.getUint16(rawValueOffset, little);
            if (orientation) {
              metadata.orientation = orientation;
            }
            continue;
          }
          if (EXIF_DATE_TAGS.has(tag) && type === 2 && count > 0) {
            const raw = asciiFromView(view, valueOffset, count);
            const normalized = normalizeExifDate(raw);
            if (normalized) {
              if (tag === 0x9003) {
                metadata.primaryDate = normalized;
              } else if (!metadata.fallbackDate) {
                metadata.fallbackDate = normalized;
              }
            }
          }
        }
        return metadata;
      };

      const readExifMetadataFromBuffer = (buffer) => {
        const view = new DataView(buffer);
        if (view.byteLength < 12 || view.getUint16(0, false) !== 0xffd8) return {};
        let offset = 2;
        while (offset + 4 < view.byteLength) {
          if (view.getUint8(offset) !== 0xff) break;
          const marker = view.getUint8(offset + 1);
          const length = view.getUint16(offset + 2, false);
          if (marker === 0xe1) {
            const segmentStart = offset + 4;
            const identifier = asciiFromView(view, segmentStart, 4);
            if (identifier !== "Exif") {
              offset += 2 + length;
              continue;
            }
            const tiffStart = segmentStart + 6;
            if (tiffStart + 8 > view.byteLength) break;
            const little = view.getUint16(tiffStart, false) === 0x4949;
            const firstIfdOffset = view.getUint32(tiffStart + 4, little);
            const metadata = parseIfdForMetadata(
              view,
              tiffStart + firstIfdOffset,
              tiffStart,
              little,
              {}
            );
            return {
              date: metadata.primaryDate || metadata.fallbackDate || null,
              gps: metadata.gps || null,
              orientation: metadata.orientation || null,
            };
          }
          offset += 2 + length;
        }
        return {};
      };

      const extractExifMetadata = async (file) => {
        if (!file || !/image\/jpe?g/i.test(file.type || "")) return {};
        try {
          const buffer = await file.arrayBuffer();
          return readExifMetadataFromBuffer(buffer) || {};
        } catch (error) {
          console.warn("EXIF 解析失敗", error);
          return {};
        }
      };

      const applyPhotoMetadata = async (file, dataUrl, extraGps) => {
        if (!file) return;
        let metadata = {};
        try {
          metadata = await extractExifMetadata(file);
        } catch (error) {
          console.warn("讀取 EXIF 資料失敗", error);
        }
        lastPhotoMetadata =
          metadata && (metadata.date || metadata.gps || metadata.orientation)
            ? { ...metadata }
            : null;
        if (extraGps && typeof extraGps.latitude === "number" && typeof extraGps.longitude === "number") {
          lastPhotoMetadata = lastPhotoMetadata || {};
          lastPhotoMetadata.gps = {
            latitude: extraGps.latitude,
            longitude: extraGps.longitude,
          };
        }
        if (window.piexif && dataUrl) {
          try {
            const exifObj = piexif.load(dataUrl);
            if (exifObj["0th"]) {
              delete exifObj["0th"][piexif.ImageIFD.Orientation];
            }
            lastPhotoExifBytes = extraGps ? null : piexif.dump(exifObj);
          } catch (error) {
            console.warn("EXIF 載入失敗", error);
            lastPhotoExifBytes = null;
          }
        } else {
          lastPhotoExifBytes = null;
        }
        if (lastPhotoMetadata?.orientation) {
          delete lastPhotoMetadata.orientation;
        }
        const exifDate = metadata.date;
        const usedExif = Boolean(exifDate);
        let resolvedDate = exifDate;
        if (!resolvedDate) {
          resolvedDate =
            file.lastModified && Number.isFinite(file.lastModified)
              ? formatDateInputValue(new Date(file.lastModified))
              : formatDateInputValue(new Date());
        }

        formInputs.testDate.value = resolvedDate;
        syncField("testDate");
        showToast(
          usedExif
            ? "已套用照片拍攝日期，如需修改可手動調整。"
            : "已套用拍攝日期，如需修改可手動調整。",
          "success"
        );
        updateCoordinateOverlay();
        recordCoordinateHistory();
      };

      const autoResizeTextarea = (textarea) => {
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 600)}px`;
      };

      const showToast = (message, variant = "info") => {
        toastMessage.textContent = message;
        toastMessage.dataset.variant = variant;
        toastMessage.classList.add("visible");
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(
          () => toastMessage.classList.remove("visible"),
          4500
        );
      };

      const updateStageAspect = () => {
        if (photoImage.hidden || !photoImage.naturalWidth) {
          captureArea.style.setProperty("--stage-aspect", "56.25%");
          requestAnimationFrame(positionBoardAtBottomLeft);
          return;
        }
        const ratio = (photoImage.naturalHeight / photoImage.naturalWidth) * 100;
        captureArea.style.setProperty("--stage-aspect", `${ratio}%`);
        requestAnimationFrame(positionBoardAtBottomLeft);
      };

      const handlePhotoFiles = async (files) => {
        const [file] = files || [];
        if (!file) return;
        let dataUrl = null;
        try {
          dataUrl = await readFileAsDataURL(file);
          photoImage.src = dataUrl;
          photoImage.hidden = false;
          placeholder.style.display = "none";
          updateStageAspect();
          whiteboardWrapper.dataset.userPositioned = "false";
          requestAnimationFrame(positionBoardAtBottomLeft);
        } catch (error) {
          showToast("照片載入失敗，請重新選擇。");
          return;
        }
        const captureCoordinates = await consumePendingCaptureCoordinates();
        await applyPhotoMetadata(file, dataUrl, captureCoordinates);
      };

      const applyColorPreset = (button) => {
        if (!button?.dataset) return;
        const { boardColor, textColor, lineColor, boardOpacity } = button.dataset;
        if (boardColor) {
          boardColorInput.value = boardColor;
          updateBoardColor(boardColor);
        }
        if (textColor) {
          textColorInput.value = textColor;
          updateTextColor(textColor);
        }
        if (lineColor) {
          lineColorInput.value = lineColor;
          updateLineColor(lineColor);
        }
        if (boardOpacity) {
          boardOpacityInput.value = boardOpacity;
          updateBoardOpacity(boardOpacity);
        }
        showToast("已套用預設配色。", "success");
      };

      const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

      const startDrag = (event) => {
        if (event.target.closest("input, textarea, button, select")) return;
        whiteboardWrapper.dataset.dragging = "true";
        whiteboardWrapper.dataset.userPositioned = "true";
        const rect = whiteboardWrapper.getBoundingClientRect();
        whiteboardWrapper.dataset.offsetX =
          (event.clientX ?? event.touches?.[0]?.clientX ?? 0) - rect.left;
        whiteboardWrapper.dataset.offsetY =
          (event.clientY ?? event.touches?.[0]?.clientY ?? 0) - rect.top;
        whiteboardWrapper.dataset.stageRect = JSON.stringify(
          captureArea.getBoundingClientRect()
        );
      };

      const dragMove = (event) => {
        if (whiteboardWrapper.dataset.dragging !== "true") return;
        event.preventDefault();
        const stageRect = JSON.parse(whiteboardWrapper.dataset.stageRect);
        const boardRect = whiteboardWrapper.getBoundingClientRect();
        const offsetX = parseFloat(whiteboardWrapper.dataset.offsetX);
        const offsetY = parseFloat(whiteboardWrapper.dataset.offsetY);
        const pointerX = event.clientX ?? event.touches?.[0]?.clientX ?? 0;
        const pointerY = event.clientY ?? event.touches?.[0]?.clientY ?? 0;
        const newLeft = clamp(
          pointerX - stageRect.left - offsetX + boardRect.width / 2,
          boardRect.width / 2,
          stageRect.width - boardRect.width / 2
        );
        const newTop = clamp(
          pointerY - stageRect.top - offsetY + boardRect.height / 2,
          boardRect.height / 2,
          stageRect.height - boardRect.height / 2
        );
        whiteboardWrapper.style.left = `${(newLeft / stageRect.width) * 100}%`;
        whiteboardWrapper.style.top = `${(newTop / stageRect.height) * 100}%`;
      };

      const endDrag = () => {
        whiteboardWrapper.dataset.dragging = "false";
      };

      const positionBoardAtBottomLeft = () => {
        if (whiteboardWrapper.dataset.userPositioned === "true") return;
        const stageRect = captureArea.getBoundingClientRect();
        if (!stageRect.width || !stageRect.height) return;
        const boardRect = whiteboardWrapper.getBoundingClientRect();
        if (!boardRect.width || !boardRect.height) return;
        const photoRect =
          !photoImage.hidden && photoImage.naturalWidth
            ? photoImage.getBoundingClientRect()
            : stageRect;
        const paddingX = Math.max(8, stageRect.width * 0.012);
        const paddingY = Math.max(8, stageRect.height * 0.012);
        const leftEdge = Math.max(photoRect.left, stageRect.left) + paddingX;
        const bottomEdge = Math.min(photoRect.bottom, stageRect.bottom) - paddingY;
        const centerX = clamp(
          leftEdge - stageRect.left + boardRect.width / 2,
          boardRect.width / 2,
          stageRect.width - boardRect.width / 2
        );
        const centerY = clamp(
          bottomEdge - stageRect.top - boardRect.height / 2,
          boardRect.height / 2,
          stageRect.height - boardRect.height / 2
        );
        whiteboardWrapper.style.left = `${(centerX / stageRect.width) * 100}%`;
        whiteboardWrapper.style.top = `${(centerY / stageRect.height) * 100}%`;
      };

      let baseBoardScale = Number(boardScaleInput.value) / 100;
      let fontScaleFactor = Number(fontScaleInput.value) / 100;

      const applyScale = () => {
        const combinedScale = baseBoardScale * fontScaleFactor;
        whiteboardWrapper.style.setProperty("--board-scale", combinedScale.toString());
        document.documentElement.style.setProperty("--whiteboard-font-scale", fontScaleFactor.toString());
        document.documentElement.style.setProperty("--whiteboard-overlay-scale", combinedScale.toString());
      };

      const updateBoardScale = (value) => {
        const percent = Math.max(10, Math.min(120, Number(value)));
        baseBoardScale = percent / 100;
        boardScaleValue.textContent = `${percent}%`;
        applyScale();
        if (whiteboardWrapper.dataset.userPositioned !== "true") {
          requestAnimationFrame(positionBoardAtBottomLeft);
        }
      };


      const updateFontScale = (value) => {
        const percent = Math.max(50, Math.min(300, Number(value)));
        fontScaleFactor = percent / 100;
        fontScaleValue.textContent = `${percent}%`;
        applyScale();
        if (whiteboardWrapper.dataset.userPositioned !== "true") {
          requestAnimationFrame(positionBoardAtBottomLeft);
        }
      };

      const updateBoardWidth = (value) => {
        const width = Math.max(200, Math.min(800, Number(value)));
        const clamped = Math.round(width);
        whiteboardWrapper.style.setProperty("--board-width", `${clamped}px`);
        boardWidthValue.textContent = `${clamped}px`;
        if (whiteboardWrapper.dataset.userPositioned !== "true") {
          requestAnimationFrame(positionBoardAtBottomLeft);
        }
      };

      const toggleExportAppearance = (enable) => {
        const state = Boolean(enable);
        captureArea.classList.toggle("exporting", state);
        photoLayer.classList.toggle("exporting", state);
        whiteboard.classList.toggle("exporting", state);
      };

      function syncField(key) {
        const value = formInputs[key].value.trim();
        displayTargets[key].textContent = value || "—";
        if (key === "testDate") {
          updateWatermarkDate();
        }
      }

      const syncAllFields = () => Object.keys(formInputs).forEach(syncField);

      const clearBoard = () => {
        Object.values(formInputs).forEach((input) => (input.value = ""));
        formInputs.testDate.valueAsDate = new Date();
        syncAllFields();
        lastPhotoMetadata = null;
        lastPhotoExifBytes = null;
        updateCoordinateOverlay();
      };

      const updateBoardColor = (color) => {
        document.documentElement.style.setProperty("--board-fill", color);
      };

      const updateBoardRotation = (value) => {
        const angle = Math.max(-90, Math.min(90, Number(value)));
        document.documentElement.style.setProperty("--board-rotation", `${angle}deg`);
        boardRotationValue.textContent = `${angle}°`;
      };

      const updateBoardOpacity = (percent) => {
        const value = Math.max(30, Math.min(100, Number(percent)));
        whiteboard.style.opacity = (value / 100).toString();
        boardOpacityValue.textContent = `${value}%`;
      };

      const updateTextColor = (color) => {
        document.documentElement.style.setProperty("--text-color", color);
      };

      const updateLineColor = (color) => {
        document.documentElement.style.setProperty("--line-color", color);
      };

      const toggleWhiteboardSolid = (enable) => {
        whiteboard.classList.toggle("solid-mode", Boolean(enable));
      };

      const downloadBlob = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      };

      const buildShareText = () => {
        const sections = [
          { label: "檢查位置", value: displayTargets.inspectionLocation.textContent },
          { label: "檢查日期", value: displayTargets.testDate.textContent },
        ];
        return sections.map((item) => `${item.label}：${item.value || "—"}`).join("\n");
      };

      const handleShareOrDownload = async (blob, filename) => {
        const file = new File([blob], filename, { type: "image/jpeg" });
        const shareText = buildShareText();
        if (
          isMobileDevice &&
          navigator.canShare &&
          navigator.canShare({ files: [file] }) &&
          navigator.share
        ) {
          try {
            await navigator.share({
              files: [file],
              title: "工程白板照片",
              text: shareText,
            });
            showToast("已開啟分享面板，請選擇儲存影像。", "success");
            return;
          } catch (error) {
            if (error.name !== "AbortError") {
              showToast("分享面板不可用，將自動下載影像。");
            }
          }
        }
        downloadBlob(blob, filename);
        showToast("已下載圖片，可直接選擇儲存位置。", "success");
      };

      const exportBoardImage = async () => {
        exportBtn.disabled = true;
        exportBtn.textContent = "匯出中…";
        toggleExportAppearance(true);
        toggleWhiteboardSolid(true);
        try {
          const baseScale = window.devicePixelRatio || 1;
          const sizeMultiplier = EXPORT_SIZE_SCALE[exportSize] || 1;
          const exportScale = baseScale * sizeMultiplier;
          const exportBg =
            (captureArea && window.getComputedStyle(captureArea).backgroundColor) || "#0f172a";
          const canvas = await html2canvas(captureArea, {
            backgroundColor: exportBg,
            scale: exportScale,
          });
          const isPortrait = canvas.height >= canvas.width;
            let dataUrl = canvas.toDataURL("image/jpeg", 0.92);
            dataUrl = applyExifToDataUrl(dataUrl);
          const blob = dataUrlToBlob(dataUrl);
          const timestamp = new Date().toISOString().replace(/[T:]/g, "-").split(".")[0];
          const filename = `whiteboard_${timestamp}${isPortrait ? "_portrait" : "_landscape"}.jpg`;
          await handleShareOrDownload(blob, filename);
        } catch (error) {
          console.error(error);
          showToast("匯出失敗，請再試一次。");
        } finally {
          toggleExportAppearance(false);
          toggleWhiteboardSolid(false);
          exportBtn.disabled = false;
          exportBtn.textContent = "匯出整張圖片";
        }
      };

      takePhotoBtn.addEventListener("click", () => {
        requestCaptureCoordinates();
        takePhotoInput.click();
      });
      uploadPhotoBtn.addEventListener("click", () => uploadInput.click());
      takePhotoInput.addEventListener("change", (event) => handlePhotoFiles(event.target.files));
      uploadInput.addEventListener("change", (event) => handlePhotoFiles(event.target.files));

      whiteboardWrapper.addEventListener("pointerdown", startDrag);
      window.addEventListener("pointermove", dragMove, { passive: false });
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);

      const historyFields = ["projectName", "inspectionLocation", "inspector", "testResult"];
      const historyTextFields = ["projectName", "inspectionLocation", "inspector"];
      const autoSyncFields = Object.keys(formInputs);
      const autoHistoryFields = ["projectName", "inspectionLocation", "inspector", "testResult"];

      clearBoardBtn.addEventListener("click", () => {
        clearBoard();
        showToast("白板文字已清除。", "success");
      });

      boardScaleInput.addEventListener("input", (event) =>
        updateBoardScale(event.target.value)
      );
      boardWidthInput.addEventListener("input", (event) =>
        updateBoardWidth(event.target.value)
      );
      boardRotationInput.addEventListener("input", (event) =>
        updateBoardRotation(event.target.value)
      );
      fontScaleInput.addEventListener("input", (event) =>
        updateFontScale(event.target.value)
      );
      boardColorInput.addEventListener("input", (event) =>
        updateBoardColor(event.target.value)
      );
      boardOpacityInput.addEventListener("input", (event) =>
        updateBoardOpacity(event.target.value)
      );
      textColorInput.addEventListener("input", (event) =>
        updateTextColor(event.target.value)
      );
      lineColorInput.addEventListener("input", (event) =>
        updateLineColor(event.target.value)
      );
      boardVisibilityButton.addEventListener("click", () => {
        const nextState = boardVisibilityButton.dataset.boardVisible !== "true";
        setWhiteboardVisibility(nextState);
      });
      colorPresetButtons.forEach((button) =>
        button.addEventListener("click", () => applyColorPreset(button))
      );
      exportSizeButtons.forEach((button) =>
        button.addEventListener("click", () => setExportSize(button.dataset.exportSize))
      );
      clearCoordinateHistoryBtn?.addEventListener("click", clearCoordinateHistory);
      downloadCoordinateHistoryBtn?.addEventListener("click", downloadCoordinateHistory);
      coordinateFormatButton.addEventListener("click", () => {
        const nextFormat =
          coordinateFormat === COORDINATE_FORMATS.TWD97
            ? COORDINATE_FORMATS.WGS84
            : COORDINATE_FORMATS.TWD97;
        setCoordinateFormat(nextFormat);
      });
      refreshAllFieldHistoryUI();

      historyTextFields.forEach((field) => {
        const input = formInputs[field];
        if (!input) return;
        input.addEventListener("focus", () => showFieldHistory(field));
        input.addEventListener("input", () => showFieldHistory(field));
        input.addEventListener("blur", () => scheduleHideFieldHistory(field));
      });

      formInputs.testResult.addEventListener("focus", () =>
        showFieldHistory("testResult")
      );
      formInputs.testResult.addEventListener("blur", () =>
        scheduleHideFieldHistory("testResult")
      );

      autoSyncFields.forEach((field) => {
        const input = formInputs[field];
        if (!input) return;
        const eventName = input.type === "date" ? "change" : "input";
        input.addEventListener(eventName, () => {
          if (field === "testResult") {
            autoResizeTextarea(formInputs.testResult);
          }
          syncField(field);
        });
        if (autoHistoryFields.includes(field)) {
          input.addEventListener("blur", () => saveFieldHistory(field, input.value));
        }
      });

      exportBtn.addEventListener("click", exportBoardImage);
      window.addEventListener("resize", updateStageAspect);
      photoImage.addEventListener("load", updateStageAspect);

      if (isMobileDevice) {
        boardScaleInput.value = "35";
        boardScaleValue.textContent = "35%";
        boardWidthInput.value = "320";
        boardWidthValue.textContent = "320px";
        fontScaleInput.value = "130";
        fontScaleValue.textContent = "130%";
      }
      if (!formInputs.testDate.value) {
        formInputs.testDate.valueAsDate = new Date();
      }
      if (!isMobileDevice) {
        fontScaleInput.value = "200";
        fontScaleValue.textContent = "200%";
      }
      try {
        const savedFormat = localStorage.getItem(COORDINATE_FORMAT_STORAGE_KEY);
        if (Object.values(COORDINATE_FORMATS).includes(savedFormat)) {
          coordinateFormat = savedFormat;
        }
      } catch (error) {
        console.warn("讀取座標格式失敗", error);
      }
      updateCoordinateFormatButton();
      coordinateHistory = loadCoordinateHistory();
      try {
        const storedExportSize = localStorage.getItem(EXPORT_SIZE_STORAGE_KEY);
        if (storedExportSize && EXPORT_SIZE_SCALE[storedExportSize]) {
          exportSize = storedExportSize;
        }
      } catch (error) {
        console.warn("讀取輸出尺寸失敗", error);
      }
      updateExportSizeButtons();
      let savedVisibility = true;
      try {
        const storedVisibility = localStorage.getItem(WHITEBOARD_VISIBILITY_STORAGE_KEY);
        if (storedVisibility === "true" || storedVisibility === "false") {
          savedVisibility = storedVisibility === "true";
        }
      } catch (error) {
        console.warn("讀取白板可見狀態失敗", error);
      }
      setWhiteboardVisibility(savedVisibility);
      syncAllFields();
      updateBoardScale(boardScaleInput.value);
      updateFontScale(fontScaleInput.value);
      updateBoardWidth(boardWidthInput.value);
      updateBoardRotation(boardRotationInput.value);
      updateBoardColor(boardColorInput.value);
      updateBoardOpacity(boardOpacityInput.value);
      updateTextColor(textColorInput.value);
      updateLineColor(lineColorInput.value);
      updateWatermarkDate();
      updateCoordinateOverlay();
      requestAnimationFrame(positionBoardAtBottomLeft);

      toggleAdvanced.addEventListener("click", () => {
        const isHidden = advancedControls.hasAttribute("hidden");
        if (isHidden) {
          advancedControls.removeAttribute("hidden");
          toggleAdvanced.textContent = "隱藏更多調整";
        } else {
          advancedControls.setAttribute("hidden", "true");
          toggleAdvanced.textContent = "顯示更多調整";
        }
      });
      autoResizeTextarea(formInputs.testResult);
      formInputs.testResult.addEventListener("input", () => {
        autoResizeTextarea(formInputs.testResult);
        showFieldHistory("testResult");
      });
      formInputs.testDate.addEventListener("change", () =>
        syncField("testDate")
      );

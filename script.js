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
  };
  reader.readAsDataURL(file);
};

const clearBoardImage = () => {
  boardImage.src = "";
  boardImage.hidden = true;
  photoInput.value = "";
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
};

const handlePhotoButtonClick = () => {
  openFloatingBoard();
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
  photoInput.addEventListener("click", handlePhotoButtonClick);
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

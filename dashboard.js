"use strict";

// ---------- ELEMENTS ----------

const webInput = document.getElementById("webFiles");
const appInput = document.getElementById("appFiles");

const webFileList = document.getElementById("webFileList");
const appFileList = document.getElementById("appFileList");

const readButton = document.getElementById("readFiles");
const clearWebButton = document.getElementById("clearWeb");
const clearAppButton = document.getElementById("clearApp");
const refreshButton = document.getElementById("refreshButton");

const logPreview = document.getElementById("logPreview");
const previewFileName = document.getElementById("previewFileName");
const previewMeta = document.getElementById("previewMeta");
const previewCount = document.getElementById("previewCount");
const uploadStatus = document.getElementById("uploadStatus");

// ---------- STATE ----------

let webContent = [];
let appContent = [];

let activeSource = "web";

// ---------- FORMAT FILE SIZE ----------

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";

  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  }

  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

// ---------- SAFE HTML ----------

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// ---------- DISPLAY SELECTED FILES ----------

function displayFileList(files, container) {
  if (!files.length) {
    container.textContent = "No files selected";
    return;
  }

  container.innerHTML = files.map(file => `
    <div class="file-item">
      <span>📄 ${escapeHTML(file.name)}</span>
      <span class="file-size">${formatSize(file.size)}</span>
    </div>
  `).join("");
}

// ---------- FILE INPUT CHANGE ----------

webInput.addEventListener("change", () => {
  displayFileList(Array.from(webInput.files), webFileList);
  document.getElementById("webFileCount").textContent =
    webInput.files.length;
});

appInput.addEventListener("change", () => {
  displayFileList(Array.from(appInput.files), appFileList);
  document.getElementById("appFileCount").textContent =
    appInput.files.length;
});

// ---------- DRAG AND DROP ----------

function setupDragDrop(input) {
  const area = document.querySelector(
    `label[for="${input.id}"]`
  );

  area.addEventListener("dragover", event => {
    event.preventDefault();
    area.classList.add("drag-over");
  });

  area.addEventListener("dragleave", () => {
    area.classList.remove("drag-over");
  });

  area.addEventListener("drop", event => {
    event.preventDefault();
    area.classList.remove("drag-over");

    const files = Array.from(event.dataTransfer.files);

    const validFiles = files.filter(file =>
      /\.(log|txt|gz)$/i.test(file.name)
    );

    if (!validFiles.length) {
      uploadStatus.textContent =
        "Please drop LOG, TXT or GZ files.";
        window.dispatchEvent(new Event("logsLoaded"));
      return;
    }

    const transfer = new DataTransfer();

    Array.from(input.files).forEach(file =>
      transfer.items.add(file)
    );

    validFiles.forEach(file =>
      transfer.items.add(file)
    );

    input.files = transfer.files;
    input.dispatchEvent(new Event("change"));
  });
}

setupDragDrop(webInput);
setupDragDrop(appInput);

// ---------- READ GZIP OR NORMAL FILE ----------

async function readFile(file) {
  if (file.name.toLowerCase().endsWith(".gz")) {
    if (!("DecompressionStream" in window)) {
      throw new Error(
        "Your browser does not support GZIP decompression."
      );
    }

    const stream = file.stream().pipeThrough(
      new DecompressionStream("gzip")
    );

    return await new Response(stream).text();
  }

  return await file.text();
}

// ---------- READ ALL FILES ----------

async function loadFiles(files) {
  const result = [];

  for (const file of files) {
    const content = await readFile(file);

    result.push({
      name: file.name,
      size: file.size,
      content: content
    });
  }

  return result;
}

// ---------- SHOW PREVIEW ----------

function showPreview(source) {
  activeSource = source;

  const selectedContent =
    source === "web" ? webContent : appContent;

  document.querySelectorAll(".preview-tab").forEach(tab => {
    tab.classList.toggle(
      "active",
      tab.dataset.source === source
    );
  });

  if (!selectedContent.length) {
    logPreview.textContent =
      `No ${source.toUpperCase()} content loaded yet. Upload a ${source.toUpperCase()} log file and click Read Files.`;

    previewFileName.textContent = "No file selected";
    previewMeta.textContent = "Waiting for upload";
    previewCount.textContent = "0 lines";

    return;
  }

  const combinedContent = selectedContent.map(file =>
    `========== ${file.name} ==========\n${file.content}`
  ).join("\n\n");

  const maxCharacters = 100000;

  logPreview.textContent =
    combinedContent.slice(0, maxCharacters);

  const lineCount = combinedContent.split(/\r?\n/).length;

  previewFileName.textContent =
    selectedContent.map(file => file.name).join(", ");

  previewMeta.textContent =
    `${selectedContent.length} file(s) · ${formatSize(
      selectedContent.reduce((sum, file) => sum + file.size, 0)
    )}`;

  previewCount.textContent =
    `${lineCount.toLocaleString()} lines`;

  if (combinedContent.length > maxCharacters) {
    logPreview.textContent +=
      "\n\n--- PREVIEW TRUNCATED. Full file content was loaded. ---";
  }
}

// ---------- PREVIEW TABS ----------

document.querySelectorAll(".preview-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    showPreview(tab.dataset.source);
  });
});

// ---------- CLEAR WEB ----------

clearWebButton.addEventListener("click", () => {
  webInput.value = "";
  webContent = [];

  displayFileList([], webFileList);

  document.getElementById("webFileCount").textContent = "0";
  document.getElementById("webLineCount").textContent = "—";

  if (activeSource === "web") {
    showPreview("web");
  }

  uploadStatus.textContent = "WEB files cleared.";
});

// ---------- CLEAR APP ----------

clearAppButton.addEventListener("click", () => {
  appInput.value = "";
  appContent = [];

  displayFileList([], appFileList);

  document.getElementById("appFileCount").textContent = "0";
  document.getElementById("appLineCount").textContent = "—";

  if (activeSource === "app") {
    showPreview("app");
  }

  uploadStatus.textContent = "APP files cleared.";
});

// ---------- READ BUTTON ----------

readButton.addEventListener("click", async () => {
  const webFiles = Array.from(webInput.files);
  const appFiles = Array.from(appInput.files);

  if (!webFiles.length || !appFiles.length) {
    uploadStatus.textContent =
      "Please select both WEB and APP log files.";

    return;
  }

  readButton.disabled = true;
  readButton.textContent = "Reading files...";

  uploadStatus.textContent = "Reading your log files...";

  try {
    webContent = await loadFiles(webFiles);
    appContent = await loadFiles(appFiles);

    const webLines = webContent.reduce(
      (sum, file) => sum + file.content.split(/\r?\n/).length,
      0
    );

    const appLines = appContent.reduce(
      (sum, file) => sum + file.content.split(/\r?\n/).length,
      0
    );

    document.getElementById("webLineCount").textContent =
      webLines.toLocaleString();

    document.getElementById("appLineCount").textContent =
      appLines.toLocaleString();

    showPreview("web");

    uploadStatus.textContent =
      "Successfully loaded WEB and APP log files.";

  } catch (error) {
    console.error(error);

    uploadStatus.textContent =
      "Error: " + error.message;

  } finally {
    readButton.disabled = false;
    readButton.textContent = "Read Files →";
  }
});

// ---------- REFRESH BUTTON ----------

if (refreshButton) {
  refreshButton.addEventListener("click", () => {
    showPreview(activeSource);
    uploadStatus.textContent = "Preview refreshed.";
  });
}

// ---------- INITIAL DISPLAY ----------

displayFileList([], webFileList);
displayFileList([], appFileList);

showPreview("web");

console.log("Phase 2 dashboard loaded successfully.");

// REFRESH BUTTON FUNCTIONALITY
(() => {
    const refreshButton = document.getElementById("refreshButton");

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            window.location.reload();
        });
    }
})();

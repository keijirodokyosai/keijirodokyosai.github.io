/**
 * 組織共済申込書 PDF — 送 信・保存と同じ見た目（§9.0.3 フェーズ2）
 * 画面上の .soshiki-form-sheet を html2canvas でキャプチャし A4 横 PDF に埋め込む。
 */

var SOSHIKI_FORM_PDF_LAYOUT_URL = "/data/soshiki-form-pdf-layout.json";
var SOSHIKI_FORM_PDF_PAGE_WIDTH_PT = 841.68;
var SOSHIKI_FORM_PDF_PAGE_HEIGHT_PT = 595.2;
var SOSHIKI_FORM_PDF_CAPTURE_SCALE = 2;

var soshikiFormPdfLayoutCache = null;

function collectSoshikiFormPdfLibErrors() {
  var errors = [];
  if (!window.PDFLib || !window.PDFLib.PDFDocument) {
    errors.push("PDF 生成ライブラリ（pdf-lib）が読み込まれていません。");
  }
  if (typeof window.html2canvas !== "function") {
    errors.push("PDF 生成ライブラリ（html2canvas）が読み込まれていません。");
  }
  return errors;
}

function fetchSoshikiFormPdfLayout() {
  if (soshikiFormPdfLayoutCache) {
    return Promise.resolve(soshikiFormPdfLayoutCache);
  }

  return fetch(SOSHIKI_FORM_PDF_LAYOUT_URL)
    .then(function (response) {
      if (!response.ok) {
        throw new Error(
          "PDF 座標定義の読み込みに失敗しました。（HTTP " + response.status + "）"
        );
      }
      return response.json();
    })
    .then(function (layout) {
      soshikiFormPdfLayoutCache = layout;
      return layout;
    });
}

function beginSoshikiFormPdfCapture() {
  var sheet = document.querySelector(".soshiki-form-sheet");
  if (sheet) {
    sheet.style.setProperty("--soshiki-form-scale", "1");
    sheet.style.marginBottom = "0";
  }
  window.SOSHIKI_FORM_CAPTURE_LOCKED = true;
  if (typeof applyAddressPrintTownJoinAllRows === "function") {
    applyAddressPrintTownJoinAllRows();
  }
  document.body.classList.add("soshiki-form-capturing");
  return sheet;
}

function endSoshikiFormPdfCapture() {
  document.body.classList.remove("soshiki-form-capturing");
  if (typeof restoreAddressPrintTownJoin === "function") {
    restoreAddressPrintTownJoin();
  }
  window.SOSHIKI_FORM_CAPTURE_LOCKED = false;
  window.dispatchEvent(new Event("resize"));
}

function waitForSoshikiFormPdfCapturePaint() {
  return new Promise(function (resolve) {
    requestAnimationFrame(function () {
      requestAnimationFrame(resolve);
    });
  });
}

function isSoshikiFormPdfCaptureVisibleInput(input) {
  if (!input || input.type === "hidden") return false;
  var style = window.getComputedStyle(input);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (input.classList.contains("is-soshiki-print-area-joined-hidden")) {
    return false;
  }
  return true;
}

function replaceInputsWithTextLayersInClone(clonedDoc) {
  var sheet = clonedDoc.querySelector(".soshiki-form-sheet");
  if (!sheet) return;

  var inputs = sheet.querySelectorAll("input, textarea");
  inputs.forEach(function (input) {
    if (!isSoshikiFormPdfCaptureVisibleInput(input)) return;
    var value = input.value;
    if (!value) return;

    var win = clonedDoc.defaultView;
    var computed = win.getComputedStyle(input);
    var rect = input.getBoundingClientRect();
    var sheetRect = sheet.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    var layer = clonedDoc.createElement("div");
    layer.className = "soshiki-form-pdf-text-swap";
    layer.textContent = value;
    layer.style.position = "absolute";
    layer.style.left = rect.left - sheetRect.left + "px";
    layer.style.top = rect.top - sheetRect.top + "px";
    layer.style.width = rect.width + "px";
    layer.style.height = rect.height + "px";
    layer.style.boxSizing = "border-box";
    layer.style.overflow = "hidden";
    layer.style.whiteSpace = "pre";
    layer.style.margin = "0";
    layer.style.padding = computed.padding;
    layer.style.border = "none";
    layer.style.background = "transparent";
    layer.style.color = computed.color || "#000";
    layer.style.fontFamily = computed.fontFamily;
    layer.style.fontSize = computed.fontSize;
    layer.style.fontWeight = computed.fontWeight;
    layer.style.lineHeight = computed.lineHeight;
    layer.style.letterSpacing = computed.letterSpacing;
    layer.style.textAlign = computed.textAlign;
    layer.style.display = "flex";
    layer.style.alignItems = "center";

    input.style.opacity = "0";
    sheet.appendChild(layer);
  });
}

function captureSoshikiFormSheetToCanvas(sheet) {
  return window
    .html2canvas(sheet, {
      scale: SOSHIKI_FORM_PDF_CAPTURE_SCALE,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      onclone: function (clonedDoc) {
        clonedDoc.body.classList.add("soshiki-form-capturing");
        replaceInputsWithTextLayersInClone(clonedDoc);
      },
    })
    .then(function (canvas) {
      if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
        throw new Error("申込書の画像化に失敗しました。");
      }
      return canvas;
    });
}

function canvasToPngBytes(canvas) {
  return new Promise(function (resolve, reject) {
    if (typeof canvas.toBlob !== "function") {
      reject(new Error("PDF 用の画像変換がサポートされていません。"));
      return;
    }
    canvas.toBlob(
      function (blob) {
        if (!blob) {
          reject(new Error("PDF 用の画像変換に失敗しました。"));
          return;
        }
        blob.arrayBuffer().then(resolve).catch(reject);
      },
      "image/png",
      1
    );
  });
}

function embedCapturedSheetInPdf(pngBytes) {
  var PDFDocument = window.PDFLib.PDFDocument;
  return PDFDocument.create().then(function (pdfDoc) {
    var page = pdfDoc.addPage([
      SOSHIKI_FORM_PDF_PAGE_WIDTH_PT,
      SOSHIKI_FORM_PDF_PAGE_HEIGHT_PT,
    ]);
    return pdfDoc.embedPng(pngBytes).then(function (image) {
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: SOSHIKI_FORM_PDF_PAGE_WIDTH_PT,
        height: SOSHIKI_FORM_PDF_PAGE_HEIGHT_PT,
      });
      return pdfDoc.save();
    });
  });
}

function buildSoshikiFormPdfBytes() {
  var libErrors = collectSoshikiFormPdfLibErrors();
  if (libErrors.length > 0) {
    return Promise.reject(new Error(libErrors[0]));
  }

  var sheet = beginSoshikiFormPdfCapture();
  if (!sheet) {
    endSoshikiFormPdfCapture();
    return Promise.reject(new Error("申込書シートが見つかりません。"));
  }

  return waitForSoshikiFormPdfCapturePaint()
    .then(function () {
      return captureSoshikiFormSheetToCanvas(sheet);
    })
    .then(function (canvas) {
      return canvasToPngBytes(canvas);
    })
    .then(function (pngBytes) {
      return embedCapturedSheetInPdf(pngBytes);
    })
    .finally(function () {
      endSoshikiFormPdfCapture();
    });
}

function soshikiFormPdfBytesToBase64(bytes) {
  var binary = "";
  var chunkSize = 0x8000;
  for (var i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/**
 * 「名前を付けて保存」（上書き可）。クリック直後に呼ぶ（user activation 用）。
 * キャンセルは "cancelled"。
 */
function promptSoshikiFormPdfSaveFileHandle(fileName) {
  if (typeof window.showSaveFilePicker !== "function") {
    return Promise.resolve("unsupported");
  }

  return window
    .showSaveFilePicker({
      suggestedName: fileName,
      types: [
        {
          description: "PDF",
          accept: { "application/pdf": [".pdf"] },
        },
      ],
    })
    .catch(function (error) {
      if (error && error.name === "AbortError") {
        return "cancelled";
      }
      throw error;
    });
}

function writeSoshikiFormPdfBytesToFileHandle(fileHandle, bytes) {
  return fileHandle.createWritable().then(function (writable) {
    return writable.write(bytes).then(function () {
      return writable.close();
    });
  });
}

function downloadSoshikiFormPdfFromTemplate() {
  var libraryErrors = collectSoshikiFormPdfLibErrors();
  if (libraryErrors.length > 0) {
    window.alert(libraryErrors.join("\n"));
    return Promise.reject(new Error(libraryErrors[0]));
  }

  var fileName = getSoshikiFormPdfDownloadFileName();
  return promptSoshikiFormPdfSaveFileHandle(fileName).then(function (handleOrStatus) {
    if (handleOrStatus === "cancelled") {
      return { cancelled: true };
    }
    if (handleOrStatus === "unsupported") {
      return Promise.reject(
        new Error(
          "このブラウザでは保存先を選べません。Microsoft Edge または Google Chrome で本サイトを開いてから保存してください。"
        )
      );
    }

    return buildSoshikiFormPdfBytes().then(function (bytes) {
      return writeSoshikiFormPdfBytesToFileHandle(handleOrStatus, bytes).then(
        function () {
          return { saved: true, fileName: fileName };
        }
      );
    });
  });
}

function buildSoshikiFormSubmitPdfBase64FromTemplate() {
  return buildSoshikiFormPdfBytes().then(function (bytes) {
    var base64 = soshikiFormPdfBytesToBase64(bytes);
    if (!base64) {
      throw new Error("PDF の生成に失敗しました。");
    }
    return base64;
  });
}

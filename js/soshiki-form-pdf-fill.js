/**
 * 組織共済申込書 PDF — 原本 pdf-lib 埋め込み（§案2・座標 JSON）
 * フェーズ1: 原本を読み込みそのまま出力（配線確認）
 */

var SOSHIKI_FORM_PDF_LAYOUT_URL = "/data/soshiki-form-pdf-layout.json";

var soshikiFormPdfLayoutCache = null;

function collectSoshikiFormPdfLibErrors() {
  var errors = [];
  if (!window.PDFLib || !window.PDFLib.PDFDocument) {
    errors.push("PDF 生成ライブラリ（pdf-lib）が読み込まれていません。");
  }
  return errors;
}

function fetchSoshikiFormPdfLayout() {
  if (soshikiFormPdfLayoutCache) {
    return Promise.resolve(soshikiFormPdfLayoutCache);
  }

  return fetch(SOSHIKI_FORM_PDF_LAYOUT_URL).then(function (response) {
    if (!response.ok) {
      throw new Error("PDF 座標定義の読み込みに失敗しました。（HTTP " + response.status + "）");
    }
    return response.json();
  }).then(function (layout) {
    soshikiFormPdfLayoutCache = layout;
    return layout;
  });
}

function fetchSoshikiFormPdfTemplateBytes(templatePath) {
  return fetch(templatePath).then(function (response) {
    if (!response.ok) {
      throw new Error("申込書 PDF 原本の読み込みに失敗しました。（HTTP " + response.status + "）");
    }
    return response.arrayBuffer();
  });
}

/**
 * 画面上の全項目（PDF 用）。フェーズ2以降でフィールドを増やす。
 */
function buildSoshikiFormPdfPayload() {
  var verified = getSoshikiFormVerifiedUnion();
  var applicationDate = readSoshikiApplicationDate();
  var unionNameField = document.getElementById("union-name");

  return {
    formVersion: "1",
    unionName: unionNameField ? unionNameField.value.trim() : "",
    KyosaikaiName: verified && verified.KyosaikaiName ? verified.KyosaikaiName : "",
    applicationDate: applicationDate,
    submission: buildSoshikiFormSubmission(),
  };
}

function drawSoshikiFormPdfFields(page, layout, payload, fonts) {
  var fields = layout && layout.fields ? layout.fields : [];
  if (!fields.length) {
    return;
  }

  fields.forEach(function (field) {
    var text = resolveSoshikiFormPdfFieldText(field, payload);
    if (!text) return;

    var size = field.fontSize || 10;
    var x = field.x;
    var y = field.y;
    var font = fonts.default;

    page.drawText(text, {
      x: x,
      y: y,
      size: size,
      font: font,
    });
  });
}

function resolveSoshikiFormPdfFieldText(field, payload) {
  if (!field || !field.id) return "";
  // フェーズ2: id → payload のマッピングをここに追加
  return "";
}

function buildSoshikiFormPdfBytes() {
  var libErrors = collectSoshikiFormPdfLibErrors();
  if (libErrors.length > 0) {
    return Promise.reject(new Error(libErrors[0]));
  }

  var PDFDocument = window.PDFLib.PDFDocument;
  var payload = buildSoshikiFormPdfPayload();

  return fetchSoshikiFormPdfLayout()
    .then(function (layout) {
      var templatePath = layout.template || "/pdf/soshiki-form-enter.pdf";
      return fetchSoshikiFormPdfTemplateBytes(templatePath).then(function (buffer) {
        return { layout: layout, buffer: buffer };
      });
    })
    .then(function (loaded) {
      return PDFDocument.load(loaded.buffer).then(function (pdfDoc) {
        return { layout: loaded.layout, pdfDoc: pdfDoc, payload: payload };
      });
    })
    .then(function (state) {
      var page = state.pdfDoc.getPages()[0];
      var fonts = { default: state.pdfDoc.getFont(window.PDFLib.StandardFonts.Helvetica) };
      drawSoshikiFormPdfFields(page, state.layout, state.payload, fonts);
      return state.pdfDoc.save();
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

function triggerSoshikiFormPdfBytesDownload(bytes, fileName) {
  var blob = new Blob([bytes], { type: "application/pdf" });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 0);
}

function downloadSoshikiFormPdfFromTemplate() {
  var libraryErrors = collectSoshikiFormPdfLibErrors();
  if (libraryErrors.length > 0) {
    window.alert(libraryErrors.join("\n"));
    return Promise.reject(new Error(libraryErrors[0]));
  }

  return buildSoshikiFormPdfBytes().then(function (bytes) {
    triggerSoshikiFormPdfBytesDownload(bytes, getSoshikiFormPdfDownloadFileName());
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

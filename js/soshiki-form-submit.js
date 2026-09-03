/**
 * 組織共済申込書 — WEB 受付（送 信）
 * JSON 組み立て・PDF 生成（html2canvas + jsPDF）・Power Automate へ POST
 */

var SOSHIKI_FORM_SUBMIT_CONFIG = {
  submitEndpointUrl: "",
  ready: false,
};

var SOSHIKI_FORM_CAPTURE_SCALE = 3;

function initSoshikiFormSubmit() {
  var sendButton = document.getElementById("soshiki-form-send");
  if (!sendButton) return;

  fetchJsonSubmitConfig("/data/soshiki-form-submit-config.json")
    .then(function (config) {
      SOSHIKI_FORM_SUBMIT_CONFIG.submitEndpointUrl = (
        config.submitEndpointUrl || ""
      ).trim();
      SOSHIKI_FORM_SUBMIT_CONFIG.ready = true;
      updateSoshikiFormSendButtonState();
    })
    .catch(function (error) {
      console.error("送信用設定の読み込みに失敗しました:", error);
      SOSHIKI_FORM_SUBMIT_CONFIG.ready = true;
      updateSoshikiFormSendButtonState();
    });

  sendButton.addEventListener("click", handleSoshikiFormSendClick);
}

function fetchJsonSubmitConfig(url) {
  return fetch(url).then(function (response) {
    if (!response.ok) {
      throw new Error("HTTP " + response.status + " for " + url);
    }
    return response.json();
  });
}

function updateSoshikiFormSendButtonState() {
  var sendButton = document.getElementById("soshiki-form-send");
  if (!sendButton) return;

  var canSend =
    SOSHIKI_FORM_SUBMIT_CONFIG.ready &&
    SOSHIKI_FORM_SUBMIT_CONFIG.submitEndpointUrl.length > 0;

  sendButton.disabled = !canSend;
  sendButton.setAttribute("aria-disabled", canSend ? "false" : "true");
}

function handleSoshikiFormSendClick() {
  if (!SOSHIKI_FORM_SUBMIT_CONFIG.submitEndpointUrl) {
    window.alert(
      "送 信の設定がありません。\ndata/soshiki-form-submit-config.json に Power Automate の URL を設定してください。"
    );
    return;
  }

  var active = document.activeElement;
  if (active && typeof active.blur === "function") {
    active.blur();
  }

  var validationErrors = collectSoshikiFormSendValidationErrors();
  if (validationErrors.length > 0) {
    window.alert(validationErrors.join("\n"));
    return;
  }

  var verifiedUnion = getSoshikiFormVerifiedUnion();
  var submissionPreview = buildSoshikiFormSubmission();
  var memberCount = submissionPreview.members.length;

  var confirmLines = [
    "申込内容を送信します。よろしいですか？",
    "",
    "組合名：" + verifiedUnion.name,
    "格納月：" + submissionPreview.storageFolder,
    "組合員：" + memberCount + "名",
    "",
    "送信後の取り消しはできません。",
  ];
  if (!window.confirm(confirmLines.join("\n"))) return;

  var password = window.prompt("申込用パスワードを入力してください");
  if (password === null) return;
  if (!String(password).trim()) {
    window.alert("パスワードが入力されていません。");
    return;
  }

  setSoshikiFormSendBusy(true);
  clearSoshikiFormSendResult();

  buildSoshikiFormSubmitPdfBase64()
    .then(function (pdfBase64) {
      var submission = buildSoshikiFormSubmission();
      var applicationDate = submission.applicationDate;
      var fileNameDate =
        applicationDate.year +
        applicationDate.month +
        applicationDate.day;

      var payload = {
        password: String(password),
        unionName: verifiedUnion.name,
        fileNameDate: fileNameDate,
        submission: submission,
        pdfBase64: pdfBase64,
      };

      return fetch(SOSHIKI_FORM_SUBMIT_CONFIG.submitEndpointUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }).then(function (response) {
        return response.text().then(function (text) {
          var body = null;
          if (text) {
            try {
              body = JSON.parse(text);
            } catch (parseError) {
              body = { raw: text };
            }
          }
          if (!response.ok) {
            var message =
              (body && (body.message || body.error)) ||
              "HTTP " + response.status;
            throw new Error(message);
          }
          return body || {};
        });
      });
    })
    .then(function (result) {
      var receiptId =
        (result && (result.receiptId || result.receipt_id)) || "";
      showSoshikiFormSendSuccess(receiptId);
    })
    .catch(function (error) {
      console.error("送 信に失敗しました:", error);
      showSoshikiFormSendError(
        error && error.message
          ? error.message
          : "送 信に失敗しました。時間をおいて再度お試しください。"
      );
    })
    .finally(function () {
      setSoshikiFormSendBusy(false);
    });
}

function collectSoshikiFormSendValidationErrors() {
  var errors = validateSoshikiForm();

  if (!getSoshikiFormVerifiedUnion()) {
    errors.push(
      "組合名が確定していません。組合名を入力して Enter キーで確定してください。"
    );
  } else {
    var unionMismatch = getSoshikiFormVerifiedUnionMismatchErrors();
    if (unionMismatch.length > 0) {
      errors = errors.concat(unionMismatch);
    }
  }

  if (!soshikiFormHasMemberSubmission()) {
    errors.push("組合員欄に1名以上入力してください。");
  }

  if (typeof html2canvas !== "function") {
    errors.push("PDF 生成ライブラリ（html2canvas）が読み込まれていません。");
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    errors.push("PDF 生成ライブラリ（jsPDF）が読み込まれていません。");
  }

  return errors;
}

function soshikiFormHasMemberSubmission() {
  for (var row = 1; row <= MEMBER_ROW_COUNT; row += 1) {
    if (memberRowHasAnyInput(row)) return true;
  }
  return false;
}

function getSoshikiFormVerifiedUnionMismatchErrors() {
  var verifiedUnion = getSoshikiFormVerifiedUnion();
  if (!verifiedUnion) return [];

  var errors = [];
  var unionName = getTrimmedFieldValue("union-name");

  if (unionName !== verifiedUnion.name) {
    errors.push("組合名が変更されています。Enter キーで再度確定してください。");
  }
  if (getTrimmedFieldValue("industry-code") !== verifiedUnion.industry) {
    errors.push("産別コードが組合確定時と一致しません。Enter キーで再度確定してください。");
  }
  if (getTrimmedFieldValue("branch-code") !== verifiedUnion.branch) {
    errors.push("支部コードが組合確定時と一致しません。Enter キーで再度確定してください。");
  }
  if (getTrimmedFieldValue("subbranch-code") !== verifiedUnion.subbranch) {
    errors.push("分会コードが組合確定時と一致しません。Enter キーで再度確定してください。");
  }
  if (!verifiedUnion.code) {
    errors.push("組合コードが取得できません。Enter キーで再度確定してください。");
  }

  return errors;
}

function buildSoshikiFormSubmission() {
  var verifiedUnion = getSoshikiFormVerifiedUnion();
  var applicationDate = readSoshikiApplicationDate();
  var coverageMonth = computeSoshikiCoverageMonth(applicationDate);

  return {
    formType: "soshiki-form-enter",
    formVersion: "1",
    submittedAt: new Date().toISOString(),
    code: verifiedUnion.code,
    industry: verifiedUnion.industry,
    branch: verifiedUnion.branch,
    subbranch: verifiedUnion.subbranch,
    applicationDate: applicationDate,
    coverageMonth: coverageMonth,
    storageFolder: formatSoshikiStorageFolder(coverageMonth),
    members: buildSoshikiFormSubmissionMembers(),
  };
}

function readSoshikiApplicationDate() {
  return {
    year: getTrimmedFieldValue("application-year"),
    month: pad2(getTrimmedFieldValue("application-month")),
    day: pad2(getTrimmedFieldValue("application-day")),
  };
}

function computeSoshikiCoverageMonth(applicationDate) {
  var year = parseInt(applicationDate.year, 10);
  var month = parseInt(applicationDate.month, 10);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return { year: "", month: "" };
  }

  if (month === 12) {
    return { year: String(year + 1), month: "01" };
  }

  return { year: String(year), month: pad2(String(month + 1)) };
}

function formatSoshikiStorageFolder(coverageMonth) {
  if (!coverageMonth.year || !coverageMonth.month) return "";
  return coverageMonth.year + "年" + coverageMonth.month + "月";
}

function buildSoshikiFormSubmissionMembers() {
  var members = [];

  for (var row = 1; row <= MEMBER_ROW_COUNT; row += 1) {
    if (!memberRowHasAnyInput(row)) continue;
    members.push(buildSoshikiFormSubmissionMember(row));
  }

  return members;
}

function buildSoshikiFormSubmissionMember(row) {
  var birthYear = getMemberFieldValue(row, "birth-year");
  var birthMonth = pad2(getMemberFieldValue(row, "birth-month"));
  var birthDay = pad2(getMemberFieldValue(row, "birth-day"));
  var postalDigits = extractZipDigits(getMemberFieldValue(row, "postal-code"));

  var member = {
    row: row,
    idou: getMemberFieldValue(row, "idou"),
    FamilyNameKana: getMemberFieldValue(row, "family-name-kana"),
    GivenNameKana: getMemberFieldValue(row, "given-name-kana"),
    FamilyName: getMemberFieldValue(row, "family-name"),
    GivenName: getMemberFieldValue(row, "given-name"),
    BirthDate: formatSubmissionBirthDate(birthYear, birthMonth, birthDay),
    Gender: getMemberFieldValue(row, "gender"),
    PostalCode: formatZipCode(postalDigits),
    Prefecture: getMemberFieldValue(row, "prefecture"),
    City: getMemberFieldValue(row, "city"),
    TownArea: getMemberFieldValue(row, "town-area"),
    AreaNumber: getMemberFieldValue(row, "area-number"),
    BuildingName: getMemberFieldValue(row, "building-name"),
  };

  var unionMemberCode = normalizeSubmissionUnionMemberCode(
    getMemberFieldValue(row, "union-member-code")
  );
  if (unionMemberCode) {
    member.UnionMemberCode = unionMemberCode;
  }

  return member;
}

function getMemberFieldValue(row, suffix) {
  var field = getMemberField(row, suffix);
  return field ? field.value.trim() : "";
}

function getTrimmedFieldValue(id) {
  var field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

function pad2(value) {
  var text = String(value).trim();
  if (!text) return "";
  return text.padStart(2, "0");
}

function formatSubmissionBirthDate(year, month, day) {
  if (!year || !month || !day) return "";
  return year + "/" + month + "/" + day;
}

function normalizeSubmissionUnionMemberCode(rawValue) {
  var digits = toHalfWidthDigits(rawValue).replace(/[^0-9]/g, "");
  if (!digits) return "";
  return digits.padStart(6, "0").slice(0, 6);
}

function buildSoshikiFormSubmitPdfBase64() {
  var sheet = document.querySelector(".soshiki-form-sheet");
  if (!sheet) {
    return Promise.reject(new Error("申込書シートが見つかりません。"));
  }

  var body = document.body;
  var previousScale = sheet.style.getPropertyValue("--soshiki-form-scale");
  var previousMarginBottom = sheet.style.marginBottom;

  body.classList.add("soshiki-form-capturing");
  sheet.style.setProperty("--soshiki-form-scale", "1");
  sheet.style.marginBottom = "0";

  return html2canvas(sheet, {
    scale: SOSHIKI_FORM_CAPTURE_SCALE,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  })
    .then(function (canvas) {
      var imgData = canvas.toDataURL("image/jpeg", 0.92);
      var pdf = new window.jspdf.jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      pdf.addImage(imgData, "JPEG", 0, 0, 297, 210);
      var dataUri = pdf.output("datauristring");
      var base64 = dataUri.split(",")[1] || "";
      if (!base64) {
        throw new Error("PDF の生成に失敗しました。");
      }
      return base64;
    })
    .finally(function () {
      body.classList.remove("soshiki-form-capturing");
      if (previousScale) {
        sheet.style.setProperty("--soshiki-form-scale", previousScale);
      } else {
        sheet.style.removeProperty("--soshiki-form-scale");
      }
      sheet.style.marginBottom = previousMarginBottom;
    });
}

function setSoshikiFormSendBusy(isBusy) {
  var sendButton = document.getElementById("soshiki-form-send");
  if (!sendButton) return;
  sendButton.disabled = isBusy;
  sendButton.setAttribute("aria-disabled", isBusy ? "true" : "false");
  sendButton.textContent = isBusy ? "送信中…" : "送 信";
  if (!isBusy) {
    updateSoshikiFormSendButtonState();
  }
}

function clearSoshikiFormSendResult() {
  var result = document.getElementById("soshiki-form-send-result");
  if (!result) return;
  result.textContent = "";
  result.className = "soshiki-form-send-result";
  result.hidden = true;
}

function showSoshikiFormSendSuccess(receiptId) {
  var result = document.getElementById("soshiki-form-send-result");
  if (!result) return;

  var lines = ["送信が完了しました。"];
  if (receiptId) {
    lines.push("受付 ID：" + receiptId);
  }
  lines.push(
    "内容を誤って送信した場合は、受付 ID を控えて京滋労働共済までご連絡ください。"
  );

  result.textContent = lines.join("\n");
  result.className = "soshiki-form-send-result soshiki-form-send-result--success";
  result.hidden = false;
}

function showSoshikiFormSendError(message) {
  var result = document.getElementById("soshiki-form-send-result");
  if (!result) return;

  result.textContent = message;
  result.className = "soshiki-form-send-result soshiki-form-send-result--error";
  result.hidden = false;
}

document.addEventListener("DOMContentLoaded", function () {
  initSoshikiFormSubmit();
});

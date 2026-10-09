/**
 * 組織共済申込書 — WEB 受付（送 信）
 * JSON 組み立て・Worker API へ POST（JSON のみ）
 */

var SOSHIKI_FORM_SUBMIT_CONFIG = {
  submitEndpointUrl: "",
  ready: false,
};

var SOSHIKI_FORM_TRANSFER_JSON = {
  new: "New",
  cancel: "Cancel",
  change: "Change",
};

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
      "送 信の設定がありません。\ndata/soshiki-form-submit-config.json に Worker の URL を設定してください。"
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
  var transferConfirmLabel = formatMemberTransferConfirmLabel(
    countMemberTransferChanges()
  );

  var confirmLines = [
    "申込内容を送信します。よろしいですか？",
    "",
    "組合名：" + verifiedUnion.KyosaikaiName,
    "格納月：" + submissionPreview.StorageFolder,
    transferConfirmLabel,
    "",
    "送信後にPDF印刷ダイアログが出ます。",
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

  var submission = buildSoshikiFormSubmission();
  var applicationDate = submission.ApplicationDate;
  var fileNameDate =
    applicationDate.Year + applicationDate.Month + applicationDate.Day;

  var payload = {
    password: String(password),
    unionName: verifiedUnion.KyosaikaiName,
    fileNameDate: fileNameDate,
    submission: submission,
  };

  fetch(SOSHIKI_FORM_SUBMIT_CONFIG.submitEndpointUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then(function (response) {
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
    })
    .then(function (result) {
      recordSoshikiFormTsukiKeiSnapshot();
      var receiptId =
        (result && (result.receiptId || result.receipt_id)) || "";
      showSoshikiFormSendSuccess(receiptId);
      promptSoshikiFormPdfSaveAfterSend(receiptId);
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

  errors = errors.concat(collectSoshikiFormSheetFooterValidationErrors());

  return errors;
}

function collectSoshikiFormSheetFooterValidationErrors() {
  var errors = [];
  var currentRaw = getTrimmedFieldValue("page-count-current");
  var totalRaw = getTrimmedFieldValue("page-count-total");

  if (!isValidPageCountFieldValue(currentRaw) || !isValidPageCountFieldValue(totalRaw)) {
    errors.push("ページ数を正しく入力してください");
    return errors;
  }

  var current = parseInt(currentRaw, 10);
  var total = parseInt(totalRaw, 10);
  if (current > total) {
    errors.push("ページ数を正しく入力してください");
  }

  var priorRaw = getTrimmedFieldValue("prior-month-headcount");
  if (!isValidPriorMonthHeadcountValue(priorRaw)) {
    errors.push("前月残（人数）を正しく入力してください");
  }

  var remarks = document.getElementById("remarks");
  if (remarks && remarks.value.length > 120) {
    errors.push("備考は120文字以内で入力してください");
  }

  return errors;
}

function isValidPageCountFieldValue(raw) {
  var trimmed = String(raw).trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return false;
  var value = parseInt(trimmed, 10);
  return Number.isFinite(value) && value >= 1 && value <= 99;
}

function isValidPriorMonthHeadcountValue(raw) {
  var trimmed = String(raw).trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return false;
  var value = parseInt(trimmed, 10);
  return Number.isFinite(value) && value >= 0 && value <= 999;
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

  if (unionName !== verifiedUnion.KyosaikaiName) {
    errors.push("組合名が変更されています。Enter キーで再度確定してください。");
  }
  if (getTrimmedFieldValue("industry-code") !== verifiedUnion.IndustryCode) {
    errors.push("産別コードが組合確定時と一致しません。Enter キーで再度確定してください。");
  }
  if (getTrimmedFieldValue("branch-code") !== verifiedUnion.BranchCode) {
    errors.push("支部コードが組合確定時と一致しません。Enter キーで再度確定してください。");
  }
  if (getTrimmedFieldValue("subbranch-code") !== verifiedUnion.SubbranchCode) {
    errors.push("分会コードが組合確定時と一致しません。Enter キーで再度確定してください。");
  }
  if (!verifiedUnion.KyosaikaiCode) {
    errors.push("共済会コードが取得できません。Enter キーで再度確定してください。");
  }

  return errors;
}

function buildSoshikiFormSubmission() {
  var verifiedUnion = getSoshikiFormVerifiedUnion();
  var applicationDate = readSoshikiApplicationDate();
  var coverageMonth = computeSoshikiCoverageMonth(applicationDate);

  return {
    FormType: "soshiki-form-enter",
    FormVersion: "1",
    SubmittedAt: new Date().toISOString(),
    IndustryCode: verifiedUnion.IndustryCode,
    BranchCode: verifiedUnion.BranchCode,
    SubbranchCode: verifiedUnion.SubbranchCode,
    KyosaikaiCode: verifiedUnion.KyosaikaiCode,
    ApplicationDate: applicationDate,
    CoverageMonth: coverageMonth,
    StorageFolder: formatSoshikiStorageFolder(coverageMonth),
    SheetFooter: buildSoshikiFormSheetFooter(),
    Members: buildSoshikiFormSubmissionMembers(),
  };
}

function buildSoshikiFormSheetFooter() {
  var remarksField = document.getElementById("remarks");
  var remarks = remarksField ? remarksField.value.trim() : "";

  return {
    PageCountCurrent: getTrimmedFieldValue("page-count-current"),
    PageCountTotal: getTrimmedFieldValue("page-count-total"),
    PriorMonthHeadcount: getTrimmedFieldValue("prior-month-headcount"),
    Remarks: remarks,
  };
}

function readSoshikiApplicationDate() {
  return {
    Year: getTrimmedFieldValue("application-year"),
    Month: pad2(getTrimmedFieldValue("application-month")),
    Day: pad2(getTrimmedFieldValue("application-day")),
  };
}

function computeSoshikiCoverageMonth(applicationDate) {
  var year = parseInt(applicationDate.Year, 10);
  var month = parseInt(applicationDate.Month, 10);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return { Year: "", Month: "" };
  }

  if (month === 12) {
    return { Year: String(year + 1), Month: "01" };
  }

  return { Year: String(year), Month: pad2(String(month + 1)) };
}

function formatSoshikiStorageFolder(coverageMonth) {
  if (!coverageMonth.Year || !coverageMonth.Month) return "";
  return coverageMonth.Year + "年" + coverageMonth.Month + "月";
}

function buildSoshikiFormSubmissionMembers() {
  var members = [];

  for (var row = 1; row <= MEMBER_ROW_COUNT; row += 1) {
    if (!memberRowHasAnyInput(row)) continue;
    members.push(buildSoshikiFormSubmissionMember(row));
  }

  return members;
}

function mapTransferValueToJson(internalValue) {
  var key = String(internalValue).trim().toLowerCase();
  return SOSHIKI_FORM_TRANSFER_JSON[key] || "";
}

function buildSoshikiFormSubmissionMember(row) {
  var birthYear = getMemberFieldValue(row, "birth-year");
  var birthMonth = pad2(getMemberFieldValue(row, "birth-month"));
  var birthDay = pad2(getMemberFieldValue(row, "birth-day"));
  var postalDigits = extractZipDigits(getMemberFieldValue(row, "postal-code"));

  var member = {
    Row: row,
    Transfer: mapTransferValueToJson(getMemberFieldValue(row, "transfer")),
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

function sanitizeSoshikiFormPdfFileNameSegment(value) {
  return String(value).replace(/[\\/:*?"<>|]/g, "_").trim();
}

function getSoshikiFormPdfDownloadFileName(receiptId) {
  var verified = getSoshikiFormVerifiedUnion();
  var unionName =
    verified && verified.KyosaikaiName
      ? sanitizeSoshikiFormPdfFileNameSegment(verified.KyosaikaiName)
      : "組織共済申込書";
  var applicationDate = readSoshikiApplicationDate();
  var fileNameDate =
    applicationDate.Year && applicationDate.Month && applicationDate.Day
      ? applicationDate.Year + applicationDate.Month + applicationDate.Day
      : "";
  if (!fileNameDate) {
    var today = new Date();
    fileNameDate =
      String(today.getFullYear()) +
      pad2(String(today.getMonth() + 1)) +
      pad2(String(today.getDate()));
  }
  var stem = unionName + "_" + fileNameDate;
  var idSegment = receiptId
    ? sanitizeSoshikiFormPdfFileNameSegment(receiptId)
    : "";
  if (idSegment) {
    stem += "_" + idSegment;
  }
  return stem + ".pdf";
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
  result.replaceChildren();
  result.className = "soshiki-form-send-result";
  result.hidden = true;
}

function promptSoshikiFormPdfSaveAfterSend(receiptId) {
  if (
    !window.confirm(
      "PDFの保存画面（印刷）を開きます。\n送信先を「PDF に保存」にしてください。"
    )
  ) {
    return;
  }
  if (typeof runSoshikiFormPdfSaveAfterSend === "function") {
    runSoshikiFormPdfSaveAfterSend(receiptId);
  }
}

function showSoshikiFormSendSuccess(receiptId) {
  var result = document.getElementById("soshiki-form-send-result");
  if (!result) return;

  result.replaceChildren();
  result.className = "soshiki-form-send-result soshiki-form-send-result--success";
  result.hidden = false;

  function addLine(text) {
    var line = document.createElement("div");
    line.className = "soshiki-form-send-result-line";
    line.textContent = text;
    result.appendChild(line);
  }

  addLine("送信が完了しました。");
  if (receiptId) {
    addLine("受付 ID：" + receiptId);
  }
  addLine(
    "内容を誤って送信した場合は、受付 ID を控えて京滋労働共済までご連絡ください。"
  );

  var pdfButton = document.createElement("button");
  pdfButton.type = "button";
  pdfButton.id = "soshiki-form-pdf-after-send";
  pdfButton.className =
    "btn btn-secondary soshiki-form-send-result-pdf-btn";
  pdfButton.textContent = "PDFを保存";
  pdfButton.addEventListener("click", function () {
    if (typeof runSoshikiFormPdfSaveAfterSend === "function") {
      runSoshikiFormPdfSaveAfterSend(receiptId);
    }
  });
  result.appendChild(pdfButton);
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

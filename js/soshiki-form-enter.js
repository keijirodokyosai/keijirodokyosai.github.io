document.addEventListener("DOMContentLoaded", function () {
  initApplicationDate();
  initCoverageMonthDisplay();
  initSoshikiFormFooterCounts();
  initSoshikiFormUnionStorage();
  initUnionMaster();
  initMemberRows();
  initSoshikiFormLayout();
  initSoshikiFormActions();
});

var SOSHIKI_FORM_FOOTER_CLEAR_FIELD_IDS = [
  "prior-month-headcount",
  "month-total-count",
  "remarks",
];

function initSoshikiFormActions() {
  var clearButton = document.getElementById("soshiki-form-clear");

  if (clearButton) {
    clearButton.addEventListener("click", function () {
      if (!soshikiFormHasClearableInput()) return;
      if (!window.confirm("入力内容をクリアします。よろしいですか？")) return;
      clearAllMemberRows();
      clearSoshikiFormFooterFields();
      applySoshikiFormPageCountDefaults();
      finalizePriorMonthHeadcountAfterFooterReset();
    });
  }
}

/**
 * 送 信成功後の PDF 保存用印刷（送信先「PDF に保存」想定）。§5.9
 */
function printSoshikiFormForPdfSave() {
  var previousTitle = document.title;
  var suggestedTitle = previousTitle;

  if (typeof getSoshikiFormPdfDownloadFileName === "function") {
    suggestedTitle = getSoshikiFormPdfDownloadFileName().replace(/\.pdf$/i, "");
  }

  document.title = suggestedTitle;

  var cleanedUp = false;
  var fallbackTimerId = null;

  function finishPrintSave() {
    if (cleanedUp) return;
    cleanedUp = true;
    if (fallbackTimerId !== null) {
      window.clearTimeout(fallbackTimerId);
      fallbackTimerId = null;
    }
    document.title = previousTitle;
    window.dispatchEvent(new Event("resize"));
    window.removeEventListener("afterprint", finishPrintSave);
  }

  window.addEventListener("afterprint", finishPrintSave);
  fallbackTimerId = window.setTimeout(finishPrintSave, 60000);
  window.setTimeout(function () {
    window.print();
  }, 0);
}

function prepareSoshikiFormSheetForPrint() {
  var sheet = document.querySelector(".soshiki-form-sheet");
  var active = document.activeElement;
  if (active && typeof active.blur === "function") {
    active.blur();
  }
  if (sheet) {
    sheet.style.setProperty("--soshiki-form-scale", "1");
    sheet.style.marginBottom = "0";
  }
}

function soshikiFormFooterFieldsHaveInput() {
  var current = document.getElementById("page-count-current");
  var total = document.getElementById("page-count-total");
  if (current && total) {
    var cur = current.value.trim();
    var tot = total.value.trim();
    if (cur && tot && !(cur === "1" && tot === "1")) return true;
  }

  var prior = document.getElementById("prior-month-headcount");
  if (prior) {
    var priorValue = prior.value.trim();
    if (priorValue && priorValue !== "0") return true;
  }

  var remarks = document.getElementById("remarks");
  if (remarks && remarks.value.trim()) return true;

  return false;
}

function soshikiFormHasClearableInput() {
  return memberRowsHaveAnyInput() || soshikiFormFooterFieldsHaveInput();
}

function clearSoshikiFormFooterFields() {
  SOSHIKI_FORM_FOOTER_CLEAR_FIELD_IDS.forEach(function (id) {
    var field = document.getElementById(id);
    if (!field) return;
    field.value = "";
    field.classList.remove("soshiki-form-field--error");
  });
}

function initSoshikiFormLayout() {
  var wrap = document.querySelector(".soshiki-form-enter-wrap");
  var sheet = document.querySelector(".soshiki-form-sheet");
  if (!wrap || !sheet) return;

  var resizeTimer;

  function updateScale() {
    if (window.SOSHIKI_FORM_CAPTURE_LOCKED) return;

    sheet.style.setProperty("--soshiki-form-scale", "1");
    sheet.style.marginBottom = "";

    var naturalWidth = sheet.offsetWidth;
    var naturalHeight = sheet.offsetHeight;
    var available = wrap.clientWidth;
    if (naturalWidth <= 0 || naturalHeight <= 0 || available <= 0) return;

    var scale = Math.min(1, available / naturalWidth);
    sheet.style.setProperty("--soshiki-form-scale", String(scale));
    if (scale < 1) {
      sheet.style.marginBottom = naturalHeight * (scale - 1) + "px";
    }
  }

  function scheduleUpdate() {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(updateScale, 100);
  }

  updateScale();
  window.addEventListener("resize", scheduleUpdate);

  if (typeof ResizeObserver !== "undefined") {
    var observer = new ResizeObserver(scheduleUpdate);
    observer.observe(wrap);
  }
}

var UNIT_FIELD_IDS = {
  danketsu: "unit-danketsu",
  "soshiki-seimei": "unit-soshiki-seimei",
  "soshiki-iryo": "unit-soshiki-iryo",
  "soshiki-kotsu": "unit-soshiki-kotsu",
  "soshiki-kasai": "unit-soshiki-kasai",
  keicho: "unit-keicho",
  "sogo-kyosai": "unit-sogo-kyosai",
};

var PREMIUM_PER_PERSON_FIELD_ID = "premium-per-person";

var soshikiFormVerifiedUnion = null;

function getSoshikiFormVerifiedUnion() {
  return soshikiFormVerifiedUnion;
}

function initApplicationDate() {
  var yearInput = document.getElementById("application-year");
  var monthInput = document.getElementById("application-month");
  var dayInput = document.getElementById("application-day");

  if (!yearInput || !monthInput || !dayInput) return;
  if (yearInput.value || monthInput.value || dayInput.value) return;

  var today = new Date();

  yearInput.value = String(today.getFullYear());
  monthInput.value = String(today.getMonth() + 1).padStart(2, "0");
  dayInput.value = String(today.getDate()).padStart(2, "0");
}

function initCoverageMonthDisplay() {
  var monthInput = document.getElementById("application-month");
  var coverageMonthInput = document.getElementById("coverage-month-display");
  if (!monthInput || !coverageMonthInput) return;

  function updateCoverageMonthDisplay() {
    var month = parseInt(String(monthInput.value).trim(), 10);
    if (!Number.isFinite(month) || month < 1 || month > 12) {
      coverageMonthInput.value = "";
      return;
    }
    coverageMonthInput.value = String(month === 12 ? 1 : month + 1);
  }

  monthInput.addEventListener("input", updateCoverageMonthDisplay);
  monthInput.addEventListener("change", updateCoverageMonthDisplay);
  updateCoverageMonthDisplay();
}

function initUnionMaster() {
  var unionNameInput = document.getElementById("union-name");
  if (!unionNameInput) return;

  var masterState = {
    unionsByName: new Map(),
    kyosaiMap: null,
    ready: false,
  };

  unionNameInput.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    tryConfirmUnionNameFromInput(unionNameInput.value, masterState);
  });

  unionNameInput.addEventListener("input", function (event) {
    if (event.inputType !== "insertReplacementText") return;
    tryConfirmUnionNameFromInput(unionNameInput.value, masterState);
  });

  unionNameInput.addEventListener("change", function () {
    var name = unionNameInput.value.trim();
    if (!name || isUnionNameAlreadyVerified(name)) return;
    if (!masterState.ready) return;
    if (!masterState.unionsByName.has(name) && !isSavedUnionName(name)) return;
    tryConfirmUnionNameFromInput(name, masterState);
  });

  Promise.all([
    fetchJson("/data/union-master.json"),
    fetchJson("/data/form-kyosai-map.json"),
  ])
    .then(function (results) {
      var unionMaster = results[0];
      var kyosaiMap = results[1];

      (unionMaster.unions || []).forEach(function (union) {
        if (!union || !union.KyosaikaiName) return;
        masterState.unionsByName.set(union.KyosaikaiName, union);
      });

      masterState.kyosaiMap = kyosaiMap;
      masterState.ready = true;
    })
    .catch(function (error) {
      console.error("組合マスタの読み込みに失敗しました:", error);
      window.alert("組合マスタの読み込みに失敗しました。ページを再読み込みしてください。");
    });
}

function fetchJson(url) {
  return fetch(url).then(function (response) {
    if (!response.ok) {
      throw new Error("HTTP " + response.status + " for " + url);
    }
    return response.json();
  });
}

function isUnionNameAlreadyVerified(name) {
  var verified = getSoshikiFormVerifiedUnion();
  return Boolean(verified && verified.KyosaikaiName === name);
}

function tryConfirmUnionNameFromInput(rawName, masterState) {
  var name = String(rawName).trim();
  if (!name) {
    clearUnionRelatedFields();
    return;
  }
  if (!masterState.ready) {
    window.alert("組合マスタを読み込み中です。しばらくしてから再度 Enter してください。");
    return;
  }
  if (isUnionNameAlreadyVerified(name)) return;
  handleUnionNameEnter(name, masterState);
}

function handleUnionNameEnter(rawName, masterState) {
  var name = rawName.trim();
  if (!name) {
    clearUnionRelatedFields();
    return;
  }

  // Subbranch.KyosaikaiName（union-master.json）と完全一致
  var union = masterState.unionsByName.get(name);
  if (!union) {
    window.alert("その組合名は京滋労働共済に登録されていません");
    clearUnionRelatedFields();
    return;
  }

  applyUnionData(union, masterState.kyosaiMap);
  promptAddSavedUnionName(union.KyosaikaiName);
}

function clearUnionRelatedFields() {
  soshikiFormVerifiedUnion = null;
  setFieldValue("union-name", "");
  setFieldValue("industry-code", "");
  setFieldValue("branch-code", "");
  setFieldValue("subbranch-code", "");
  clearKuchiFields();
  setFieldValue(PREMIUM_PER_PERSON_FIELD_ID, "");
}

function clearKuchiFields() {
  Object.keys(UNIT_FIELD_IDS).forEach(function (formKey) {
    setFieldValue(UNIT_FIELD_IDS[formKey], "");
  });
}

function applyUnionData(union, kyosaiMap) {
  soshikiFormVerifiedUnion = {
    KyosaikaiCode: union.KyosaikaiCode || "",
    KyosaikaiName: union.KyosaikaiName || "",
    IndustryCode: union.IndustryCode || "",
    BranchCode: union.BranchCode || "",
    SubbranchCode: union.SubbranchCode || "",
  };
  setFieldValue("union-name", union.KyosaikaiName);
  setFieldValue("industry-code", union.IndustryCode || "");
  setFieldValue("branch-code", union.BranchCode || "");
  setFieldValue("subbranch-code", union.SubbranchCode || "");
  applyFormKuchiToDom(computeFormKuchi(union, kyosaiMap));
  applyPriorMonthHeadcountCarryForward();
  ensurePriorMonthHeadcountDefault();
  recalcSoshikiFormTsukiKeiCount();
}

function applyFormKuchiToDom(result) {
  if (!result) {
    clearKuchiFields();
    setFieldValue(PREMIUM_PER_PERSON_FIELD_ID, "");
    return;
  }

  Object.keys(UNIT_FIELD_IDS).forEach(function (formKey) {
    var value = result.formKuchi && result.formKuchi[formKey];
    setFieldValue(UNIT_FIELD_IDS[formKey], value || "");
  });

  var kakekin = result.KakekinPerPerson;
  setFieldValue(
    PREMIUM_PER_PERSON_FIELD_ID,
    kakekin != null && kakekin !== "" ? String(kakekin) : ""
  );
}

function setFieldValue(id, value) {
  var field = document.getElementById(id);
  if (field) field.value = value;
}

function computeFormKuchi(union, kyosaiMap) {
  if (!union || !kyosaiMap) return null;

  var rows = (union.Kyosai || []).map(function (item) {
    return {
      kyosaiId: item.KyosaiId,
      units: Number(item.Units),
    };
  });

  var displayUnitsByKyosaiId = new Map();

  rows.forEach(function (row) {
    if (!row.kyosaiId || Number.isNaN(row.units)) return;
    var units = applyKyosaiDisplayRule(row.kyosaiId, row.units, kyosaiMap);
    displayUnitsByKyosaiId.set(
      row.kyosaiId,
      (displayUnitsByKyosaiId.get(row.kyosaiId) || 0) + units
    );
  });

  applySuppressRules(displayUnitsByKyosaiId, kyosaiMap.suppressKyosaiWhenPresent);

  var isSogoPackage = (kyosaiMap.sogoCollectiveKyosaiIds || []).indexOf(
    union.CollectiveKyosaiId
  ) !== -1;

  if (isSogoPackage) {
    (kyosaiMap.sogoHiddenKyosaiIds || []).forEach(function (kyosaiId) {
      displayUnitsByKyosaiId.delete(kyosaiId);
    });
  }

  var formKuchi = {};
  (kyosaiMap.formFields || []).forEach(function (field) {
    if (!field.formKey || !field.kyosaiIds) return;
    var total = 0;
    field.kyosaiIds.forEach(function (kyosaiId) {
      total += displayUnitsByKyosaiId.get(kyosaiId) || 0;
    });
    formKuchi[field.formKey] = total > 0 ? formatKuchi(total) : "";
  });

  var sogoField = (kyosaiMap.formFields || []).find(function (field) {
    return field.formKey === "sogo-kyosai";
  });
  formKuchi["sogo-kyosai"] = isSogoPackage
    ? String((sogoField && sogoField.displayKuchi) || 1)
    : "";

  return {
    formKuchi: formKuchi,
    KakekinPerPerson: union.KakekinPerPerson,
  };
}

function applyKyosaiDisplayRule(kyosaiId, units, kyosaiMap) {
  var keichoField = (kyosaiMap.formFields || []).find(function (field) {
    return field.formKey === "keicho";
  });
  var rules = (keichoField && keichoField.kyosaiDisplayRules) || {};
  var rule = rules[String(kyosaiId)] || rules[kyosaiId];

  if (!rule || rule.type !== "unitsMultiply") return units;
  return units * Number(rule.factor);
}

function applySuppressRules(displayUnitsByKyosaiId, suppressRules) {
  if (!suppressRules) return;

  Object.keys(suppressRules).forEach(function (triggerId) {
    var triggerKyosaiId = Number(triggerId);
    if (!displayUnitsByKyosaiId.has(triggerKyosaiId)) return;
    (suppressRules[triggerId] || []).forEach(function (hiddenId) {
      displayUnitsByKyosaiId.delete(Number(hiddenId));
    });
  });
}

function formatKuchi(value) {
  if (Number.isInteger(value)) return String(value);
  return String(value);
}

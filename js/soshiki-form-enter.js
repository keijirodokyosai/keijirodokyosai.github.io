document.addEventListener("DOMContentLoaded", function () {
  initApplicationDate();
  initTougetsuMonth();
  initSoshikiFormUnionStorage();
  initUnionMaster();
  initMemberRows();
  initSoshikiFormLayout();
  initSoshikiFormActions();
});

var SOSHIKI_FORM_FOOTER_CLEAR_FIELD_IDS = [
  "page-count-current",
  "page-count-total",
  "zengetsu-zan-count",
  "tsuki-kei-count",
  "biko-remarks",
];

function initSoshikiFormActions() {
  var clearButton = document.getElementById("soshiki-form-clear");
  var saveButton = document.getElementById("soshiki-form-save-pdf");

  if (clearButton) {
    clearButton.addEventListener("click", function () {
      if (!soshikiFormHasClearableInput()) return;
      if (!window.confirm("入力内容をクリアします。よろしいですか？")) return;
      clearAllMemberRows();
      clearSoshikiFormFooterFields();
    });
  }

  if (saveButton) {
    saveButton.addEventListener("click", printSoshikiFormSheet);
  }
}

function printSoshikiFormSheet() {
  var body = document.body;
  var sheet = document.querySelector(".soshiki-form-sheet");
  var active = document.activeElement;
  if (active && typeof active.blur === "function") {
    active.blur();
  }

  if (sheet) {
    sheet.style.setProperty("--soshiki-form-scale", "1");
    sheet.style.marginBottom = "0";
  }

  body.classList.add("soshiki-form-printing");

  function cleanup() {
    body.classList.remove("soshiki-form-printing");
    window.dispatchEvent(new Event("resize"));
  }

  window.addEventListener(
    "afterprint",
    function onAfterPrint() {
      cleanup();
      window.removeEventListener("afterprint", onAfterPrint);
    },
    { once: true }
  );

  window.print();
}

function soshikiFormFooterFieldsHaveInput() {
  for (var i = 0; i < SOSHIKI_FORM_FOOTER_CLEAR_FIELD_IDS.length; i += 1) {
    var field = document.getElementById(SOSHIKI_FORM_FOOTER_CLEAR_FIELD_IDS[i]);
    if (field && field.value.trim()) return true;
  }
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

var KUCHI_FIELD_IDS = {
  danketsu: "kuchi-danketsu",
  "soshiki-seimei": "kuchi-soshiki-seimei",
  "soshiki-iryo": "kuchi-soshiki-iryo",
  "soshiki-kotsu": "kuchi-soshiki-kotsu",
  "soshiki-kasai": "kuchi-soshiki-kasai",
  keicho: "kuchi-keicho",
  "sogo-kyosai": "kuchi-sogo-kyosai",
};

var KAKEKIN_FIELD_ID = "kakekin-per-person";

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

function initTougetsuMonth() {
  var monthInput = document.getElementById("application-month");
  var tougetsuInput = document.getElementById("tougetsu-count");
  if (!monthInput || !tougetsuInput) return;

  function updateTougetsuMonth() {
    var month = parseInt(String(monthInput.value).trim(), 10);
    if (!Number.isFinite(month) || month < 1 || month > 12) {
      tougetsuInput.value = "";
      return;
    }
    tougetsuInput.value = String(month === 12 ? 1 : month + 1);
  }

  monthInput.addEventListener("input", updateTougetsuMonth);
  monthInput.addEventListener("change", updateTougetsuMonth);
  updateTougetsuMonth();
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
  setFieldValue(KAKEKIN_FIELD_ID, "");
}

function clearKuchiFields() {
  Object.keys(KUCHI_FIELD_IDS).forEach(function (formKey) {
    setFieldValue(KUCHI_FIELD_IDS[formKey], "");
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
}

function applyFormKuchiToDom(result) {
  if (!result) {
    clearKuchiFields();
    setFieldValue(KAKEKIN_FIELD_ID, "");
    return;
  }

  Object.keys(KUCHI_FIELD_IDS).forEach(function (formKey) {
    var value = result.formKuchi && result.formKuchi[formKey];
    setFieldValue(KUCHI_FIELD_IDS[formKey], value || "");
  });

  var kakekin = result.KakekinPerPerson;
  setFieldValue(
    KAKEKIN_FIELD_ID,
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

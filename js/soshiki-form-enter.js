document.addEventListener("DOMContentLoaded", function () {
  initApplicationDate();
  initUnionMaster();
  initMemberRows();
});

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
    if (!masterState.ready) {
      window.alert("組合マスタを読み込み中です。しばらくしてから再度 Enter してください。");
      return;
    }
    handleUnionNameEnter(unionNameInput.value, masterState);
  });

  Promise.all([
    fetchJson("/data/union-master.json"),
    fetchJson("/data/form-kyosai-map.json"),
  ])
    .then(function (results) {
      var unionMaster = results[0];
      var kyosaiMap = results[1];

      (unionMaster.unions || []).forEach(function (union) {
        if (!union || !union.name) return;
        // union.name = Subbranch.KyosaikaiName（完全一致キー）
        masterState.unionsByName.set(union.name, union);
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

function handleUnionNameEnter(rawName, masterState) {
  var name = rawName.trim();
  if (!name) {
    clearUnionRelatedFields();
    return;
  }

  // Subbranch.KyosaikaiName（union-master.json の name）と完全一致
  var union = masterState.unionsByName.get(name);
  if (!union) {
    window.alert("その組合名は京滋労働共済に登録されていません");
    clearUnionRelatedFields();
    return;
  }

  applyUnionData(union, masterState.kyosaiMap);
}

function clearUnionRelatedFields() {
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
  setFieldValue("union-name", union.name);
  setFieldValue("industry-code", union.industry || "");
  setFieldValue("branch-code", union.branch || "");
  setFieldValue("subbranch-code", union.subbranch || "");
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

  var kakekin = result.kakekinPerPerson;
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

  var rows = (union.kyosai || []).map(function (item) {
    return {
      kyosaiId: item.kyosaiId,
      units: Number(item.kuchi),
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
    union.collectiveKyosaiId
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
    kakekinPerPerson: union.kakekinPerPerson,
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

/**
 * 組織共済申込書 — 前月残の持ち越し（直近月計）・月計の自動計算・localStorage 記録
 */

var SOSHIKI_FORM_TSUKI_KEI_SNAPSHOTS_KEY = "soshiki-form-tsuki-kei-snapshots";

function padCoverageMonth2(value) {
  var s = String(value).trim();
  if (s.length === 1) return "0" + s;
  return s;
}

function readSoshikiFormApplicationDateFields() {
  var yearEl = document.getElementById("application-year");
  var monthEl = document.getElementById("application-month");
  var dayEl = document.getElementById("application-day");
  if (!yearEl || !monthEl || !dayEl) {
    return { year: "", month: "", day: "" };
  }
  return {
    year: String(yearEl.value).trim(),
    month: padCoverageMonth2(monthEl.value),
    day: padCoverageMonth2(dayEl.value),
  };
}

function computeSoshikiFormCoverageMonth(applicationDate) {
  var year = parseInt(applicationDate.year, 10);
  var month = parseInt(applicationDate.month, 10);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return { year: "", month: "" };
  }

  if (month === 12) {
    return { year: String(year + 1), month: "01" };
  }

  return { year: String(year), month: padCoverageMonth2(String(month + 1)) };
}

function getSoshikiFormCoverageMonthFromApplicationDate() {
  return computeSoshikiFormCoverageMonth(readSoshikiFormApplicationDateFields());
}

function formatSoshikiFormCoverageMonthKey(coverageMonth) {
  if (!coverageMonth.year || !coverageMonth.month) return "";
  return coverageMonth.year + "-" + padCoverageMonth2(coverageMonth.month);
}

var TSUKI_KEI_COVERAGE_MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

function loadTsukiKeiSnapshotStore() {
  try {
    var raw = window.localStorage.getItem(SOSHIKI_FORM_TSUKI_KEI_SNAPSHOTS_KEY);
    if (!raw) return {};
    var parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.error("月計スナップショットの読み込みに失敗しました:", error);
    return {};
  }
}

function saveTsukiKeiSnapshotStore(store) {
  window.localStorage.setItem(
    SOSHIKI_FORM_TSUKI_KEI_SNAPSHOTS_KEY,
    JSON.stringify(store)
  );
}

function normalizeTsukiKeiSnapshotEntry(raw) {
  if (!raw || typeof raw !== "object") return null;

  if (typeof raw.tsukiKei === "string" && raw.coverageMonth) {
    var tsukiKei = String(raw.tsukiKei).trim();
    var coverageMonth = String(raw.coverageMonth).trim();
    if (!tsukiKei || !coverageMonth) return null;
    return { tsukiKei: tsukiKei, coverageMonth: coverageMonth };
  }

  var legacyKeys = Object.keys(raw)
    .filter(function (key) {
      return TSUKI_KEI_COVERAGE_MONTH_KEY_PATTERN.test(key);
    })
    .sort();
  if (legacyKeys.length === 0) return null;

  var lastKey = legacyKeys[legacyKeys.length - 1];
  var legacyValue = String(raw[lastKey]).trim();
  if (!legacyValue) return null;
  return { tsukiKei: legacyValue, coverageMonth: lastKey };
}

function loadLatestTsukiKeiSnapshot(kyosaikaiCode) {
  if (!kyosaikaiCode) return null;
  var store = loadTsukiKeiSnapshotStore();
  return normalizeTsukiKeiSnapshotEntry(store[kyosaikaiCode]);
}

function saveTsukiKeiSnapshot(kyosaikaiCode, coverageMonthKey, tsukiKeiValue) {
  if (!kyosaikaiCode || !coverageMonthKey) return;
  var store = loadTsukiKeiSnapshotStore();
  var trimmed = String(tsukiKeiValue).trim();
  if (!trimmed) {
    delete store[kyosaikaiCode];
  } else {
    store[kyosaikaiCode] = {
      tsukiKei: trimmed,
      coverageMonth: coverageMonthKey,
    };
  }
  saveTsukiKeiSnapshotStore(store);
}

function parseZengetsuZanCountValue(raw) {
  var trimmed = String(raw).trim();
  if (!trimmed) return 0;
  var value = parseInt(trimmed, 10);
  if (!Number.isFinite(value)) return NaN;
  return value;
}

function countMemberTransferDelta() {
  var added = 0;
  var removed = 0;

  for (var row = 1; row <= MEMBER_ROW_COUNT; row += 1) {
    var field = getMemberField(row, "transfer");
    if (!field) continue;
    var transfer = field.value;
    if (transfer === "new") added += 1;
    else if (transfer === "cancel") removed += 1;
  }

  return added - removed;
}

function recalcSoshikiFormTsukiKeiCount() {
  var priorInput = document.getElementById("prior-month-headcount");
  var monthTotalInput = document.getElementById("month-total-count");
  if (!priorInput || !monthTotalInput) return;

  var prior = parsePriorMonthHeadcountValue(priorInput.value);
  if (Number.isNaN(prior)) {
    monthTotalInput.value = "";
    return;
  }

  var total = prior + countMemberTransferDelta();
  if (total < 0) total = 0;
  monthTotalInput.value = String(total);
}

function parsePriorMonthHeadcountValue(raw) {
  return parseZengetsuZanCountValue(raw);
}

function ensurePriorMonthHeadcountDefault() {
  var priorInput = document.getElementById("prior-month-headcount");
  if (!priorInput) return;
  if (String(priorInput.value).trim()) return;
  priorInput.value = "0";
}

function applyPriorMonthHeadcountCarryForward() {
  var union = getSoshikiFormVerifiedUnion();
  var priorInput = document.getElementById("prior-month-headcount");
  if (!union || !union.KyosaikaiCode || !priorInput) return;

  var coverage = getSoshikiFormCoverageMonthFromApplicationDate();
  var coverageKey = formatSoshikiFormCoverageMonthKey(coverage);
  if (!coverageKey) return;

  var snapshot = loadLatestTsukiKeiSnapshot(union.KyosaikaiCode);
  if (!snapshot || !snapshot.tsukiKei) return;
  if (snapshot.coverageMonth >= coverageKey) return;

  priorInput.value = snapshot.tsukiKei;
  recalcSoshikiFormTsukiKeiCount();
}

/** @deprecated 呼び出し互換 */
function applySoshikiFormZengetsuCarryForward() {
  applyPriorMonthHeadcountCarryForward();
}

function finalizePriorMonthHeadcountAfterFooterReset() {
  applyPriorMonthHeadcountCarryForward();
  ensurePriorMonthHeadcountDefault();
  recalcSoshikiFormTsukiKeiCount();
}

function recordSoshikiFormTsukiKeiSnapshot() {
  var union = getSoshikiFormVerifiedUnion();
  if (!union || !union.KyosaikaiCode) return;

  var coverage = getSoshikiFormCoverageMonthFromApplicationDate();
  var coverageKey = formatSoshikiFormCoverageMonthKey(coverage);
  if (!coverageKey) return;

  var monthTotalInput = document.getElementById("month-total-count");
  if (!monthTotalInput) return;

  saveTsukiKeiSnapshot(
    union.KyosaikaiCode,
    coverageKey,
    monthTotalInput.value
  );
}

function initSoshikiFormPageCountDefaults() {
  var current = document.getElementById("page-count-current");
  var total = document.getElementById("page-count-total");
  if (!current || !total) return;
  if (!String(current.value).trim()) current.value = "1";
  if (!String(total.value).trim()) total.value = "1";
}

function applySoshikiFormPageCountDefaults() {
  var current = document.getElementById("page-count-current");
  var total = document.getElementById("page-count-total");
  if (current) current.value = "1";
  if (total) total.value = "1";
}

function initSoshikiFormFooterCounts() {
  var monthTotalInput = document.getElementById("month-total-count");
  if (monthTotalInput) {
    monthTotalInput.readOnly = true;
  }

  var priorInput = document.getElementById("prior-month-headcount");
  if (priorInput) {
    priorInput.addEventListener("input", recalcSoshikiFormTsukiKeiCount);
    priorInput.addEventListener("change", recalcSoshikiFormTsukiKeiCount);
  }

  ["application-year", "application-month", "application-day"].forEach(function (
    id
  ) {
    var field = document.getElementById(id);
    if (!field) return;
    field.addEventListener("change", function () {
      applyPriorMonthHeadcountCarryForward();
      ensurePriorMonthHeadcountDefault();
      recalcSoshikiFormTsukiKeiCount();
    });
    field.addEventListener("input", function () {
      applyPriorMonthHeadcountCarryForward();
      ensurePriorMonthHeadcountDefault();
      recalcSoshikiFormTsukiKeiCount();
    });
  });

  initSoshikiFormPageCountDefaults();
  applyPriorMonthHeadcountCarryForward();
  ensurePriorMonthHeadcountDefault();
  recalcSoshikiFormTsukiKeiCount();
}

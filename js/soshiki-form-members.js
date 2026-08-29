/**
 * 組合員入力欄（最大5名）: 異動内容トグル・半角制限・blur 正規化・郵便番号検索
 */

var MEMBER_ROW_COUNT = 5;
var HALF_WIDTH_KANA_PATTERN = /[^ｦ-ﾟ]/g;
var ZIPCLOUD_API = "https://zipcloud.ibsnet.co.jp/api/search";
var ZIP_MULTIPLE_RESULTS_MESSAGE =
  "入力の郵便番号には、複数の住所候補があります。表示された住所が異なる場合は手入力でお願いします。";

var ADDRESS_GROUP_FIELD_SUFFIXES = [
  "postal-code",
  "prefecture",
  "city",
  "town-area",
  "area-number",
];

var lastPostalCodeLookupByRow = {};

var ADDRESS_FONT_FIT_SUFFIXES = [
  "prefecture",
  "city",
  "town-area",
  "area-number",
  "building-name",
];

var ADDRESS_FONT_FIT_SELECTOR =
  ".soshiki-form-member-prefecture, .soshiki-form-member-city, .soshiki-form-member-town-area, .soshiki-form-member-area-number, .soshiki-form-member-building-name";

function initMemberRows() {
  initIdouButtons();
  initGenderButtons();
  initUnionMemberCodeFields();
  initHalfWidthInputs();
  initZipFields();
  initZipLookup();
  initTownAreaFields();
  initAddressFieldFontFit();
  fitAllAddressFieldFonts();
}

function memberFieldId(row, suffix) {
  return "member-" + row + "-" + suffix;
}

function getMemberField(row, suffix) {
  return document.getElementById(memberFieldId(row, suffix));
}

function initIdouButtons() {
  document.querySelectorAll(".soshiki-form-idou-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      var row = button.getAttribute("data-row");
      var idou = button.getAttribute("data-idou");
      var hidden = getMemberField(row, "idou");
      if (!hidden) return;

      var isSelected = button.classList.contains("is-selected");
      clearIdouSelection(row);

      if (!isSelected) {
        hidden.value = idou;
        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");
      } else {
        hidden.value = "";
      }
    });
  });
}

function clearIdouSelection(row) {
  var hidden = getMemberField(row, "idou");
  if (hidden) hidden.value = "";

  document
    .querySelectorAll('.soshiki-form-idou-btn[data-row="' + row + '"]')
    .forEach(function (button) {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    });
}

function initGenderButtons() {
  document.querySelectorAll(".soshiki-form-gender-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      var row = button.getAttribute("data-row");
      var gender = button.getAttribute("data-gender");
      var hidden = getMemberField(row, "gender");
      if (!hidden) return;

      var isSelected = button.classList.contains("is-selected");
      clearGenderSelection(row);

      if (!isSelected) {
        hidden.value = gender;
        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");
      }
    });
  });
}

function clearGenderSelection(row) {
  var hidden = getMemberField(row, "gender");
  if (hidden) hidden.value = "";

  document
    .querySelectorAll('.soshiki-form-gender-btn[data-row="' + row + '"]')
    .forEach(function (button) {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    });
}

function initUnionMemberCodeFields() {
  document.querySelectorAll(".soshiki-form-member-union-member-code").forEach(function (input) {
    var composing = false;

    input.addEventListener("compositionstart", function () {
      composing = true;
    });
    input.addEventListener("compositionend", function () {
      composing = false;
      filterUnionMemberCodeInput(input);
    });

    input.addEventListener("input", function () {
      if (composing) return;
      filterUnionMemberCodeInput(input);
    });

    input.addEventListener("blur", function () {
      normalizeUnionMemberCodeField(input);
    });
  });
}

function filterUnionMemberCodeInput(input) {
  var digits = toHalfWidthDigits(input.value).replace(/[^0-9]/g, "").slice(0, 6);
  input.value = digits;
}

function normalizeUnionMemberCodeField(input) {
  var digits = toHalfWidthDigits(input.value).replace(/[^0-9]/g, "");

  if (!digits) {
    input.value = "";
    setFieldError(input, false);
    return;
  }

  input.value = digits.slice(0, 6).padStart(6, "0");
  setFieldError(input, false);
}

function initHalfWidthInputs() {
  document.querySelectorAll("[data-halfwidth-kana]").forEach(function (input) {
    if (input.classList.contains("soshiki-form-member-union-member-code")) return;

    var composing = false;

    input.addEventListener("compositionstart", function () {
      composing = true;
    });
    input.addEventListener("compositionend", function () {
      composing = false;
      filterHalfWidthKana(input);
    });

    input.addEventListener("input", function () {
      if (composing) return;
      filterHalfWidthKana(input);
    });

    input.addEventListener("blur", function () {
      filterHalfWidthKana(input);
      if (input.value && HALF_WIDTH_KANA_PATTERN.test(input.value)) {
        setFieldError(input, true);
      } else {
        setFieldError(input, false);
      }
    });
  });

  document.querySelectorAll("[data-halfwidth-numeric]").forEach(function (input) {
    if (input.classList.contains("soshiki-form-member-union-member-code")) return;

    var composing = false;
    var maxDigits = Number(input.getAttribute("data-max-digits")) || 99;

    input.addEventListener("compositionstart", function () {
      composing = true;
    });
    input.addEventListener("compositionend", function () {
      composing = false;
      filterHalfWidthNumeric(input, maxDigits);
    });

    input.addEventListener("input", function () {
      if (composing) return;
      filterHalfWidthNumeric(input, maxDigits);
    });

    input.addEventListener("blur", function () {
      filterHalfWidthNumeric(input, maxDigits);
      if (input.hasAttribute("data-pad-2")) {
        padTwoDigitField(input);
      }
      if (input.hasAttribute("data-birth-part")) {
        validateBirthDateForRow(getRowFromField(input));
      }
    });
  });
}

function filterHalfWidthKana(input) {
  var before = input.value;
  var filtered = before.replace(HALF_WIDTH_KANA_PATTERN, "");
  if (filtered !== before) {
    input.value = filtered;
  }
}

function filterHalfWidthNumeric(input, maxDigits) {
  var normalized = toHalfWidthDigits(input.value).replace(/[^0-9]/g, "");
  if (normalized.length > maxDigits) {
    normalized = normalized.slice(0, maxDigits);
  }
  input.value = normalized;
}

function padTwoDigitField(input) {
  if (!input.value) return;
  var num = Number(input.value);
  if (Number.isNaN(num) || num < 1 || num > 99) return;
  input.value = String(num).padStart(2, "0");
}

function validateBirthDateForRow(row) {
  if (!row) return true;

  var yearInput = getMemberField(row, "birth-year");
  var monthInput = getMemberField(row, "birth-month");
  var dayInput = getMemberField(row, "birth-day");
  if (!yearInput || !monthInput || !dayInput) return true;

  var year = yearInput.value.trim();
  var month = monthInput.value.trim();
  var day = dayInput.value.trim();

  [yearInput, monthInput, dayInput].forEach(function (field) {
    setFieldError(field, false);
  });

  if (!year && !month && !day) return true;
  if (!year || !month || !day) return true;

  if (year.length !== 4) {
    setFieldError(yearInput, true);
    return false;
  }

  var y = Number(year);
  var m = Number(month);
  var d = Number(day);
  var date = new Date(y, m - 1, d);
  var valid =
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d;

  if (!valid) {
    setFieldError(yearInput, true);
    setFieldError(monthInput, true);
    setFieldError(dayInput, true);
    return false;
  }

  return true;
}

function initZipFields() {
  document.querySelectorAll("[data-zip-field]").forEach(function (input) {
    var composing = false;

    input.addEventListener("compositionstart", function () {
      composing = true;
    });
    input.addEventListener("compositionend", function () {
      composing = false;
      applyZipFieldValue(input);
    });

    input.addEventListener("input", function () {
      if (composing) return;
      applyZipFieldValue(input);
    });

    input.addEventListener("blur", function () {
      applyZipFieldValue(input);
    });

    updateZipView(input);
  });
}

function updateZipView(input) {
  var wrap = input.closest(".soshiki-form-member-zip-wrap");
  if (!wrap) return;

  var view = wrap.querySelector(".soshiki-form-member-zip-view");
  if (!view) return;

  var digits = extractZipDigits(input.value);
  if (!digits) {
    view.textContent = "";
    return;
  }

  var html =
    '<span class="soshiki-form-member-zip-part">' + digits.slice(0, 3) + "</span>";
  if (digits.length > 3) {
    html += '<span class="soshiki-form-member-zip-hyphen">-</span>';
    html +=
      '<span class="soshiki-form-member-zip-part">' + digits.slice(3) + "</span>";
  }

  view.innerHTML = html;
}

function extractZipDigits(value) {
  return toHalfWidthDigits(value).replace(/[^0-9]/g, "").slice(0, 7);
}

function formatZipCode(digits) {
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  return digits.slice(0, 3) + "-" + digits.slice(3);
}

function applyZipFieldValue(input) {
  var selectionStart = input.selectionStart;
  var digitsBeforeCursor = extractZipDigits(
    input.value.slice(0, selectionStart)
  ).length;
  var digits = extractZipDigits(input.value);
  var formatted = formatZipCode(digits);

  input.value = formatted;

  var nextCursor = 0;
  var digitsSeen = 0;
  for (var i = 0; i < formatted.length; i += 1) {
    if (formatted.charAt(i) !== "-") {
      digitsSeen += 1;
    }
    nextCursor = i + 1;
    if (digitsSeen >= digitsBeforeCursor) break;
  }

  if (typeof input.setSelectionRange === "function") {
    input.setSelectionRange(nextCursor, nextCursor);
  }

  updateZipView(input);
}

function initZipLookup() {
  document.querySelectorAll("[data-zip-lookup]").forEach(function (input) {
    input.addEventListener("blur", function () {
      lookupAddressFromZip(getRowFromField(input));
    });
  });
}

function clearManualAddressFields(row) {
  var areaNumber = getMemberField(row, "area-number");
  var buildingName = getMemberField(row, "building-name");
  if (areaNumber) areaNumber.value = "";
  if (buildingName) buildingName.value = "";
}

function setAddressFieldsFromZipcloud(row, chosen) {
  var prefecture = getMemberField(row, "prefecture");
  var city = getMemberField(row, "city");
  var townArea = getMemberField(row, "town-area");
  var prefectureValue = chosen.address1 || "";
  if (prefecture) prefecture.value = prefectureValue;
  if (city) city.value = chosen.address2 || "";
  if (townArea) {
    townArea.value = normalizeTownAreaValue(prefectureValue, chosen.address3 || "");
  }
  fitAddressFieldsForRow(row);
}

function getMemberBoxFontLimits(input) {
  var sheet = input ? input.closest(".soshiki-form-sheet") : null;
  if (!sheet) {
    return { max: 15, min: 10 };
  }

  var styles = getComputedStyle(sheet);
  var max =
    parseFloat(styles.getPropertyValue("--soshiki-form-member-box-font-size")) || 15;
  var min =
    parseFloat(styles.getPropertyValue("--soshiki-form-member-box-font-size-min")) ||
    10;

  if (min > max) {
    min = max;
  }

  return { max: max, min: min };
}

function fitAddressFieldFont(input) {
  if (!input) return;

  if (!input.value) {
    input.style.fontSize = "";
    return;
  }

  var limits = getMemberBoxFontLimits(input);
  input.style.fontSize = limits.max + "px";

  if (input.scrollWidth <= input.clientWidth) {
    return;
  }

  for (var size = limits.max - 1; size >= limits.min; size -= 1) {
    input.style.fontSize = size + "px";
    if (input.scrollWidth <= input.clientWidth) {
      return;
    }
  }

  input.style.fontSize = limits.min + "px";
}

function fitAddressFieldsForRow(row) {
  ADDRESS_FONT_FIT_SUFFIXES.forEach(function (suffix) {
    fitAddressFieldFont(getMemberField(row, suffix));
  });
}

function fitAllAddressFieldFonts() {
  document.querySelectorAll(ADDRESS_FONT_FIT_SELECTOR).forEach(function (input) {
    fitAddressFieldFont(input);
  });
}

function initAddressFieldFontFit() {
  document.querySelectorAll(ADDRESS_FONT_FIT_SELECTOR).forEach(function (input) {
    input.addEventListener("input", function () {
      fitAddressFieldFont(input);
    });
  });
}

function initTownAreaFields() {
  document.querySelectorAll(".soshiki-form-member-town-area").forEach(function (input) {
    input.addEventListener("blur", function () {
      normalizeTownAreaField(input);
    });
  });
}

function normalizeTownAreaField(input) {
  var row = getRowFromField(input);
  var prefecture = getMemberField(row, "prefecture");
  var prefectureValue = prefecture ? prefecture.value.trim() : "";
  var normalized = normalizeTownAreaValue(prefectureValue, input.value);
  if (normalized !== input.value) {
    input.value = normalized;
  }
  fitAddressFieldFont(input);
}

/**
 * 住所3（町村域）の正規化。
 * - 全国: （…）・(…) のカッコ書きを除去
 * - 京都府のみ: 通り名（…下る/上る/東入等の手前）を除去し、町域名部分を残す
 */
function normalizeTownAreaValue(prefecture, rawValue) {
  if (!rawValue) return "";

  var value = stripParentheticalFromTownArea(rawValue);
  if (prefecture === "京都府") {
    value = stripKyotoStreetNameFromTownArea(value);
  }
  return value.trim();
}

function stripParentheticalFromTownArea(value) {
  var result = value;
  var previous;
  do {
    previous = result;
    result = result.replace(/（[^）]*）/g, "").replace(/\([^)]*\)/g, "");
  } while (result !== previous);
  return result.trim();
}

function stripKyotoStreetNameFromTownArea(value) {
  if (!value) return "";

  var directionalMatch = value.match(/(?:下る|上る|東入|西入|南入|北入)(.+)$/);
  if (directionalMatch) {
    return directionalMatch[1].trim();
  }

  // 通り名のみで町域名がない address3（例: 「河原町通」）は空にして手入力を促す
  if (/通/.test(value)) {
    return "";
  }

  return value.trim();
}

function lookupAddressFromZip(row) {
  var zipInput = getMemberField(row, "postal-code");
  if (!zipInput) return;

  var digits = extractZipDigits(zipInput.value);
  if (digits.length !== 7) return;

  zipInput.value = formatZipCode(digits);
  updateZipView(zipInput);

  var previousDigits = lastPostalCodeLookupByRow[row] || "";
  var postalCodeChanged = previousDigits !== digits;

  fetch(ZIPCLOUD_API + "?zipcode=" + encodeURIComponent(digits))
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (!data || data.status !== 200 || !data.results || !data.results.length) {
        return;
      }

      var results = data.results;
      var chosen = results[0];
      if (results.length > 1) {
        window.alert(ZIP_MULTIPLE_RESULTS_MESSAGE);
      }

      if (postalCodeChanged) {
        clearManualAddressFields(row);
      }

      setAddressFieldsFromZipcloud(row, chosen);
      lastPostalCodeLookupByRow[row] = digits;
    })
    .catch(function (error) {
      console.error("郵便番号検索に失敗しました:", error);
    });
}

function getRowFromField(field) {
  var row = field.getAttribute("data-row");
  if (row) return row;

  var id = field.id || "";
  var match = id.match(/^member-(\d+)-/);
  return match ? match[1] : "";
}

function toHalfWidthDigits(value) {
  return String(value).replace(/[０-９]/g, function (char) {
    return String.fromCharCode(char.charCodeAt(0) - 0xfee0);
  });
}

function setFieldError(field, hasError) {
  if (!field) return;
  field.classList.toggle("soshiki-form-field--error", hasError);
}

function clearFieldErrorForRow(row, selector) {
  document
    .querySelectorAll(
      '.soshiki-form-member-row[data-row="' + row + '"] ' + selector
    )
    .forEach(function (field) {
      setFieldError(field, false);
    });
}

function addressGroupHasAnyInput(row) {
  return ADDRESS_GROUP_FIELD_SUFFIXES.some(function (suffix) {
    var field = getMemberField(row, suffix);
    return field && field.value.trim();
  });
}

function validateAddressGroupForRow(row, rowLabel, errors) {
  if (!addressGroupHasAnyInput(row)) {
    clearFieldErrorForRow(
      row,
      ".soshiki-form-member-prefecture, .soshiki-form-member-city, .soshiki-form-member-town-area, .soshiki-form-member-area-number"
    );
    setFieldError(getMemberField(row, "postal-code"), false);
    return;
  }

  var labels = {
    "postal-code": "郵便番号",
    prefecture: "都道府県",
    city: "市区町村",
    "town-area": "町村域",
    "area-number": "番地",
  };

  ADDRESS_GROUP_FIELD_SUFFIXES.forEach(function (suffix) {
    var field = getMemberField(row, suffix);
    var missing = !field || !field.value.trim();
    setFieldError(field, missing);
    if (missing) {
      errors.push(rowLabel + "：" + labels[suffix] + "が未入力です");
    }
  });
}

/**
 * 行に1項目でも入力があるか（確認画面用のたたき）
 */
function memberRowHasAnyInput(row) {
  var rowEl = document.querySelector('.soshiki-form-member-row[data-row="' + row + '"]');
  if (!rowEl) return false;

  if (getMemberField(row, "idou").value) return true;

  var unionMemberCode = getMemberField(row, "union-member-code");
  if (unionMemberCode && unionMemberCode.value.trim()) return true;

  var textSuffixes = [
    "family-name-kana",
    "given-name-kana",
    "family-name",
    "given-name",
    "birth-year",
    "birth-month",
    "birth-day",
    "postal-code",
    "prefecture",
    "city",
    "town-area",
    "area-number",
    "building-name",
  ];

  for (var i = 0; i < textSuffixes.length; i += 1) {
    var field = getMemberField(row, textSuffixes[i]);
    if (field && field.value.trim()) return true;
  }

  if (getMemberField(row, "gender").value) return true;
  return false;
}

/**
 * 組合員行の必須チェック（確認画面・送信前に呼ぶ）
 */
function validateMemberRows() {
  var errors = [];

  for (var row = 1; row <= MEMBER_ROW_COUNT; row += 1) {
    if (!memberRowHasAnyInput(row)) continue;

    var rowLabel = row + "行目";
    var idou = getMemberField(row, "idou").value;
    if (!idou) errors.push(rowLabel + "：異動内容を選択してください");

    var requiredText = [
      { suffix: "family-name", label: "漢字姓" },
      { suffix: "given-name", label: "漢字名" },
      { suffix: "family-name-kana", label: "カナ姓" },
      { suffix: "given-name-kana", label: "カナ名" },
      { suffix: "birth-year", label: "生年月日・年" },
      { suffix: "birth-month", label: "生年月日・月" },
      { suffix: "birth-day", label: "生年月日・日" },
    ];

    requiredText.forEach(function (item) {
      var field = getMemberField(row, item.suffix);
      if (!field || !field.value.trim()) {
        errors.push(rowLabel + "：" + item.label + "が未入力です");
      }
    });

    var gender = getMemberField(row, "gender").value;
    if (!gender) errors.push(rowLabel + "：性別を選択してください");

    if (!validateBirthDateForRow(String(row))) {
      errors.push(rowLabel + "：生年月日が正しくありません");
    }

    validateAddressGroupForRow(String(row), rowLabel, errors);
  }

  return errors;
}

/**
 * 申込全体の必須チェック（申込日・組合名＋組合員行）
 */
function validateSoshikiForm() {
  var errors = [];

  ["application-year", "application-month", "application-day"].forEach(function (id) {
    var field = document.getElementById(id);
    if (!field || !field.value.trim()) {
      errors.push("申込日が未入力です");
    }
  });

  var unionName = document.getElementById("union-name");
  if (!unionName || !unionName.value.trim()) {
    errors.push("組合名が未入力です");
  }

  return errors.concat(validateMemberRows());
}

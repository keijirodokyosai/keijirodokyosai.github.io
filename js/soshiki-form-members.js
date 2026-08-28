/**
 * 組合員入力欄（最大5名）: 異動内容トグル・半角制限・blur 正規化・郵便番号検索
 */

var MEMBER_ROW_COUNT = 5;
var HALF_WIDTH_KANA_PATTERN = /[^ｦ-ﾟ]/g;
var ZIPCLOUD_API = "https://zipcloud.ibsnet.co.jp/api/search";

function initMemberRows() {
  initIdouButtons();
  initGenderButtons();
  initMemberCodeDigits();
  initHalfWidthInputs();
  initZipFields();
  initZipLookup();
}

function initIdouButtons() {
  document.querySelectorAll(".soshiki-form-idou-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      var row = button.getAttribute("data-row");
      var idou = button.getAttribute("data-idou");
      var hidden = document.getElementById("member-" + row + "-idou");
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
  var hidden = document.getElementById("member-" + row + "-idou");
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
      var hidden = document.getElementById("member-" + row + "-gender");
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
  var hidden = document.getElementById("member-" + row + "-gender");
  if (hidden) hidden.value = "";

  document
    .querySelectorAll('.soshiki-form-gender-btn[data-row="' + row + '"]')
    .forEach(function (button) {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    });
}

function initMemberCodeDigits() {
  document.querySelectorAll(".soshiki-form-member-code-digit").forEach(function (input) {
    var composing = false;

    input.addEventListener("compositionstart", function () {
      composing = true;
    });
    input.addEventListener("compositionend", function () {
      composing = false;
      filterMemberCodeDigitInput(input);
    });

    input.addEventListener("input", function () {
      if (composing) return;
      filterMemberCodeDigitInput(input);
      if (input.value.length === 1) {
        focusNextCodeDigit(input);
      }
    });

    input.addEventListener("blur", function () {
      normalizeMemberCodeRow(input.getAttribute("data-row"));
    });
  });
}

function filterMemberCodeDigitInput(input) {
  var digit = toHalfWidthDigits(input.value).replace(/[^0-9]/g, "").slice(-1);
  input.value = digit;
}

function focusNextCodeDigit(input) {
  var index = Number(input.getAttribute("data-digit-index"));
  if (index >= 6) return;
  var next = document.getElementById(
    "member-" + input.getAttribute("data-row") + "-code-" + (index + 1)
  );
  if (next) next.focus();
}

function collectMemberCodeDigits(row) {
  var chars = [];
  var hasAny = false;

  for (var i = 1; i <= 6; i += 1) {
    var field = document.getElementById("member-" + row + "-code-" + i);
    var digit = "";
    if (field) {
      digit = toHalfWidthDigits(field.value).replace(/[^0-9]/g, "").charAt(0) || "";
    }
    chars.push(digit);
    if (digit) hasAny = true;
  }

  if (!hasAny) return "";

  var joined = chars.join("");
  if (joined.length > 6) joined = joined.slice(0, 6);
  return joined.padStart(6, "0");
}

function normalizeMemberCodeRow(row) {
  var padded = collectMemberCodeDigits(row);
  if (!padded) {
    clearMemberCodeRow(row);
    return;
  }

  for (var i = 1; i <= 6; i += 1) {
    var field = document.getElementById("member-" + row + "-code-" + i);
    if (field) field.value = padded.charAt(i - 1);
  }
  clearFieldErrorForRow(row, ".soshiki-form-member-code-digit");
}

function clearMemberCodeRow(row) {
  for (var i = 1; i <= 6; i += 1) {
    var field = document.getElementById("member-" + row + "-code-" + i);
    if (field) field.value = "";
  }
}

function initHalfWidthInputs() {
  document.querySelectorAll("[data-halfwidth-kana]").forEach(function (input) {
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

  var yearInput = document.getElementById("member-" + row + "-birth-year");
  var monthInput = document.getElementById("member-" + row + "-birth-month");
  var dayInput = document.getElementById("member-" + row + "-birth-day");
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
  });
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
}

function initZipLookup() {
  document.querySelectorAll("[data-zip-lookup]").forEach(function (input) {
    input.addEventListener("blur", function () {
      lookupAddressFromZip(getRowFromField(input));
    });
  });
}

function lookupAddressFromZip(row) {
  var zipInput = document.getElementById("member-" + row + "-zip");
  var address = document.getElementById("member-" + row + "-address");
  if (!zipInput || !address) return;

  var digits = extractZipDigits(zipInput.value);
  if (digits.length !== 7) return;

  zipInput.value = formatZipCode(digits);

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
        window.alert(
          "郵便番号に複数の住所が見つかりました。最初の候補を入力しました。必要に応じて修正してください。"
        );
      }

      address.value =
        (chosen.address1 || "") +
        (chosen.address2 || "") +
        (chosen.address3 || "");
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

/**
 * 行に1項目でも入力があるか（確認画面用のたたき）
 */
function memberRowHasAnyInput(row) {
  var rowEl = document.querySelector('.soshiki-form-member-row[data-row="' + row + '"]');
  if (!rowEl) return false;

  if (document.getElementById("member-" + row + "-idou").value) return true;

  for (var c = 1; c <= 6; c += 1) {
    var codeField = document.getElementById("member-" + row + "-code-" + c);
    if (codeField && codeField.value.trim()) return true;
  }

  var textIds = [
    "kana-sei",
    "kana-mei",
    "kanji-sei",
    "kanji-mei",
    "birth-year",
    "birth-month",
    "birth-day",
    "zip",
    "address",
  ];

  for (var i = 0; i < textIds.length; i += 1) {
    var field = document.getElementById("member-" + row + "-" + textIds[i]);
    if (field && field.value.trim()) return true;
  }

  if (document.getElementById("member-" + row + "-gender").value) return true;
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
    var idou = document.getElementById("member-" + row + "-idou").value;
    if (!idou) errors.push(rowLabel + "：異動内容を選択してください");

    var requiredText = [
      { id: "kanji-sei", label: "漢字姓" },
      { id: "kanji-mei", label: "漢字名" },
      { id: "kana-sei", label: "カナ姓" },
      { id: "kana-mei", label: "カナ名" },
      { id: "birth-year", label: "生年月日・年" },
      { id: "birth-month", label: "生年月日・月" },
      { id: "birth-day", label: "生年月日・日" },
    ];

    requiredText.forEach(function (item) {
      var field = document.getElementById("member-" + row + "-" + item.id);
      if (!field || !field.value.trim()) {
        errors.push(rowLabel + "：" + item.label + "が未入力です");
      }
    });

    var gender = document.getElementById("member-" + row + "-gender").value;
    if (!gender) errors.push(rowLabel + "：性別を選択してください");

    if (!validateBirthDateForRow(String(row))) {
      errors.push(rowLabel + "：生年月日が正しくありません");
    }
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

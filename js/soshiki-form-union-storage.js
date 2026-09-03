/**
 * 組織共済申込書 — 保存組合名（localStorage）
 * よく使う KyosaikaiName のみ記憶。マスタ照合は union-master.json が担当。
 */

var SOSHIKI_FORM_SAVED_UNIONS_KEY = "soshiki-form-saved-unions";

function loadSavedUnionNames() {
  try {
    var raw = window.localStorage.getItem(SOSHIKI_FORM_SAVED_UNIONS_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(function (name) {
        return String(name).trim();
      })
      .filter(function (name) {
        return name.length > 0;
      });
  } catch (error) {
    console.error("保存組合名の読み込みに失敗しました:", error);
    return [];
  }
}

function saveSavedUnionNames(names) {
  var unique = [];
  names.forEach(function (name) {
    var trimmed = String(name).trim();
    if (!trimmed) return;
    if (unique.indexOf(trimmed) === -1) unique.push(trimmed);
  });
  window.localStorage.setItem(
    SOSHIKI_FORM_SAVED_UNIONS_KEY,
    JSON.stringify(unique)
  );
  return unique;
}

function isSavedUnionName(name) {
  var trimmed = String(name).trim();
  if (!trimmed) return false;
  return loadSavedUnionNames().indexOf(trimmed) !== -1;
}

function addSavedUnionName(name) {
  var trimmed = String(name).trim();
  if (!trimmed) return loadSavedUnionNames();
  var names = loadSavedUnionNames();
  if (names.indexOf(trimmed) !== -1) return names;
  names.push(trimmed);
  return saveSavedUnionNames(names);
}

function removeSavedUnionName(name) {
  var trimmed = String(name).trim();
  var names = loadSavedUnionNames().filter(function (item) {
    return item !== trimmed;
  });
  return saveSavedUnionNames(names);
}

function clearSavedUnionNames() {
  window.localStorage.removeItem(SOSHIKI_FORM_SAVED_UNIONS_KEY);
  return [];
}

function promptAddSavedUnionName(kyosaikaiName) {
  var trimmed = String(kyosaikaiName).trim();
  if (!trimmed || isSavedUnionName(trimmed)) return;

  if (
    !window.confirm(
      "組合リストに「" + trimmed + "」を追加しますか？\n次回からプルダウンで選べます。"
    )
  ) {
    return;
  }

  addSavedUnionName(trimmed);
  refreshSavedUnionUi();
}

function initSoshikiFormUnionStorage() {
  var clearAllButton = document.getElementById(
    "soshiki-form-saved-unions-clear-all"
  );
  if (clearAllButton) {
    clearAllButton.addEventListener("click", function () {
      var names = loadSavedUnionNames();
      if (names.length === 0) return;
      if (!window.confirm("保存した組合名をすべて削除します。よろしいですか？")) {
        return;
      }
      clearSavedUnionNames();
      refreshSavedUnionUi();
    });
  }

  refreshSavedUnionUi();
}

function refreshSavedUnionUi() {
  var names = loadSavedUnionNames();
  var datalist = document.getElementById("soshiki-form-saved-unions-datalist");
  var panel = document.getElementById("soshiki-form-saved-unions-panel");
  var list = document.getElementById("soshiki-form-saved-unions-list");
  var unionNameInput = document.getElementById("union-name");

  if (datalist) {
    datalist.innerHTML = "";
    names.forEach(function (name) {
      var option = document.createElement("option");
      option.value = name;
      datalist.appendChild(option);
    });
  }

  if (unionNameInput) {
    if (names.length > 0) {
      unionNameInput.setAttribute("list", "soshiki-form-saved-unions-datalist");
    } else {
      unionNameInput.removeAttribute("list");
    }
  }

  if (!panel || !list) return;

  if (names.length === 0) {
    panel.hidden = true;
    list.innerHTML = "";
    return;
  }

  panel.hidden = false;
  list.innerHTML = "";

  names.forEach(function (name) {
    var item = document.createElement("li");
    item.className = "soshiki-form-saved-unions-item";

    var label = document.createElement("span");
    label.className = "soshiki-form-saved-unions-name";
    label.textContent = name;

    var removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn btn-secondary soshiki-form-saved-unions-remove";
    removeButton.textContent = "削除";
    removeButton.setAttribute("aria-label", name + " を保存リストから削除");
    removeButton.addEventListener("click", function () {
      removeSavedUnionName(name);
      refreshSavedUnionUi();
    });

    item.appendChild(removeButton);
    item.appendChild(label);
    list.appendChild(item);
  });
}

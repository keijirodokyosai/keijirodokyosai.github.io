document.addEventListener("DOMContentLoaded", function () {
  var dateInput = document.getElementById("application-date");
  if (!dateInput || dateInput.value) return;

  var today = new Date();
  var year = today.getFullYear();
  var month = String(today.getMonth() + 1).padStart(2, "0");
  var day = String(today.getDate()).padStart(2, "0");

  dateInput.value = year + "/" + month + "/" + day;
});

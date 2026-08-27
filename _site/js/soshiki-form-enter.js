document.addEventListener("DOMContentLoaded", function () {
  var yearInput = document.getElementById("application-year");
  var monthInput = document.getElementById("application-month");
  var dayInput = document.getElementById("application-day");

  if (!yearInput || !monthInput || !dayInput) return;
  if (yearInput.value || monthInput.value || dayInput.value) return;

  var today = new Date();

  yearInput.value = String(today.getFullYear());
  monthInput.value = String(today.getMonth() + 1).padStart(2, "0");
  dayInput.value = String(today.getDate()).padStart(2, "0");
});

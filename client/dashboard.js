const user = JSON.parse(localStorage.getItem("user") || "null");
const navButtons = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".section");
const DASHBOARD_API_BASE = "http://localhost:3000/api";
const DASHBOARD_CURRENCY = "$";

const budgetForm = document.getElementById("budget-form");
const budgetAmountInput = document.getElementById("budget-amount");
const budgetSubmitButton = document.getElementById("budget-submit");
const budgetMessage = document.getElementById("budget-message");
const budgetMonthLabel = document.getElementById("budget-month-label");
const dashboardMonthPill = document.getElementById("dashboard-month-pill");
const overviewSpent = document.getElementById("overview-spent");
const overviewSpentNote = document.getElementById("overview-spent-note");
const overviewRemaining = document.getElementById("overview-remaining");
const overviewStatus = document.getElementById("overview-status");
const overviewProgress = document.getElementById("overview-progress");
const overviewAlert = document.getElementById("overview-alert");
const budgetSummaryLeft = document.getElementById("budget-summary-left");
const budgetSummaryValue = document.getElementById("budget-summary-value");
const budgetProgressFill = document.getElementById("budget-progress-fill");
const categoryPill = document.getElementById("category-pill");
const categoryBreakdown = document.getElementById("category-breakdown");
const dailyChart = document.getElementById("daily-chart");
const insightList = document.getElementById("insight-list");

let currentMonth = todayISO().slice(0, 7);

//logged in user is stored in local storage, if it exists, display a greeting
if (user) {
  document.getElementById("greeting").textContent = `Welcome, ${user.name}!`;
}
//
function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${String(now.getDate()).padStart(2, "0")}`;
}

// get the current month in YYYY-MM format
function formatMoney(amount) {
  return `${DASHBOARD_CURRENCY} ${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
//helper to render HTML safely
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character];
  });
}
// label for the month in a human-readable format, e.g. "August 2026"
function formatMonthLabel(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}
// YYYY-MM-DD in local time; toISOString() would shift the day on non-UTC offsets
function toLocalISODate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${String(date.getDate()).padStart(2, "0")}`;
}
//format day
function formatDayLabel(day) {
  return day.label || String(day.day ?? day).padStart(2, "0");
}
// Monday of the week containing the given date
function startOfWeek(date) {
  const value = new Date(date);
  const day = value.getDay();
  value.setDate(value.getDate() + (day === 0 ? -6 : 1 - day));
  value.setHours(0, 0, 0, 0);
  return value;
}
// weekly series for the current Mon-Sun week, based on the daily data and the current month
function buildWeeklySeries(data) {
  if (Array.isArray(data.weekly)) return data.weekly;

  if (!Array.isArray(data.daily) || !data.month) return [];

  const [year, monthNumber] = data.month.split("-").map(Number);
  const start = startOfWeek(new Date());

  const dailyByDate = new Map(
    data.daily.map((day) => [
      `${year}-${String(monthNumber).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`,
      Number(day.amount || 0),
    ]),
  );

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    const date = toLocalISODate(current);
    return {
      date,
      label: current.toLocaleDateString("en-GB", { weekday: "short" }),
      amount: dailyByDate.get(date) || 0,
    };
  });
}

async function api(path, options = {}) {
  const response = await fetch(`${DASHBOARD_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("index.html");
    throw new Error("Session expired");
  }

  const contentType = response.headers.get("content-type") || "";
  const bodyText = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `API returned ${response.status} ${response.statusText || "response"} instead of JSON`,
    );
  }

  const data = bodyText ? JSON.parse(bodyText) : null;
  if (!response.ok) throw new Error(data?.error || "Something went wrong");
  return data;
}

function setBudgetMessage(text, type) {
  budgetMessage.textContent = text;
  budgetMessage.className = type ? `message ${type}` : "message";
}

function renderCategoryBreakdown(categories) {
  const total = categories.reduce((sum, category) => sum + category.amount, 0);

  if (!total) {
    categoryPill.textContent = "No spending yet";
    categoryBreakdown.innerHTML = `<p class="subtle">Spend something this month to see the category breakdown.</p>`;
    return;
  }

  categoryPill.textContent = `${categories.filter((category) => category.amount > 0).length} categories`;
  categoryBreakdown.innerHTML = categories
    .filter((category) => category.amount > 0)
    .map((category) => {
      const percent = Math.round((category.amount / total) * 100);
      return `
        <div class="breakdown-item">
          <div class="breakdown-header">
            <strong>${escapeHtml(category.category)}</strong>
            <span>${percent}% · ${formatMoney(category.amount)}</span>
          </div>
          <div class="progress-bar small">
            <span style="width: ${percent}%"></span>
          </div>
        </div>`;
    })
    .join("");
}

function renderWeeklyTrend(weekly) {
  const maxAmount = Math.max(...weekly.map((day) => day.amount), 0);

  if (!maxAmount) {
    dailyChart.innerHTML = `<p class="subtle">No weekly activity yet for this week.</p>`;
    return;
  }

  dailyChart.innerHTML = weekly
    .map((day) => {
      const height = Math.max(8, (day.amount / maxAmount) * 100);
      return `
        <div class="daily-bar">
          <div class="daily-bar-track">
            <span style="height: ${height}%" title="${escapeHtml(formatDayLabel(day))}: ${formatMoney(day.amount)}"></span>
          </div>
          <strong>${escapeHtml(formatDayLabel(day))}</strong>
          <span>${day.amount ? formatMoney(day.amount) : "—"}</span>
        </div>`;
    })
    .join("");
}

function renderInsights(summary) {
  const remainingText =
    summary.remaining == null
      ? "No budget set"
      : formatMoney(summary.remaining);
  const topCategory = summary.topCategory
    ? `${summary.topCategory.category} leads with ${formatMoney(summary.topCategory.amount)}`
    : "No category spend yet this month.";

  insightList.innerHTML = `
    <div class="breakdown-item">
      <div class="breakdown-header">
        <strong>Top category</strong>
        <span>${summary.topCategory ? formatMoney(summary.topCategory.amount) : "—"}</span>
      </div>
      <p class="subtle">${escapeHtml(topCategory)}</p>
    </div>
    <div class="breakdown-item">
      <div class="breakdown-header">
        <strong>Active days</strong>
        <span>${summary.activeDays}</span>
      </div>
      <p class="subtle">Average per active day: ${formatMoney(summary.averagePerActiveDay || 0)}</p>
    </div>
    <div class="breakdown-item">
      <div class="breakdown-header">
        <strong>Budget remaining</strong>
        <span>${remainingText}</span>
      </div>
      <p class="subtle">Track your spending against the monthly target.</p>
    </div>`;
}

function renderBudgetSummary(data) {
  const { summary, budget, month } = data;
  const monthLabel = formatMonthLabel(month);

  currentMonth = month;
  dashboardMonthPill.textContent = monthLabel;
  budgetMonthLabel.textContent = `For ${monthLabel}`;
  budgetAmountInput.value = budget?.amount ?? "";

  overviewSpent.textContent = formatMoney(summary.spent);
  overviewSpentNote.textContent = `${summary.expenseCount} expenses logged`;

  if (budget?.amount) {
    overviewRemaining.textContent = formatMoney(summary.remaining ?? 0);
    overviewProgress.textContent = `${summary.usagePercent?.toFixed(1) ?? 0}%`;
    budgetSummaryLeft.textContent =
      summary.remaining >= 0 ? "Remaining this month" : "Over budget";
    budgetSummaryValue.textContent =
      summary.remaining >= 0
        ? formatMoney(summary.remaining)
        : `-${formatMoney(Math.abs(summary.remaining))}`;
    budgetProgressFill.style.width = `${summary.usagePercent ?? 0}%`;
  } else {
    overviewRemaining.textContent = "—";
    overviewProgress.textContent = "—";
    budgetSummaryLeft.textContent = "No budget set";
    budgetSummaryValue.textContent = "—";
    budgetProgressFill.style.width = "0%";
  }

  const alerts = {
    none: "No budget has been set yet.",
    ok: "You are within budget.",
    notice: "You have spent more than 75% of your budget.",
    warning: "You have spent more than 90% of your budget.",
    danger: "You are over budget for this month.",
  };

  const pillClasses = {
    none: "status-pill muted",
    ok: "status-pill",
    notice: "status-pill warning",
    warning: "status-pill warning",
    danger: "status-pill warning",
  };

  overviewStatus.textContent = alerts[summary.alertLevel] || alerts.none;
  overviewAlert.textContent = alerts[summary.alertLevel] || alerts.none;
  dashboardMonthPill.className =
    pillClasses[summary.alertLevel] || "status-pill muted";

  if (summary.alertLevel === "danger") {
    dashboardMonthPill.textContent = "Over budget";
  } else if (
    summary.alertLevel === "warning" ||
    summary.alertLevel === "notice"
  ) {
    dashboardMonthPill.textContent = "Budget watch";
  } else if (budget?.amount) {
    dashboardMonthPill.textContent = "On track";
  } else {
    dashboardMonthPill.textContent = "Budget needed";
  }
  //category breakdown of expenses
  renderCategoryBreakdown(data.categories);
  //bar graph of last 7 days
  renderWeeklyTrend(buildWeeklySeries(data));
  //insights are based on the summary data, which is already calculated on the server side
  renderInsights(summary);
}

async function loadDashboard(month = currentMonth) {
  try {
    const data = await api(`/dashboard?month=${month}`);
    renderBudgetSummary(data);
    setBudgetMessage("");
  } catch (error) {
    setBudgetMessage(error.message, "error");
    categoryBreakdown.innerHTML = `<p class="message error">${escapeHtml(error.message)}</p>`;
    dailyChart.innerHTML = `<p class="message error">${escapeHtml(error.message)}</p>`;
    insightList.innerHTML = `<p class="message error">${escapeHtml(error.message)}</p>`;
  }
}

budgetForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const amount = Number(budgetAmountInput.value);
  if (!(amount > 0)) {
    setBudgetMessage("Enter a budget amount greater than zero", "error");
    return;
  }

  budgetSubmitButton.disabled = true;
  const originalText = budgetSubmitButton.textContent;
  budgetSubmitButton.textContent = "Saving…";

  try {
    await api("/dashboard/budget", {
      method: "PUT",
      body: JSON.stringify({ month: currentMonth, amount }),
    });

    setBudgetMessage("Budget saved", "success");
    await loadDashboard(currentMonth);
  } catch (error) {
    setBudgetMessage(error.message, "error");
  } finally {
    budgetSubmitButton.disabled = false;
    budgetSubmitButton.textContent = originalText;
  }
});

window.addEventListener("expense-dashboard-refresh", (event) => {
  const month = event.detail?.month || currentMonth;
  loadDashboard(month);
});

document.getElementById("logout").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.replace("index.html");
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const sectionName = button.dataset.section;

    navButtons.forEach((navButton) =>
      navButton.classList.toggle("active", navButton === button),
    );
    sections.forEach((section) =>
      section.classList.toggle(
        "active",
        section.dataset.section === sectionName,
      ),
    );
  });
});

loadDashboard(currentMonth);

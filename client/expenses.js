const API_BASE = "http://localhost:3000/api";
const CURRENCY = "$";

const form = document.getElementById("expense-form");
const amountInput = document.getElementById("expense-amount");
const dateInput = document.getElementById("expense-date");
const categorySelect = document.getElementById("expense-category");
const noteInput = document.getElementById("expense-note");
const submitButton = document.getElementById("expense-submit");
const cancelButton = document.getElementById("expense-cancel");
const formTitle = document.getElementById("form-title");
const formMessage = document.getElementById("expense-message");

const monthFilter = document.getElementById("month-filter");
const showAllButton = document.getElementById("show-all");
const rangePill = document.getElementById("range-pill");
const list = document.getElementById("expense-list");

// null when adding, an expenseId when editing — the form handles both
let editingId = null;

// --- talking to the API -----------------------------------------------------

async function api(path, options = {}) {
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // an expired or tampered token means the session is over
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("index.html");
    throw new Error("Session expired");
  }

  if (response.status === 204) return null;

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

// --- small helpers ----------------------------------------------------------

// Notes are whatever the user typed, so they never go into innerHTML raw.
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

//format currency
function formatMoney(amount) {
  return `${CURRENCY} ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// "2026-08-14" → "14 Aug 2026". The T00:00:00 keeps it in local time so the
// day never slips backwards.
function formatDate(spentOn) {
  return new Date(`${spentOn}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

//display message
function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = type ? `message ${type}` : "message";
}

//getting today date
function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${String(now.getDate()).padStart(2, "0")}`;
}

//notify dashboard to refresh
function notifyDashboard(month) {
  window.dispatchEvent(
    new CustomEvent("expense-dashboard-refresh", {
      detail: { month },
    }),
  );
}

// --- rendering --------------------------------------------------------------

function renderStats(expenses, total) {
  document.getElementById("stat-total").textContent = formatMoney(total);
  document.getElementById("stat-count").textContent = expenses.length;

  // biggest spend by category, worked out from the rows we already have
  const totals = {};
  expenses.forEach((expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
  });

  const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("stat-top").textContent = top ? top[0] : "—";
}

// render the list of expenses, or a message if there are none
function renderList(expenses) {
  if (!expenses.length) {
    list.innerHTML = `<p class="subtle">No expenses yet for this range. Add one on the left.</p>`;
    return;
  }

  list.innerHTML = expenses
    .map(
      (expense) => `
      <div class="transaction-item">
        <div class="transaction-main">
          <strong>${escapeHtml(expense.category)}</strong>
          <span>${expense.note ? `${escapeHtml(expense.note)} · ` : ""}${formatDate(expense.spentOn)}</span>
        </div>
        <div class="transaction-meta">
          <strong>${formatMoney(expense.amount)}</strong>
          <div class="row-actions">
            <button type="button" class="link-button" data-edit="${expense.expenseId}">Edit</button>
            <button type="button" class="link-button danger" data-delete="${expense.expenseId}">Delete</button>
          </div>
        </div>
      </div>`,
    )
    .join("");
}

// --- loading ----------------------------------------------------------------

async function loadCategories() {
  const { categories } = await api("/categories");

  categorySelect.innerHTML =
    `<option value="">Choose a category</option>` +
    categories
      .map(
        (category) =>
          `<option value="${category.categoryId}">${escapeHtml(category.name)}</option>`,
      )
      .join("");
}

// load the expenses for the current month or all time, and render them
async function loadExpenses() {
  const month = monthFilter.value;
  rangePill.textContent = month ? "Filtered by month" : "All time";

  try {
    const { expenses, total } = await api(
      `/expenses${month ? `?month=${month}` : ""}`,
    );
    renderStats(expenses, total);
    renderList(expenses);
    notifyDashboard(month || todayISO().slice(0, 7));
  } catch (error) {
    list.innerHTML = `<p class="message error">${escapeHtml(error.message)}</p>`;
  }
}

// --- the form ---------------------------------------------------------------

// reset the form to its default "add" state
function resetForm() {
  editingId = null;
  form.reset();
  dateInput.value = todayISO();
  formTitle.textContent = "Add an expense";
  submitButton.textContent = "Add expense";
  cancelButton.classList.add("hidden");
  showMessage("");
}
// start editing an existing expense, populating the form with its data
function startEditing(expense) {
  editingId = expense.expenseId;
  amountInput.value = expense.amount;
  dateInput.value = expense.spentOn;
  categorySelect.value = expense.categoryId;
  noteInput.value = expense.note || "";

  formTitle.textContent = "Edit expense";
  submitButton.textContent = "Save changes";
  cancelButton.classList.remove("hidden");
  showMessage("");
  form.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
// --- event listeners --------------------------------------------------------
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const amount = Number(amountInput.value);
  if (!(amount > 0))
    return showMessage("Enter an amount greater than zero", "error");
  if (!dateInput.value) return showMessage("Pick a date", "error");
  if (!categorySelect.value) return showMessage("Choose a category", "error");

  const body = {
    amount,
    spentOn: dateInput.value,
    categoryId: Number(categorySelect.value),
    note: noteInput.value.trim() || null,
  };

  submitButton.disabled = true;
  const originalText = submitButton.textContent;
  submitButton.textContent = "Saving…";

  // resetForm() clears editingId, so remember which we did before calling it
  const wasEditing = editingId !== null;

  try {
    // same body either way — PUT replaces the row, POST creates one
    if (wasEditing) {
      await api(`/expenses/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    } else {
      await api("/expenses", { method: "POST", body: JSON.stringify(body) });
    }

    resetForm();
    showMessage(wasEditing ? "Expense updated" : "Expense added", "success");
    await loadExpenses();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    submitButton.disabled = false;
    if (submitButton.textContent === "Saving…")
      submitButton.textContent = originalText;
  }
});
// cancel editing and reset the form
cancelButton.addEventListener("click", resetForm);

// One listener on the list covers every row's buttons, including new ones.
list.addEventListener("click", async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    try {
      startEditing(await api(`/expenses/${editId}`));
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  if (deleteId) {
    if (!confirm("Delete this expense?")) return;

    try {
      await api(`/expenses/${deleteId}`, { method: "DELETE" });
      if (editingId === Number(deleteId)) resetForm();
      await loadExpenses();
    } catch (error) {
      showMessage(error.message, "error");
    }
  }
});
// filter by month or show all
monthFilter.addEventListener("change", loadExpenses);
// show all expenses, clearing the month filter
showAllButton.addEventListener("click", () => {
  monthFilter.value = "";
  loadExpenses();
});

// --- start ------------------------------------------------------------------

(async function start() {
  dateInput.value = todayISO();
  monthFilter.value = todayISO().slice(0, 7);

  try {
    await loadCategories();
  } catch (error) {
    categorySelect.innerHTML = `<option value="">Could not load categories</option>`;
    showMessage(error.message, "error");
  }

  await loadExpenses();
})();

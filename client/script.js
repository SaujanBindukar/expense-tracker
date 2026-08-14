const API_URL = "http://localhost:3000/api/auth";

const tabs = document.querySelectorAll(".tab");
const forms = {
  login: document.getElementById("login"),
  signup: document.getElementById("signup"),
};
const message = document.getElementById("message");

// switch between the login and signup forms
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.target;

    tabs.forEach((t) => t.classList.toggle("active", t === tab));
    Object.keys(forms).forEach((name) => {
      forms[name].classList.toggle("hidden", name !== target);
    });

    showMessage("");
  });
});

function showMessage(text, type) {
  message.textContent = text;
  message.className = type ? `message ${type}` : "message";
}

async function submitForm(form, endpoint, body) {
  const button = form.querySelector(".submit");
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "Please wait...";
  showMessage("");

  try {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || "Something went wrong", "error");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    window.location.href = "dashboard.html";
  } catch (error) {
    showMessage("Cannot reach the server. Is it running?", "error");
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

forms.login.addEventListener("submit", (event) => {
  event.preventDefault();

  submitForm(forms.login, "login", {
    email: document.getElementById("login-email").value.trim(),
    password: document.getElementById("login-password").value,
  });
});

forms.signup.addEventListener("submit", (event) => {
  event.preventDefault();

  submitForm(forms.signup, "signup", {
    name: document.getElementById("signup-name").value.trim(),
    email: document.getElementById("signup-email").value.trim(),
    password: document.getElementById("signup-password").value,
  });
});

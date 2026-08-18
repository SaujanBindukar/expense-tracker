const user = JSON.parse(localStorage.getItem("user") || "null");
const navButtons = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".section");

if (user) {
  document.getElementById("greeting").textContent = `Welcome, ${user.name}!`;
}

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

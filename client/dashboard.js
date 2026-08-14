// read the logged in user saved at login/signup
const user = JSON.parse(localStorage.getItem("user") || "null");

if (user) {
  document.getElementById("greeting").textContent = `Welcome, ${user.name}!`;
}

document.getElementById("logout").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.replace("index.html");
});

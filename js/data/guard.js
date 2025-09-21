// js/data/guard.js
(function () {
  const raw = localStorage.getItem("session");
  const session = raw ? JSON.parse(raw) : null;
  const roleRequired = document.body?.dataset?.role; // "Administrador" | "Vendedor"

  // Si no hay sesión, al login
  if (!session) { location.href = "AdminLogin.html"; return; }

  // Si la página requiere un rol y no coincide, redirige a su panel
  if (roleRequired && session.rol !== roleRequired) {
    if (session.rol === "Administrador") location.href = "AdminHome.html";
    else if (session.rol === "Vendedor") location.href = "VendedorHome.html";
    else location.href = "AdminLogin.html";
    return;
  }

  // Logout: funciona con cualquier enlace .logout o #logoutBtn
  const bindLogout = (el) => el?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("session");
    location.href = "AdminLogin.html";
  });
  document.querySelectorAll(".logout, #logoutBtn").forEach(bindLogout);
})();

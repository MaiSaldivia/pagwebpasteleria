// admin/js/guard.js
(function () {
  const raw = localStorage.getItem("session");
  const session = raw ? JSON.parse(raw) : null;
  const roleRequired = document.body?.dataset?.role; // "Administrador" | "Vendedor"

  if (!session) { location.href = "AdminLogin.html"; return; }

  if (roleRequired && session.rol !== roleRequired) {
    if (session.rol === "Administrador") location.href = "AdminHome.html";
    else if (session.rol === "Vendedor") location.href = "VendedorHome.html";
    else location.href = "AdminLogin.html";
    return;
  }

  // Logout
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("session");
    location.href = "AdminLogin.html";
  });
})();

// ================================
// ADMIN - CRUD USUARIOS (localStorage)
// ================================
(function () {
  const USERS_KEY = "ADMIN_USERS_V1";

  // ---- helpers ----
  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const setHelp = (id, msg) => { const el = document.getElementById(id); if (el) el.textContent = msg || ""; };

  const baseUsers = () => Array.isArray(window.usuarios) ? window.usuarios.slice() : [];

  const mergeByRun = (base, saved) => {
    const map = new Map();
    base.forEach(u => map.set((u.run || "").toUpperCase(), u));
    saved.forEach(u => map.set((u.run || "").toUpperCase(), u)); // prioriza guardados
    return [...map.values()];
  };

  function loadUsers() {
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch {}
    const base = baseUsers();

    const list = (Array.isArray(saved) && saved.length) ? mergeByRun(base, saved) : base;
    if (!saved || !saved.length) localStorage.setItem(USERS_KEY, JSON.stringify(list));

    window.usuarios = mergeByRun(base, list);
    return list;
  }

  function saveUsers(list) {
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
    window.usuarios = mergeByRun(baseUsers(), list);
  }

  // ---- LISTADO (AdminUsuario.html) ----
  document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.querySelector("#tablaUsuarios tbody");
    if (tbody) {
      let users = loadUsers();

      const render = () => {
        if (!users.length) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#666;">No hay usuarios</td></tr>`;
          return;
        }
        tbody.innerHTML = users.map(u => `
          <tr data-run="${(u.run || "").toUpperCase()}">
            <td>${u.run || ""}</td>
            <td>${u.nombre || ""}</td>
            <td>${u.apellidos || ""}</td>
            <td>${u.correo || ""}</td>
            <td>${u.rol || ""}</td>
            <td>
              <div class="table-actions">
                <button class="btn-edit">✏️ Editar</button>
                <button class="btn-delete">🗑️ Eliminar</button>
              </div>
            </td>
          </tr>
        `).join("");
      };

      render();

      tbody.addEventListener("click", (e) => {
        const tr = e.target.closest("tr[data-run]");
        if (!tr) return;
        const run = tr.dataset.run;

        if (e.target.closest(".btn-edit")) {
          window.location.href = `AdminUsuariosNuevos.html?run=${encodeURIComponent(run)}`;
        }

        if (e.target.closest(".btn-delete")) {
          const u = users.find(x => (x.run || "").toUpperCase() === run);
          if (!u) return;
          if (confirm(`¿Eliminar a "${u.nombre || ""}" (${u.run})?`)) {
            users = users.filter(x => (x.run || "").toUpperCase() !== run);
            saveUsers(users);
            render();
            alert("Usuario eliminado ✔️");
          }
        }
      });
    }
  });

  // ---- FORM (AdminUsuariosNuevos.html) ----
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formUsuario");
    if (!form) return;

    const region = document.getElementById("region");
    const comuna = document.getElementById("comuna");

    // Poblar regiones y comunas desde window.regiones
    if (region && comuna && window.regiones) {
      region.innerHTML = `<option value="">-- Selecciona --</option>` +
        Object.keys(window.regiones).map(r => `<option value="${r}">${r}</option>`).join("");
      region.addEventListener("change", () => {
        const list = window.regiones[region.value] || [];
        comuna.innerHTML = `<option value="">-- Selecciona --</option>` +
          list.map(c => `<option value="${c}">${c}</option>`).join("");
      });
    }

    const params = new URLSearchParams(location.search);
    const editingRun = (params.get("run") || "").toUpperCase();
    let users = loadUsers();

    // Prefill si estamos editando
    if (editingRun) {
      const u = users.find(x => (x.run || "").toUpperCase() === editingRun);
      if (u) {
        form.run.value = u.run || "";
        form.nombre.value = u.nombre || "";
        form.apellidos.value = u.apellidos || "";
        form.correo.value = u.correo || "";
        form.rol.value = u.rol || "";
        form.direccion.value = u.direccion || "";

        if (region) {
          region.value = u.region || "";
          region.dispatchEvent(new Event("change"));
        }
        if (comuna) {
          setTimeout(() => { comuna.value = u.comuna || ""; }, 0);
        }

        form.run.readOnly = true;
      }
    }

    // Validación + guardar
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const run = (form.run.value || "").toUpperCase().trim();
      const nombre = (form.nombre.value || "").trim();
      const apellidos = (form.apellidos.value || "").trim();
      const correo = (form.correo.value || "").trim();
      const rol = form.rol.value || "";
      const regionVal = region?.value || "";
      const comunaVal = comuna?.value || "";
      const direccion = (form.direccion.value || "").trim();

      let ok = true;
      if (!/^[0-9]{7,8}[0-9Kk]$/.test(run)) { setHelp("runHelp","RUN sin puntos ni guion (Ej: 19011022K)"); ok = false; } else setHelp("runHelp","");
      if (!nombre) { setHelp("nombreHelp","Requerido"); ok = false; } else setHelp("nombreHelp","");
      if (!apellidos) { setHelp("apellidosHelp","Requerido"); ok = false; } else setHelp("apellidosHelp","");
      if (!/^[\w.%+-]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i.test(correo)) { setHelp("correoHelp","Correo no válido"); ok = false; } else setHelp("correoHelp","");
      if (!rol) { setHelp("rolHelp","Selecciona un rol"); ok = false; } else setHelp("rolHelp","");
      if (!regionVal) { setHelp("regionHelp","Selecciona una región"); ok = false; } else setHelp("regionHelp","");
      if (!comunaVal) { setHelp("comunaHelp","Selecciona una comuna"); ok = false; } else setHelp("comunaHelp","");
      if (!direccion) { setHelp("direccionHelp","Requerida"); ok = false; } else setHelp("direccionHelp","");

      if (!ok) return;

      const nuevo = { run, nombre, apellidos, correo, rol, region: regionVal, comuna: comunaVal, direccion };

      const idx = users.findIndex(x => (x.run || "").toUpperCase() === run);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...nuevo };
      } else {
        if (users.some(x => (x.run || "").toUpperCase() === run)) {
          setHelp("runHelp","Ese RUN ya existe");
          return;
        }
        users.push(nuevo);
      }

      saveUsers(users);
      alert("Usuario guardado ✔️");
      window.location.href = "AdminUsuario.html";
    });
  });
})();
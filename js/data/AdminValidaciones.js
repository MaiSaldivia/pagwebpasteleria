// ================================
// VALIDACIONES ADMINISTRADOR (actualizado)
// - Login consulta también usuarios guardados en LS (ADMIN_USERS_V1)
// - Form Producto: igual, con categorías dinámicas
// - Form Usuario (admin): crea/edita y PERSISTE en LS (ADMIN_USERS_V1)
// ================================
document.addEventListener("DOMContentLoaded", () => {

  // --------- Helpers comunes ----------
  const USERS_KEY = "ADMIN_USERS_V1";
  const $ = (sel, ctx=document) => ctx.querySelector(sel);

  const loadUsersLS = () => {
    try {
      const arr = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  };
  const saveUsersLS = (list) => localStorage.setItem(USERS_KEY, JSON.stringify(list));

  // Unifica usuarios base (DataAdmin.js) + guardados en LS, dedupe por correo
  function getAllUsersByEmail() {
    const base = Array.isArray(window.usuarios) ? window.usuarios : [];
    const saved = loadUsersLS();
    const map = new Map();
    [...base, ...saved].forEach(u => {
      const key = (u.correo || "").toLowerCase();
      if (!key) return;
      map.set(key, { ...u }); // saved sobrescribe base si existe
    });
    return map; // Map<correoLower, usuario>
  }

  // ===============================
  // 1) LOGIN (con roles y sesión)
  // ===============================
  const loginForm = document.getElementById("adminLoginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let valido = true;

      const correoEl = document.getElementById("correo");
      const contrasenaEl = document.getElementById("contrasena");

      const correo = (correoEl?.value || "").trim().toLowerCase();
      const contrasena = (contrasenaEl?.value || "").trim();

      if (!correo) {
        mostrarError("correoHelp", "El correo es obligatorio");
        valido = false;
      } else if (!/^[\w.%+-]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i.test(correo)) {
        mostrarError("correoHelp", "Solo correos válidos: @duoc.cl, @profesor.duoc.cl o @gmail.com");
        valido = false;
      } else {
        limpiarError("correoHelp");
      }

      if (!contrasena) {
        mostrarError("contrasenaHelp", "La contraseña es obligatoria");
        valido = false;
      } else if (contrasena.length < 4 || contrasena.length > 10) {
        mostrarError("contrasenaHelp", "Debe tener entre 4 y 10 caracteres");
        valido = false;
      } else {
        limpiarError("contrasenaHelp");
      }

      if (!valido) return;

      // Busca en base + guardados en LS
      const usersByEmail = getAllUsersByEmail();
      const user = usersByEmail.get(correo) || null;

      if (!user) {
        mostrarError("correoHelp", "Usuario no encontrado");
        return;
      }

      // (demo) no validamos password real
      const session = { correo: user.correo, nombre: user.nombre, rol: user.rol };
      localStorage.setItem("session", JSON.stringify(session));
      alert("Ingreso exitoso ✔️");

      if (user.rol === "Administrador") {
        window.location.href = "AdminHome.html";
      } else if (user.rol === "Vendedor") {
        window.location.href = "VendedorHome.html";
      } else {
        alert("Tu rol no tiene acceso al panel.");
      }
    });
  }

  // ==================================================
  // 2) FORMULARIO PRODUCTO (crear/editar con LS)
  // ==================================================
  {
    const STORE_KEY = "ADMIN_PRODUCTS_V1";

    // mapeos entre formatos admin <-> público
    const toAdmin = p => ({
      codigo: p.codigo || p.id || "",
      nombre: p.nombre || "",
      precio: Number(p.precio ?? 0),
      stock: Number(p.stock ?? 0),
      stockCritico: Number(p.stockCritico ?? 0),
      categoria: p.categoria || p.category || "",
      attr: p.attr || "",
      imagen: p.imagen || p.img || p.image || p.picture || "",
      descripcion: p.descripcion || ""
    });
    const toPublic = a => ({
      id: a.codigo,
      nombre: a.nombre,
      precio: Number(a.precio || 0),
      categoria: a.categoria || "",
      attr: a.attr || "",
      img: a.imagen || ""
    });

    const loadList = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
        if (Array.isArray(saved) && saved.length) return saved;
      } catch (e) {}
      if (Array.isArray(window.PRODUCTS) && window.PRODUCTS.length) {
        return window.PRODUCTS.map(toAdmin);
      }
      if (typeof window.productos !== "undefined") {
        return window.productos.map(toAdmin);
      }
      return [];
    };

    const saveList = (list) => {
      localStorage.setItem(STORE_KEY, JSON.stringify(list));
      window.PRODUCTS = list.map(toPublic);
    };

    // ---- categorías dinámicas ----
    const uniq = arr => Array.from(new Set(arr.filter(Boolean)));
    function buildCategories(list) {
      const fromData = (window.PRODUCTS || []).map(p => p.categoria || p.category || p.categoryName || "");
      return uniq([...(window.CATEGORIES || []), ...fromData, ...list.map(p => p.categoria || "")])
        .sort((a, b) => a.localeCompare(b, "es"));
    }
    function paintCategories(selectEl, cats, selected) {
      if (!selectEl) return;
      selectEl.innerHTML = '<option value="">-- Selecciona --</option>' +
        cats.map(c => `<option value="${c}">${c}</option>`).join("");
      if (selected && !cats.includes(selected)) {
        const opt = document.createElement("option");
        opt.value = selected;
        opt.textContent = selected;
        selectEl.appendChild(opt);
      }
      if (selected) selectEl.value = selected;
    }

    const formProducto = document.getElementById("formProducto");
    if (formProducto) {
      const params = new URLSearchParams(location.search);
      const editingCode = params.get("codigo") || "";
      let list = loadList();

      // pintar categorías antes de pre-cargar datos
      const catSelect = document.getElementById("categoria");
      const allCats = buildCategories(list);
      paintCategories(catSelect, allCats, "");

      if (editingCode) {
        const p = list.find(x => x.codigo === editingCode);
        if (p) {
          $("#codigo").value = p.codigo;
          $("#nombre").value = p.nombre;
          $("#descripcion").value = p.descripcion || "";
          $("#precio").value = p.precio;
          $("#stock").value = p.stock;
          $("#stockCritico").value = p.stockCritico || 0;
          $("#imagen").value = p.imagen || "";
          paintCategories(catSelect, buildCategories(list), p.categoria || "");
          $("#codigo").readOnly = true;
        }
      }

      formProducto.addEventListener("submit", (e) => {
        e.preventDefault();
        let valido = true;

        const codigo = $("#codigo");
        const nombre = $("#nombre");
        const descripcion = $("#descripcion");
        const precio = $("#precio");
        const stock = $("#stock");
        const stockCritico = $("#stockCritico");
        const categoria = $("#categoria");
        const imagen = $("#imagen");

        if (!codigo.value || codigo.value.length < 3) { mostrarError("codigoHelp","El código debe tener al menos 3 caracteres"); valido=false; } else limpiarError("codigoHelp");
        if (!nombre.value) { mostrarError("nombreHelp","El nombre es obligatorio"); valido=false; } else limpiarError("nombreHelp");
        if (descripcion.value.length > 500) { mostrarError("descripcionHelp","Máximo 500 caracteres"); valido=false; } else limpiarError("descripcionHelp");
        if (precio.value === "" || Number(precio.value) < 0) { mostrarError("precioHelp","El precio debe ser mayor o igual a 0"); valido=false; } else limpiarError("precioHelp");
        if (stock.value === "" || Number(stock.value) < 0 || !Number.isInteger(Number(stock.value))) { mostrarError("stockHelp","El stock debe ser entero ≥ 0"); valido=false; } else limpiarError("stockHelp");
        if (stockCritico.value && (Number(stockCritico.value) < 0 || !Number.isInteger(Number(stockCritico.value)))) { mostrarError("stockCriticoHelp","El stock crítico debe ser entero ≥ 0"); valido=false; } else limpiarError("stockCriticoHelp");
        if (!categoria.value) { mostrarError("categoriaHelp","Debes seleccionar una categoría"); valido=false; } else limpiarError("categoriaHelp");
        if (!valido) return;

        const nuevo = toAdmin({
          codigo: codigo.value.trim(),
          nombre: nombre.value.trim(),
          descripcion: descripcion.value.trim(),
          precio: Number(precio.value),
          stock: Number(stock.value),
          stockCritico: Number(stockCritico.value || 0),
          categoria: categoria.value,
          imagen: imagen.value.trim()
        });

        const idx = list.findIndex(x => x.codigo === nuevo.codigo);
        if (idx >= 0) list[idx] = { ...list[idx], ...nuevo };
        else {
          if (list.some(x => x.codigo === nuevo.codigo)) { mostrarError("codigoHelp","Ya existe un producto con ese código"); return; }
          list.push(nuevo);
        }

        paintCategories(catSelect, buildCategories(list), nuevo.categoria);
        saveList(list);
        alert("Producto guardado ✔️");
        window.location.href = "AdminProductos.html";
      });
    }
  }

  // ==================================================
  // 3) FORMULARIO USUARIO (ADMIN) -> LS (crear/editar)
  // ==================================================
  const formUsuario = document.getElementById("formUsuario");
  if (formUsuario) {
    // Prefill si venimos a editar: ?run=XXXXX
    const params = new URLSearchParams(location.search);
    const editingRun = (params.get("run") || "").toUpperCase();

    // Cargar existentes (base + guardados) para prefill
    const usersCombined = (() => {
      const base = Array.isArray(window.usuarios) ? window.usuarios : [];
      const saved = loadUsersLS();
      const map = new Map();
      [...base, ...saved].forEach(u => map.set((u.run || "").toUpperCase(), u));
      return [...map.values()];
    })();

    if (editingRun) {
      const u = usersCombined.find(x => (x.run || "").toUpperCase() === editingRun);
      if (u) {
        $("#run").value = u.run || "";
        $("#nombre").value = u.nombre || "";
        $("#apellidos").value = u.apellidos || "";
        $("#correo").value = u.correo || "";
        $("#rol").value = u.rol || "";
        $("#direccion").value = u.direccion || "";

        // Región / Comuna (si están disponibles en el DOM y regiones ya cargadas)
        const regionSel = $("#region"), comunaSel = $("#comuna");
        if (regionSel) {
          regionSel.value = u.region || "";
          // si DataAdmin.js pobla comunas en change:
          regionSel.dispatchEvent(new Event("change"));
        }
        if (comunaSel) {
          setTimeout(() => { comunaSel.value = u.comuna || ""; }, 0);
        }

        // RUN no editable al modificar
        $("#run").readOnly = true;
      }
    }

    formUsuario.addEventListener("submit", e => {
      e.preventDefault();
      let valido = true;

      const run = $("#run");
      const nombre = $("#nombre");
      const apellidos = $("#apellidos");
      const correo = $("#correo");
      const rol = $("#rol");
      const region = $("#region");
      const comuna = $("#comuna");
      const direccion = $("#direccion");

      if (!/^[0-9]{7,8}[0-9Kk]$/.test(run.value)) { mostrarError("runHelp","El RUN debe tener 7 a 9 caracteres, sin puntos ni guion (Ej: 19011022K)"); valido=false; } else limpiarError("runHelp");
      if (!nombre.value) { mostrarError("nombreHelp","El nombre es obligatorio"); valido=false; } else limpiarError("nombreHelp");
      if (!apellidos.value) { mostrarError("apellidosHelp","Los apellidos son obligatorios"); valido=false; } else limpiarError("apellidosHelp");
      if (!/^[\w.%+-]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i.test(correo.value)) { mostrarError("correoHelp","Correo no válido"); valido=false; } else limpiarError("correoHelp");
      if (!rol.value) { mostrarError("rolHelp","Selecciona un rol"); valido=false; } else limpiarError("rolHelp");
      if (region && !region.value) { mostrarError("regionHelp","Selecciona una región"); valido=false; } else limpiarError("regionHelp");
      if (comuna && !comuna.value) { mostrarError("comunaHelp","Selecciona una comuna"); valido=false; } else limpiarError("comunaHelp");
      if (!direccion.value) { mostrarError("direccionHelp","La dirección es obligatoria"); valido=false; } else limpiarError("direccionHelp");
      if (!valido) return;

      const nuevoUsuario = {
        run: run.value.toUpperCase().trim(),
        nombre: nombre.value.trim(),
        apellidos: apellidos.value.trim(),
        correo: correo.value.trim(),
        rol: rol.value,
        region: region?.value || "",
        comuna: comuna?.value || "",
        direccion: direccion.value.trim()
      };

      // Persistir en LS: crear/editar por RUN
      let saved = loadUsersLS();
      const idx = saved.findIndex(x => (x.run || "").toUpperCase() === nuevoUsuario.run);
      if (idx >= 0) {
        saved[idx] = { ...saved[idx], ...nuevoUsuario };
      } else {
        // prevenir duplicados si ya existe en base+saved
        const exists = usersCombined.some(x => (x.run || "").toUpperCase() === nuevoUsuario.run);
        if (exists && !editingRun) {
          mostrarError("runHelp", "Ya existe un usuario con ese RUN");
          return;
        }
        saved.push(nuevoUsuario);
      }
      saveUsersLS(saved);

      alert("Usuario registrado correctamente ✔️");
      window.location.href = "AdminUsuario.html";
    });
  }
});

// -------------------------------
// Funciones auxiliares
// -------------------------------
function mostrarError(id, mensaje) {
  const el = document.getElementById(id);
  if (el) el.textContent = mensaje;
}
function limpiarError(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = "";
}

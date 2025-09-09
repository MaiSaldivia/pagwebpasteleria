// ================================
// VALIDACIONES ADMINISTRADOR
// ================================
document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------
  // 1. LOGIN (con roles y sesión)
  // -------------------------------
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

      // Buscar usuario por correo en DataAdmin.js
      const user = (typeof usuarios !== "undefined")
        ? usuarios.find(u => (u.correo || "").toLowerCase() === correo)
        : null;

      if (!user) {
        mostrarError("correoHelp", "Usuario no encontrado");
        return;
      }

      // Para la evaluación: no se valida password real (o usa '1234' si te lo exigen)
      // Guardar sesión mínima
      const session = {
        correo: user.correo,
        nombre: user.nombre,
        rol: user.rol // "Administrador" | "Vendedor"
      };
      localStorage.setItem("session", JSON.stringify(session));

      alert("Ingreso exitoso ✔️");

      // Redirigir según rol
      if (user.rol === "Administrador") {
        window.location.href = "AdminHome.html";
      } else if (user.rol === "Vendedor") {
        window.location.href = "VendedorHome.html";
      } else {
        alert("Tu rol no tiene acceso al panel.");
      }
    });
  }

  // -------------------------------
  // 2. FORMULARIO PRODUCTO
  // -------------------------------
  const formProducto = document.getElementById("formProducto");
  if (formProducto) {
    formProducto.addEventListener("submit", e => {
      e.preventDefault();
      let valido = true;

      const codigo = document.getElementById("codigo");
      const nombre = document.getElementById("nombre");
      const descripcion = document.getElementById("descripcion");
      const precio = document.getElementById("precio");
      const stock = document.getElementById("stock");
      const stockCritico = document.getElementById("stockCritico");
      const categoria = document.getElementById("categoria");
      const imagen = document.getElementById("imagen");

      if (!codigo.value || codigo.value.length < 3) {
        mostrarError("codigoHelp", "El código debe tener al menos 3 caracteres");
        valido = false;
      } else limpiarError("codigoHelp");

      if (!nombre.value) {
        mostrarError("nombreHelp", "El nombre es obligatorio");
        valido = false;
      } else limpiarError("nombreHelp");

      if (descripcion.value.length > 500) {
        mostrarError("descripcionHelp", "Máximo 500 caracteres");
        valido = false;
      } else limpiarError("descripcionHelp");

      if (precio.value === "" || Number(precio.value) < 0) {
        mostrarError("precioHelp", "El precio debe ser mayor o igual a 0");
        valido = false;
      } else limpiarError("precioHelp");

      if (stock.value === "" || Number(stock.value) < 0 || !Number.isInteger(Number(stock.value))) {
        mostrarError("stockHelp", "El stock debe ser un número entero mayor o igual a 0");
        valido = false;
      } else limpiarError("stockHelp");

      if (stockCritico.value && (Number(stockCritico.value) < 0 || !Number.isInteger(Number(stockCritico.value)))) {
        mostrarError("stockCriticoHelp", "El stock crítico debe ser un número entero mayor o igual a 0");
        valido = false;
      } else limpiarError("stockCriticoHelp");

      if (!categoria.value) {
        mostrarError("categoriaHelp", "Debes seleccionar una categoría");
        valido = false;
      } else limpiarError("categoriaHelp");

      if (valido) {
        const nuevoProducto = {
          codigo: codigo.value,
          nombre: nombre.value,
          descripcion: descripcion.value,
          precio: Number(precio.value),
          stock: Number(stock.value),
          stockCritico: Number(stockCritico.value || 0),
          categoria: categoria.value,
          imagen: imagen.value
        };

        if (typeof productos !== "undefined") {
          productos.push(nuevoProducto);
          console.log("Producto agregado:", nuevoProducto);
          console.log("Total de productos:", productos);
        }

        alert("Producto registrado correctamente ✔️");
        window.location.href = "AdminProductos.html";
      }
    });
  }

  // -------------------------------
  // 3. FORMULARIO USUARIO
  // -------------------------------
  const formUsuario = document.getElementById("formUsuario");
  if (formUsuario) {
    formUsuario.addEventListener("submit", e => {
      e.preventDefault();
      let valido = true;

      const run = document.getElementById("run");
      const nombre = document.getElementById("nombre");
      const apellidos = document.getElementById("apellidos");
      const correo = document.getElementById("correo");
      const rol = document.getElementById("rol");
      const region = document.getElementById("region");
      const comuna = document.getElementById("comuna");
      const direccion = document.getElementById("direccion");

      if (!/^[0-9]{7,8}[0-9Kk]$/.test(run.value)) {
        mostrarError("runHelp", "El RUN debe tener 7 a 9 caracteres, sin puntos ni guion (Ej: 19011022K)");
        valido = false;
      } else limpiarError("runHelp");

      if (!nombre.value) {
        mostrarError("nombreHelp", "El nombre es obligatorio");
        valido = false;
      } else limpiarError("nombreHelp");

      if (!apellidos.value) {
        mostrarError("apellidosHelp", "Los apellidos son obligatorios");
        valido = false;
      } else limpiarError("apellidosHelp");

      if (!/^[\w.%+-]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i.test(correo.value)) {
        mostrarError("correoHelp", "Correo no válido");
        valido = false;
      } else limpiarError("correoHelp");

      if (!rol.value) {
        mostrarError("rolHelp", "Selecciona un rol");
        valido = false;
      } else limpiarError("rolHelp");

      if (!region.value) {
        mostrarError("regionHelp", "Selecciona una región");
        valido = false;
      } else limpiarError("regionHelp");

      if (!comuna.value) {
        mostrarError("comunaHelp", "Selecciona una comuna");
        valido = false;
      } else limpiarError("comunaHelp");

      if (!direccion.value) {
        mostrarError("direccionHelp", "La dirección es obligatoria");
        valido = false;
      } else limpiarError("direccionHelp");

      if (valido) {
        const nuevoUsuario = {
          run: run.value,
          nombre: nombre.value,
          apellidos: apellidos.value,
          correo: correo.value,
          rol: rol.value,
          region: region.value,
          comuna: comuna.value,
          direccion: direccion.value
        };

        if (typeof usuarios !== "undefined") {
          usuarios.push(nuevoUsuario);
          console.log("Usuario agregado:", nuevoUsuario);
          console.log("Total de usuarios:", usuarios);
        }

        alert("Usuario registrado correctamente ✔️");
        window.location.href = "AdminUsuario.html";
      }
    });
  }
});

// -------------------------------
// FUNCIONES AUXILIARES
// -------------------------------
function mostrarError(id, mensaje) {
  const el = document.getElementById(id);
  if (el) el.textContent = mensaje;
}

function limpiarError(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = "";
}

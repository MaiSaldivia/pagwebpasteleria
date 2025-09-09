// ================================
// ADMIN JS (Tablas de Productos y Usuarios)
// ================================
window.addEventListener("DOMContentLoaded", () => {
  // -------------------------------
  // Renderizar Productos
  // -------------------------------
  const tablaProductos = document.querySelector("#tablaProductos tbody");
  if (tablaProductos && typeof productos !== "undefined") {
    productos.forEach(p => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${p.codigo}</td>
        <td>${p.nombre}</td>
        <td>$${p.precio.toLocaleString()}</td>
        <td>${p.stock}</td>
        <td>${p.categoria}</td>
        <td>
          <div class="table-actions">
            <button class="btn-edit">✏️ Editar</button>
            <button class="btn-delete">🗑️ Eliminar</button>
          </div>
        </td>
      `;
      tablaProductos.appendChild(fila);
    });
  }

  // -------------------------------
  // Renderizar Usuarios
  // -------------------------------
  const tablaUsuarios = document.querySelector("#tablaUsuarios tbody");
  if (tablaUsuarios && typeof usuarios !== "undefined") {
    usuarios.forEach(u => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${u.run}</td>
        <td>${u.nombre}</td>
        <td>${u.apellidos}</td>
        <td>${u.correo}</td>
        <td>${u.rol}</td>
        <td>
          <div class="table-actions">
            <button class="btn-edit">✏️ Editar</button>
            <button class="btn-delete">🗑️ Eliminar</button>
          </div>
        </td>
      `;
      tablaUsuarios.appendChild(fila);
    });
  }
});
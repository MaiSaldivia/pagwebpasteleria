// ================================
// ADMIN (Productos y Usuarios) - CRUD Productos con localStorage
// ================================
(function () {
  const STORE_KEY = 'ADMIN_PRODUCTS_V1';

  // ---- helpers de mapeo entre formatos ----
  const toAdmin = p => ({
    codigo: (p.codigo || p.id || p.code || '').toString(),
    nombre: p.nombre || p.name || p.title || '',
    precio: Number(p.precio ?? p.price ?? 0),
    stock: Number(p.stock ?? 0),
    stockCritico: Number(p.stockCritico ?? 0),
    categoria: p.categoria || p.category || p.categoryName || '',
    attr: p.attr || p.atributo || '',
    imagen: p.imagen || p.img || p.image || p.picture || '',
    descripcion: p.descripcion || ''
  });

  const toPublic = a => ({
    id: a.codigo,
    nombre: a.nombre,
    precio: Number(a.precio || 0),
    categoria: a.categoria || '',
    attr: a.attr || '',
    img: a.imagen || ''
  });

  const fmtCLP = n =>
    Number(n || 0).toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    });

  function getBase() {
    if (Array.isArray(window.PRODUCTS) && window.PRODUCTS.length) {
      return window.PRODUCTS.map(toAdmin);
    }
    if (Array.isArray(window.productos) && window.productos.length) {
      return window.productos.map(toAdmin);
    }
    return [];
  }

  function mergeByCodigo(baseList, savedList) {
    const map = new Map();
    baseList.forEach(p => map.set(p.codigo, p));
    savedList.forEach(p => map.set(p.codigo, p)); // sobreescribe con cambios del admin
    return Array.from(map.values());
  }

  function loadList() {
    const base = getBase();
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    } catch {}

    // Si no hay nada guardado, sembramos con la base y persistimos
    if (!Array.isArray(saved) || saved.length === 0) {
      const seeded = base.slice();
      saveList(seeded);
      return seeded;
    }

    // Si ya había guardado, lo fusionamos con la base para no “perder” productos
    return mergeByCodigo(base, saved);
  }

  function saveList(list) {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
    // Mantener la tienda sincronizada durante la sesión
    window.PRODUCTS = list.map(toPublic);
  }

  // ---- render de tabla productos + acciones ----
  document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.querySelector('#tablaProductos tbody');
    if (!tbody) return;

    let data = loadList();

    function render() {
      if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#666;">No hay productos</td></tr>`;
        return;
      }
      tbody.innerHTML = data
        .map(
          p => `
        <tr data-code="${p.codigo}">
          <td>${p.codigo}</td>
          <td>${p.nombre}</td>
          <td>${fmtCLP(p.precio)}</td>
          <td>${p.stock ?? 0}</td>
          <td>${p.categoria || '-'}</td>
          <td>
            <div class="table-actions">
              <button class="btn-edit">✏️ Editar</button>
              <button class="btn-delete">🗑️ Eliminar</button>
            </div>
          </td>
        </tr>`
        )
        .join('');
    }

    render();

    // Delegación de eventos (editar / eliminar)
    tbody.addEventListener('click', e => {
      const row = e.target.closest('tr[data-code]');
      if (!row) return;
      const code = row.dataset.code;

      if (e.target.closest('.btn-edit')) {
        window.location.href =
          'AdminProductoNuevo.html?codigo=' + encodeURIComponent(code);
        return;
      }

      if (e.target.closest('.btn-delete')) {
        const p = data.find(x => x.codigo === code);
        if (!p) return;
        if (confirm(`¿Eliminar "${p.nombre}" (${p.codigo})?`)) {
          data = data.filter(x => x.codigo !== code);
          saveList(data);
          render();
          alert('Producto eliminado ✔️');
        }
      }
    });

    // ---- Render usuarios ----
    const tablaUsuarios = document.querySelector('#tablaUsuarios tbody');
    if (tablaUsuarios && Array.isArray(window.usuarios)) {
      tablaUsuarios.innerHTML = window.usuarios
        .map(
          u => `
        <tr>
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
        </tr>`
        )
        .join('');
    }
  });
})();
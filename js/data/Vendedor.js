// ================================
// VENDEDOR - Pedidos e Inventario
// ================================
(function () {
  const PRODUCTS_KEY = "ADMIN_PRODUCTS_V1";
  const ORDERS_KEY   = "ORDERS_V1";

  const $ = (s, ctx=document) => ctx.querySelector(s);
  const money = v => "$" + Number(v||0).toLocaleString("es-CL");

  // --- Limitar navegación a lo permitido (Inicio, Pedidos, Inventario, Volver a tienda) ---
  document.addEventListener("DOMContentLoaded", () => {
    const allowed = new Set(["VendedorHome.html","VendedorPedidos.html","VendedorInventario.html","index.html"]);
    document.querySelectorAll(".vendedor-sidebar .sidebar__nav a").forEach(a=>{
      const href = a.getAttribute("href") || "";
      if(!allowed.has(href)) a.remove();
    });
  });

  // ---------- Productos ----------
  const toAdmin = p => ({
    codigo: (p.codigo||p.id||p.code||"").toString(),
    nombre: p.nombre || p.name || p.title || "",
    precio: Number(p.precio ?? p.price ?? 0),
    stock: Number(p.stock ?? 0),
    stockCritico: Number(p.stockCritico ?? 0),
    categoria: p.categoria || p.category || "",
    attr: p.attr || p.atributo || "",
    imagen: p.imagen || p.img || p.image || p.picture || "",
    descripcion: p.descripcion || ""
  });

  function loadProducts() {
    try {
      const saved = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || "[]");
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    if (Array.isArray(window.PRODUCTS) && window.PRODUCTS.length) {
      return window.PRODUCTS.map(toAdmin);
    }
    if (Array.isArray(window.productos) && window.productos.length) {
      return window.productos.map(toAdmin);
    }
    return [];
  }
  function saveProducts(list){
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
  }

  // ---------- Pedidos ----------
  function seedOrders(){
    return [
      { id:"PED001", cliente:"Ana López",  total:25000, estado:"Pendiente", items:[{codigo:"P001", nombre:"Torta de Chocolate", qty:1, price:25000}] },
      { id:"PED002", cliente:"Juan Pérez", total:18000, estado:"Enviado",   items:[{codigo:"P003", nombre:"Pastel de Zanahoria", qty:1, price:18000}] },
      { id:"PED003", cliente:"Luis Ramírez", total:32000, estado:"Pendiente", items:[{codigo:"P002", nombre:"Cheesecake Frutos Rojos", qty:2, price:16000}] }
    ];
  }
  function loadOrders(){
    try {
      const saved = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    const demo = seedOrders();
    localStorage.setItem(ORDERS_KEY, JSON.stringify(demo));
    return demo;
  }

  // ---------- Modal reutilizable ----------
  const modal   = $("#pedidoModal");
  const mTitle  = $("#mTitle");
  const mBody   = $("#mBody");
  const mClose  = $("#mClose");
  const mOk     = $("#mOk");

  function openModal(title, html){
    if(!modal){ alert(title + "\n\n" + html.replace(/<[^>]+>/g,"")); return; }
    if (mTitle) mTitle.textContent = title || "Detalle";
    if (mBody)  mBody.innerHTML = html || "";
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal(){
    if(!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  }
  if (mClose) mClose.addEventListener("click", closeModal);
  if (mOk)    mOk.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e)=>{ if(e.target === modal) closeModal(); });
    window.addEventListener("keydown", (e)=>{ if(!modal.hidden && e.key === "Escape") closeModal(); });
  }

  function orderToHtml(o){
    const items = (o.items||[])
      .map(it => `<li>${it.nombre} <small>(${it.codigo})</small> × ${it.qty} — <strong>${money(it.price*it.qty)}</strong></li>`)
      .join("");
    return `
      <p><strong>Cliente:</strong> ${o.cliente}</p>
      <p><strong>Estado:</strong> ${o.estado}</p>
      <h4>Ítems</h4>
      <ul>${items || "<li>(sin ítems)</li>"}</ul>
      <p><strong>Total:</strong> ${money(o.total)}</p>
    `;
  }

  // ---------- Render Pedidos ----------
  function renderOrders(){
    const table = $("#tablaPedidos"); if(!table) return;
    const tbody = table.querySelector("tbody");
    const orders = loadOrders();

    if(!orders.length){
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#666;">No hay pedidos</td></tr>`;
      return;
    }
    tbody.innerHTML = orders.map(o => `
      <tr data-id="${o.id}">
        <td>${o.id}</td>
        <td>${o.cliente}</td>
        <td>${money(o.total)}</td>
        <td>${o.estado}</td>
        <td><button class="btn btn--principal" data-detalle="${o.id}">Ver Detalles</button></td>
      </tr>
    `).join("");

    tbody.addEventListener("click", (e)=>{
      const id = e.target?.dataset?.detalle;
      if(!id) return;
      const o = orders.find(x=>x.id===id);
      if(!o) return;
      openModal(`Pedido ${o.id}`, orderToHtml(o));
    });
  }

  // ---------- Render Inventario ----------
  function renderInventory(){
    const table = $("#tablaInventario"); if(!table) return;
    const tbody = table.querySelector("tbody");
    let products = loadProducts();

    if(!products.length){
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#666;">No hay productos</td></tr>`;
      return;
    }

    const rowHtml = p => {
      const low = Number(p.stock) <= Number(p.stockCritico || 0);
      const stockCell = low
        ? `<span class="stock-bajo">Bajo (${p.stock})</span>`
        : String(p.stock);
      const link = `producto.html?id=${encodeURIComponent(p.codigo)}`;
      return `
        <tr data-code="${p.codigo}">
          <td>${p.codigo}</td>
          <td><a href="${link}" target="_blank" rel="noopener">${p.nombre}</a></td>
          <td>${stockCell}</td>
          <td><button class="btn btn--principal" data-stock="${p.codigo}">Actualizar Stock</button></td>
        </tr>`;
    };

    const paint = () => { tbody.innerHTML = products.map(rowHtml).join(""); };
    paint();

    // Actualizar stock y persistir al mismo storage que usa Admin
    tbody.addEventListener("click", (e)=>{
      const code = e.target?.dataset?.stock;
      if(!code) return;
      const idx = products.findIndex(x => String(x.codigo) === String(code));
      if(idx < 0) return;
      const cur = products[idx];
      const nuevo = prompt(`Nuevo stock para "${cur.nombre}" (actual: ${cur.stock})`, String(cur.stock));
      if(nuevo===null) return;
      const val = Number(nuevo);
      if(!Number.isInteger(val) || val < 0){ alert("Debe ser un entero ≥ 0"); return; }
      products[idx] = { ...cur, stock: val };
      saveProducts(products);
      paint();
    });
  }

  // ---------- Bootstrap ----------
  document.addEventListener("DOMContentLoaded", ()=>{
    renderOrders();
    renderInventory();
  });
})();

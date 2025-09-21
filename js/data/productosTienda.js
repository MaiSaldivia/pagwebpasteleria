// Unifica acceso a productos entre tienda, admin y vendedor.
// Fuente canónica: localStorage['ADMIN_PRODUCTS_V1']
// Mantiene compatibilidad con clave antigua 'productosLS' solo para migrar.
(function () {
  const ADMIN_KEY  = "ADMIN_PRODUCTS_V1";
  const LEGACY_KEY = "productosLS"; // compat

  // Normaliza cualquier forma de producto a un objeto único
  const normalize = p => ({
    id:        p.id || p.codigo || p.code || p.nombre || p.name || "",
    nombre:    p.nombre || p.name || "",
    precio:    Number(p.precio ?? p.price ?? 0),
    categoria: p.categoria || p.category || p.categoryName || "",
    attr:      p.attr || p.atributo || p.attributes || "",
    img:       p.imagen || p.img || p.image || p.picture || "",
    // >>> campos de inventario (¡clave para la tienda!)
    stock:        Number(p.stock ?? 0),
    stockCritico: Number(p.stockCritico ?? 0),
    // opcional
    descripcion:  p.descripcion || p.longDesc || ""
  });

  // Base declarada en data.js (por si no hay nada en LS aún)
  function getBase() {
    const base = Array.from(window.PRODUCTS || []).map(normalize);
    return base;
  }

  // --- Store helpers ---
  const safeParse = (k) => {
    try { const v = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(v) ? v : []; }
    catch { return []; }
  };
  const setJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  function getStoreRaw() {
    const admin = safeParse(ADMIN_KEY);
    if (admin.length) return admin;
    // compat: migración desde productosLS si existiera
    const legacy = safeParse(LEGACY_KEY);
    if (legacy.length) {
      setJSON(ADMIN_KEY, legacy);
      return legacy;
    }
    // si no hay nada, sembrar con base
    const seeded = getBase();
    setJSON(ADMIN_KEY, seeded);
    return seeded;
  }

  function setStoreRaw(list) {
    setJSON(ADMIN_KEY, list);
    // opcional: mantener legacy sincronizado (por si algo viejo lo leyera)
    setJSON(LEGACY_KEY, list);
  }

  // Merge: completamos con la base por id (por si falta algún campo)
  const getId = o => o?.id || o?.codigo || o?.code || o?.nombre || o?.name;
  function mergedList() {
    const base = getBase();
    const ls   = getStoreRaw().map(normalize);
    const baseMap = new Map(base.map(p => [getId(p), normalize(p)]));
    // sobreescribe con lo guardado (admin/vendedor)
    const merged = ls.map(p => ({ ...baseMap.get(getId(p)), ...p }));
    return merged;
  }

  // Mantener window.PRODUCTS sincronizado (para el resto de la tienda)
  function refreshWindowProducts() {
    window.PRODUCTS = mergedList().map(p => ({
      id: p.id, nombre: p.nombre, precio: p.precio,
      categoria: p.categoria, attr: p.attr, img: p.img,
      stock: p.stock, stockCritico: p.stockCritico, descripcion: p.descripcion
    }));
  }

  // Si otra pestaña cambia el inventario, reflejarlo
  window.addEventListener("storage", (e) => {
    if (e.key === ADMIN_KEY) refreshWindowProducts();
  });

  // Seed/sync inicial
  refreshWindowProducts();

  // ===== API global mínima =====
  window.ProductsStore = {
    // Devuelve la lista lista para usar en la tienda (con stock)
    getAll() {
      return mergedList();
    },
    // Inserta o actualiza por id/código
    upsert(prod) {
      const list = getStoreRaw();
      const id   = getId(prod);
      const idx  = list.findIndex(p => getId(p) === id);
      const nuevo = normalize({ ...list[idx], ...prod, id }); // preserva id
      if (idx >= 0) list[idx] = nuevo;
      else list.push(nuevo);
      setStoreRaw(list);
      refreshWindowProducts();
    },
    // Elimina por id/objeto
    remove(idOrObj) {
      const id = (idOrObj && getId(idOrObj)) || idOrObj;
      const list = getStoreRaw().filter(p => getId(p) !== id);
      setStoreRaw(list);
      refreshWindowProducts();
    },
    // Acceso raw (por si lo necesitas en admin)
    getRaw()  { return getStoreRaw(); },
    setRaw(l) { setStoreRaw((Array.isArray(l) ? l : []).map(normalize)); refreshWindowProducts(); }
  };
})();

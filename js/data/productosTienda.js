// Unifica acceso a productos entre tienda y admin.
(function () {
  const KEY = "productosLS";

  const normalize = p => ({
    id:        p.id || p.codigo || p.code || p.nombre || p.name,
    nombre:    p.nombre || p.name || "",
    precio:    Number(p.precio ?? p.price ?? 0),
    categoria: p.categoria || p.category || p.categoryName || "",
    attr:      p.attr || p.atributo || p.attributes || "",
    img:       p.img || p.image || p.picture || ""
  });

  function getBase() {
    return Array.from(window.PRODUCTS || []).map(normalize);
  }

  function getLS() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch { return []; }
  }

  function setLS(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  (function seedIfNeeded() {
    const cur = getLS();
    if (!cur.length) setLS(getBase());
  })();

  // API global mínima
  window.ProductsStore = {
    getAll() {
      const base = getBase();
      const ls   = getLS();
      if (!ls.length) return base; // por si acaso
      // devolvemos LS completado con campos faltantes desde base (por id)
      const byId = o => o.id || o.codigo || o.code || o.nombre || o.name;
      const baseMap = new Map(base.map(p => [byId(p), p]));
      return ls.map(p => ({ ...baseMap.get(byId(p)), ...p }));
    },
    upsert(prod) {
      const list = getLS();
      const byId = o => o.id || o.codigo || o.code || o.nombre || o.name;
      const id   = byId(prod);
      const idx  = list.findIndex(p => byId(p) === id);
      const nuevo = normalize(prod);
      if (idx >= 0) list[idx] = { ...list[idx], ...nuevo };
      else list.push(nuevo);
      setLS(list);
    },
    remove(idOrObj) {
      const id = (idOrObj && (idOrObj.id || idOrObj.codigo || idOrObj.code || idOrObj.nombre || idOrObj.name)) || idOrObj;
      const list = getLS().filter(p => (p.id || p.codigo || p.code || p.nombre || p.name) !== id);
      setLS(list);
    },
    getRaw() { return getLS(); },
    setRaw(list) { setLS(list); }
  };
})();

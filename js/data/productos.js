(function () {
  // --- Fusionar base (data.js) + lo del admin (localStorage) ---
  const STORE_KEY = 'ADMIN_PRODUCTS_V1';

  const norm = p => ({
    id:        p.id || p.codigo || p.code || p.nombre || p.name || '',
    nombre:    p.nombre || p.name || '',
    precio:    Number(p.precio ?? p.price ?? 0),
    categoria: p.categoria || p.category || p.categoryName || '',
    attr:      p.attr || p.atributo || p.attributes || '',
    img:       p.imagen || p.img || p.image || p.picture || ''
  });

  const base  = Array.isArray(window.PRODUCTS) ? window.PRODUCTS.map(norm) : [];
  let saved   = [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    if (Array.isArray(raw)) saved = raw.map(norm);
  } catch (e) {}

  const byId = new Map();
  for (const p of base)  if (p.id) byId.set(String(p.id), p);
  for (const p of saved) if (p.id) byId.set(String(p.id), { ...byId.get(String(p.id)), ...p });

  // Lista final
  const ALL = Array.from(byId.values());
  window.PRODUCTS = ALL;

  // ===== Helpers =====
  const getName  = p => p.name || p.nombre || p.title || "";
  const getCat   = p => p.category || p.categoria || p.categoryName || "";
  const getAttr  = p => p.attr || p.atributo || p.attributes || "";
  const getId    = p => p.id || p.code || getName(p);
  const getImg   = p => p.img || p.image || p.picture || "";
  const getPrice = p => Number(String(p.price ?? p.precio ?? 0).toString().replace(/[^0-9.]/g, "")) || 0;

  const grid  = document.getElementById("grid");
  const q     = document.getElementById("q");
  const cat   = document.getElementById("cat");
  const sort  = document.getElementById("sort");
  const chips = document.getElementById("chips");

  // ===== 1) Categorías =====
  const baseCats = [
    "Tortas Cuadradas", "Tortas Circulares", "Postres Individuales",
    "Productos Sin Azúcar", "Pastelería Tradicional",
    "Productos Sin Gluten", "Productos Vegana", "Tortas Especiales"
  ];
  const fromData = Array.from(new Set((window.PRODUCTS || []).map(getCat))).filter(Boolean);
  const CATS = Array.from(new Set([...baseCats, ...fromData]));

  // Rellena select y chips
  CATS.forEach(c => {
    const op = document.createElement("option");
    op.value = c;
    op.textContent = c;
    cat.appendChild(op);

    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = c;
    chip.addEventListener("click", () => {
      cat.value = c;
      render();
      scrollTo({ top: grid.offsetTop - 80, behavior: "smooth" });
    });
    chips.appendChild(chip);
  });

  // ===== 2) HTML de tarjeta =====
  function cardHTML(p) {
    const price = (getPrice(p) || 0).toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
    const name  = getName(p);
    const attr  = getAttr(p);
    const id    = encodeURIComponent(getId(p));
    const src   = getImg(p) ? encodeURI(getImg(p)) : "img/placeholder.png";

    return `
      <article class="tarjeta" data-id="${id}">
        <a href="producto.html?id=${id}" class="tarjeta__imagen" aria-label="${name}">
          <img loading="lazy" src="${src}" alt="${name}">
        </a>
        <a class="tarjeta__titulo" href="producto.html?id=${id}">${name}</a>
        ${attr ? `<p class="tarjeta__atributo">${attr}</p>` : `<p class="tarjeta__atributo">&nbsp;</p>`}
        <p class="tarjeta__precio">${price}</p>
        <button class="btn btn--fantasma boton-añadir-carrito" data-id="${id}">Añadir</button>
      </article>
    `;
  }

  // ===== 3) Render principal =====
  function render() {
    let list = (window.PRODUCTS || []).slice();

    // Búsqueda
    const term = q.value.trim().toLowerCase();
    if (term) {
      list = list.filter(p =>
        [getName(p), getAttr(p), getCat(p)]
          .filter(Boolean).join(" ").toLowerCase().includes(term)
      );
    }

    // Categoría
    const c = cat.value;
    if (c && c !== "__all__") {
      list = list.filter(p => (getCat(p) || "").toLowerCase() === c.toLowerCase());
    }

    // Ordenamiento
    const s = sort.value;
    if (s === "price-asc")  list.sort((a, b) => getPrice(a) - getPrice(b));
    if (s === "price-desc") list.sort((a, b) => getPrice(b) - getPrice(a));
    if (s === "name-asc")   list.sort((a, b) => getName(a).localeCompare(getName(b), "es"));

    // Pintar
    grid.innerHTML = list.map(cardHTML).join("");

    // Delegar click de "Añadir"
    grid.querySelectorAll(".boton-añadir-carrito").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof window.addToCart === "function") {
          window.addToCart(btn.dataset.id);
        } else {
          alert("Añadido al carrito " + btn.dataset.id);
        }
      });
    });
  }

  // ===== 4) Eventos =====
  q.addEventListener("input", render);
  cat.addEventListener("change", render);
  sort.addEventListener("change", render);

  // Primera carga
  render();
})();

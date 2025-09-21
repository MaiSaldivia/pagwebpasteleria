(function () {
  // --- Fuente única: base (data.js) + admin (localStorage) ---
  const STORE_KEY = 'ADMIN_PRODUCTS_V1';
  const norm = p => ({
    id:        p.id || p.codigo || p.code || p.nombre || p.name || '',
    nombre:    p.nombre || p.name || '',
    precio:    Number(p.precio ?? p.price ?? 0),
    categoria: p.categoria || p.category || p.categoryName || '',
    attr:      p.attr || p.atributo || p.attributes || '',
    img:       p.imagen || p.img || p.image || p.picture || '',
    // ---> campos de stock que ahora usamos en la tienda
    stock:         Number(p.stock ?? 0),
    stockCritico:  Number(p.stockCritico ?? 0),
    descripcion:   p.descripcion || ''
  });

  const base  = Array.isArray(window.PRODUCTS) ? window.PRODUCTS.map(norm) : [];
  let saved   = [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    if (Array.isArray(raw)) saved = raw.map(norm);
  } catch (e) {}

  // merge: lo guardado por admin sobreescribe a la base
  const byId = new Map();
  for (const p of base)  if (p.id) byId.set(String(p.id), p);
  for (const p of saved) if (p.id) byId.set(String(p.id), { ...byId.get(String(p.id)), ...p });

  const ALL = Array.from(byId.values());
  window.PRODUCTS = ALL; // disponible para otras vistas

  // === Helpers ===
  const getName  = p => p.name || p.nombre || p.title;
  const getCat   = p => p.category || p.categoria || p.categoryName;
  const getAttr  = p => p.attr || p.atributo || p.attributes || "";
  const getId    = p => p.id || p.code || getName(p);
  const rawPrice = p => String(p.price ?? p.precio ?? 0).toString();
  const getPrice = p => Number(rawPrice(p).replace(/[^0-9.]/g, '')) || 0;
  const getImg   = p => p.img || p.image || p.picture || "";
  const fmtCLP   = n => (n || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

  // === Descripciones largas ===
  const DESCS = window.DESCRIPTIONS || {
    "Torta Cuadrada de Chocolate": "Deliciosa torta de chocolate con capas de ganache y un toque de avellanas. Personalizable con mensajes especiales.",
    "Torta Cuadrada de Frutas": "Mezcla de frutas frescas y crema chantilly sobre un suave bizcocho de vainilla. Ideal para celebraciones.",
    "Torta Circular de Vainilla": "Bizcocho de vainilla clásico relleno con crema pastelera y glaseado dulce, perfecto para cualquier ocasión.",
    "Torta Circular de Manjar": "Torta tradicional con manjar y nueces, un deleite para los amantes de los sabores clásicos.",
    "Mousse de Chocolate": "Postre individual cremoso y suave, hecho con chocolate de alta calidad.",
    "Tiramisú Clásico": "Postre italiano individual con capas de café, mascarpone y cacao. Perfecto para finalizar cualquier comida.",
    "Torta Sin Azúcar de Naranja": "Ligera y deliciosa, endulzada naturalmente. Ideal para opciones más saludables.",
    "Cheesecake Sin Azúcar": "Suave y cremoso, opción perfecta para disfrutar sin culpa.",
    "Brownie Sin Gluten": "Rico y denso; ideal para quienes evitan el gluten sin sacrificar el sabor.",
    "Pan Sin Gluten": "Suave y esponjoso, perfecto para sándwiches o acompañar cualquier comida.",
    "Torta Vegana de Chocolate": "Torta húmeda y deliciosa, sin productos de origen animal.",
    "Galletas Veganas de Avena": "Crujientes y sabrosas; excelente opción de snack.",
    "Torta Especial de Cumpleaños": "Personalizable con decoraciones y mensajes únicos.",
    "Torta Especial de Boda": "Elegante y deliciosa; pensada para ser el centro de tu boda."
  };

  // === Obtiene el id del querystring ===
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  const products = (window.PRODUCTS || []);
  const prod = products.find(p => encodeURIComponent(getId(p)) === id) || products[0];

  if (!prod) {
    const cont = document.querySelector('.detalle-producto');
    if (cont) cont.innerHTML = '<p>No se encontró el producto.</p>';
    return;
  }

  // ===== Pinta la información =====
  const name  = getName(prod);
  const cat   = getCat(prod);
  const attr  = getAttr(prod);
  const basePrice = getPrice(prod);

  // Si usas beneficios dinámicos, mantenemos la lógica:
  const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  const ben  = (typeof computeUserBenefits === 'function') ? computeUserBenefits(user) : {percent:0};
  const finalPrice = (typeof priceWithBenefits === 'function') ? priceWithBenefits(basePrice, ben) : basePrice;

  document.title = name + ' · Mil Sabores';
  document.getElementById('pName').textContent = name;
  const pCatEl = document.getElementById('pCat');
  pCatEl.textContent = cat || 'Productos';
  pCatEl.href = 'productos.html' + (cat ? ('#' + encodeURIComponent(cat)) : '');
  document.getElementById('pAttr').textContent = attr ? ('• ' + attr) : '';
  document.getElementById('pPrice').innerHTML =
    ben.percent
      ? `<s class="muted">${fmtCLP(basePrice)}</s> <strong>${fmtCLP(finalPrice)}</strong>`
      : `<strong>${fmtCLP(basePrice)}</strong>`;
  document.getElementById('pLong').textContent =
    DESCS[name] || DESCS[getId(prod)] || 'Deliciosa preparación de la casa, ideal para tus celebraciones.';

  // ===== Mostrar STOCK y bloquear compra si no hay =====
  const stock = Number(prod.stock ?? 0);
  const infoBox = document.querySelector('.pdp__info');
  let stockBadge = document.getElementById('pStock');
  if (!stockBadge) {
    stockBadge = document.createElement('p');
    stockBadge.id = 'pStock';
    stockBadge.className = 'muted';
    if (infoBox) infoBox.insertBefore(stockBadge, document.getElementById('pLong'));
  }
  stockBadge.textContent = stock > 0 ? `Stock disponible: ${stock}` : 'Sin stock';

  // ===== Ruta de navegación dinámica =====
  const crumbCat    = document.getElementById('crumbCat');
  const crumbCatSep = document.getElementById('crumbCatSep');
  const crumbName   = document.getElementById('crumbName');
  crumbName.textContent = name;
  if (cat) {
    crumbCat.classList.remove('oculto');
    crumbCatSep.classList.remove('oculto');
    crumbCat.innerHTML = `<a href="productos.html#${encodeURIComponent(cat)}">${cat}</a>`;
  }

  // ===== Galería (solo 1 imagen) =====
  const hero = document.getElementById('heroImg');
  const heroSrc = encodeURI(getImg(prod) || 'img/placeholder.png');
  if (hero) {
    hero.style.backgroundImage = `url('${heroSrc}')`;
    hero.style.backgroundSize = 'cover';
    hero.style.backgroundPosition = 'center';
    hero.style.backgroundRepeat = 'no-repeat';
  }

  // ===== Personalización: mensaje en tortas =====
  const customBox = document.getElementById('customBox');
  const isCake = /torta/i.test(name);
  if (isCake && customBox) {
    customBox.classList.remove('hide');
  }

  // ===== Añadir al carrito (respetando stock) =====
  const addBtn = document.getElementById('addBtn');
  const qtyEl  = document.getElementById('qty');
  const msgEl  = document.getElementById('customMsg');

  if (qtyEl){
    // limitar por stock
    qtyEl.min = 1;
    qtyEl.max = Math.max(1, stock);
    if (stock <= 0){
      qtyEl.value = 0;
      qtyEl.disabled = true;
    } else {
      // si el usuario escribe más que el stock, lo capamos
      qtyEl.addEventListener('input', ()=>{
        let v = Number(qtyEl.value || 1);
        if (!Number.isFinite(v) || v < 1) v = 1;
        if (v > stock) v = stock;
        qtyEl.value = v;
      });
    }
  }

  if (addBtn){
    addBtn.disabled = stock <= 0;
    addBtn.textContent = stock > 0 ? 'Añadir al carrito' : 'Sin stock';

    addBtn.addEventListener('click', () => {
      if (stock <= 0){ return; }

      const qty = Math.max(1, Number(qtyEl?.value || 1));
      const customMsg = msgEl ? msgEl.value.trim() : "";

      if (typeof window.addToCart === 'function') {
        // La versión nueva de addToCart ya valida contra stock.
        window.addToCart(getId(prod), qty, customMsg);
      }
      alert('Añadido al carrito: ' + name + ' × ' + qty);
    });
  }

  // ===== Relacionados (misma categoría) =====
  const related = products
    .filter(p => getCat(p) === cat && getId(p) !== getId(prod))
    .slice(0, 4);

  const relBox = document.getElementById('related');
  relBox.innerHTML = related.map(p => {
    const rid    = encodeURIComponent(getId(p));
    const rname  = getName(p);
    const rbase  = getPrice(p);
    const rfin   = (typeof priceWithBenefits === 'function') ? priceWithBenefits(rbase, ben) : rbase;
    const rattr  = getAttr(p) || '&nbsp;';
    const rimg   = encodeURI(getImg(p) || 'img/placeholder.png');
    const priceHTML = ben.percent
      ? `<s class="muted">${fmtCLP(rbase)}</s> <strong>${fmtCLP(rfin)}</strong>`
      : `<strong>${fmtCLP(rbase)}</strong>`;

    return `
      <article class="tarjeta">
        <a href="producto.html?id=${rid}" class="tarjeta__imagen" aria-label="${rname}">
          <img loading="lazy" src="${rimg}" alt="${rname}">
        </a>
        <a class="tarjeta__titulo" href="producto.html?id=${rid}">${rname}</a>
        <p class="tarjeta__atributo">${rattr}</p>
        <p class="tarjeta__precio">${priceHTML}</p>
        <a class="btn btn--fantasma" href="producto.html?id=${rid}">Ver detalle</a>
      </article>
    `;
  }).join('');
})();

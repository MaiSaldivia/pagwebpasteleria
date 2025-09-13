/* ======= Helpers comunes ======= */
const $  = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];
const money = v => "$" + Number(v||0).toLocaleString("es-CL");

/* ======= LocalStorage ======= */
const LS = {
  get(key, def){ try{ return JSON.parse(localStorage.getItem(key)) ?? def; }catch{ return def; } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
};

/* ======= Sincroniza productos con lo guardado por el admin (si existe) ======= */
(function syncAdminProducts(){
  try{
    const saved = JSON.parse(localStorage.getItem('ADMIN_PRODUCTS_V1') || '[]');
    if (Array.isArray(saved) && saved.length){
      window.PRODUCTS = saved.map(a => ({
        id: a.codigo || a.id || "",
        nombre: a.nombre || a.name || a.title || "",
        precio: Number(a.precio ?? a.price ?? 0),
        categoria: a.categoria || a.category || a.categoryName || "",
        attr: a.attr || a.atributo || a.attributes || "",
        img: a.imagen || a.img || a.image || a.picture || ""
      }));
    }
  }catch(e){}
})();

/* ======= utils de productos ======= */
const pid    = p => String(p?.id || p?.code || p?.codigo || "");
const pprice = p => Number(String(p?.price ?? p?.precio ?? 0).toString().replace(/[^0-9.]/g,'')) || 0;

/* ======= Cart helpers para limpiar “huérfanos” ======= */
function pruneCartOrphans(){
  const ids = new Set((window.PRODUCTS || []).map(p => pid(p)));
  const cart = getCart();
  const cleaned = cart.filter(it => ids.has(String(it.id)));
  if (cleaned.length !== cart.length) {
    saveCart(cleaned);
  }
}

/* ======= Carrito ======= */
function getCart(){ return LS.get("cart", []); }

function saveCart(cart){
  LS.set("cart", cart);
  updateCartBadge();
}

function addToCart(id, qty=1){
  id = decodeURIComponent(id);

  // Evitar agregar productos que ya no existen en el catálogo
  const exists = (window.PRODUCTS || []).some(p => pid(p) === String(id));
  if (!exists){
    alert("Este producto ya no está disponible.");
    return;
  }

  qty = Math.max(1, Number(qty||1));
  const cart = getCart();
  const i = cart.findIndex(x => String(x.id) === String(id));
  if(i >= 0) cart[i].qty += qty;
  else cart.push({ id, qty });
  saveCart(cart);
}

function setQty(id, qty){
  id = decodeURIComponent(id);
  qty = Math.max(0, Number(qty||0));
  const cart = getCart();
  const i = cart.findIndex(x => String(x.id) === String(id));
  if(i === -1) return;
  if(qty === 0){ cart.splice(i,1); }
  else { cart[i].qty = qty; }
  saveCart(cart);
}

function removeFromCart(id){
  id = decodeURIComponent(id);
  const cart = getCart().filter(x => String(x.id) !== String(id));
  saveCart(cart);
}

function clearCart(){
  saveCart([]);
}

function cartTotals(){
  const cart = getCart();
  const list = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
  const items = cart.map(it => {
    const p = list.find(pp => pid(pp) === String(it.id));
    if(!p) return null;
    const price = pprice(p);
    return {
      ...p,
      id: pid(p),
      name: p.name || p.nombre || p.title || "",
      category: p.category || p.categoria || "",
      attr: p.attr || p.atributo || "",
      price,
      qty: it.qty,
      subtotal: price * it.qty
    };
  }).filter(Boolean);

  const total = items.reduce((s,x)=> s + x.subtotal, 0);
  const totalQty = items.reduce((s,x)=> s + x.qty, 0);
  return { items, total, totalQty };
}

function updateCartBadge(){
  let totalQty = 0;
  const hasProducts = Array.isArray(window.PRODUCTS) && window.PRODUCTS.length > 0;

  if (hasProducts){
    pruneCartOrphans();               // limpia fantasmas si los hay
    totalQty = cartTotals().totalQty; // cuenta solo ítems válidos
  } else {
    // fallback si en esta página no cargaste PRODUCTS
    totalQty = getCart().reduce((s,it)=> s + Number(it.qty||0), 0);
  }

  const a = document.getElementById("cartCount");
  const b = document.getElementById("contadorCarrito");
  if(a) a.textContent = String(totalQty);
  if(b) b.textContent = String(totalQty);
}

/* Exponer para otros scripts */
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartBadge = updateCartBadge;
window.setQty = setQty;

/* ======= Envío y Cupones ======= */
const SHIP_KEY   = "shipCost";
const COUPON_KEY = "couponCode_v1";

// Mapa de cupones
const COUPONS = {
  "DUOC10":      { type: "percent", value: 10,   label: "10% OFF" },
  "DUOC20":      { type: "percent", value: 20,   label: "20% OFF" },
  "5000OFF":     { type: "amount",  value: 5000, label: "$5.000 OFF" },
  "ENVIOGRATIS": { type: "ship",    value: 0,    label: "Envío gratis" }
};

const getCoupon = () => (LS.get(COUPON_KEY, "") || "").toString().trim().toUpperCase();
const setCoupon = (code) => LS.set(COUPON_KEY, (code||"").toString().trim().toUpperCase());

function evaluateCoupon(code, subTotal, shipCost){
  code = (code||"").toUpperCase().trim();
  const c = COUPONS[code];
  if(!c) return { valid:false, discount:0, shipAfter:shipCost, label:"" };

  let discount = 0, shipAfter = shipCost, label = c.label;
  if(c.type === "percent"){
    discount = Math.max(0, Math.min(subTotal, Math.round(subTotal * (c.value/100))));
  } else if (c.type === "amount"){
    discount = Math.max(0, Math.min(subTotal, Number(c.value||0)));
  } else if (c.type === "ship"){
    shipAfter = 0; // envío gratis
  }
  return { valid:true, discount, shipAfter, label, code };
}

/* ======= Carrito ======= */
function renderCart(){
  const wrap = $("#cartPage");
  if(!wrap) return;

  pruneCartOrphans(); // <-- importante: limpiar antes de calcular

  const {items, total: subTotal} = cartTotals();

  if(!items.length){
    wrap.innerHTML = `
      <div class="cart-layout">
        <section>
          <p>Tu carrito está vacío.</p>
          <a class="btn btn--primary" href="productos.html">Ir a productos</a>
        </section>
        <aside class="cart-summary">
          <h3>Total del carrito</h3>
          <div class="sum-row"><span>Subtotal</span><strong>${money(0)}</strong></div>
          <div class="sum-row"><span>Envío</span><strong>${money(0)}</strong></div>
          <div class="sum-row total"><span>Total</span><strong>${money(0)}</strong></div>
        </aside>
      </div>`;
    return;
  }

  // Envío + Cupón
  let chosenShip = Number(LS.get(SHIP_KEY, 0)) || 0;
  const currentCoupon = getCoupon();
  const cup = evaluateCoupon(currentCoupon, subTotal, chosenShip);
  const shipCost = cup.valid ? cup.shipAfter : chosenShip;
  const totalBefore = subTotal - (cup.valid ? cup.discount : 0);
  const total = Math.max(0, totalBefore + shipCost);

  const rows = items.map(it => `
    <tr>
      <td>
        <div class="cart-prodname">${it.name}</div>
        <small class="muted">${it.category}${it.attr ? " • " + it.attr : ""}</small>
      </td>
      <td class="ta-right">${money(it.price)}</td>
      <td class="ta-center">
        <input class="qty-input" type="number" min="1" value="${it.qty}" data-id="${encodeURIComponent(it.id)}" />
      </td>
      <td class="ta-right"><strong>${money(it.subtotal)}</strong></td>
      <td class="ta-right">
        <button class="btn btn--ghost btn-sm" data-remove="${encodeURIComponent(it.id)}">Eliminar</button>
      </td>
    </tr>
  `).join("");

  wrap.innerHTML = `
    <div class="cart-layout">
      <section>
        <table class="cart-table">
          <thead>
            <tr>
              <th class="w-50">Producto</th>
              <th class="ta-right">Precio</th>
              <th class="ta-center">Cant.</th>
              <th class="ta-right">Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div style="margin-top:10px; display:flex; gap:10px;">
          <button id="clearCart" class="btn btn--ghost">Vaciar carrito</button>
          <a class="btn btn--primary" href="productos.html">Seguir comprando</a>
        </div>
      </section>

      <aside class="cart-summary" data-cart-summary>
        <h3>Total del carrito</h3>

        <div class="sum-row">
          <span>Subtotal</span>
          <strong id="sum-sub">${money(subTotal)}</strong>
        </div>

        ${
          cup.valid
            ? `<div class="sum-row">
                 <span>Descuento ${cup.label ? `(${cup.label})` : ""}</span>
                 <strong id="sum-disc">-${money(cup.discount || 0)}</strong>
               </div>`
            : ""
        }

        <div class="sum-row">
          <label for="shipping">Envío</label>
          <select id="shipping" class="input" ${cup.valid && COUPONS[currentCoupon]?.type === "ship" ? "disabled" : ""}>
            <option value="0" ${chosenShip===0?'selected':''}>Retiro en tienda (gratis)</option>
            <option value="3000" ${chosenShip===3000?'selected':''}>Envío urbano ($3.000)</option>
            <option value="6000" ${chosenShip===6000?'selected':''}>Envío regional ($6.000)</option>
          </select>
          <strong style="margin-left:auto">${money(shipCost)}</strong>
        </div>

        <!-- Cupones -->
        <div class="coupon-box">
          <label for="couponInput" class="coupon-label">Ingrese el cupón de descuento</label>
          <div class="coupon-row">
            <input type="text" id="couponInput" class="coupon-input" placeholder="Ej: DUOC10" value="${currentCoupon || ""}" />
            <button type="button" class="coupon-btn" id="couponBtn">${cup.valid ? "REAPLICAR" : "APLICAR"}</button>
            ${cup.valid ? `<button type="button" class="coupon-btn" id="couponRemove" style="margin-left:6px; background:#eee;color:#333;">Quitar</button>` : ""}
          </div>
          <small id="couponMsg" class="muted">${cup.valid ? "Cupón aplicado" : "Ej: DUOC10, ENVIOGRATIS, 5000OFF"}</small>
        </div>

        <div class="sum-row total">
          <span>Total</span>
          <strong id="sum-total">${money(total)}</strong>
        </div>

        <button class="btn btn--primary btn-block" id="checkoutBtn">Finalizar compra</button>
        <p class="muted small">* No procesa pago real.</p>
      </aside>
    </div>
  `;

  // Cambiar cantidad
  wrap.querySelectorAll(".qty-input").forEach(inp=>{
    inp.addEventListener("change", ()=>{
      const id = inp.dataset.id;
      const qty = Math.max(1, Number(inp.value||1));
      setQty(id, qty);
      renderCart();
    });
  });

  // Eliminar producto
  wrap.addEventListener("click", (e)=>{
    const id = e.target?.dataset?.remove;
    if(id){ removeFromCart(id); renderCart(); }
  });

  // Vaciar carrito
  $("#clearCart")?.addEventListener("click", ()=>{
    if(confirm("¿Vaciar carrito?")){ clearCart(); renderCart(); }
  });

  // Cambiar envío
  const shipSel = $("#shipping");
  if(shipSel){
    shipSel.addEventListener("change", ()=>{
      const cost = Number(shipSel.value)||0;
      LS.set(SHIP_KEY, cost);
      renderCart();
    });
  }

  // Cupón: aplicar / quitar
  const applyCoupon = ()=>{
    const code = ($("#couponInput")?.value || "").toUpperCase().trim();
    setCoupon(code);
    renderCart();
  };
  $("#couponBtn")?.addEventListener("click", applyCoupon);
  $("#couponInput")?.addEventListener("keydown", (e)=>{ if(e.key === "Enter"){ e.preventDefault(); applyCoupon(); } });
  $("#couponRemove")?.addEventListener("click", ()=>{ setCoupon(""); renderCart(); });

  // Checkout
  $("#checkoutBtn")?.addEventListener("click", ()=>{
    alert("¡Gracias! \nTotal: " + ($("#sum-total")?.textContent || ""));
  });
}

/* ======= Validaciones varias (registro/contacto/login) ======= */
const EMAIL_OK = /@(?:duocuc\.cl|profesor\.duoc\.cl|gmail\.com)$/i;

function cleanRun(run){ return (run||"").toUpperCase().replace(/[^0-9K]/g,""); }
function validRun(run){
  run = cleanRun(run);
  if(run.length < 7 || run.length > 9) return false;
  const body = run.slice(0,-1), dv = run.at(-1);
  let sum=0, mult=2;
  for(let i=body.length-1;i>=0;i--){
    sum += parseInt(body[i],10)*mult;
    mult = mult===7 ? 2 : mult+1;
  }
  const res = 11 - (sum % 11);
  const dvCalc = res===11?'0':(res===10?'K':String(res));
  return dvCalc===dv;
}
function setErr(el,msg){ const help = el?.nextElementSibling; if(help) help.textContent = msg||""; }

/* Registro / Nuevo usuario */
function bindUserForm(form){
  if(!form) return;
  const run = $("#run",form), nombre=$("#nombre",form), apellidos=$("#apellidos",form),
        correo=$("#correo",form), direccion=$("#direccion",form),
        fecha=$("#fnac",form), tipo=$("#tipo",form),
        region=$("#region",form), comuna=$("#comuna",form);

  if(region && comuna){
    region.innerHTML = `<option value="">Seleccione</option>`+
      Object.keys(window.REGIONES || {}).map(r=>`<option>${r}</option>`).join("");
    region.addEventListener("change", ()=>{
      const list = (window.REGIONES || {})[region.value] || [];
      comuna.innerHTML = `<option value="">Seleccione</option>`+
        list.map(c=>`<option>${c}</option>`).join("");
    });
  }

  form.addEventListener("submit",(e)=>{
    e.preventDefault(); let ok=true;
    if(run && !validRun(run.value)){ setErr(run,"RUN inválido (sin puntos ni guion)"); ok=false; } else setErr(run,"");
    if(!nombre.value || nombre.value.length>50){ setErr(nombre,"Requerido (máx 50)"); ok=false; } else setErr(nombre,"");
    if(!apellidos.value || apellidos.value.length>100){ setErr(apellidos,"Requerido (máx 100)"); ok=false; } else setErr(apellidos,"");
    if(!correo.value || correo.value.length>100 || !EMAIL_OK.test(correo.value)){ setErr(correo,"Correo permitido (máx 100)"); ok=false; } else setErr(correo,"");
    if(direccion && (!direccion.value || direccion.value.length>300)){ setErr(direccion,"Requerida (máx 300)"); ok=false; } else setErr(direccion,"");
    if(tipo && !tipo.value){ setErr(tipo,"Seleccione un tipo"); ok=false; } else setErr(tipo,"");
    if(region && !region.value){ setErr(region,"Seleccione región"); ok=false; } else setErr(region,"");
    if(comuna && !comuna.value){ setErr(comuna,"Seleccione comuna"); ok=false; } else setErr(comuna,"");
    if(ok){ alert("Registrado."); form.reset(); }
  });
}

/* Login */
function bindLoginForm(){
  const form = $("#loginForm"); if(!form) return;
  const correo=$("#loginEmail"), pass=$("#loginPass");
  form.addEventListener("submit",(e)=>{
    e.preventDefault(); let ok=true;
    if(!correo.value || correo.value.length>100 || !EMAIL_OK.test(correo.value)){ setErr(correo,"Correo permitido y máx 100."); ok=false; } else setErr(correo,"");
    if(!pass.value || pass.value.length<4 || pass.value.length>10){ setErr(pass,"Contraseña 4 a 10 caracteres."); ok=false; } else setErr(pass,"");
    if(ok){ alert("Login válido."); form.reset(); }
  });
}

/* Contacto */
function bindContactForm(){
  const form = $("#contactForm"); if(!form) return;
  const nombre=$("#cNombre"), correo=$("#cCorreo"), msg=$("#cMsg");
  form.addEventListener("submit",(e)=>{
    e.preventDefault(); let ok=true;
    if(!nombre.value || nombre.value.length>100){ setErr(nombre,"Requerido (máx 100)"); ok=false; } else setErr(nombre,"");
    if(correo.value && (correo.value.length>100 || !EMAIL_OK.test(correo.value))){ setErr(correo,"Dominio permitido y máx 100"); ok=false; } else setErr(correo,"");
    if(!msg.value || msg.value.length>500){ setErr(msg,"Requerido (máx 500)"); ok=false; } else setErr(msg,"");
    if(ok){ alert("Mensaje enviado."); form.reset(); }
  });
}

/* Newsletter del footer */
(function(){
  const form = $("#newsletterForm"); if(!form) return;
  const email = $("#email"), help=$("#emailHelp");
  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    if(!EMAIL_OK.test(email.value)){ help.textContent="Correo permitido: duocuc, profesor.duoc, gmail"; return; }
    help.textContent = "¡Gracias por suscribirte!";
    form.reset();
  });
})();

/* ======= Bootstrap común ======= */
document.addEventListener("DOMContentLoaded", ()=>{
  pruneCartOrphans();
  updateCartBadge();
  renderCart();
  bindLoginForm();
  bindContactForm();
  bindUserForm($("#registroForm"));
  bindUserForm($("#adminUserForm"));
});
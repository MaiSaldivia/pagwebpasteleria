/* ======= Helpers comunes ======= */
const $  = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];
const money = v => "$" + Number(v||0).toLocaleString("es-CL");

/* ======= LocalStorage ======= */
const LS = {
  get(key, def){ try{ return JSON.parse(localStorage.getItem(key)) ?? def; }catch{ return def; } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)); },
  del(key){ localStorage.removeItem(key); }
};

/* ================== Usuarios / Sesión ================== */
const USERS_KEY = "USERS_V1";
const CUR_KEY   = "CURRENT_USER_V1";

/* dominios válidos globales (newsletter/forms) */
const EMAIL_OK = /@(?:duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i;
/* correo institucional DUOC para beneficio torta */
const IS_DUOC  = /@duoc\.cl$/i;

/* producto regalo */
const BDAY_CAKE_ID   = "TE001";
const BDAY_CAKE_NAME = "Torta Especial de Cumpleaños";

const getUsers   = () => LS.get(USERS_KEY, []);
const setUsers   = (list) => LS.set(USERS_KEY, list);
const getCurrent = () => LS.get(CUR_KEY, null);
const setCurrent = (u) => LS.set(CUR_KEY, u);
const logOut     = () => { LS.del(CUR_KEY); updateHeaderSessionUI(); renderCart(); };

/* --- Fechas (local) --- */
function parseLocalDate(iso){
  if(!iso || typeof iso !== "string") return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m) return null;
  const [_, y, mo, d] = m.map(Number);
  return new Date(y, mo-1, d);
}
function computeAge(iso){
  const d = parseLocalDate(iso);
  if(!d) return null;
  const t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  const m  = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
  return age;
}
function isBirthdayToday(iso){
  const d = parseLocalDate(iso);
  if(!d) return false;
  const t = new Date();
  return d.getDate()===t.getDate() && d.getMonth()===t.getMonth();
}

/* Header: sesión */
function updateHeaderSessionUI(){
  const box = $(".actions"); if(!box) return;
  const cur = getCurrent();
  const cartHtml = `<a id="cartBtn" class="cart" href="carrito.html">🛒 <span id="cartCount">0</span></a>`;
  if(cur){
    const firstName = (cur.nombre||"").split(" ")[0] || (cur.email||"");
    box.innerHTML = `
      <span class="small muted">👋 Hola, ${firstName}</span>
      <a href="perfil.html" class="link">Mi perfil</a>
      <a href="#" id="logoutLink" class="link">Cerrar sesión</a>
      ${cartHtml}
    `;
    $("#logoutLink")?.addEventListener("click", (e)=>{ e.preventDefault(); logOut(); });
  }else{
    box.innerHTML = `
      <a href="login.html" class="link">Iniciar sesión</a>
      <a href="registro.html" class="link">Registrarse</a>
      ${cartHtml}
    `;
  }
}

/* ======= Perfil / Preferencias ======= */
function findUserIndexByEmail(email){
  const users = getUsers();
  const idx = users.findIndex(u => (u.email||"").toLowerCase() === (email||"").toLowerCase());
  return { users, idx };
}

function bindProfileForm(){
  const form = $("#perfilForm");
  const passForm = $("#passForm");
  if(!form && !passForm) return;

  const cur = getCurrent();
  if(!cur){
    alert("Debes iniciar sesión para ver tu perfil.");
    location.href = "login.html";
    return;
  }

  // Rellena saludo
  const hi = $("#perfilWelcome");
  if(hi) hi.textContent = `Estás editando el perfil de ${cur.email}`;

  // Selects de región/comuna
  const pfRegion = $("#pfRegion"), pfComuna = $("#pfComuna");
  if(pfRegion && pfComuna){
    pfRegion.innerHTML = `<option value="">Seleccione</option>`+
      Object.keys(window.REGIONES||{}).map(r=>`<option>${r}</option>`).join("");
    pfRegion.addEventListener("change", ()=>{
      const list = (window.REGIONES||{})[pfRegion.value] || [];
      pfComuna.innerHTML = `<option value="">Seleccione</option>`+list.map(c=>`<option>${c}</option>`).join("");
    });
  }

  // Cargar datos del usuario completo desde USERS para no perder flags
  const { users, idx } = findUserIndexByEmail(cur.email);
  if(idx === -1){ alert("No se encontró el usuario en la base local."); return; }
  const u = users[idx];

  // Campos personales
  $("#pfNombre").value    = u.nombre || "";
  $("#pfApellidos").value = u.apellidos || "";
  $("#pfEmail").value     = u.email || "";
  $("#pfFono").value      = u.phone || "";
  $("#pfFnac").value      = u.fnac || "";
  $("#pfDireccion").value = u.direccion || "";
  if(pfRegion){ pfRegion.value = u.region || ""; pfRegion.dispatchEvent(new Event("change")); }
  if(pfComuna){ pfComuna.value = u.comuna || ""; }

  // Preferencias (con defaults)
  const prefs = u.prefs || {};
  $("#pfShip").value           = String(prefs.defaultShip ?? 0);
  $("#pfDefaultCoupon").value  = prefs.defaultCoupon || "";
  $("#pfNewsletter").checked   = !!prefs.newsletter;
  $("#pfSaveAddr").checked     = !!prefs.saveAddress;

  // Guardar perfil
  form?.addEventListener("submit",(e)=>{
    e.preventDefault();
    // Validaciones simples
    const nom = $("#pfNombre"), ape=$("#pfApellidos");
    if(!nom.value || nom.value.length>50){ setErr(nom,"Requerido (máx 50)"); return; } else setErr(nom,"");
    if(!ape.value || ape.value.length>100){ setErr(ape,"Requerido (máx 100)"); return; } else setErr(ape,"");

    // Actualiza objeto
    users[idx] = {
      ...u,
      nombre: nom.value.trim(),
      apellidos: ape.value.trim(),
      phone: $("#pfFono").value.trim(),
      fnac: $("#pfFnac").value || "",
      direccion: $("#pfDireccion").value.trim(),
      region: pfRegion?.value || "",
      comuna: pfComuna?.value || "",
      // sobrescribe/crea prefs
      prefs: {
        defaultShip: Number($("#pfShip").value)||0,
        defaultCoupon: ($("#pfDefaultCoupon").value||"").toUpperCase().trim(),
        newsletter: $("#pfNewsletter").checked,
        saveAddress: $("#pfSaveAddr").checked
      }
    };

    // Persistir
    setUsers(users);
    // Refrescar CURRENT con los campos que usa el header y beneficios
    setCurrent({
      email: users[idx].email,
      nombre: users[idx].nombre,
      fnac: users[idx].fnac,
      promoCode: users[idx].promoCode,
      felices50: users[idx].felices50,
      bdayRedeemedYear: users[idx].bdayRedeemedYear,
      prefs: users[idx].prefs
    });

    updateHeaderSessionUI();
    alert("Perfil actualizado.");
  });

  // Cambiar contraseña
  passForm?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const old = $("#pfPassOld"), neu=$("#pfPassNew"), neu2=$("#pfPassNew2");
    if(!old.value || old.value !== (u.pass||"")){ setErr(old,"Contraseña actual incorrecta."); return; } else setErr(old,"");
    if(!neu.value || neu.value.length<4 || neu.value.length>10){ setErr(neu,"Debe tener 4 a 10 caracteres."); return; } else setErr(neu,"");
    if(neu2.value !== neu.value){ setErr(neu2,"Debe coincidir."); return; } else setErr(neu2,"");

    users[idx].pass = neu.value;
    setUsers(users);
    alert("Contraseña actualizada.");
    passForm.reset();
  });
}

/* ======= Sincroniza productos con admin (si existe) ======= */
(function syncAdminProducts(){
  try{
    const saved = JSON.parse(localStorage.getItem('ADMIN_PRODUCTS_V1') || '[]');
    if (Array.isArray(saved) && saved.length){
      // Mapeo: Admin -> Tienda
      window.PRODUCTS = saved.map(a => ({
        id: a.codigo || a.id || "",
        nombre: a.nombre || a.name || a.title || "",
        precio: Number(a.precio ?? a.price ?? 0),
        categoria: a.categoria || a.category || a.categoryName || "",
        attr: a.attr || a.atributo || a.attributes || "",
        img: a.imagen || a.img || a.image || a.picture || "",
        // ---> stock en la tienda
        stock: Number(a.stock ?? 0),
        stockCritico: Number(a.stockCritico ?? 0),
        descripcion: a.descripcion || ""
      }));
    }
  }catch(e){}
})();

/* Stock helpers visibles en la tienda */
function getLiveProduct(id){
  id = String(id||"");
  return (window.PRODUCTS || []).find(p => String(p.id) === id) || null;
}
function getLiveStock(id){
  const p = getLiveProduct(id);
  return Number(p?.stock ?? 0);
}

/* ======= utils de productos ======= */
const pid    = p => String(p?.id || p?.code || p?.codigo || "");
const pprice = p => Number(String(p?.price ?? p?.precio ?? 0).toString().replace(/[^0-9.]/g,'')) || 0;

/* ======= limpia huérfanos de carrito ======= */
function pruneCartOrphans(){
  const ids = new Set((window.PRODUCTS || []).map(p => pid(p)));
  const cart = getCart();
  const cleaned = cart.filter(it => ids.has(String(it.id)));
  if (cleaned.length !== cart.length) {
    saveCart(cleaned);
  }
}

/* ================== Carrito ================== */
function getCart(){ return LS.get("cart", []); }
function saveCart(cart){ LS.set("cart", cart); updateCartBadge(); }

/* Ahora carrito soporta mensaje personalizado por ítem (id + msg) */
function addToCart(id, qty=1, msg=""){
  id  = decodeURIComponent(id);
  msg = String(msg||"");
  const p = getLiveProduct(id);
  if (!p){ alert("Este producto ya no está disponible."); return; }

  const max = Number(p.stock ?? 0);
  if (max <= 0){ alert("Sin stock disponible."); return; }

  qty = Math.max(1, Number(qty||1));
  const cart = getCart();
  const i = cart.findIndex(x => String(x.id) === String(id) && String(x.msg||"") === msg);

  const already = i>=0 ? Number(cart[i].qty||0) : 0;
  const wanted  = Math.min(qty, Math.max(0, max - already));
  if (wanted <= 0){
    alert(`Solo quedan ${max} unidad(es) disponibles.`);
    return;
  }

  if(i >= 0) cart[i].qty += wanted;
  else cart.push({ id, qty: wanted, msg });

  if (qty > wanted) alert(`Solo quedan ${max} unidad(es). Se agregaron ${wanted}.`);
  saveCart(cart);
}

function setQty(id, qty, msg=""){
  id  = decodeURIComponent(id);
  msg = String(msg||"");
  qty = Math.max(0, Number(qty||0));

  const max = getLiveStock(id);
  if (qty > max){
    alert(`Stock disponible: ${max}`);
    qty = max;
  }

  const cart = getCart();
  const i = cart.findIndex(x => String(x.id) === String(id) && String(x.msg||"") === msg);
  if(i === -1) return;
  if(qty === 0){ cart.splice(i,1); } else { cart[i].qty = qty; }
  saveCart(cart);
}

function removeFromCart(id, msg=""){
  id = decodeURIComponent(id);
  msg = String(msg||"");
  const cart = getCart().filter(x => !(String(x.id) === String(id) && String(x.msg||"") === msg));
  saveCart(cart);
}
function clearCart(){ saveCart([]); }

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
      msg: it.msg || "",
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
  if (hasProducts){ pruneCartOrphans(); totalQty = cartTotals().totalQty; }
  else { totalQty = getCart().reduce((s,it)=> s + Number(it.qty||0), 0); }
  const a = document.getElementById("cartCount");
  const b = document.getElementById("contadorCarrito");
  if(a) a.textContent = String(totalQty);
  if(b) b.textContent = String(totalQty);
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartBadge = updateCartBadge;
window.setQty = setQty;

/* ======= Envío y Cupones ======= */
const SHIP_KEY   = "shipCost";
const COUPON_KEY = "couponCode_v1";

/* Ojo: FELICES50 **no** es cupón manual */
const COUPONS = {
  "ENVIOGRATIS": { type: "ship",   value: 0,    label: "Envío gratis" },
  "5000OFF":     { type: "amount", value: 5000, label: "$5.000 OFF" }
};

const getCoupon = () => (LS.get(COUPON_KEY, "") || "").toString().trim().toUpperCase();
const setCoupon = (code) => LS.set(COUPON_KEY, (code||"").toString().trim().toUpperCase());

function evaluateCoupon(code, subTotal, shipCost){
  code = (code||"").toUpperCase().trim();
  const c = COUPONS[code];
  if(!c) return { valid:false, discount:0, shipAfter:shipCost, label:"" };
  let discount = 0, shipAfter = shipCost, label = c.label;
  if(c.type === "amount"){ discount = Math.max(0, Math.min(subTotal, Number(c.value||0))); }
  else if (c.type === "ship"){ shipAfter = 0; }
  return { valid:true, discount, shipAfter, label, code };
}

/* =============== Beneficios por usuario =============== */
function userBenefits(items, subTotal){
  const u = getCurrent();
  if(!u) return { userDisc:0, userLabel:"", bdayDisc:0, bdayLabel:"", bdayEligible:false, bdayApplied:false };

  const thisYear = new Date().getFullYear();
  const eligibleToday = IS_DUOC.test(u.email||"") && isBirthdayToday(u.fnac) && Number(u.bdayRedeemedYear) !== thisYear;

  const cake = items.find(it => String(it.id) === BDAY_CAKE_ID || /torta especial de cumpleaños/i.test(it.name));
  let bdayDisc = 0, bdayLabel = "", bdayApplied = false;
  if (eligibleToday && cake && cake.qty > 0){
    bdayDisc = cake.price; // 1 unidad gratis
    bdayLabel = "Beneficio DUOC: Torta de Cumpleaños gratis";
    bdayApplied = true;
  }

  const age = computeAge(u.fnac);
  const pct = (typeof age === "number" && age > 50) ? 0.50 : ((u?.promoCode === "FELICES50" || u?.felices50) ? 0.10 : 0);
  const baseForPercent = Math.max(0, subTotal - bdayDisc);
  const userDisc = Math.round(baseForPercent * pct);
  const userLabel = pct ? `Beneficio de usuario (${Math.round(pct*100)}% OFF)` : "";

  return { userDisc, userLabel, bdayDisc, bdayLabel, bdayEligible: eligibleToday, bdayApplied };
}

/* ======= Helpers: recibo/boleta ======= */
function buildReceiptHTML({items, subTotal, benefits, couponInfo, shipCost, total, curEmail}){
  const { userDisc, userLabel, bdayDisc, bdayLabel } = benefits || {};
  const now = new Date();
  const fecha = now.toLocaleString('es-CL');
  const filas = items.map(it => `
    <tr>
      <td>
        <div><strong>${it.name}</strong></div>
        <div class="muted small">${it.category}${it.attr ? " • "+it.attr : ""}</div>
        ${ it.msg ? `<div class="small">🎂 Mensaje: ${it.msg}</div>` : "" }
      </td>
      <td class="ta-right">${money(it.price)}</td>
      <td class="ta-center">${it.qty}</td>
      <td class="ta-right"><strong>${money(it.subtotal)}</strong></td>
    </tr>
  `).join("");

  return `<!doctype html>
  <html lang="es">
  <head>
    <meta charset="utf-8">
    <title>Detalle de compra · Mil Sabores</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      body{font-family: Lato, Arial, sans-serif; background:#faf7f2; margin:0; color:#2f2a25;}
      .wrap{max-width:860px;margin:24px auto;padding:24px;background:#fff;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.08)}
      h1{font-size:22px;margin:0 0 8px}
      .muted{color:#7a766f}
      .small{font-size:12px}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      th,td{padding:10px;border-bottom:1px solid #eee;vertical-align:top}
      th{background:#faf7f2;text-align:left}
      .ta-right{text-align:right}
      .ta-center{text-align:center}
      .sum{margin-top:8px}
      .sum .row{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:6px 0}
      .total{font-weight:700;font-size:18px;border-top:1px dashed #ddd;padding-top:10px;margin-top:6px}
      .btns{display:flex;gap:10px;margin-top:16px}
      button{padding:10px 14px;border-radius:10px;border:1px solid #ddd;cursor:pointer;background:#fff}
      .primary{background:#8c4b27;color:#fff;border-color:#8c4b27}
      @media print {.btns{display:none}}
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>Detalle de la compra</h1>
      <div class="muted small">Fecha: ${fecha}${curEmail ? ` &nbsp;•&nbsp; Cliente: ${curEmail}` : ""}</div>

      <table>
        <thead>
          <tr>
            <th class="w-50">Producto</th>
            <th class="ta-right">Precio</th>
            <th class="ta-center">Cant.</th>
            <th class="ta-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>

      <div class="sum">
        <div class="row"><span>Subtotal</span><strong>${money(subTotal)}</strong></div>
        ${bdayDisc>0 ? `<div class="row"><span>${bdayLabel || "Beneficio cumpleaños"}</span><strong>- ${money(bdayDisc)}</strong></div>` : ""}
        ${userDisc>0 ? `<div class="row"><span>${userLabel || "Descuento usuario"}</span><strong>- ${money(userDisc)}</strong></div>` : ""}
        ${couponInfo?.valid && couponInfo?.discount>0 ? `<div class="row"><span>${couponInfo.label || "Cupón"} (${couponInfo.code})</span><strong>- ${money(couponInfo.discount)}</strong></div>` : ""}
        <div class="row"><span>Envío</span><strong>${money(shipCost)}</strong></div>
        <div class="row total"><span>Total</span><strong>${money(total)}</strong></div>
      </div>

      <div class="btns">
        <button class="primary" onclick="window.print()">Imprimir / Guardar PDF</button>
        <button onclick="window.close()">Cerrar</button>
      </div>
    </div>
  </body>
  </html>`;
}

function openReceiptWindow(html){
  const w = window.open("", "_blank");
  if(!w){ alert("Permite las ventanas emergentes para ver el detalle."); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/* =============== Carrito (render) =============== */
function renderCart(){
  const wrap = $("#cartPage");
  if(!wrap) return;

  pruneCartOrphans();

  const {items, total: subTotal} = cartTotals();
  const cur = getCurrent();

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

  const benefits = userBenefits(items, subTotal);
  const { userDisc, userLabel, bdayDisc, bdayLabel, bdayEligible } = benefits;
  window._lastUserBenefits = benefits;

  let bdayHint = "";
  if (cur && bdayEligible){
    const hasCake = items.some(it => String(it.id) === BDAY_CAKE_ID || /torta especial de cumpleaños/i.test(it.name));
    if(!hasCake){ bdayHint = `Agrega "${BDAY_CAKE_NAME}" para recibirla gratis hoy.`; }
  }

  let currentCoupon = getCoupon();
  if (currentCoupon === "FELICES50") { setCoupon(""); currentCoupon = ""; }

  let chosenShip = Number(LS.get(SHIP_KEY, 0)) || 0;
  const baseAfterBenefits = Math.max(0, subTotal - bdayDisc - userDisc);
  const cup = evaluateCoupon(currentCoupon, baseAfterBenefits, chosenShip);
  const shipCost = cup.valid ? cup.shipAfter : chosenShip;
  const total = Math.max(0, baseAfterBenefits - (cup.valid ? cup.discount : 0) + shipCost);

  const rows = items.map(it => `
  <tr>
    <td>
      <div class="cart-prodname">${it.name}</div>
      <small class="muted">${it.category}${it.attr ? " • " + it.attr : ""}</small>
      ${ it.msg ? `<div class="small muted">🎂 Mensaje: ${it.msg}</div>` : "" }
    </td>
    <td class="ta-right">${money(it.price)}</td>
    <td class="ta-center">
      <input class="qty-input" type="number" min="1" value="${it.qty}" data-id="${encodeURIComponent(it.id)}" data-msg="${encodeURIComponent(it.msg||"")}" />
    </td>
    <td class="ta-right"><strong>${money(it.subtotal)}</strong></td>
    <td class="ta-right">
      <button class="btn btn--ghost btn-sm" data-remove="${encodeURIComponent(it.id)}" data-msg="${encodeURIComponent(it.msg||"")}">Eliminar</button>
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

        ${cur ? `<div class="sum-row"><span class="small muted">Sesión</span><strong class="small">${cur.email||""}</strong></div>` : ""}

        <div class="sum-row">
          <span>Subtotal</span>
          <strong id="sum-sub">${money(subTotal)}</strong>
        </div>

        ${ bdayDisc>0 ? `<div class="sum-row"><span>${bdayLabel}</span><strong>- ${money(bdayDisc)}</strong></div>` : "" }
        ${ userDisc>0 ? `<div class="sum-row"><span>${userLabel}</span><strong>- ${money(userDisc)}</strong></div>` : "" }

        <div class="sum-row">
          <label for="shipping">Envío</label>
          <select id="shipping" class="input" ${cup.valid && COUPONS[currentCoupon]?.type === "ship" ? "disabled" : ""}>
            <option value="0" ${chosenShip===0?'selected':''}>Retiro en tienda (gratis)</option>
            <option value="3000" ${chosenShip===3000?'selected':''}>Envío urbano ($3.000)</option>
            <option value="6000" ${chosenShip===6000?'selected':''}>Envío regional ($6.000)</option>
          </select>
          <strong style="margin-left:auto">${money(shipCost)}</strong>
        </div>

        <div class="coupon-box">
          <label for="couponInput" class="coupon-label">Ingrese el cupón de descuento</label>
          <div class="coupon-row">
            <input type="text" id="couponInput" class="coupon-input" placeholder="Ej: ENVIOGRATIS, 5000OFF" value="${currentCoupon || ""}" />
            <button type="button" class="coupon-btn" id="couponBtn">${cup.valid ? "REAPLICAR" : "APLICAR"}</button>
            ${cup.valid ? `<button type="button" class="coupon-btn" id="couponRemove" style="margin-left:6px; background:#eee;color:#333;">Quitar</button>` : ""}
          </div>
          <small id="couponMsg" class="muted">${cup.valid ? "Cupón aplicado" : "Puedes usar ENVIOGRATIS o 5000OFF"}</small>
        </div>

        ${ bdayHint ? `<p class="small muted" style="margin:6px 0 0">${bdayHint}</p>` : "" }

        <div class="sum-row total">
          <span>Total</span>
          <strong id="sum-total">${money(total)}</strong>
        </div>

        <button class="btn btn--primary btn-block" id="checkoutBtn">Finalizar compra</button>
        <p class="muted small">* No procesa pago real.</p>
      </aside>
    </div>
  `;

  // Cambios de cantidad
  wrap.querySelectorAll(".qty-input").forEach(inp=>{
    inp.addEventListener("change", ()=>{
      const id = inp.dataset.id;
      const msg = decodeURIComponent(inp.dataset.msg || "");
      const qty = Math.max(1, Number(inp.value||1));
      setQty(id, qty, msg);
      renderCart();
    });
  });

  // Eliminar producto
  wrap.addEventListener("click", (e)=>{
    const id = e.target?.dataset?.remove;
    const msg = e.target?.dataset?.msg ? decodeURIComponent(e.target.dataset.msg) : "";
    if(id){ removeFromCart(id, msg); renderCart(); }
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

  // Cupón
  const applyCoupon = ()=>{
    const code = ($("#couponInput")?.value || "").toUpperCase().trim();
    setCoupon(code);
    renderCart();
  };
  $("#couponBtn")?.addEventListener("click", applyCoupon);
  $("#couponInput")?.addEventListener("keydown", (e)=>{ if(e.key === "Enter"){ e.preventDefault(); applyCoupon(); } });
  $("#couponRemove")?.addEventListener("click", ()=>{ setCoupon(""); renderCart(); });

  // Checkout = mostrar Detalle de compra (recibo imprimible)
  $("#checkoutBtn")?.addEventListener("click", ()=>{
    const cur = getCurrent();

    // Marca canje de torta si aplicó (igual que antes)
    const b = window._lastUserBenefits;
    if (cur && b?.bdayApplied){
      const users = getUsers();
      const idx = users.findIndex(x => (x.email||"").toLowerCase() === (cur.email||"").toLowerCase());
      const yr = new Date().getFullYear();
      if (idx >= 0){
        users[idx].bdayRedeemedYear = yr;
        setUsers(users);
        setCurrent({ ...cur, bdayRedeemedYear: yr });
      }
    }

    // Construir y abrir el recibo
    const html = buildReceiptHTML({
      items,
      subTotal,
      benefits,
      couponInfo: cup,
      shipCost,
      total,
      curEmail: cur?.email || ""
    });
    openReceiptWindow(html);

    // Si quieres vaciar el carrito después de generar el recibo, descomenta estas dos líneas:
    // clearCart();
    // renderCart();
  });
}

/* ======= Validaciones varias ======= */
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

/* ======= Registro ======= */
function bindUserForm(form){
  if(!form) return;
  const run = $("#run",form), nombre=$("#nombre",form), apellidos=$("#apellidos",form),
        correo=$("#correo",form), direccion=$("#direccion",form),
        fecha=$("#fnac",form), tipo=$("#tipo",form),
        region=$("#region",form), comuna=$("#comuna",form),
        pass=$("#pass",form), pass2=$("#pass2",form),
        promo=$("#promo",form) || $("#promoCode",form);

  if(region && comuna){
    region.innerHTML = `<option value="">Seleccione</option>`+
      Object.keys(window.REGIONES || {}).map(r=>`<option>${r}</option>`).join("");
    region.addEventListener("change", ()=>{
      const list = (window.REGIONES || {})[region.value] || [];
      comuna.innerHTML = `<option value="">Seleccione</option>`+ list.map(c=>`<option>${c}</option>`).join("");
    });
  }

  form.addEventListener("submit",(e)=>{
  e.preventDefault(); let ok=true;

  // RUN (7–9, sin puntos/guion y dígito verificador correcto)
  if(run && !validRun(run.value)){
    setErr(run,"RUN inválido (sin puntos ni guion). Ej: 19011022K");
    ok=false;
  } else setErr(run,"");

  if(!nombre.value || nombre.value.length>50){ setErr(nombre,"Requerido (máx 50)"); ok=false; } else setErr(nombre,"");
  if(!apellidos.value || apellidos.value.length>100){ setErr(apellidos,"Requerido (máx 100)"); ok=false; } else setErr(apellidos,"");

  if(!correo.value || correo.value.length>100 || !EMAIL_OK.test(correo.value)){
    setErr(correo,"Correo permitido (@duoc.cl, profesor.duoc.cl, gmail). Máx 100.");
    ok=false;
  } else setErr(correo,"");

  if(direccion && (!direccion.value || direccion.value.length>300)){ setErr(direccion,"Requerida (máx 300)"); ok=false; } else setErr(direccion,"");
  if(tipo && !tipo.value){ setErr(tipo,"Seleccione un tipo"); ok=false; } else setErr(tipo,"");
  if(region && !region.value){ setErr(region,"Seleccione región"); ok=false; } else setErr(region,"");
  if(comuna && !comuna.value){ setErr(comuna,"Seleccione comuna"); ok=false; } else setErr(comuna,"");

  // NUEVO: fecha obligatoria y mayor de 18
  if(!fecha?.value){
    setErr(fecha,"Requerida");
    ok=false;
  }else{
    const age = computeAge(fecha.value);
    if(typeof age !== "number" || age < 18){
      setErr(fecha,"Debes ser mayor de 18 años.");
      ok=false;
    }else setErr(fecha,"");
  }

  if(!pass.value || pass.value.length<4 || pass.value.length>10){ setErr(pass,"Contraseña 4 a 10 caracteres."); ok=false; } else setErr(pass,"");
  if(pass2.value !== pass.value){ setErr(pass2,"Debe coincidir."); ok=false; } else setErr(pass2,"");
  if(!ok) return;

  const users = getUsers();
  if(users.some(u => (u.email||"").toLowerCase() === correo.value.toLowerCase())){
    setErr(correo,"Este correo ya está registrado.");
    return;
  }

  const u = {
    run: cleanRun(run.value),
    tipo: tipo?.value || "Cliente",
    nombre: nombre.value.trim(),
    apellidos: apellidos.value.trim(),
    email: correo.value.trim(),
    fnac: fecha.value,
    region: region?.value || "",
    comuna: comuna?.value || "",
    direccion: direccion?.value || "",
    phone: $("#fono",form)?.value || "",
    pass: pass.value,
    promoCode: (promo?.value || "").toUpperCase().trim(),
    felices50: ((promo?.value || "").toUpperCase().trim() === "FELICES50"),
    createdAt: Date.now(),
    bdayRedeemedYear: null
  };
  users.push(u); setUsers(users);
  setCurrent({ email:u.email, nombre:u.nombre, fnac:u.fnac, promoCode:u.promoCode, felices50:u.felices50, bdayRedeemedYear:u.bdayRedeemedYear });
  alert("¡Registro exitoso! Sesión iniciada.");
  location.href = "index.html";
});

}

/* ======= Login ======= */
function bindLoginForm(){
  const form = $("#loginForm"); if(!form) return;
  const correo=$("#loginEmail"), pass=$("#loginPass");
  form.addEventListener("submit",(e)=>{
    e.preventDefault(); let ok=true;
    if(!correo.value || correo.value.length>100 || !EMAIL_OK.test(correo.value)){ setErr(correo,"Correo permitido y máx 100."); ok=false; } else setErr(correo,"");
    if(!pass.value || pass.value.length<4 || pass.value.length>10){ setErr(pass,"Contraseña 4 a 10 caracteres."); ok=false; } else setErr(pass,"");
    if(!ok) return;

    const users = getUsers();
    const u = users.find(x => x.email.toLowerCase()===correo.value.toLowerCase() && x.pass===pass.value);
    if(!u){ alert("Credenciales inválidas."); return; }
    setCurrent({ email:u.email, nombre:u.nombre, fnac:u.fnac, promoCode:u.promoCode, felices50:u.felices50, bdayRedeemedYear:u.bdayRedeemedYear });
    alert("Sesión iniciada.");
    location.href = "index.html";
  });
}

/* ======= Contacto ======= */
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

/* ======= Newsletter del footer ======= */
(function(){
  const form = $("#newsletterForm"); if(!form) return;
  const email = $("#email"), help=$("#emailHelp");
  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    if(!EMAIL_OK.test(email.value)){ help.textContent="Correo permitido: @duoc.cl, profesor.duoc.cl o gmail"; return; }
    help.textContent = "¡Gracias por suscribirte!";
    form.reset();
  });
})();

/* ======= Migración de comentarios antiguos ======= */
function migrateComments(){
  const KEY = "BLOG_COMMENTS_V1";
  const all = LS.get(KEY, {});
  if (!all || typeof all !== "object") return;

  let changed = false;
  for (const pid of Object.keys(all)){
    const list = Array.isArray(all[pid]) ? all[pid] : [];
    for (const c of list){
      // Normaliza campos antiguos a authorEmail/authorName
      if (!c.authorEmail && (c.email || c.userEmail)) {
        c.authorEmail = String(c.email || c.userEmail || "").trim();
        changed = true;
      }
      if (!c.authorName && (c.name || c.user || c.author)) {
        c.authorName  = String(c.name || c.user || c.author || "").trim();
        changed = true;
      }
      // Si solo había 'author' y es un correo
      if (!c.authorEmail && c.author && /@/.test(String(c.author))) {
        c.authorEmail = String(c.author).trim();
        changed = true;
      }
      // Tipos
      if (c.authorEmail) c.authorEmail = c.authorEmail.toLowerCase();
    }
    all[pid] = list;
  }
  if (changed) LS.set(KEY, all);
}

/* ======= Bootstrap común ======= */
document.addEventListener("DOMContentLoaded", ()=>{
  updateHeaderSessionUI();
  pruneCartOrphans();
  updateCartBadge();
  renderCart();
  bindLoginForm();
  bindContactForm();
  bindUserForm($("#registroForm"));
  bindUserForm($("#adminUserForm"));
  migrateComments();
  bindProfileForm();
});

/* ======= Comentarios de Blog (con ownerId y rescate) ======= */
const BLOG_COMMENTS_KEY = "BLOG_COMMENTS_V1";
const getAllBlogComments = () => LS.get(BLOG_COMMENTS_KEY, {});
const setAllBlogComments = (obj) => LS.set(BLOG_COMMENTS_KEY, obj);

function getPostComments(postId){
  const all = getAllBlogComments();
  return Array.isArray(all[postId]) ? all[postId] : [];
}
function setPostComments(postId, list){
  const all = getAllBlogComments();
  all[postId] = list;
  setAllBlogComments(all);
}
function addPostComment(postId, comment){
  const list = getPostComments(postId);
  list.push(comment);
  setPostComments(postId, list);
}
function updatePostComment(postId, id, newText){
  const list = getPostComments(postId).map(c => c.id === id ? { ...c, text:newText, editedAt: Date.now() } : c);
  setPostComments(postId, list);
}
function deletePostComment(postId, id){
  const list = getPostComments(postId).filter(c => c.id !== id);
  setPostComments(postId, list);
}

function timeAgo(ts){
  const diff = Date.now() - ts;
  const m = Math.floor(diff/60000);
  if(m < 1) return "justo ahora";
  if(m < 60) return `${m} min`;
  const h = Math.floor(m/60);
  if(h < 24) return `${h} h`;
  const d = Math.floor(h/24);
  return `${d} d`;
}

/* --- owner helpers --- */
const currentOwnerId = () => (getCurrent()?.email || "").toLowerCase();
const commentOwnerId = (c) =>
  (c.ownerId || c.authorEmail || c.email || c.userEmail || "").toLowerCase();

/* --- migración: agrega ownerId y id a comentarios viejos --- */
(function migrateCommentsOnce(){
  const all = getAllBlogComments();
  if (!all || typeof all !== "object") return;
  let changed = false;

  const newId = () => `c_mig_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

  for (const pid of Object.keys(all)){
    const list = Array.isArray(all[pid]) ? all[pid] : [];
    for (const c of list){
      // Normaliza nombre/email
      if (!c.authorEmail && (c.email || c.userEmail)) {
        c.authorEmail = String(c.email || c.userEmail || "").trim();
        changed = true;
      }
      if (!c.authorName && (c.name || c.user || c.author)) {
        c.authorName  = String(c.name || c.user || c.author || "").trim();
        changed = true;
      }
      // ownerId estable
      if (!c.ownerId) {
        c.ownerId = (c.authorEmail || c.email || c.userEmail || "").toLowerCase();
        changed = true;
      }
      // **ID faltante (lo que impide eliminar/editar)**
      if (!c.id || typeof c.id !== "string") {
        c.id = newId();
        changed = true;
      }
    }
    all[pid] = list;
  }

  if (changed) setAllBlogComments(all);
})();

/* --- si un comentario antiguo no trae email, reasigna por nombre --- */
function ensureOwnership(postId, c){
  const cur = getCurrent();
  if(!cur) return false;
  const hasOwner = !!commentOwnerId(c);
  if (hasOwner) return true;

  const myName = (cur.nombre || "").trim().toLowerCase();
  const cName  = (c.authorName || c.name || "").trim().toLowerCase();
  if (myName && cName && myName === cName){
    const me = (cur.email || "").toLowerCase();
    c.ownerId = me;
    c.authorEmail = me;
    c.authorName = cur.nombre || c.authorName || c.name || "";
    const list = getPostComments(postId).map(x => x.id === c.id ? c : x);
    setPostComments(postId, list);
    return true;
  }
  return false;
}

function isCommentOwner(c){
  const me = currentOwnerId();
  const owner = commentOwnerId(c);
  return !!me && !!owner && me === owner;
}

function commentItemHTML(c){
  const edited = c.editedAt ? ` • <span class="muted small">editado</span>` : "";
  const displayName = c.authorName || (c.authorEmail ? c.authorEmail.split("@")[0] : (c.name || c.email || "Anónimo"));
  const mine = isCommentOwner(c);
  const actions = mine
    ? `<div class="comment__actions">
         <button class="btn btn--ghost btn-sm" data-act="edit" data-id="${c.id}">Editar</button>
         <button class="btn btn--ghost btn-sm" data-act="del" data-id="${c.id}">Eliminar</button>
       </div>`
    : "";
  return `
    <div class="comment" data-id="${c.id}" data-owner="${commentOwnerId(c)}">
      <div class="comment__head">
        <strong>${displayName}</strong>
        <span class="muted small">· ${timeAgo(c.ts)}</span>${edited}
      </div>
      <p class="comment__text">${c.text}</p>
      ${actions}
    </div>`;
}

function renderCommentsUI(box){
  const postId = box?.dataset?.postId;
  if(!postId) return;

  const cur = getCurrent();
  const comments = getPostComments(postId);

  const listHtml = comments.length
    ? comments.map(c => commentItemHTML(c)).join("")
    : `<p class="muted">Aún no hay comentarios. ¡Sé el primero!</p>`;

  const formHtml = cur
    ? `
      <form id="commentForm" class="comment__form" novalidate>
        <label class="muted small" for="commentText">Escribe un comentario (máx 300):</label>
        <textarea id="commentText" class="input" maxlength="300" rows="3" placeholder="¿Qué te pareció este artículo?"></textarea>
        <div style="display:flex; gap:10px; align-items:center; margin-top:6px;">
          <button class="btn btn--primary" type="submit">Publicar</button>
          <small class="muted">Comentando como <strong>${cur.nombre?.split(" ")[0] || cur.email}</strong></small>
        </div>
        <small id="commentHelp" class="help"></small>
      </form>`
    : `<div class="muted">Debes <a class="link" href="login.html">iniciar sesión</a> para comentar.</div>`;

  box.innerHTML = `
    <div class="comments__list">${listHtml}</div>
    <div class="comments__formwrap" style="margin-top:12px;">${formHtml}</div>
  `;

  // Publicar nuevo
  if(cur){
    const form = box.querySelector("#commentForm");
    const textarea = box.querySelector("#commentText");
    const help = box.querySelector("#commentHelp");
    form?.addEventListener("submit", (e)=>{
      e.preventDefault();
      const text = (textarea.value || "").trim();
      if(!text){ help.textContent = "Escribe algo."; return; }
      if(text.length > 300){ help.textContent = "Máximo 300 caracteres."; return; }
      const me = currentOwnerId();
      addPostComment(postId, {
        id: `c_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        ownerId: me,
        authorEmail: me,
        authorName: (cur.nombre || "").trim() || (cur.email||"").split("@")[0],
        text,
        ts: Date.now(),
        editedAt: null
      });
      textarea.value = "";
      renderCommentsUI(box);
    });
  }

  // Delegación para Editar/Eliminar
  box.querySelector(".comments__list")?.addEventListener("click", (e)=>{
    const btn = e.target.closest("button[data-act]");
    if(!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;

    const comment = getPostComments(postId).find(c => c.id === id);
    if(!comment) return;

    // Rescate de propiedad si hiciera falta
    ensureOwnership(postId, comment);

    // Check final (usa ownerId)
    if(!isCommentOwner(comment)){
      alert("Solo el autor puede realizar esta acción.");
      return;
    }

    if(act === "del"){
      if(confirm("¿Eliminar tu comentario?")){
        deletePostComment(postId, id);
        renderCommentsUI(box);
      }
    }

    if(act === "edit"){
      const item = box.querySelector(`.comment[data-id="${id}"]`);
      if(!item) return;
      const currentText = comment.text;
      item.querySelector(".comment__text").outerHTML =
        `<textarea class="input comment__edit" rows="3" maxlength="300">${currentText}</textarea>`;
      const actions = item.querySelector(".comment__actions");
      if(actions){
        actions.innerHTML = `
          <button class="btn btn--primary btn-sm" data-act="save" data-id="${id}">Guardar</button>
          <button class="btn btn--ghost btn-sm" data-act="cancel" data-id="${id}">Cancelar</button>`;
      }
    }

    if(act === "save"){
      const item = box.querySelector(`.comment[data-id="${id}"]`);
      const ta = item?.querySelector(".comment__edit");
      const newText = (ta?.value || "").trim();
      if(!newText){ alert("El comentario no puede estar vacío."); return; }
      updatePostComment(postId, id, newText);
      renderCommentsUI(box);
    }

    if(act === "cancel"){
      renderCommentsUI(box);
    }
  });
}

function initBlogComments(){
  $$("[data-post-id]")?.forEach(renderCommentsUI);
}
document.addEventListener("DOMContentLoaded", ()=>{ initBlogComments(); });

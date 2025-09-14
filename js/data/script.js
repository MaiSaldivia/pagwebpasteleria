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

/* ======= Sincroniza productos con admin (si existe) ======= */
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

function addToCart(id, qty=1){
  id = decodeURIComponent(id);
  const exists = (window.PRODUCTS || []).some(p => pid(p) === String(id));
  if (!exists){ alert("Este producto ya no está disponible."); return; }
  qty = Math.max(1, Number(qty||1));
  const cart = getCart();
  const i = cart.findIndex(x => String(x.id) === String(id));
  if(i >= 0) cart[i].qty += qty; else cart.push({ id, qty });
  saveCart(cart);
}
function setQty(id, qty){
  id = decodeURIComponent(id);
  qty = Math.max(0, Number(qty||0));
  const cart = getCart();
  const i = cart.findIndex(x => String(x.id) === String(id));
  if(i === -1) return;
  if(qty === 0){ cart.splice(i,1); } else { cart[i].qty = qty; }
  saveCart(cart);
}
function removeFromCart(id){
  id = decodeURIComponent(id);
  const cart = getCart().filter(x => String(x.id) !== String(id));
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
/* Reglas:
   - Regalo primero: @duoc.cl + cumpleaños + no canjeado este año => 1 TE001 gratis (debe estar en carrito)
   - % luego (no acumulables): 50% si ≥50 años, else 10% si FELICES50
   - % se calcula sobre subtotal **sin** la torta gratis
*/
function userBenefits(items, subTotal){
  const u = getCurrent();
  if(!u) return { userDisc:0, userLabel:"", bdayDisc:0, bdayLabel:"", bdayEligible:false, bdayApplied:false };

  // --- Regalo: ¿puede canjear hoy? (máx 1 por año)
  const thisYear = new Date().getFullYear();
  const eligibleToday = IS_DUOC.test(u.email||"") && isBirthdayToday(u.fnac) && Number(u.bdayRedeemedYear) !== thisYear;

  const cake = items.find(it => String(it.id) === BDAY_CAKE_ID || /torta especial de cumpleaños/i.test(it.name));
  let bdayDisc = 0, bdayLabel = "", bdayApplied = false;
  if (eligibleToday && cake && cake.qty > 0){
    bdayDisc = cake.price; // 1 unidad gratis
    bdayLabel = "Beneficio DUOC: Torta de Cumpleaños gratis";
    bdayApplied = true;
  }

  // --- % de usuario (no acumular 50% + 10%) sobre subtotal SIN la torta gratis
  const age = computeAge(u.fnac);
  const pct = (typeof age === "number" && age > 50) ? 0.50 : ((u?.promoCode === "FELICES50" || u?.felices50) ? 0.10 : 0);
  const baseForPercent = Math.max(0, subTotal - bdayDisc);
  const userDisc = Math.round(baseForPercent * pct);
  const userLabel = pct ? `Beneficio de usuario (${Math.round(pct*100)}% OFF)` : "";

  return { userDisc, userLabel, bdayDisc, bdayLabel, bdayEligible: eligibleToday, bdayApplied };
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

  // Beneficios
  const benefits = userBenefits(items, subTotal);
  const { userDisc, userLabel, bdayDisc, bdayLabel, bdayEligible, bdayApplied } = benefits;
  window._lastUserBenefits = benefits;

  // Tip si es su cumple DUOC y NO tiene la torta en el carrito aún
  let bdayHint = "";
  if (cur && bdayEligible){
    const hasCake = items.some(it => String(it.id) === BDAY_CAKE_ID || /torta especial de cumpleaños/i.test(it.name));
    if(!hasCake){ bdayHint = `Agrega "${BDAY_CAKE_NAME}" para recibirla gratis hoy.`; }
  }

  // Limpiar FELICES50 guardado como cupón manual (por si quedó de pruebas)
  let currentCoupon = getCoupon();
  if (currentCoupon === "FELICES50") { setCoupon(""); currentCoupon = ""; }

  // Envío + cupones (sobre monto ya con regalo y %)
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

  // Checkout (marca canje de torta por año si aplicó)
  $("#checkoutBtn")?.addEventListener("click", ()=>{
    const cur = getCurrent();
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
    alert("¡Gracias! \nTotal: " + ($("#sum-total")?.textContent || ""));
  });
}

/* ======= Validaciones varias (registro/contacto/login) ======= */
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
    if(run && !validRun(run.value)){ setErr(run,"RUN inválido (sin puntos ni guion)"); ok=false; } else setErr(run,"");
    if(!nombre.value || nombre.value.length>50){ setErr(nombre,"Requerido (máx 50)"); ok=false; } else setErr(nombre,"");
    if(!apellidos.value || apellidos.value.length>100){ setErr(apellidos,"Requerido (máx 100)"); ok=false; } else setErr(apellidos,"");
    if(!correo.value || correo.value.length>100 || !EMAIL_OK.test(correo.value)){ setErr(correo,"Correo permitido (@duoc.cl, profesor.duoc.cl, gmail). Máx 100."); ok=false; } else setErr(correo,"");
    if(direccion && (!direccion.value || direccion.value.length>300)){ setErr(direccion,"Requerida (máx 300)"); ok=false; } else setErr(direccion,"");
    if(tipo && !tipo.value){ setErr(tipo,"Seleccione un tipo"); ok=false; } else setErr(tipo,"");
    if(region && !region.value){ setErr(region,"Seleccione región"); ok=false; } else setErr(region,"");
    if(comuna && !comuna.value){ setErr(comuna,"Seleccione comuna"); ok=false; } else setErr(comuna,"");
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
      fnac: fecha?.value || "",
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
});

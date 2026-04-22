/* ============================================================
   MAKENA — app.js
   Tiendanube via Vercel Proxy
   Credenciales fijas — sin panel de configuración público
   ============================================================ */

// ─── CREDENCIALES (hardcodeadas — no exponer Admin API aquí) ──
const TN_STORE_ID    = '7601778'; // Tu ID real de Tiendanube (user_id)
const WHATSAPP_NUMBER = '5493757000000'; // ← Cambiá por tu número real

// ─── CONFIG ───────────────────────────────────────────────────
const PAGE_SIZE = 12;
const CATEGORY_EMOJIS = { agro:'🌾', bazar:'🏠', papeleria:'📎', default:'📦' };
const EMPTY_MESSAGES = {
  error:     'No pudimos cargar los productos. Intentá de nuevo más tarde.',
  comingSoon:'¡Próximamente! Los productos están en camino.',
  noResults: 'No encontramos productos con ese criterio.',
};

// ─── ESTADO ───────────────────────────────────────────────────
let allProducts      = [];
let filteredProducts = [];
let cart             = [];
let currentFilter    = 'all';
let currentPage      = 1;
let hasNextPage      = false;
let connectionState  = 'idle';

// ─── DOM ──────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const productsGrid   = $('productsGrid');
const loadingState   = $('loadingState');
const emptyState     = $('emptyState');
const loadMoreRow    = $('loadMoreRow');
const loadMoreBtn    = $('loadMoreBtn');
const cartBtn        = $('cartBtn');
const cartBadge      = $('cartBadge');
const cartDrawer     = $('cartDrawer');
const cartCloseBtn   = $('cartCloseBtn');
const cartBody       = $('cartBody');
const cartEmpty      = $('cartEmpty');
const cartFooter     = $('cartFooterPanel');
const cartSubtotal   = $('cartSubtotal');
const cartCountLabel = $('cartCountLabel');
const checkoutBtn    = $('checkoutBtn');
const overlay        = $('overlay');
const toast          = $('toast');
const searchInput    = $('searchInput');
const searchBtn      = $('searchBtn');
const searchToggle   = $('searchToggle');
const searchExpand   = $('searchExpand');
const chips          = document.querySelectorAll('.chip');
const catBtns        = document.querySelectorAll('.btn-cat-link');
const hamburger      = $('hamburger');
const navLinks       = $('navLinks');
const navbar         = $('navbar');
const hfcCards       = document.querySelectorAll('.hfc');

// ─── UTILIDADES ───────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('es-AR', { style:'currency', currency:'ARS', minimumFractionDigits:0 }).format(n);

function esc(s='') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let _toastTimer;
function showToast(msg, duration=2800) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

function detectCategory(p) {
  const name = (p.name?.es || '').toLowerCase();
  const cats = (p.categories||[]).map(c=>(c.name?.es||'').toLowerCase());
  const joined = [name, ...cats].join(' ');
  if (/agro|campo|semilla|fertiliz|herbicida|fungicida|herbici|poda|huerta|jardín|jardin/.test(joined)) return 'agro';
  if (/papel|cuaderno|resma|lapiz|lápiz|birome|carpeta|agenda|folder|archiv|marcador|sello/.test(joined)) return 'papeleria';
  return 'bazar';
}

// ─── TIENDANUBE PROXY ─────────────────────────────────────────
async function tnFetch(params={}) {
  const url = new URL('/api/products', window.location.origin);
  url.searchParams.set('storeId', TN_STORE_ID);
  Object.entries(params).forEach(([k,v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  return { data: await res.json(), total: res.headers.get('X-Total-Count') };
}

// ─── CARGAR PRODUCTOS ─────────────────────────────────────────
async function loadProducts(filter='all', page=1, append=false) {
  setLoading(true);

  try {
    const params = { page, per_page: PAGE_SIZE };
    if (searchInput.value.trim()) params.q = searchInput.value.trim();

    const { data, total } = await tnFetch(params);

    connectionState = 'connected';
    const totalCount = parseInt(total || 0);
    hasNextPage = (page * PAGE_SIZE) < totalCount;
    currentPage = page;

    const products = data.map(p => {
      const v = p.variants?.[0] || {};
      return {
        id:           String(p.id),
        variantId:    String(v.id || ''),
        title:        p.name?.es || p.name?.[Object.keys(p.name||{})[0]] || 'Producto',
        description:  p.description?.es || '',
        price:        parseFloat(v.price || 0),
        comparePrice: parseFloat(v.compare_at_price || 0),
        image:        p.images?.[0]?.src || null,
        imageAlt:     p.name?.es || '',
        available:    v.stock !== 0,
        category:     detectCategory(p),
      };
    });

    allProducts = append ? [...allProducts, ...products] : products;
    filteredProducts = applyFilter(allProducts, currentFilter, searchInput.value);

    const toRender = append
      ? applyFilter(products, currentFilter, searchInput.value)
      : filteredProducts;

    if (!append && filter === 'all' && !searchInput.value.trim() && allProducts.length === 0) {
      renderProducts([], false, EMPTY_MESSAGES.comingSoon);
    } else {
      const hasQuery = searchInput.value.trim() || currentFilter !== 'all';
      renderProducts(toRender, append, EMPTY_MESSAGES.noResults, hasQuery);
      const label = allProducts.length === 1 ? 'producto' : 'productos';
    }

    loadMoreRow.hidden = !hasNextPage || allProducts.length === 0;

  } catch(err) {
    console.error('🔴 Error detallado de carga:', err.message);
    connectionState = 'error';
    hasNextPage = false; currentPage = 1;
    loadMoreRow.hidden = true;
    if (!append) renderProducts([], false, EMPTY_MESSAGES.error);
    else showToast('Error al cargar más productos.');
  } finally {
    setLoading(false);
  }
}

function applyFilter(products, filter, search='') {
  let r = products;
  if (filter !== 'all') r = r.filter(p => p.category === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    r = r.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }
  return r;
}

window.applyFilter = function(filter) {
  currentFilter = filter;
  currentPage = 1;
  chips.forEach(c => c.classList.toggle('active', c.dataset.filter === filter));
  allProducts = [];
  loadProducts(filter, 1, false);
  document.getElementById('productos')?.scrollIntoView({ behavior:'smooth', block:'start' });
};

// ─── RENDER PRODUCTOS ─────────────────────────────────────────
function renderProducts(products, append=false, emptyMsg=EMPTY_MESSAGES.noResults, showReset=false) {
  if (!append) {
    productsGrid.querySelectorAll('.product-card').forEach(el=>el.remove());
  }

  if (!products.length && !append) {
    emptyState.innerHTML = `${esc(emptyMsg)} ${showReset ? '<button onclick="applyFilter(\'all\');searchInput.value=\'\'" class="link-btn">Ver todos</button>' : ''}`;
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  products.forEach((p, i) => productsGrid.appendChild(buildCard(p, i)));
}

function buildCard(p, i=0) {
  const el = document.createElement('article');
  el.className = 'product-card fade-up';
  el.style.animationDelay = `${(i%8)*0.055}s`;
  el.dataset.productId = p.id;

  const emoji = CATEGORY_EMOJIS[p.category] || CATEGORY_EMOJIS.default;
  const tagLabel = { agro:'Agro', bazar:'Bazar', papeleria:'Papelería' }[p.category] || 'Otro';

  const imgHtml = p.image
    ? `<img class="product-img" src="${esc(p.image)}" alt="${esc(p.imageAlt)}" loading="lazy" decoding="async">`
    : `<div class="product-img-placeholder">${emoji}</div>`;

  const priceHtml = p.comparePrice > p.price
    ? `<div><span class="product-compare">${fmt(p.comparePrice)}</span> <span class="product-price">${fmt(p.price)}</span></div>`
    : `<span class="product-price">${fmt(p.price)}</span>`;

  el.innerHTML = `
    <div class="product-img-wrap">
      ${imgHtml}
      <span class="product-tag ${esc(p.category)}">${tagLabel}</span>
    </div>
    <div class="product-body">
      <p class="product-name">${esc(p.title)}</p>
      <p class="product-desc">${esc(p.description || '')}</p>
      <div class="product-foot">
        ${priceHtml}
        <button class="add-btn" data-product-id="${esc(p.id)}" aria-label="Agregar ${esc(p.title)}" ${!p.available?'disabled title="Sin stock"':''}>+</button>
      </div>
    </div>`;

  return el;
}

// ─── LOADING ──────────────────────────────────────────────────
function setLoading(on) {
  loadingState.hidden = !on;
  loadingState.style.display = on ? 'flex' : 'none';
  if (on) emptyState.hidden = true;
}

// ─── CARRITO ──────────────────────────────────────────────────
function addToCart(productId) {
  const p = allProducts.find(x => x.id === productId);
  if (!p) return;

  const ex = cart.find(x => x.id === productId);
  ex ? ex.qty++ : cart.push({...p, qty:1});

  saveCart(); updateCartUI();
  showToast(`✓ ${p.title}`);
  cartBtn.classList.add('pop');
  setTimeout(() => cartBtn.classList.remove('pop'), 320);
}

function changeQty(id, delta) {
  const item = cart.find(x => x.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(x => x.id !== id);
  saveCart(); updateCartUI();
}

function saveCart() {
  try { localStorage.setItem('mk_cart', JSON.stringify(cart.map(i=>({id:i.id,qty:i.qty})))); } catch(e){}
}

function loadCart() {
  try { cart = JSON.parse(localStorage.getItem('mk_cart')||'[]'); } catch(e){ cart=[]; }
}

function reconcileCart() {
  cart = cart.reduce((acc, s) => {
    const p = allProducts.find(x=>x.id===s.id);
    if (p) acc.push({...p, qty:s.qty});
    return acc;
  }, []);
  updateCartUI();
}

function updateCartUI() {
  const total   = cart.reduce((a,i)=>a+i.qty, 0);
  const subtotal= cart.reduce((a,i)=>a+i.price*i.qty, 0);

  cartBadge.textContent = total;
  cartBadge.hidden = total === 0;
  cartSubtotal.textContent = fmt(subtotal);
  if (cartCountLabel) cartCountLabel.textContent = `${total} ${total===1?'item':'items'}`;

  if (!cart.length) {
    cartEmpty.hidden = false;
    cartFooter.hidden = true;
    cartBody.innerHTML = '';
    cartBody.appendChild(cartEmpty);
    return;
  }

  cartEmpty.hidden = true;
  cartFooter.hidden = false;

  cartBody.innerHTML = cart.map(item => {
    const emoji = CATEGORY_EMOJIS[item.category]||'📦';
    const imgHtml = item.image
      ? `<img class="ci-img" src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy">`
      : `<div class="ci-placeholder">${emoji}</div>`;
    return `
      <div class="cart-item-row">
        ${imgHtml}
        <div class="ci-info">
          <p class="ci-name">${esc(item.title)}</p>
          <p class="ci-price">${fmt(item.price * item.qty)}</p>
        </div>
        <div class="ci-controls">
          <button class="qty-btn" data-action="dec" data-id="${esc(item.id)}">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${esc(item.id)}">+</button>
        </div>
      </div>`;
  }).join('');
}

function openCart()  { cartDrawer.classList.add('open'); overlay.classList.add('active'); document.body.style.overflow='hidden'; }
function closeCart() { cartDrawer.classList.remove('open'); overlay.classList.remove('active'); document.body.style.overflow=''; }

// ─── CHECKOUT → WHATSAPP ──────────────────────────────────────
function sendWhatsApp() {
  if (!cart.length) return;
  let msg = '¡Hola Makena! Quiero hacer un pedido:\n\n';
  cart.forEach(i => msg += `• ${i.qty}x ${i.title} — ${fmt(i.price*i.qty)}\n`);
  const total = cart.reduce((a,i)=>a+i.price*i.qty,0);
  msg += `\n*Total productos:* ${fmt(total)}`;
  msg += '\n\n¿Me podés confirmar disponibilidad y coordinar el envío?';
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
}

// ─── BÚSQUEDA ─────────────────────────────────────────────────
function doSearch() {
  if (connectionState !== 'connected') return;
  const q = searchInput.value.trim();
  filteredProducts = applyFilter(allProducts, currentFilter, q);
  const hasQuery = q || currentFilter !== 'all';
  renderProducts(filteredProducts, false, EMPTY_MESSAGES.noResults, hasQuery);
  if (q) document.getElementById('productos')?.scrollIntoView({behavior:'smooth', block:'start'});
}

// ─── NAVBAR & UI ──────────────────────────────────────────────
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  // Active nav link por sección visible
  const sections = ['inicio','categorias','productos','nosotros','contacto'];
  let current = 'inicio';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 120) current = id;
  });
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href')==='#'+current);
  });
}, { passive:true });

// Buscador expandible
searchToggle.addEventListener('click', () => {
  const open = searchExpand.classList.toggle('open');
  if (open) setTimeout(()=>searchInput.focus(), 50);
});
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrapper')) searchExpand.classList.remove('open');
});

// ─── EVENT LISTENERS ──────────────────────────────────────────
cartBtn.addEventListener('click', openCart);
cartCloseBtn.addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);
checkoutBtn.addEventListener('click', sendWhatsApp);

// Delegación: carrito items
cartBody.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action==='inc') changeQty(id, 1);
  if (btn.dataset.action==='dec') changeQty(id,-1);
});

// Delegación: agregar al carrito
productsGrid.addEventListener('click', e => {
  const btn = e.target.closest('.add-btn');
  if (!btn || btn.disabled) return;
  addToCart(btn.dataset.productId);
});

// Filtros chips
chips.forEach(c => c.addEventListener('click', () => applyFilter(c.dataset.filter)));

// Botones de categoría en sección categorías
catBtns.forEach(btn => btn.addEventListener('click', () => applyFilter(btn.dataset.filter)));

// Tarjetas flotantes del hero también filtran
hfcCards.forEach(card => {
  const filter = card.classList.contains('hfc-agro') ? 'agro'
               : card.classList.contains('hfc-bazar') ? 'bazar'
               : card.classList.contains('hfc-papel') ? 'papeleria' : null;
  if (filter) card.addEventListener('click', () => applyFilter(filter));
});

// Búsqueda
searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => e.key==='Enter' && doSearch());
searchInput.addEventListener('input', () => { if (!searchInput.value) doSearch(); });

// Load more
loadMoreBtn.addEventListener('click', () => loadProducts(currentFilter, currentPage+1, true));

// Hamburger
hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', open);
});
document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => {
  navLinks.classList.remove('open');
  hamburger.classList.remove('open');
}));

// Escape
document.addEventListener('keydown', e => { if (e.key==='Escape') { closeCart(); searchExpand.classList.remove('open'); } });

// ─── ANIMACIONES SCROLL ───────────────────────────────────────
function setupObserver() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('fade-up'); obs.unobserve(e.target); } });
  }, { threshold:0.1 });
  document.querySelectorAll('.cat-card, .contact-card, .mosaic-cell, .about-checks li, .stat-pill').forEach(el => obs.observe(el));
}

// ─── POP ANIMATION ────────────────────────────────────────────
const popStyle = document.createElement('style');
popStyle.textContent = `.cart-btn.pop{animation:cartPop .32s ease}@keyframes cartPop{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}`;
document.head.appendChild(popStyle);

// ─── INIT ─────────────────────────────────────────────────────
async function init() {
  try {
    $('currentYear').textContent = new Date().getFullYear();
    loadCart();
    updateCartUI();
    setupObserver();

    connectionState = 'connecting';
    await loadProducts('all', 1, false);

    if (connectionState === 'connected') reconcileCart();
  } catch (e) {
    console.error("Falla crítica en init:", e);
  }
}

init();

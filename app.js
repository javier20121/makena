/* ============================================================
   MAKENA — app.js (VERSIÓN CORREGIDA)
   Tiendanube via Vercel Proxy
   ============================================================ */

// ─── CREDENCIALES ───────────────────────────────────────────
const TN_STORE_ID = '7601778';
const TN_BASE_URL = 'https://rere9.mitiendanube.com';
const WHATSAPP_NUMBER = '5493757000000';

// ─── CONFIG ─────────────────────────────────────────────────
const PAGE_SIZE = 12;
const CATEGORY_EMOJIS = { agro:'🌾', bazar:'🏠', papeleria:'📎', default:'📦' };
const EMPTY_MESSAGES = {
  error:     'No pudimos cargar los productos. Intentá de nuevo más tarde.',
  comingSoon:'¡Próximamente! Los productos están en camino.',
  noResults: 'No encontramos productos con ese criterio.',
};

// ─── ESTADO ─────────────────────────────────────────────────
let allProducts      = [];
let filteredProducts = [];
let cart             = [];
let currentFilter    = 'all';
let currentPage      = 1;
let hasNextPage      = false;
let connectionState  = 'idle';
let isLoading        = false;  // ✅ PREVIENE BUCLE INFINITO

// ─── DOM ────────────────────────────────────────────────────
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
const checkoutTNBtn  = $('checkoutTNBtn');
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

// ─── UTILIDADES ─────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('es-AR', { style:'currency', currency:'ARS', minimumFractionDigits:0 }).format(n);

function esc(s='') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function stripHtml(html='') {
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g,' ').trim();
}

let _toastTimer;
function showToast(msg, duration=2800) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

function detectCategory(p) {
  const tags = (p.tags || '').toLowerCase();
  
  // Prioridad 1: Tags explícitos (Si en Tiendanube usás el tag 'agro', ES Agro)
  if (tags.includes('papeleria') || tags.includes('papelería')) return 'papeleria';
  if (tags.includes('agro')) return 'agro';
  if (tags.includes('bazar')) return 'bazar';

  // Prioridad 2: Si no hay tags, buscamos palabras clave específicas
  const name = (p.name?.es || '').toLowerCase();
  const cats = (p.categories||[]).map(c=>(c.name?.es||'').toLowerCase());
  const joined = [name, ...cats].join(' ');
  
  if (/agro|campo|semilla|fertiliz|herbicida|fungicida|poda|huerta|jardín|jardin|manguera|riego|veneno|insecticida/.test(joined)) return 'agro';
  if (/papel|cuaderno|resma|lapiz|lápiz|birome|carpeta|agenda|archiv|marcador|sello|oficina|escolar|tijera|pegamento/.test(joined)) return 'papeleria';
  return 'bazar';
}

// ─── TIENDANUBE PROXY ───────────────────────────────────────
async function tnFetch(params={}) {
  const url = new URL('/api/products', window.location.origin);
  url.searchParams.set('storeId', TN_STORE_ID);
  Object.entries(params).forEach(([k,v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  console.log('[tnFetch] URL:', url.toString());

  const res = await fetch(url);
  
  // ✅ VALIDAR RESPUESTA
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('[tnFetch] Error HTTP:', res.status, errorData);
    throw new Error(`HTTP ${res.status}: ${errorData.error || 'Error desconocido'}`);
  }

  const data = await res.json();
  
  // ✅ VALIDAR QUE DATA SEA ARRAY
  if (!Array.isArray(data)) {
    console.error('[tnFetch] Data no es array:', data);
    throw new Error('La respuesta de la API no es un array válido');
  }

  return { data, total: res.headers.get('X-Total-Count') };
}

// ─── CARGAR PRODUCTOS ───────────────────────────────────────
async function loadProducts(filter='all', page=1, append=false) {
  // ✅ PREVENIR BUCLE INFINITO
  if (isLoading) {
    console.log('[loadProducts] Ya hay una carga en progreso, saltando...');
    return;
  }
  
  isLoading = true;
  setLoading(true);

  try {
    const params = { page, per_page: PAGE_SIZE };
    if (searchInput.value.trim()) params.q = searchInput.value.trim();

    console.log('[loadProducts] Cargando:', { filter, page, append, params });

    const { data, total } = await tnFetch(params);

    connectionState = 'connected';
    const totalCount = parseInt(total || 0);
    hasNextPage = (page * PAGE_SIZE) < totalCount;
    currentPage = page;

    // ✅ VALIDAR DATA ANTES DE MAPEAR
    const products = Array.isArray(data) ? data.map(p => {
      const v = p.variants?.[0] || {};
      return {
        id:           String(p.id),
        variantId:    String(v.id || ''),
        title:        p.name?.es || p.name?.[Object.keys(p.name||{})[0]] || 'Producto',
        description:  stripHtml(p.description?.es || ''),
        price:        parseFloat(v.promotional_price || v.price || 0),
        comparePrice: parseFloat(v.price || 0),
        image:        p.images?.[0]?.src || null,
        imageAlt:     p.name?.es || 'Imagen de producto',
        available:    v.stock !== 0 && !!v.id, // ✅ Un producto es "available" si tiene stock Y un variantId válido
        category:     detectCategory(p),
        permalink:    p.canonical_url || (typeof p.permalink === 'object' ? p.permalink?.es : p.permalink) || null,
        images:       p.images || [],
        fullDescription: p.description?.es || '',
        allVariants:  p.variants || [],
        tags:         p.tags ? p.tags.split(',').map(t => t.trim()).filter(t => t !== '') : []
      };
    }) : [];

    console.log('[loadProducts] Productos procesados:', products.length);
    if (products.length) console.log('[DEBUG] Primer producto permalink:', products[0]?.permalink, '| raw:', data[0]?.permalink, '| canonical:', data[0]?.canonical_url);

    allProducts = append ? [...allProducts, ...products] : products;
    filteredProducts = logicFilter(allProducts, currentFilter, searchInput.value);

    const toRender = append
      ? logicFilter(products, currentFilter, searchInput.value)
      : filteredProducts;

    if (!append && filter === 'all' && !searchInput.value.trim() && allProducts.length === 0) {
      renderProducts([], false, EMPTY_MESSAGES.comingSoon);
    } else {
      const hasQuery = searchInput.value.trim() || currentFilter !== 'all';
      renderProducts(toRender, append, EMPTY_MESSAGES.noResults, hasQuery);
    }

    loadMoreRow.hidden = !hasNextPage || allProducts.length === 0;

  } catch(err) {
    console.error('🔴 Error detallado de carga:', err.message);
    console.error('Stack:', err.stack);
    connectionState = 'error';
    hasNextPage = false; 
    currentPage = 1;
    loadMoreRow.hidden = true;
    if (!append) renderProducts([], false, EMPTY_MESSAGES.error);
    else showToast('Error al cargar más productos.');
  } finally {
    isLoading = false;  // ✅ LIBERAR BLOQUEO
    setLoading(false);
  }
}

function logicFilter(products, filter, search='') {
  let r = Array.isArray(products) ? products : [];
  if (filter !== 'all') r = r.filter(p => p.category === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    r = r.filter(p => p.title.toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q));
  }
  return r;
}

// ─── APLICAR FILTRO ─────────────────────────────────────────
window.applyFilter = function(filter) {
  // ✅ PREVENIR BUCLE INFINITO
  if (isLoading || currentFilter === filter) {
    console.log('[applyFilter] Saltando, filtro igual o carga en progreso');
    return;
  }
  
  currentFilter = filter;
  currentPage = 1;
  
  // Actualizar chips visualmente
  chips.forEach(c => c.classList.toggle('active', c.dataset.filter === filter));
  
  allProducts = []; 
  loadProducts(filter, 1, false);
  
  document.getElementById('productos')?.scrollIntoView({ behavior:'smooth', block:'start' });
};

// ─── RENDER PRODUCTOS ───────────────────────────────────────
function renderProducts(products, append=false, emptyMsg=EMPTY_MESSAGES.noResults, showReset=false) {
  if (!append) {
    productsGrid.querySelectorAll('.product-card, .skeleton-card').forEach(el=>el.remove());
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
  
  // Forzamos a que la etiqueta visual sea únicamente el nombre del rubro detectado
  const tagLabel = ({ agro: 'Agro', bazar: 'Bazar', papeleria: 'Papelería' }[p.category] || 'Bazar');

  const hasSale = p.comparePrice > p.price && p.price > 0;
  const discount = hasSale ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0;

  const imgHtml = p.image
    ? `<img class="product-img" src="${esc(p.image)}" alt="${esc(p.imageAlt)}" loading="lazy" decoding="async">`
    : `<div class="product-img-placeholder">${emoji}</div>`;

  const priceHtml = hasSale
    ? `<div><span class="product-compare">${fmt(p.comparePrice)}</span> <span class="product-price">${fmt(p.price)}</span></div>`
    : `<span class="product-price">${p.price > 0 ? fmt(p.price) : 'Consultar'}</span>`;
  const addBtnDisabled = !p.available || !p.variantId ? 'disabled title="Sin stock o sin variante para agregar"' : '';
  el.innerHTML = `
    <div class="product-img-wrap">
      ${imgHtml}
      <span class="product-tag ${esc(p.category)}">${tagLabel}</span>
      ${hasSale ? `<span class="badge-sale">${discount}% OFF</span>` : ''}
      <button class="wishlist-btn" aria-label="Favorito">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </button>
    </div>
    <div class="product-body">
      <p class="product-name">${esc(p.title)}</p>
      <p class="product-desc">${esc(p.description || '')}</p>
      <div class="product-foot">
        ${priceHtml}
        <div class="product-actions">
          ${p.permalink ? `<a class="buy-btn" href="${esc(p.permalink)}" target="_blank" rel="noopener noreferrer" aria-label="Ver ${esc(p.title)}">Ver</a>` : ''}
          <button class="add-btn" data-product-id="${esc(p.id)}" aria-label="Agregar ${esc(p.title)}" ${addBtnDisabled}>+ Carrito</button>
        </div>
      </div>
    </div>`;

  return el;
}

// ─── LOADING ────────────────────────────────────────────────
function setLoading(on) {
  loadingState.hidden = true; // skeletons reemplazan al spinner
  loadingState.style.display = 'none';
  if (on) emptyState.hidden = true;
}

// ─── CARRITO ────────────────────────────────────────────────
function addToCart(productId) {
  const p = allProducts.find(x => x.id === productId);
  if (!p) return;
  if (!p.variantId) { // ✅ NUEVA VALIDACIÓN
    console.warn(`[addToCart] Producto ${p.title} (${p.id}) no tiene variantId, no se puede agregar a Tiendanube.`);
    showToast(`⚠️ No se puede agregar ${p.title} a Tiendanube.`);
    return;
  }

  const ex = cart.find(x => x.id === productId);
  ex ? ex.qty++ : cart.push({...p, qty:1});

  // 🔄 Sincronización silenciosa con Tiendanube
  if (p.variantId) {
    const body = new URLSearchParams();
    body.append('add_to_cart', p.variantId);
    body.append('variant_id', p.variantId);
    body.append('quantity', '1');

    console.log(`[Tiendanube Sync] Enviando a /cart/add/: variantId=${p.variantId}, quantity=1`); // ✅ LOG DE DEPURACIÓN
    fetch(`${TN_BASE_URL}/cart/add/`, { method: 'POST', mode: 'no-cors', body })
      .catch(err => console.warn('[Tiendanube Sync] Falló:', err));
  }

  saveCart(); updateCartUI();
  showToast(`✓ ${p.title}`);
  
  cartBtn.classList.add('pop');
  setTimeout(() => cartBtn.classList.remove('pop'), 320);
}

function changeQty(id, delta) {
  const item = cart.find(x => x.id === id);
  if (!item) return;
  item.qty += delta;

  // Si el usuario incrementa, sincronizamos también en la nube
  if (delta > 0 && item.variantId) { // ✅ VALIDACIÓN item.variantId
    const body = new URLSearchParams();
    body.append('add_to_cart', item.variantId);
    body.append('variant_id', item.variantId);
    body.append('quantity', '1');

    console.log(`[Tiendanube Sync] Incrementando en /cart/add/: variantId=${item.variantId}, quantity=1`); // ✅ LOG DE DEPURACIÓN
    fetch(`${TN_BASE_URL}/cart/add/`, { method: 'POST', mode: 'no-cors', body })
      .catch(() => {});
  }

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

// ─── CHECKOUT → WHATSAPP ────────────────────────────────────
function sendWhatsApp() {
  if (!cart.length) return;
  let msg = '¡Hola Makena! Quiero hacer un pedido:\n\n';
  cart.forEach(i => msg += `• ${i.qty}x ${i.title} — ${fmt(i.price*i.qty)}\n`);
  const total = cart.reduce((a,i)=>a+i.price*i.qty,0);
  msg += `\n*Total productos:* ${fmt(total)}`;
  msg += '\n\n¿Me podés confirmar disponibilidad y coordinar el envío?';
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
}

function sendToTiendaNube() {
  if (!cart.length) return;
  
  // Usamos el último ítem para abrir el carrito de Tiendanube
  // La sincronización previa (fetch) ya debería haber cargado los demás
  const item = cart[cart.length - 1];
  if (!item.variantId) return;

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `${TN_BASE_URL}/cart/add/`;
  form.target = '_blank';

  const fields = {
    'add_to_cart': item.variantId,
    'variant_id': item.variantId,
    'quantity': item.qty
  };

  for (const [key, val] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = val;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  
  // Limpieza
  setTimeout(() => document.body.removeChild(form), 1000);
}

// ─── BÚSQUEDA ───────────────────────────────────────────────
function doSearch() {
  if (connectionState !== 'connected') return;
  const q = searchInput.value.trim();
  filteredProducts = logicFilter(allProducts, currentFilter, q);
  const hasQuery = q || currentFilter !== 'all';
  renderProducts(filteredProducts, false, EMPTY_MESSAGES.noResults, hasQuery);
  if (q) document.getElementById('productos')?.scrollIntoView({behavior:'smooth', block:'start'});
}

// ─── NAVBAR & UI ────────────────────────────────────────────
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
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

searchToggle.addEventListener('click', () => {
  const open = searchExpand.classList.toggle('open');
  if (open) setTimeout(()=>searchInput.focus(), 50);
});
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrapper')) searchExpand.classList.remove('open');
});

// ─── EVENT LISTENERS ────────────────────────────────────────
cartBtn.addEventListener('click', openCart);
cartCloseBtn.addEventListener('click', closeCart);
overlay.addEventListener('click', () => { closeCart(); closeProductModal(); });
checkoutBtn.addEventListener('click', sendWhatsApp);
if (checkoutTNBtn) checkoutTNBtn.addEventListener('click', sendToTiendaNube);

cartBody.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action==='inc') changeQty(id, 1);
  if (btn.dataset.action==='dec') changeQty(id,-1);
});

productsGrid.addEventListener('click', e => {
  const btn = e.target.closest('.add-btn');
  if (btn) {
    if (btn.disabled) return;
    addToCart(btn.dataset.productId);
    return;
  }

  // Wishlist heart toggle
  const wishBtn = e.target.closest('.wishlist-btn');
  if (wishBtn) {
    wishBtn.classList.toggle('active');
    e.stopPropagation(); // Evitar abrir el modal al tocar el corazón
    return;
  }

  // Si hace clic en el enlace de comprar, dejar que siga su curso
  if (e.target.closest('.buy-btn')) return;

  // Si hace clic en cualquier otra parte de la tarjeta, abrir modal
  const card = e.target.closest('.product-card');
  if (card) {
    openProductModal(card.dataset.productId);
  }
});

// ─── LÓGICA DEL MODAL DE PRODUCTO ───────────────────────────
const productModal = $('productModal');
const pmClose      = $('pmClose');

function openProductModal(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;

  // Poblar datos básicos
  $('pmTag').textContent = ({ agro:'Agro', bazar:'Bazar', papeleria:'Papelería' }[p.category] || 'Bazar');
  $('pmTitle').textContent = p.title;
  $('pmPrice').textContent = fmt(p.price);
  $('pmCompare').textContent = (p.comparePrice > p.price) ? fmt(p.comparePrice) : '';
  $('pmDescription').innerHTML = p.fullDescription || '<p>Sin descripción disponible.</p>';
  
  // Galería
  const mainImg = $('pmMainImg');
  const thumbs  = $('pmThumbs');
  mainImg.src = p.image || '';
  
  thumbs.innerHTML = p.images.map((img, idx) => `
    <div class="pm-thumb ${idx === 0 ? 'active' : ''}" data-src="${esc(img.src)}">
      <img src="${esc(img.src)}" alt="Miniatura ${idx + 1}">
    </div>
  `).join('');

  // Variantes (Simplificado: mostramos si hay más de una)
  const varContainer = $('pmVariants');
  if (p.allVariants && p.allVariants.length > 1) {
    varContainer.innerHTML = `
      <div class="pm-variant-group">
        <span class="pm-variant-label">Opciones disponibles:</span>
        <div class="pm-variant-options">
          ${p.allVariants.map(v => `<span class="pm-opt">${esc(v.values?.[0]?.es || 'Opción')}</span>`).join('')}
        </div>
      </div>
    `;
    varContainer.hidden = false;
  } else {
    varContainer.hidden = true;
  }

  // Acciones
  $('pmAddToCart').onclick = () => { addToCart(p.id); closeProductModal(); };
  
  const btnBuyNow = $('pmBuyNow');
  btnBuyNow.hidden = !p.variantId;
  btnBuyNow.href = '#';
  btnBuyNow.onclick = (e) => {
    e.preventDefault();
    if (!p.variantId) return;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${TN_BASE_URL}/cart/add/`;
    form.target = '_blank';
    
    const fields = { 
      'add_to_cart': p.variantId, 
      'variant_id': p.variantId, 
      'quantity': '1' 
    };
    for (const [k, v] of Object.entries(fields)) {
      const input = document.createElement('input'); input.type = 'hidden'; input.name = k; input.value = v;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => document.body.removeChild(form), 1000);
  };

  $('pmWhatsApp').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola! Me interesa este producto: ' + p.title + '\n' + (p.permalink || ''))}`;

  // Mostrar modal
  productModal.classList.add('open'); // ✅ Asegurarse de que el modal se abre
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  productModal.classList.remove('open');
  if (!cartDrawer.classList.contains('open')) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

pmClose.addEventListener('click', closeProductModal);

// Cambiar imagen principal al tocar miniatura
$('pmThumbs').addEventListener('click', e => {
  const thumb = e.target.closest('.pm-thumb');
  if (!thumb) return;
  document.querySelectorAll('.pm-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
  $('pmMainImg').src = thumb.dataset.src;
});

// ✅ FILTROS CHIPS - SIN BUCLE INFINITO
chips.forEach(c => {
  c.addEventListener('click', () => {
    const filter = c.dataset.filter;
    if (filter !== currentFilter) {
      window.applyFilter(filter);
    }
  });
});

catBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    if (filter !== currentFilter) {
      window.applyFilter(filter);
    }
  });
});

hfcCards.forEach(card => {
  const filter = card.classList.contains('hfc-agro') ? 'agro'
               : card.classList.contains('hfc-bazar') ? 'bazar'
               : card.classList.contains('hfc-papel') ? 'papeleria' : null;
  if (filter) {
    card.addEventListener('click', () => {
      if (filter !== currentFilter) {
        window.applyFilter(filter);
      }
    });
  }
});

searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => e.key==='Enter' && doSearch());
searchInput.addEventListener('input', () => { if (!searchInput.value) doSearch(); });

loadMoreBtn.addEventListener('click', () => {
  if (!isLoading && hasNextPage) {
    loadProducts(currentFilter, currentPage+1, true);
  }
});

hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', open);
});
document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => {
  navLinks.classList.remove('open');
  hamburger.classList.remove('open');
}));

document.addEventListener('keydown', e => { if (e.key==='Escape') { closeCart(); closeProductModal(); searchExpand.classList.remove('open'); } });

// ─── ANIMACIONES SCROLL ─────────────────────────────────────
function setupObserver() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('fade-up'); obs.unobserve(e.target); } });
  }, { threshold:0.1 });
  document.querySelectorAll('.cat-card, .contact-card, .mosaic-cell, .about-checks li, .stat-pill').forEach(el => obs.observe(el));
}

// ─── POP ANIMATION ──────────────────────────────────────────
const popStyle = document.createElement('style');
popStyle.textContent = `.cart-btn.pop{animation:cartPop .32s ease}@keyframes cartPop{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}`;
document.head.appendChild(popStyle);

// ─── INIT ───────────────────────────────────────────────────
async function init() {
  try {
    $('currentYear').textContent = new Date().getFullYear();
    loadCart();
    updateCartUI();
    setupObserver();

    // Announce bar
    const announceBar = $('announceBar');
    const announceClose = $('announceClose');
    if (announceClose && announceBar) {
      announceClose.addEventListener('click', () => {
        announceBar.classList.add('hidden');
        // ajustar navbar top si es necesario
      });
    }

    // Back to top
    const backTop = $('backTop');
    if (backTop) {
      window.addEventListener('scroll', () => {
        backTop.classList.toggle('visible', window.scrollY > 400);
      }, { passive: true });
      backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // Skeleton cards mientras carga
    showSkeletons(6);

    connectionState = 'connecting';
    await loadProducts('all', 1, false);

    if (connectionState === 'connected') reconcileCart();
  } catch (e) {
    console.error("Falla crítica en init:", e);
  }
}

function showSkeletons(n) {
  productsGrid.querySelectorAll('.product-card, .skeleton-card').forEach(el => el.remove());
  for (let i = 0; i < n; i++) {
    const sk = document.createElement('div');
    sk.className = 'skeleton-card';
    sk.innerHTML = `<div class="skeleton-img"></div><div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-line price"></div></div>`;
    productsGrid.appendChild(sk);
  }
}

init();

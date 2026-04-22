/* ============================================================
   MAKENA — app.js
   Integración con Tiendanube API
   ============================================================ */

// ─── CONFIGURACIÓN ────────────────────────────────────────────
const WHATSAPP_NUMBER = '5493757000000'; // ← Cambiá por tu número real

// Credenciales Tiendanube (se leen desde localStorage)
let TN_STORE_ID = localStorage.getItem('mk_domain') || '';
let TN_TOKEN    = localStorage.getItem('mk_token')  || 'eab22a1052be423fc56d633f7c34f8507d8e747a';

// ─── ESTADO GLOBAL ────────────────────────────────────────────
let allProducts    = [];   // Todos los productos cargados
let filteredProducts = []; // Productos filtrados actualmente
let cart           = [];   // Items en el carrito
let currentFilter  = 'all';
let currentPage    = 1;    // Para paginación
let hasNextPage    = false;
let connectionState = 'disconnected';
const PAGE_SIZE    = 12;

const EMPTY_MESSAGES = {
  error: 'Error al conectar con Tiendanube.',
  comingSoon: 'Los productos se van a mostrar dentro de poco.',
  noResults: 'No se encontraron productos.',
};

// Mapeo de colecciones/tags de Shopify a categorías Makena
const CATEGORY_EMOJIS = {
  agro:      '🌾',
  bazar:     '🏠',
  papeleria: '📎',
  default:   '📦',
};

// ─── ELEMENTOS DOM ────────────────────────────────────────────
const productsGrid    = document.getElementById('productsGrid');
const loadingState    = document.getElementById('loadingState');
const emptyState      = document.getElementById('emptyState');
const loadMoreRow     = document.getElementById('loadMoreRow');
const loadMoreBtn     = document.getElementById('loadMoreBtn');
const cartBtn         = document.getElementById('cartBtn');
const cartBadge       = document.getElementById('cartBadge');
const cartDrawer      = document.getElementById('cartDrawer');
const cartCloseBtn    = document.getElementById('cartCloseBtn');
const cartBody        = document.getElementById('cartBody');
const cartEmpty       = document.getElementById('cartEmpty');
const cartFooter      = document.getElementById('cartFooterPanel');
const cartSubtotal    = document.getElementById('cartSubtotal');
const checkoutBtn     = document.getElementById('checkoutBtn');
const whatsappBtn     = document.getElementById('whatsappBtn');
const overlay         = document.getElementById('overlay');
const toast           = document.getElementById('toast');
const statusDot       = document.getElementById('statusDot');
const statusText      = document.getElementById('statusText');
const searchInput     = document.getElementById('searchInput');
const searchBtn       = document.getElementById('searchBtn');
const filterPills     = document.querySelectorAll('.filter-pill');
const catButtons      = document.querySelectorAll('.btn-cat');
const fabSettings     = document.getElementById('fabSettings');
const configPanel     = document.getElementById('configPanel');
const configOverlay   = document.getElementById('configOverlay');
const configClose     = document.getElementById('configClose');
const saveConfigBtn   = document.getElementById('saveConfigBtn');
const inputDomain     = document.getElementById('inputDomain');
const inputToken      = document.getElementById('inputToken');
const hamburger       = document.getElementById('hamburger');
const navLinks        = document.getElementById('navLinks');
const navbar          = document.getElementById('navbar');

// ─── UTILIDADES ───────────────────────────────────────────────
function formatPrice(amount, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg, duration = 2500) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), duration);
}

function clearRenderedProducts() {
  const existing = productsGrid.querySelectorAll('.product-card');
  existing.forEach(el => el.remove());
}

function showEmptyState(message, showResetButton = false) {
  emptyState.innerHTML = `${message} ${showResetButton ? '<button onclick="applyFilter(\'all\'); searchInput.value=\'\';" class="link-btn">Ver todos</button>' : ''}`;
  emptyState.hidden = false;
}

function hideEmptyState() {
  emptyState.hidden = true;
}

function detectCategory(product) {
  const name = (product.name?.es || '').toLowerCase();
  const categories = (product.categories || []).map(c => (c.name?.es || '').toLowerCase());

  if (categories.includes('agro') || name.includes('agro') || name.includes('campo')) return 'agro';
  if (categories.includes('bazar') || name.includes('bazar') || name.includes('cocina')) return 'bazar';
  if (categories.includes('papeleria') || categories.includes('papelería') || name.includes('papel')) return 'papeleria';
  return 'bazar'; // default
}

// ─── TIENDANUBE API ───────────────────────────────────────────
async function tnFetch(path, params = {}) {
  if (!TN_STORE_ID || !TN_TOKEN) {
    throw new Error('No hay credenciales de Tiendanube configuradas.');
  }

  // Apuntamos a nuestra función de Vercel en lugar de a Tiendanube directamente
  const url = new URL('/api/products', window.location.origin);
  
  // Enviamos las credenciales como parámetros para que el proxy las use
  url.searchParams.append('storeId', TN_STORE_ID);
  url.searchParams.append('token', TN_TOKEN);  // ← Faltaba esto

  // Filtrar parámetros adicionales (paginación, búsqueda, etc.)
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });

  console.log(`📡 Solicitando productos al Proxy: ${url.toString()}`);

  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    console.error(`❌ Error en respuesta de Tiendanube: ${response.status} ${response.statusText}`);
    throw new Error(`Error HTTP ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ Respuesta exitosa de Tiendanube (${path}):`, data);

  return {
    data: data,
    total: response.headers.get('X-Total-Count')
  };
}

// ─── CARGAR PRODUCTOS ─────────────────────────────────────────
async function loadProducts(filter = 'all', page = 1, append = false) {
  setLoadingState(true);

  try {
    const { data, total } = await tnFetch('products', {
      page: page,
      per_page: PAGE_SIZE,
      q: searchInput.value.trim() || undefined
    });

    connectionState = 'connected';
    const totalCount = parseInt(total || 0);
    hasNextPage = (page * PAGE_SIZE) < totalCount;
    currentPage = page;

    const products = data.map(p => {
      const mainVariant = p.variants[0] || {};
      return {
        id: p.id,
        variantId: mainVariant.id,
        title: p.name.es || p.name[Object.keys(p.name)[0]],
        description: p.description.es || '',
        price: parseFloat(mainVariant.price || 0),
        comparePrice: parseFloat(mainVariant.compare_at_price || 0),
        currency: 'ARS',
        image: p.images[0]?.src || null,
        imageAlt: p.name.es,
        available: mainVariant.stock !== 0,
        category: detectCategory(p),
      };
    });

    if (append) {
      allProducts = [...allProducts, ...products];
    } else {
      allProducts = products;
    }

    filteredProducts = applyLocalFilter(allProducts, currentFilter, searchInput.value);
    const productsToRender = append
      ? applyLocalFilter(products, currentFilter, searchInput.value)
      : filteredProducts;
    const isCatalogEmpty = !append && filter === 'all' && !searchInput.value.trim() && allProducts.length === 0;

    // Paginación
    if (isCatalogEmpty) {
      renderProducts([], false, { emptyMessage: EMPTY_MESSAGES.comingSoon });
      setStatus('connected', 'Tienda conectada. Los productos se van a mostrar dentro de poco.');
    } else {
      renderProducts(productsToRender, append, {
        emptyMessage: EMPTY_MESSAGES.noResults,
        showResetButton: Boolean(searchInput.value.trim() || currentFilter !== 'all'),
      });

      const productLabel = allProducts.length === 1 ? 'producto' : 'productos';
      setStatus('connected', `✓ ${allProducts.length} ${productLabel} de Tiendanube`);
    }

    loadMoreRow.hidden = !hasNextPage || allProducts.length === 0;

  } catch (err) {
    console.error('Error cargando productos:', err);
    connectionState = 'error';
    hasNextPage = false;
    currentPage = 1;
    loadMoreRow.hidden = true;
    setStatus('error', `Error al conectar con Tiendanube${err.message ? `: ${err.message}` : '.'}`);

    if (!append) {
      allProducts = [];
      filteredProducts = [];
      renderProducts([], false, { emptyMessage: EMPTY_MESSAGES.error });
    } else {
      showToast('Error al cargar más productos.');
    }
  } finally {
    setLoadingState(false);
  }
}

function applyLocalFilter(products, filter, search = '') {
  let result = products;

  if (filter !== 'all') {
    result = result.filter(p => p.category === filter);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  return result;
}

window.applyFilter = function(filter) {
  currentFilter = filter;
  currentPage = 1;

  filterPills.forEach(pill => {
    pill.classList.toggle('active', pill.dataset.filter === filter);
  });

  if (TN_STORE_ID && TN_TOKEN) {
    allProducts = [];
    loadProducts(filter, 1, false);
  } else {
    connectionState = 'error';
    loadMoreRow.hidden = true;
    setStatus('error', 'Error: Tiendanube no está configurado.');
    renderProducts([], false, { emptyMessage: EMPTY_MESSAGES.error });
  }

  document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ─── RENDER PRODUCTOS ─────────────────────────────────────────
function renderProducts(products, append = false, options = {}) {
  const {
    emptyMessage = EMPTY_MESSAGES.noResults,
    showResetButton = false,
  } = options;

  if (!append) {
    clearRenderedProducts();
  }

  if (products.length === 0 && !append) {
    showEmptyState(emptyMessage, showResetButton);
    return;
  }

  hideEmptyState();

  products.forEach((product, i) => {
    const card = createProductCard(product, i);
    productsGrid.appendChild(card);
  });
}

function createProductCard(product, index = 0) {
  const card = document.createElement('article');
  card.className = 'product-card fade-up';
  card.style.animationDelay = `${(index % 6) * 0.06}s`;
  card.dataset.category = product.category;
  card.dataset.productId = product.id;

  const emoji = CATEGORY_EMOJIS[product.category] || CATEGORY_EMOJIS.default;
  const tagClass = product.category;
  const tagLabel = product.category === 'papeleria' ? 'Papelería' :
                   product.category === 'agro' ? 'Agro' : 'Bazar';

  const priceHtml = product.comparePrice > product.price
    ? `<div>
        <span class="product-compare-price">${formatPrice(product.comparePrice, product.currency)}</span>
        <span class="product-price">${formatPrice(product.price, product.currency)}</span>
       </div>`
    : `<span class="product-price">${formatPrice(product.price, product.currency)}</span>`;

  const imageHtml = product.image
    ? `<img class="product-img" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.imageAlt)}" loading="lazy" decoding="async">`
    : `<div class="product-img-placeholder">${emoji}</div>`;

  card.innerHTML = `
    <div class="product-img-wrap">
      ${imageHtml}
      <span class="product-tag ${tagClass}">${tagLabel}</span>
    </div>
    <div class="product-body">
      <h3 class="product-name">${escapeHtml(product.title)}</h3>
      <p class="product-desc">${escapeHtml(product.description || 'Producto disponible en Makena.')}</p>
      <div class="product-footer">
        ${priceHtml}
        <button 
          class="add-to-cart-btn" 
          data-product-id="${escapeHtml(product.id)}"
          data-variant-id="${escapeHtml(product.variantId || '')}"
          aria-label="Agregar ${escapeHtml(product.title)} al carrito"
          ${!product.available ? 'disabled title="Sin stock"' : ''}
        >+</button>
      </div>
    </div>
  `;

  return card;
}

// ─── DEMO PRODUCTS (cuando no hay Shopify conectado) ──────────
function renderDemoProducts() {
  allProducts = [];
  filteredProducts = [];
  renderProducts([], false, { emptyMessage: EMPTY_MESSAGES.error });
  return;

  const demoProducts = [
    { id: 'd1', variantId: 'dv1', title: 'Fertilizante Orgánico 1kg', description: 'Fertilizante de origen natural para huerta y jardín.', category: 'agro', price: 2500, comparePrice: 0, currency: 'ARS', image: null, imageAlt: '', tags: ['agro'], available: true },
    { id: 'd2', variantId: 'dv2', title: 'Semillas de Tomate Cherry', description: 'Pack de semillas seleccionadas para mayor producción.', category: 'agro', price: 1200, comparePrice: 1500, currency: 'ARS', image: null, imageAlt: '', tags: ['agro'], available: true },
    { id: 'd3', variantId: 'dv3', title: 'Tijera de Poda', description: 'Tijera de acero inoxidable para poda de plantas.', category: 'agro', price: 3800, comparePrice: 0, currency: 'ARS', image: null, imageAlt: '', tags: ['agro'], available: true },
    { id: 'd4', variantId: 'dv4', title: 'Juego de Ollas x5', description: 'Juego de ollas de acero con tapa. Ideal para el hogar.', category: 'bazar', price: 18500, comparePrice: 22000, currency: 'ARS', image: null, imageAlt: '', tags: ['bazar'], available: true },
    { id: 'd5', variantId: 'dv5', title: 'Tabla de Madera para Cocina', description: 'Tabla de corte de madera natural, mediana.', category: 'bazar', price: 4200, comparePrice: 0, currency: 'ARS', image: null, imageAlt: '', tags: ['bazar'], available: true },
    { id: 'd6', variantId: 'dv6', title: 'Set de Tazas x6', description: 'Set de 6 tazas de cerámica resistente.', category: 'bazar', price: 6800, comparePrice: 0, currency: 'ARS', image: null, imageAlt: '', tags: ['bazar'], available: true },
    { id: 'd7', variantId: 'dv7', title: 'Resma A4 500 Hojas', description: 'Papel de impresión blanco, 75gr. Para impresora y fotocopiadora.', category: 'papeleria', price: 3500, comparePrice: 0, currency: 'ARS', image: null, imageAlt: '', tags: ['papeleria'], available: true },
    { id: 'd8', variantId: 'dv8', title: 'Cuaderno A4 Tapa Dura', description: 'Cuaderno 100 hojas rayado con tapa dura. Varios colores.', category: 'papeleria', price: 1800, comparePrice: 2200, currency: 'ARS', image: null, imageAlt: '', tags: ['papeleria'], available: true },
    { id: 'd9', variantId: 'dv9', title: 'Set de Lapiceros x12', description: 'Lapiceros de tinta azul y negra, punta fina.', category: 'papeleria', price: 1500, comparePrice: 0, currency: 'ARS', image: null, imageAlt: '', tags: ['papeleria'], available: true },
  ];

  allProducts = demoProducts;
  filteredProducts = demoProducts;
  renderProducts(demoProducts, false);
  setStatus('error', '⚠ Modo demo — conectá tu tienda Tiendanube con el botón ⚙️');
}

// ─── LOADING STATE ─────────────────────────────────────────────
function setLoadingState(loading) {
  if (loading) {
    hideEmptyState();
  }
  loadingState.hidden = !loading;
  loadingState.style.display = loading ? 'flex' : 'none';
}

function setStatus(state, message) {
  statusDot.className = 'status-dot ' + state;
  statusText.textContent = message;
}

// ─── CARRITO ──────────────────────────────────────────────────
async function addToCart(productId, variantId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  // Carrito local (siempre)
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveLocalCart();
  updateCartUI();
  showToast(`✓ ${product.title} agregado al carrito`);

  // Pop en botón del cart
  cartBtn.classList.add('pop');
  setTimeout(() => cartBtn.classList.remove('pop'), 300);
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }
  saveLocalCart();
  updateCartUI();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveLocalCart();
  updateCartUI();
  showToast('Producto eliminado del carrito');
}

function saveLocalCart() {
  try {
    localStorage.setItem('mk_local_cart', JSON.stringify(cart.map(i => ({ id: i.id, qty: i.qty }))));
  } catch (e) {}
}

function loadLocalCart() {
  try {
    const stored = JSON.parse(localStorage.getItem('mk_local_cart') || '[]');
    // Se reconcilia con allProducts cuando estos cargan
    cart = stored;
  } catch (e) { cart = []; }
}

function reconcileCart() {
  cart = cart.reduce((acc, stored) => {
    const product = allProducts.find(p => p.id === stored.id);
    if (product) acc.push({ ...product, qty: stored.qty });
    return acc;
  }, []);
  updateCartUI();
}

function updateCartUI() {
  const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);
  const subtotal = cart.reduce((acc, i) => acc + i.price * i.qty, 0);

  // Badge
  cartBadge.textContent = totalItems;
  cartBadge.hidden = totalItems === 0;

  // Subtotal
  cartSubtotal.textContent = formatPrice(subtotal, 'ARS');

  // Items en drawer
  if (cart.length === 0) {
    cartEmpty.hidden = false;
    cartFooter.hidden = true;
    cartBody.innerHTML = '';
    cartBody.appendChild(cartEmpty);
    return;
  }

  cartEmpty.hidden = true;
  cartFooter.hidden = false;

  cartBody.innerHTML = cart.map(item => {
    const emoji = CATEGORY_EMOJIS[item.category] || '📦';
    const imgHtml = item.image
      ? `<img class="cart-item-img" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">`
      : `<div class="cart-item-img-placeholder">${emoji}</div>`;

    return `
      <div class="cart-item-row" data-item-id="${escapeHtml(item.id)}">
        ${imgHtml}
        <div class="cart-item-info">
          <p class="cart-item-name">${escapeHtml(item.title)}</p>
          <p class="cart-item-price">${formatPrice(item.price * item.qty, 'ARS')}</p>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" data-action="decrease" data-id="${escapeHtml(item.id)}">-</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" data-action="increase" data-id="${escapeHtml(item.id)}">+</button>
        </div>
      </div>
    `;
  }).join('');
}

function openCart() {
  cartDrawer.classList.add('open');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartDrawer.classList.remove('open');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ─── CHECKOUT ─────────────────────────────────────────────────
function handleCheckout() {
  // Tiendanube requiere integración de checkout vía API más compleja.
  // Por ahora, usamos WhatsApp como canal de cierre directo.
  handleWhatsAppOrder();
}

function handleWhatsAppOrder() {
  if (!cart.length) return;

  let msg = '¡Hola Makena! Vi estos productos en la web y quiero hacer un pedido:\n\n';
  cart.forEach(item => {
    msg += `• ${item.qty}x ${item.title} — ${formatPrice(item.price * item.qty, 'ARS')}\n`;
  });
  const total = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
  msg += `\n*Total productos:* ${formatPrice(total, 'ARS')}`;
  msg += '\n\n¿Me podés confirmar disponibilidad y coordinar el envío?';

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
}

// ─── BÚSQUEDA ─────────────────────────────────────────────────
function handleSearch() {
  if (connectionState !== 'connected') {
    loadMoreRow.hidden = true;
    setStatus('error', 'Error al conectar con Tiendanube.');
    renderDemoProducts();
    return;
  }

  const query = searchInput.value.trim();
  filteredProducts = applyLocalFilter(allProducts, currentFilter, query);
  renderProducts(filteredProducts, false, {
    emptyMessage: allProducts.length === 0 ? EMPTY_MESSAGES.comingSoon : EMPTY_MESSAGES.noResults,
    showResetButton: Boolean(query || currentFilter !== 'all'),
  });

  if (query) {
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ─── CONFIG TIENDANUBE ────────────────────────────────────────
function openConfig() {
  inputDomain.value = TN_STORE_ID;
  inputToken.value = TN_TOKEN;
  configPanel.classList.add('active');
  configOverlay.classList.add('active');
}

function closeConfig() {
  configPanel.classList.remove('active');
  configOverlay.classList.remove('active');
}

function saveConfig() {
  const storeId = inputDomain.value.trim();
  const token   = inputToken.value.trim();

  if (!storeId || !token) {
    showToast('⚠ Completá el ID de tienda y el token.');
    return;
  }

  // El ID de Tiendanube es numérico (ej: 3123456), no un dominio .myshopify.com
  if (storeId.includes('.') || isNaN(storeId)) {
    showToast('⚠ El ID debe ser un número (ej: 123456).');
    return;
  }

  TN_STORE_ID = storeId;
  TN_TOKEN    = token;
  localStorage.setItem('mk_domain', storeId);
  localStorage.setItem('mk_token', token);

  closeConfig();
  showToast('✓ Credenciales guardadas. Cargando productos...');

  connectionState = 'connecting';
  setStatus('', 'Conectando con Tiendanube...');
  currentFilter = 'all';
  filterPills.forEach(pill => {
    pill.classList.toggle('active', pill.dataset.filter === 'all');
  });
  allProducts = [];
  filteredProducts = [];
  clearRenderedProducts();
  currentPage = 1;
  loadProducts('all', 1, false);
}

// ─── NAVBAR SCROLL & HAMBURGER ────────────────────────────────
function handleNavbarScroll() {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}

function toggleMenu() {
  const open = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', open);
}

// ─── EVENT LISTENERS ──────────────────────────────────────────
cartBtn.addEventListener('click', openCart);
cartCloseBtn.addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);

// Delegación para items del carrito
cartBody.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === 'increase') changeQty(id, 1);
  if (btn.dataset.action === 'decrease') changeQty(id, -1);
});

// Agregar al carrito (delegación en el grid)
productsGrid.addEventListener('click', e => {
  const btn = e.target.closest('.add-to-cart-btn');
  if (!btn) return;
  addToCart(btn.dataset.productId, btn.dataset.variantId);
});

// Filtros
filterPills.forEach(pill => {
  pill.addEventListener('click', () => applyFilter(pill.dataset.filter));
});

// Botones de categoría
catButtons.forEach(btn => {
  btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
});

// Búsqueda
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSearch();
});

// Load more
loadMoreBtn.addEventListener('click', () => {
  loadProducts(currentFilter, currentPage + 1, true);
});

// Checkout y WhatsApp
checkoutBtn.addEventListener('click', handleCheckout);
whatsappBtn.addEventListener('click', handleWhatsAppOrder);

// Config
fabSettings.addEventListener('click', openConfig);
configClose.addEventListener('click', closeConfig);
configOverlay.addEventListener('click', closeConfig);
saveConfigBtn.addEventListener('click', saveConfig);

// Navbar
hamburger.addEventListener('click', toggleMenu);
window.addEventListener('scroll', handleNavbarScroll, { passive: true });

// Cerrar menú mobile al hacer clic en un enlace
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
  });
});

// Teclado Escape cierra modales
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeCart();
    closeConfig();
  }
});

// ─── ANIMACIONES DE ENTRADA (Intersection Observer) ───────────
function setupScrollAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-up');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.cat-card, .info-card, .mosaic-item').forEach(el => {
    observer.observe(el);
  });
}

// ─── INIT ─────────────────────────────────────────────────────
async function init() {
  document.getElementById('currentYear').textContent = new Date().getFullYear();

  loadLocalCart();

  if (TN_STORE_ID && TN_TOKEN) {
    inputDomain.value = TN_STORE_ID;
    inputToken.value  = TN_TOKEN;
    connectionState = 'connecting';
    setStatus('', 'Conectando con Tiendanube...');
    await loadProducts('all', 1, false);
    if (connectionState === 'connected') {
      reconcileCart();
    }
  } else {
    connectionState = 'error';
    loadMoreRow.hidden = true;
    setStatus('error', 'Error: Tiendanube no está configurado.');
    setLoadingState(false);
    renderProducts([], false, { emptyMessage: EMPTY_MESSAGES.error });
  }

  updateCartUI();
  setupScrollAnimations();
}

// Pop animation para el cart btn
const style = document.createElement('style');
style.textContent = `
  .cart-btn.pop { animation: cartPop 0.3s ease; }
  @keyframes cartPop {
    0%   { transform: scale(1); }
    50%  { transform: scale(1.25); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);

init();

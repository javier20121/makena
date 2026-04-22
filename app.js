/* ============================================================
   MAKENA — app.js
   Integración con Shopify Storefront API
   ============================================================ */

// ─── CONFIGURACIÓN ────────────────────────────────────────────
const WHATSAPP_NUMBER = '5493757000000'; // ← Cambiá por tu número real

// Credenciales Shopify (se leen desde localStorage)
let SHOPIFY_DOMAIN = localStorage.getItem('mk_domain') || '';
let SHOPIFY_TOKEN  = localStorage.getItem('mk_token')  || '';

// ─── ESTADO GLOBAL ────────────────────────────────────────────
let allProducts    = [];   // Todos los productos cargados
let filteredProducts = []; // Productos filtrados actualmente
let cart           = [];   // Items en el carrito
let shopifyCartId  = null; // ID del carrito en Shopify
let currentFilter  = 'all';
let currentCursor  = null; // Para paginación
let hasNextPage    = false;
const PAGE_SIZE    = 12;

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

function detectCategory(product) {
  const tags = (product.tags || []).map(t => t.toLowerCase());
  const title = (product.title || '').toLowerCase();
  const vendor = (product.vendor || '').toLowerCase();

  if (tags.includes('agro') || title.includes('agro') || title.includes('campo') || title.includes('semilla') || title.includes('herramienta')) return 'agro';
  if (tags.includes('bazar') || title.includes('bazar') || title.includes('cocina') || title.includes('hogar')) return 'bazar';
  if (tags.includes('papeleria') || tags.includes('papelería') || title.includes('papel') || title.includes('lapiz') || title.includes('lápiz') || title.includes('cuaderno')) return 'papeleria';
  return 'bazar'; // default
}

// ─── SHOPIFY API ──────────────────────────────────────────────
async function shopifyFetch(query, variables = {}) {
  if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) {
    throw new Error('No hay credenciales de Shopify configuradas.');
  }

  const endpoint = `https://${SHOPIFY_DOMAIN}/api/2024-04/graphql.json`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'Error de API');
  }

  return json.data;
}

// ─── CARGAR PRODUCTOS ─────────────────────────────────────────
const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          description
          vendor
          tags
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
              }
            }
          }
        }
      }
    }
  }
`;

async function loadProducts(filter = 'all', cursor = null, append = false) {
  setLoadingState(true);

  let queryStr = '';
  if (filter !== 'all') {
    queryStr = `tag:${filter}`;
  }

  try {
    const data = await shopifyFetch(PRODUCTS_QUERY, {
      first: PAGE_SIZE,
      after: cursor,
      query: queryStr || null,
    });

    const edges = data.products.edges;
    const pageInfo = data.products.pageInfo;

    hasNextPage = pageInfo.hasNextPage;
    currentCursor = pageInfo.endCursor;

    const products = edges.map(({ node }) => ({
      id: node.id,
      variantId: node.variants.edges[0]?.node.id,
      title: node.title,
      description: node.description,
      vendor: node.vendor,
      tags: node.tags,
      price: parseFloat(node.priceRange.minVariantPrice.amount),
      comparePrice: parseFloat(node.compareAtPriceRange?.minVariantPrice?.amount || 0),
      currency: node.priceRange.minVariantPrice.currencyCode,
      image: node.images.edges[0]?.node.url || null,
      imageAlt: node.images.edges[0]?.node.altText || node.title,
      available: node.variants.edges[0]?.node.availableForSale ?? true,
      category: detectCategory(node),
    }));

    if (append) {
      allProducts = [...allProducts, ...products];
    } else {
      allProducts = products;
    }

    filteredProducts = applyLocalFilter(allProducts, currentFilter, searchInput.value);
    renderProducts(filteredProducts, append);

    // Paginación
    if (hasNextPage) {
      loadMoreRow.hidden = false;
    } else {
      loadMoreRow.hidden = true;
    }

    setStatus('connected', `✓ ${allProducts.length} productos cargados de Shopify`);

  } catch (err) {
    console.error('Error cargando productos:', err);
    setStatus('error', `⚠ Error al conectar con Shopify: ${err.message}`);

    if (!append) {
      renderDemoProducts();
    }
  } finally {
    setLoadingState(false);
  }
}

function applyLocalFilter(products, filter, search = '') {
  let result = products;

  if (filter !== 'all') {
    result = result.filter(p => p.category === filter || p.tags.map(t => t.toLowerCase()).includes(filter));
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  return result;
}

window.applyFilter = function(filter) {
  currentFilter = filter;
  currentCursor = null;

  filterPills.forEach(pill => {
    pill.classList.toggle('active', pill.dataset.filter === filter);
  });

  // Si hay credenciales y queremos filtrar por tag en Shopify directamente:
  if (SHOPIFY_DOMAIN && SHOPIFY_TOKEN) {
    allProducts = [];
    loadProducts(filter, null, false);
  } else {
    // Filtro local sobre demo
    filteredProducts = applyLocalFilter(allProducts, filter, searchInput.value);
    renderProducts(filteredProducts, false);
  }

  document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ─── RENDER PRODUCTOS ─────────────────────────────────────────
function renderProducts(products, append = false) {
  if (!append) {
    // Limpiamos el grid pero dejamos el loading state fuera
    const existing = productsGrid.querySelectorAll('.product-card');
    existing.forEach(el => el.remove());
  }

  if (products.length === 0 && !append) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

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
  setStatus('error', '⚠ Modo demo — conectá tu tienda Shopify con el botón ⚙️');
}

// ─── LOADING STATE ─────────────────────────────────────────────
function setLoadingState(loading) {
  loadingState.hidden = !loading;
}

function setStatus(state, message) {
  statusDot.className = 'status-dot ' + state;
  statusText.textContent = message;
}

// ─── CARRITO ──────────────────────────────────────────────────
const CREATE_CART_MUTATION = `
  mutation CreateCart($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        checkoutUrl
        cost {
          subtotalAmount { amount currencyCode }
        }
      }
      userErrors { field message }
    }
  }
`;

const ADD_TO_CART_MUTATION = `
  mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        cost {
          subtotalAmount { amount currencyCode }
        }
      }
      userErrors { field message }
    }
  }
`;

async function addToCart(productId, variantId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  // Si hay Shopify conectado, usamos la API
  if (SHOPIFY_DOMAIN && SHOPIFY_TOKEN && variantId && !variantId.startsWith('dv')) {
    try {
      if (!shopifyCartId) {
        // Crear carrito nuevo en Shopify
        const data = await shopifyFetch(CREATE_CART_MUTATION, {
          lines: [{ merchandiseId: variantId, quantity: 1 }],
        });
        const cartData = data.cartCreate.cart;
        shopifyCartId = cartData.id;
        localStorage.setItem('mk_cart_id', shopifyCartId);
        localStorage.setItem('mk_checkout_url', cartData.checkoutUrl);
      } else {
        // Agregar al carrito existente
        await shopifyFetch(ADD_TO_CART_MUTATION, {
          cartId: shopifyCartId,
          lines: [{ merchandiseId: variantId, quantity: 1 }],
        });
      }
    } catch (err) {
      console.warn('Error al sincronizar con Shopify cart:', err);
      // Continuamos con carrito local de todas formas
    }
  }

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
  const checkoutUrl = localStorage.getItem('mk_checkout_url');
  if (checkoutUrl) {
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
  } else {
    // Si no hay URL de Shopify, mandamos por WhatsApp
    handleWhatsAppOrder();
  }
}

function handleWhatsAppOrder() {
  if (!cart.length) return;

  let msg = '¡Hola Makena! Quiero hacer un pedido:\n\n';
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
  const query = searchInput.value.trim();
  filteredProducts = applyLocalFilter(allProducts, currentFilter, query);
  renderProducts(filteredProducts, false);

  if (query) {
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ─── CONFIG SHOPIFY ───────────────────────────────────────────
function openConfig() {
  inputDomain.value = SHOPIFY_DOMAIN;
  inputToken.value = SHOPIFY_TOKEN;
  configPanel.classList.add('active');
  configOverlay.classList.add('active');
}

function closeConfig() {
  configPanel.classList.remove('active');
  configOverlay.classList.remove('active');
}

function saveConfig() {
  const domain = inputDomain.value.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const token  = inputToken.value.trim();

  if (!domain || !token) {
    showToast('⚠ Completá el dominio y el token.');
    return;
  }

  SHOPIFY_DOMAIN = domain;
  SHOPIFY_TOKEN  = token;
  localStorage.setItem('mk_domain', domain);
  localStorage.setItem('mk_token', token);

  closeConfig();
  showToast('✓ Credenciales guardadas. Cargando productos...');

  allProducts = [];
  currentCursor = null;
  loadProducts('all', null, false);
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
  loadProducts(currentFilter, currentCursor, true);
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

  // Shopify cart ID previo
  shopifyCartId = localStorage.getItem('mk_cart_id') || null;

  // Rellenar inputs de config si hay credenciales guardadas
  inputDomain.value = SHOPIFY_DOMAIN;
  inputToken.value  = SHOPIFY_TOKEN;

  if (SHOPIFY_DOMAIN && SHOPIFY_TOKEN) {
    setStatus('', 'Conectando con Shopify...');
    await loadProducts('all', null, false);
    reconcileCart();
  } else {
    setStatus('error', 'Sin conexión — configurá Shopify con el botón ⚙️');
    renderDemoProducts();
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

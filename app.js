/* ============================================================
   MAKENA — app.js (VERSIÓN CORREGIDA)
   Tiendanube via Vercel Proxy
   ============================================================ */

// ─── CREDENCIALES ───────────────────────────────────────────
const TN_STORE_ID = '7599760';
const TN_BASE_URL = 'https://makenashop1.mitiendanube.com/';
const WHATSAPP_NUMBER = '5493757000000'; // No olvides verificar si este número sigue siendo el mismo

// ─── CONFIG ─────────────────────────────────────────────────
const PAGE_SIZE = 8;
const CATEGORY_EMOJIS = { agro: '🌾', bazar: '🏠', papeleria: '📎', default: '📦' };
const EMPTY_MESSAGES = {
  error: 'No pudimos cargar los productos. Intentá de nuevo más tarde.',
  comingSoon: '¡Próximamente! Los productos están en camino.',
  noResults: 'No encontramos productos con ese criterio.',
};

// ─── ASOCIACIONES SEMÁNTICAS — cargadas bajo demanda ────────
// Se inicializa vacío y se llena la primera vez que el usuario escribe.
// Así no bloquea el hilo principal en la carga inicial de la página.
let _searchAssoc = null;

function getSearchAssociations() {
  if (_searchAssoc) return _searchAssoc;
  _searchAssoc = {
    // — BAZAR / Cocina —
    olla:        ['cacerola','sarten','paila','menaje','cocina','hervir','acero','aluminio'],
    sarten:      ['olla','cacerola','plancha','antiadherente','cocina','freir'],
    cacerola:    ['olla','sarten','menaje','cocina','hervir'],
    cubierto:    ['tenedor','cuchara','cuchillo','vajilla','mesa','comer'],
    vajilla:     ['plato','cubierto','vaso','taza','mesa','servir'],
    plato:       ['vajilla','cubierto','mesa','cocina','comida'],
    vaso:        ['taza','jarra','termo','botella','beber'],
    taza:        ['vaso','jarra','cafe','te','desayuno'],
    jarra:       ['vaso','taza','botella','agua'],
    cocina:      ['olla','sarten','cubierto','plato','menaje','utensilio','vajilla','batidora','licuadora','pava','cafetera','tostadora'],
    menaje:      ['olla','sarten','vajilla','cocina','utensilios'],
    utensilio:   ['cocina','menaje','olla','sarten','cubierto'],
    termo:       ['mate','bombilla','botella','acero'],
    mate:        ['termo','bombilla','yerba','infusion'],
    bombilla:    ['mate','termo','yerba','acero'],
    botella:     ['termo','vaso','jarra','agua','hidratacion'],
    colador:     ['cocina','utensilio','menaje','escurrir','pasta'],
    tabla:       ['cocina','utensilio','picar','madera','plastico'],
    fuente:      ['horno','cocina','vajilla','bandeja'],
    escurridor:  ['cocina','vajilla','plato','secar'],
    tazon:       ['bol','ensalada','vajilla','desayuno'],
    bol:         ['tazon','ensalada','vajilla','mezclar'],
    // — BAZAR / Hogar —
    limpieza:    ['escoba','trapo','detergente','higiene','lavar','limpiar'],
    escoba:      ['limpieza','trapeador','higiene','barrer'],
    balde:       ['limpieza','trapo','higiene','agua'],
    cesto:       ['canasto','organizador','bano','basura'],
    canasto:     ['cesto','organizador','lavanderia','ropa'],
    percha:      ['ropa','placard','organizador','colgar'],
    toalla:      ['bano','higiene','tela','secar'],
    sabana:      ['cama','almohada','dormir'],
    almohada:    ['cama','sabana','descanso','dormir'],
    mantel:      ['mesa','cocina','comedor','proteccion'],
    repasador:   ['cocina','trapo','menaje','secar'],
    organizador: ['cajones','cesto','canasto','orden','guardar'],
    lampara:     ['luz','iluminacion','hogar','led'],
    velador:     ['lampara','luz','dormitorio'],
    adorno:      ['decoracion','hogar','figura','estetica'],
    espejo:      ['hogar','bano','decoracion','reflejo'],
    // — AGRO —
    semilla:     ['siembra','huerta','campo','cultivo','plantar'],
    plantin:     ['semilla','huerta','jardin','crecimiento'],
    fertilizante:['abono','nutricion','huerta','campo','nutrir'],
    abono:       ['fertilizante','compost','huerta','organico'],
    herbicida:   ['maleza','quimico','campo','eliminar'],
    fungicida:   ['hongo','tratamiento','planta','proteccion'],
    insecticida: ['plaga','quimico','campo','insectos'],
    veneno:      ['plaga','insecticida','raticida','control'],
    poda:        ['jardin','arbol','corte'],
    manguera:    ['riego','agua','jardin','regar'],
    riego:       ['manguera','aspersor','jardin','agua'],
    aspersor:    ['riego','manguera','agua'],
    pala:        ['herramienta','campo','tierra','excavar'],
    azada:       ['pala','herramienta','cultivo','remover'],
    rastrillo:   ['jardin','herramienta','campo','juntar'],
    fumigadora:  ['mochila','insecticida','aplicar'],
    jardin:      ['planta','flor','tierra','maceta','verde'],
    maceta:      ['planta','flor','jardin','tierra','decoracion'],
    tierra:      ['sustrato','maceta','huerta','jardin','suelo'],
    sustrato:    ['tierra','maceta','planta','nutrientes'],
    huerta:      ['semilla','plantin','cultivo','organico'],
    campo:       ['semilla','fertilizante','herramienta','rural'],
    gallinero:   ['aves','pollo','campo','granja'],
    alambrado:   ['campo','cerco','limite'],
    tranquera:   ['campo','alambrado','entrada'],
    bolsa:       ['acarreo','semilla','carga'],
    // — PAPELERÍA —
    cuaderno:    ['libreta','anotador','escolar','lapiz','birome','escribir'],
    libreta:     ['cuaderno','anotador','escolar','notas'],
    anotador:    ['cuaderno','libreta','nota','apuntar'],
    agenda:      ['calendario','planificador','organizar'],
    lapiz:       ['lapicera','birome','marcador','escolar','escribir'],
    lapicera:    ['lapiz','birome','boligrafo','escolar','tinta'],
    birome:      ['lapiz','lapicera','boligrafo','escolar','tinta'],
    boligrafo:   ['birome','lapicera','lapiz','tinta'],
    marcador:    ['resaltador','lapiz','escolar','color'],
    resaltador:  ['marcador','lapiz','escolar','subrayar'],
    fibra:       ['marcador','pintura','escolar','color'],
    carpeta:     ['archivo','escolar','folio','guardar'],
    archivo:     ['carpeta','folio','oficina','guardar'],
    folio:       ['carpeta','archivo','plastico'],
    resma:       ['hoja','papel','impresora','oficina','imprimir'],
    hoja:        ['resma','papel','cuaderno','escribir'],
    papel:       ['resma','hoja','impresora','imprimir'],
    escolar:     ['cuaderno','lapiz','papeleria','colegio'],
    oficina:     ['carpeta','archivo','lapicera','resma','trabajo'],
    sello:       ['tinta','oficina','marcar'],
    pegamento:   ['cola','manualidades','pegar'],
    cola:        ['pegamento','manualidades','adhesivo'],
    cinta:       ['scotch','adhesivo','pegar'],
    scotch:      ['cinta','adhesivo','pegar'],
    engrapadora: ['abrochadora','grampa','oficina','unir'],
    abrochadora: ['engrapadora','grampa','oficina','unir'],
    calculadora: ['matematica','oficina','escolar','numeros'],
    regla:       ['escolar','geometria','medir'],
    compas:      ['geometria','escolar','circulo'],
    cartuchera:  ['lapiz','escolar','estuche','guardar'],
    globo:       ['fiesta','decoracion','inflar','set'],
    vinilo:      ['adhesivo','decoracion','stickers'],
  };
  return _searchAssoc;
}

// ─── ESTADO ─────────────────────────────────────────────────
let allProducts = [];
let filteredProducts = [];
let lenis = null; // ✅ Variable global para control
let cart = [];
let currentFilter = 'all';
let currentCategoryId = null; // ✅ Declaramos la variable que faltaba
let currentPage = 1;
let hasNextPage = false;
let connectionState = 'idle';
let isLoading = false;  // ✅ PREVIENE BUCLE INFINITO

// ─── DOM ────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const productsGrid = $('productsGrid');
const loadingState = $('loadingState');
const emptyState = $('emptyState');
const loadMoreRow = $('loadMoreRow');
const loadMoreBtn = $('loadMoreBtn');
const cartBtn = $('cartBtn');
const cartBadge = $('cartBadge');
const cartDrawer = $('cartDrawer');
const cartCloseBtn = $('cartCloseBtn');
const cartBody = $('cartBody');
const cartEmpty = $('cartEmpty');
const cartFooter = $('cartFooterPanel');
const cartSubtotal = $('cartSubtotal');
const cartCountLabel = $('cartCountLabel');
const checkoutBtn = $('checkoutBtn');
const checkoutTNBtn = $('checkoutTNBtn');
const overlay = $('overlay');
const toast = $('toast');
const searchInput = $('searchInput');
const searchBtn = $('searchBtn');
const searchToggle = $('searchToggle');
const searchExpand = $('searchExpand');
const chips = document.querySelectorAll('.chip');
const catBtns = document.querySelectorAll('.btn-cat-link');
const hamburger = $('hamburger');
const navLinks = $('navLinks');
const navbar = $('navbar');
const hfcCards = document.querySelectorAll('.hfc');

// ─── UTILIDADES ─────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

function esc(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stripHtml(html = '') {
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

let _toastTimer;
function showToast(msg, duration = 2800) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// ─── NORMALIZAR TEXTO (quita acentos para comparar) ─────────
function norm(s = '') {
  if (!s) return '';
  return String(s)
    .normalize('NFD') // Descompone caracteres (á -> a + ´)
    .replace(/[\u0300-\u036f]/g, '') // Elimina los acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, ' ') // Quita símbolos
    .replace(/\s+/g, ' '); // Colapsa espacios múltiples
}

// ─── TIENDANUBE PROXY ───────────────────────────────────────
async function tnFetch(params = {}) {
  const url = new URL('/api/products', window.location.origin);
  url.searchParams.set('storeId', TN_STORE_ID);
  Object.entries(params).forEach(([k, v]) => {
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
// ─── CARGAR CATEGORÍAS (API) ────────────────────────────
async function loadCategories() {
  const categoriesGrid = $('categoriesGrid');
  if (!categoriesGrid) return;

  try {
    const url = new URL('/api/categories', window.location.origin);
    url.searchParams.set('storeId', TN_STORE_ID);

    console.log('[loadCategories] Cargando desde:', url.toString());

    const res = await fetch(url);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('[loadCategories] Error HTTP:', res.status, errorData);
      throw new Error(`HTTP ${res.status}`);
    }

    const categories = await res.json();

    if (!Array.isArray(categories) || categories.length === 0) {
      console.warn('[loadCategories] No hay categorías o respuesta inválida');
      categoriesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--ink-3);">Sin categorías disponibles</p>';
      return;
    }

    // Mapear iconos a categorías
    const categoryEmojis = {
      'agro': '🌾',
      'bazar': '🏠',
      'papeleria': '📎',
      'papelería': '📎',
      'hogar': '🏠',
      'jardin': '🌿',
      'oficina': '📎',
      'escolar': '📎'
    };

    // Contar productos por ID de categoría (más preciso)
    const categoryCount = {};
    if (allProducts && allProducts.length > 0) {
      allProducts.forEach(p => {
        p.categoryIdsList.forEach(id => {
          categoryCount[id] = (categoryCount[id] || 0) + 1;
        });
      });
    }

    // Renderizar categorías
    categoriesGrid.innerHTML = categories.map((cat, idx) => {
      const name = cat.name?.es || cat.name || 'Categoría';
      const normName = norm(name);
      
      // Buscar emoji
      let emoji = '📦';
      for (const [key, icon] of Object.entries(categoryEmojis)) {
        if (normName.includes(key)) {
          emoji = icon;
          break;
        }
      }

      // Contar productos usando el ID oficial de Tiendanube
      const count = categoryCount[String(cat.id)] || 0;

      return `
        <article class="category-pill fade-up" style="animation-delay: ${idx * 0.08}s;" tabindex="0" data-id="${cat.id}" data-name="${esc(name)}">
          <span class="category-pill-icon">${emoji}</span>
          <h3 class="category-pill-title">${esc(name)}</h3>
          ${count > 0 ? `<span class="category-pill-count">${count} productos</span>` : '<span class="category-pill-count">Ver más</span>'}
        </article>
      `;
    }).join('');

    // Agregar event listeners a las pastillas
    document.querySelectorAll('.category-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        applyFilter(pill.dataset.name, pill.dataset.id);
      });
    });

  } catch (err) {
    console.error('[loadCategories] Error:', err.message);
    categoriesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--ink-3);">Error al cargar categorías</p>';
  }
}

async function loadProducts(filter = 'all', page = 1, append = false) {
  // ✅ PREVENIR BUCLE INFINITO
  if (isLoading) {
    console.log('[loadProducts] Ya hay una carga en progreso, saltando...');
    return;
  }

  isLoading = true;
  setLoading(true);

  try {
    const isSearch = searchInput.value.trim().length > 0;
    const isFiltered = filter !== 'all';
    const params = {
      page,
      per_page: (isSearch || isFiltered) ? 80 : PAGE_SIZE
    };
    if (isSearch) params.q = searchInput.value.trim();

    console.log('[loadProducts] Cargando:', { filter, page, append, params });

    const { data, total } = await tnFetch(params);

    connectionState = 'connected';
    const totalCount = parseInt(total || 0);
    hasNextPage = (page * PAGE_SIZE) < totalCount;
    currentPage = page;

    const products = Array.isArray(data) ? data.map(p => {
      const v = (p.variants && p.variants.length > 0) ? p.variants[0] : {};

      return {
        id: String(p.id),
        variantId: v.id ? String(v.id) : '',
        title: p.name?.es || p.name?.[Object.keys(p.name || {})[0]] || 'Producto',
        description: stripHtml(p.description?.es || ''),
        price: parseFloat(v.promotional_price || v.price || 0),
        comparePrice: parseFloat(v.price || 0),
        image: p.images?.[0]?.src || null,
        imageAlt: p.name?.es || 'Imagen de producto',
        available: v.stock !== 0 && !!v.id,
        category: p.categories?.[0]?.name?.es || 'General',
        categoriesList: (p.categories || []).map(c => c.name?.es || c.name?.en || 'General'),
        categoryIdsList: (p.categories || []).map(c => String(c.id)),
        permalink: p.canonical_url || (typeof p.permalink === 'object' ? p.permalink?.es : p.permalink) || null,
        images: p.images || [],
        fullDescription: p.description?.es || '',
        allVariants: p.variants || [],
        tags: p.tags ? p.tags.split(',').map(t => t.trim()).filter(t => t !== '') : []
      };
    }) : [];

    // 🟢 Depuración: Verificamos qué nombres e IDs llegan de la API
    products.forEach(p => console.log(`[DEBUG] Producto: ${p.title} | IDs: ${p.categoryIdsList} | Nombres: ${p.categoriesList}`));

    allProducts = append ? [...allProducts, ...products] : products;
    filteredProducts = logicFilter(allProducts, currentFilter, searchInput.value, currentCategoryId);

    const toRender = append
      ? logicFilter(products, currentFilter, searchInput.value, currentCategoryId)
      : filteredProducts;

    if (!append && filter === 'all' && !searchInput.value.trim() && allProducts.length === 0) {
      renderProducts([], false, EMPTY_MESSAGES.comingSoon);
    } else {
      const hasQuery = searchInput.value.trim() || currentFilter !== 'all';
      renderProducts(toRender, append, EMPTY_MESSAGES.noResults, hasQuery);
    }

    loadMoreRow.hidden = !hasNextPage || allProducts.length === 0;

  } catch (err) {
    console.error('🔴 Error detallado de carga:', err.message);
    connectionState = 'error';
    hasNextPage = false;
    currentPage = 1;
    loadMoreRow.hidden = true;
    if (!append) renderProducts([], false, EMPTY_MESSAGES.error);
    else showToast('Error al cargar más productos.');
  } finally {
    isLoading = false;
    setLoading(false);
  }
}

function logicFilter(products, filter, search = '', filterId = null) {
  const list = Array.isArray(products) ? products : [];

  const query  = norm(search.trim());
  const words  = query ? query.split(/\s+/).filter(w => w.length > 1) : [];
  const doFilter = filter !== 'all';
  const doSearch = words.length > 0;

  // Sin filtros → devuelve todo directo
  if (!doFilter && !doSearch) return list;

  // Armar términos relacionados SOLO si hay búsqueda (carga lazy el diccionario)
  let relatedTerms = [];
  if (doSearch) {
    const assoc = getSearchAssociations();
    const termSet = new Set();
    words.forEach(w => {
      for (const key in assoc) {
        if (key === w || key.startsWith(w) || w.startsWith(key)) {
          assoc[key].forEach(t => termSet.add(t));
        }
      }
    });
    relatedTerms = Array.from(termSet);
  }

  // Un único recorrido: filtra por categoría Y calcula score al mismo tiempo
  const results = [];
  for (const p of list) {
    // Filtro de categoría
    if (doFilter) {
      // Prioridad 1: Si tenemos ID de categoría, comparamos por ID
      // Prioridad 2: Si no hay ID o falla, comparamos por nombre normalizado
      const matchById = filterId && p.categoryIdsList.includes(String(filterId));
      const matchByName = p.categoriesList.some(c => norm(c) === norm(filter));
      
      if (!matchById && !matchByName) continue;
    }

    // Sin búsqueda activa → incluir directamente
    if (!doSearch) { results.push(p); continue; }

    const title = norm(p.title || '');
    const desc  = norm(p.description || '');
    const ptags = norm((p.tags || []).join(' '));

    let score = 0;
    for (const w of words) {
      const re = new RegExp(`\\b${w}\\b`);
      if (re.test(title))       score += 20;
      else if (title.includes(w)) score += 10;
      if (title.startsWith(w))  score += 5;   // bonus inicio
      if (re.test(desc))        score += 6;
      else if (desc.includes(w)) score += 3;
      if (ptags.includes(w))    score += 8;
    }
    for (const rt of relatedTerms) {
      if (title.includes(rt)) score += 3;
      if (desc.includes(rt))  score += 1;
      if (ptags.includes(rt)) score += 2;
    }

    if (score > 0) results.push({ ...p, _score: score });
  }

  if (doSearch) results.sort((a, b) => b._score - a._score);
  return results;
}

window.applyFilter = function (filter, categoryId = null) {
  if (filter === 'all') categoryId = null;
  if (isLoading || (currentFilter === filter && currentCategoryId === categoryId)) return;

  currentFilter = filter;
  currentCategoryId = categoryId;
  currentPage = 1;
  if (chips) chips.forEach(c => c.classList.toggle('active', c.dataset.filter === filter));
  allProducts = [];
  loadProducts(currentFilter, 1, false);
  document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

function renderProducts(products, append = false, emptyMsg = EMPTY_MESSAGES.noResults, showReset = false) {
  if (!append) {
    productsGrid.querySelectorAll('.product-card, .skeleton-card').forEach(el => el.remove());
  }

  if (!products.length && !append) {
    emptyState.innerHTML = `${esc(emptyMsg)} ${showReset ? '<button onclick="applyFilter(\'all\');searchInput.value=\'\'" class="link-btn">Ver todos</button>' : ''}`;
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  products.forEach((p, i) => productsGrid.appendChild(buildCard(p, i)));
}

function buildCard(p, i = 0) {
  const el = document.createElement('article');
  el.className = 'product-card fade-up';
  el.style.animationDelay = `${(i % 8) * 0.055}s`;
  el.dataset.productId = p.id;

  // Buscar emoji por palabra clave en el nombre de la categoría
  let emoji = '📦';
  const catNorm = norm(p.category);
  if (catNorm.includes('agro')) emoji = '🌾';
  else if (catNorm.includes('bazar') || catNorm.includes('hogar')) emoji = '🏠';
  else if (catNorm.includes('papel') || catNorm.includes('libreria') || catNorm.includes('oficina')) emoji = '📎';

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
      <span class="product-tag">${esc(p.category)}</span>
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

function setLoading(on) {
  loadingState.hidden = true;
  loadingState.style.display = 'none';
  if (on) emptyState.hidden = true;
}

// ─── CARRITO ────────────────────────────────────────────────
function addToCart(productId) {
  const p = allProducts.find(x => x.id === productId);
  if (!p) return;
  if (!p.variantId) {
    showToast(`⚠️ No se puede agregar ${p.title} a Tiendanube.`);
    return;
  }

  const ex = cart.find(x => x.id === productId);
  ex ? ex.qty++ : cart.push({ ...p, qty: 1 });

  saveCart(); updateCartUI();
  showToast(`✓ ${p.title}`);
  flyToCart(productId);

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
  try { localStorage.setItem('mk_cart', JSON.stringify(cart.map(i => ({ id: i.id, qty: i.qty })))); } catch (e) { }
}

function loadCart() {
  try {
    cart = JSON.parse(localStorage.getItem('mk_cart') || '[]');
  } catch (e) {
    cart = [];
    try { localStorage.removeItem('mk_cart'); } catch (_) { }
  }
}

function reconcileCart() {
  cart = cart.reduce((acc, s) => {
    const p = allProducts.find(x => x.id === s.id);
    if (p) acc.push({ ...p, qty: s.qty });
    return acc;
  }, []);
  updateCartUI();
}

function updateCartUI() {
  const total = cart.reduce((a, i) => a + i.qty, 0);
  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);

  cartBadge.textContent = total;
  cartBadge.hidden = total === 0;
  cartSubtotal.textContent = fmt(subtotal);
  if (cartCountLabel) cartCountLabel.textContent = `${total} ${total === 1 ? 'item' : 'items'}`;

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
    const emoji = CATEGORY_EMOJIS[item.category] || '📦';
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

function openCart() { cartDrawer.classList.add('open'); overlay.classList.add('active'); document.body.style.overflow = 'hidden'; if (lenis) lenis.stop(); }
function closeCart() { cartDrawer.classList.remove('open'); overlay.classList.remove('active'); document.body.style.overflow = ''; if (lenis) lenis.start(); }

function sendWhatsApp() {
  if (!cart.length) return;
  let msg = '¡Hola Makena! Quiero hacer un pedido:\n\n';
  cart.forEach(i => msg += `• ${i.qty}x ${i.title} — ${fmt(i.price * i.qty)}\n`);
  const total = cart.reduce((a, i) => a + i.price * i.qty, 0);
  msg += `\n*Total productos:* ${fmt(total)}`;
  msg += '\n\n¿Me podés confirmar disponibilidad y coordinar el envío?';
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
}

function sendToTiendaNube() {
  if (!cart.length) return;
  const validItems = cart.filter(i => i.permalink);
  if (validItems.length === 1) {
    window.open(validItems[0].permalink, '_blank', 'noopener,noreferrer');
  } else {
    showToast('🛍️ Abriendo tu tienda para completar la compra…', 3000);
    setTimeout(() => window.open(TN_BASE_URL, '_blank', 'noopener,noreferrer'), 500);
  }
}

function doSearch() {
  const q = searchInput.value.trim();
  currentPage = 1;
  allProducts = [];
  loadProducts(currentFilter, 1, false);
  if (q) {
    const productsEl = document.getElementById('productos');
    if (productsEl) window.scrollTo({ top: productsEl.offsetTop - 100, behavior: 'smooth' });
  }
}

// ─── NAVBAR & UI ────────────────────────────────────────────
let _scrollTicking = false;
window.addEventListener('scroll', () => {
  if (_scrollTicking) return;
  _scrollTicking = true;
  requestAnimationFrame(() => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    const sections = ['inicio', 'categorias', 'productos', 'nosotros', 'contacto'];
    let current = 'inicio';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 120) current = id;
    });
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === '#' + current);
    });
    _scrollTicking = false;
  });
}, { passive: true });

searchToggle.addEventListener('click', () => {
  const open = searchExpand.classList.toggle('open');
  if (open) setTimeout(() => searchInput.focus(), 50);
});
// Cierre único para search-expand y search-results al hacer click fuera
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrapper')) {
    searchExpand.classList.remove('open');
    $('searchResults').classList.remove('open');
  }
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
  if (btn.dataset.action === 'inc') changeQty(id, 1);
  if (btn.dataset.action === 'dec') changeQty(id, -1);
});

productsGrid.addEventListener('click', e => {
  const btn = e.target.closest('.add-btn');
  if (btn) {
    if (btn.disabled) return;
    addToCart(btn.dataset.productId);
    return;
  }
  const wishBtn = e.target.closest('.wishlist-btn');
  if (wishBtn) {
    wishBtn.classList.toggle('active');
    e.stopPropagation();
    return;
  }
  if (e.target.closest('.buy-btn')) return;
  const card = e.target.closest('.product-card');
  if (card) openProductModal(card.dataset.productId);
});

const productModal = $('productModal');
const pmClose = $('pmClose');

function openProductModal(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;

  $('pmTag').textContent = ({ agro: 'Agro', bazar: 'Bazar', papeleria: 'Papelería' }[p.category] || 'Bazar');
  $('pmTitle').textContent = p.title;
  $('pmPrice').textContent = fmt(p.price);
  $('pmCompare').textContent = (p.comparePrice > p.price) ? fmt(p.comparePrice) : '';
  $('pmDescription').innerHTML = p.fullDescription || '<p>Sin descripción disponible.</p>';

  const mainImg = $('pmMainImg');
  const thumbs = $('pmThumbs');
  mainImg.src = p.image || '';

  thumbs.innerHTML = p.images.map((img, idx) => `
    <div class="pm-thumb ${idx === 0 ? 'active' : ''}" data-src="${esc(img.src)}">
      <img src="${esc(img.src)}" alt="Miniatura ${idx + 1}">
    </div>
  `).join('');

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

  $('pmAddToCart').onclick = () => { addToCart(p.id); closeProductModal(); };

  const btnBuyNow = $('pmBuyNow');
  const buyUrl = p.permalink || TN_BASE_URL;
  btnBuyNow.hidden = false;
  btnBuyNow.href = buyUrl;
  btnBuyNow.target = '_blank';
  btnBuyNow.rel = 'noopener noreferrer';
  btnBuyNow.onclick = null;

  $('pmWhatsApp').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola! Me interesa este producto: ' + p.title + '\n' + (p.permalink || ''))}`;

  renderRelatedProducts(p);

  productModal.classList.add('open');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  if (lenis) lenis.stop();
}

function closeProductModal() {
  productModal.classList.remove('open');
  if (!cartDrawer.classList.contains('open')) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }
}

pmClose.addEventListener('click', closeProductModal);

$('pmThumbs').addEventListener('click', e => {
  const thumb = e.target.closest('.pm-thumb');
  if (!thumb) return;
  document.querySelectorAll('.pm-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
  $('pmMainImg').src = thumb.dataset.src;
});

chips.forEach(c => {
  c.addEventListener('click', () => {
    const filter = c.dataset.filter;
    if (filter !== currentFilter) window.applyFilter(filter);
  });
});

catBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    if (filter !== currentFilter) window.applyFilter(filter);
  });
});

hfcCards.forEach(card => {
  const filter = card.classList.contains('hfc-agro') ? 'agro'
    : card.classList.contains('hfc-bazar') ? 'bazar'
      : card.classList.contains('hfc-papel') ? 'papeleria' : null;
  if (filter) card.addEventListener('click', () => { if (filter !== currentFilter) window.applyFilter(filter); });
});

searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => e.key === 'Enter' && doSearch());

let searchTimeout;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  const q = searchInput.value.trim().toLowerCase();
  const resContainer = $('searchResults');
  if (!q) {
    resContainer.classList.remove('open');
    if (!searchInput.value) doSearch();
    return;
  }
  searchTimeout = setTimeout(() => {
    const results = logicFilter(allProducts, currentFilter !== 'all' ? currentFilter : 'all', q, currentCategoryId).slice(0, 6);
    if (results.length > 0) {
      resContainer.innerHTML = results.map(p => `
        <div class="search-res-item" onclick="openProductModal('${p.id}'); $('searchResults').classList.remove('open');">
          <img src="${p.image || ''}" class="search-res-img" alt="">
          <div class="search-res-info">
            <p>${esc(p.title)}</p>
            <span>${fmt(p.price)}</span>
          </div>
        </div>
      `).join('');
      resContainer.classList.add('open');
    } else {
      resContainer.classList.remove('open');
    }
  }, 250);
});

loadMoreBtn.addEventListener('click', () => { if (!isLoading && hasNextPage) loadProducts(currentFilter, currentPage + 1, true); });

hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', open);
});
document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => {
  navLinks.classList.remove('open');
  hamburger.classList.remove('open');
}));

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCart(); closeProductModal(); searchExpand.classList.remove('open'); } });

function setupObserver() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('fade-up'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.cat-card, .contact-card, .mosaic-cell, .about-checks li, .stat-pill').forEach(el => obs.observe(el));
}

function initDraggableDeco() {
  const elements = document.querySelectorAll('.deco-el');
  if (!elements.length) return;

  // Un único estado compartido en lugar de listeners por elemento
  let activeEl   = null;
  let startX     = 0, startY = 0;
  let initialLeft = 0, initialTop = 0;

  function startDrag(e, el) {
    activeEl = el;
    el.classList.add('is-dragging');
    const rect       = el.getBoundingClientRect();
    const parentRect = el.offsetParent.getBoundingClientRect();
    initialLeft = rect.left - parentRect.left;
    initialTop  = rect.top  - parentRect.top;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startX = clientX; startY = clientY;
    el.style.left   = initialLeft + 'px';
    el.style.top    = initialTop  + 'px';
    el.style.right  = 'auto';
    el.style.bottom = 'auto';
    if (e.type === 'touchstart') e.preventDefault();
  }

  function doDrag(e) {
    if (!activeEl) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    activeEl.style.left = (initialLeft + clientX - startX) + 'px';
    activeEl.style.top  = (initialTop  + clientY - startY) + 'px';
    if (e.type === 'touchmove') e.preventDefault();
  }

  function endDrag() {
    if (!activeEl) return;
    activeEl.classList.remove('is-dragging');
    activeEl = null;
  }

  elements.forEach(el => {
    el.addEventListener('mousedown',  e => startDrag(e, el));
    el.addEventListener('touchstart', e => startDrag(e, el), { passive: false });
  });

  // Un único par de listeners en window para mover y soltar
  window.addEventListener('mousemove', doDrag);
  window.addEventListener('mouseup',   endDrag);
  window.addEventListener('touchmove', doDrag, { passive: false });
  window.addEventListener('touchend',  endDrag);
}

function initSmoothScroll() {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
  });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
}

async function init() {
  try {
    $('currentYear').textContent = new Date().getFullYear();
    loadCart(); updateCartUI(); setupObserver();
    initSmoothScroll(); initDraggableDeco(); initLeaves();
    const announceBar = $('announceBar');
    const announceClose = $('announceClose');
    if (announceClose && announceBar) announceClose.addEventListener('click', () => announceBar.classList.add('hidden'));
    const backTop = $('backTop');
    if (backTop) {
      window.addEventListener('scroll', () => backTop.classList.toggle('visible', window.scrollY > 400), { passive: true });
      backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
    showSkeletons(6);
    connectionState = 'connecting';
    await loadProducts('all', 1, false);
    await loadCategories(); // ✅ Cargar categorías después de productos
    if (connectionState === 'connected') reconcileCart();
  } catch (e) { console.error("Falla crítica en init:", e); }
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

(function () {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });
})();

function initLeaves() {
  const container = $('leafContainer');
  if (!container) return;
  const emojis = ['🍂', '🍁', '🍃', '🌿'];
  for (let i = 0; i < 15; i++) {
    const leaf = document.createElement('span');
    leaf.className = 'leaf';
    leaf.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    leaf.style.left = Math.random() * 100 + '%';
    leaf.style.animationDelay = Math.random() * 12 + 's';
    leaf.style.animationDuration = (8 + Math.random() * 8) + 's';
    leaf.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
    container.appendChild(leaf);
  }
}

function flyToCart(productId) {
  const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
  const img = card ? card.querySelector('.product-img') : null;
  const cartBtn = document.getElementById('cartBtn');
  if (!img || !cartBtn) return;
  const clone = img.cloneNode();
  const rect = img.getBoundingClientRect();
  const cartRect = cartBtn.getBoundingClientRect();
  clone.className = 'flying-item';
  clone.style.position = 'fixed';
  clone.style.left = rect.left + 'px';
  clone.style.top = rect.top + 'px';
  clone.style.width = rect.width + 'px';
  clone.style.height = rect.height + 'px';
  clone.style.zIndex = '9999';
  clone.style.transition = 'all 0.85s cubic-bezier(0.64, 0, 0.78, 0)';
  document.body.appendChild(clone);
  const deltaX = (cartRect.left + cartRect.width / 2) - (rect.left + rect.width / 2);
  const deltaY = (cartRect.top + cartRect.height / 2) - (rect.top + rect.height / 2);
  requestAnimationFrame(() => {
    clone.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.1) rotate(420deg)`;
    clone.style.opacity = '0';
  });
  clone.addEventListener('transitionend', () => clone.remove(), { once: true });
  setTimeout(() => { if (clone.parentNode) clone.remove(); }, 1000);
}

function fisherYates(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderRelatedProducts(currentProd) {
  const container = document.getElementById('pmRelatedGrid');
  if (!container) return;
  const related = fisherYates(
    allProducts.filter(p => p.category === currentProd.category && p.id !== currentProd.id)
  ).slice(0, 3);
  if (related.length === 0) { document.getElementById('pmRelated').hidden = true; return; }
  document.getElementById('pmRelated').hidden = false;
  container.innerHTML = related.map(p => `
    <div class="pm-rel-card" onclick="openProductModal('${p.id}')">
      <div class="pm-rel-img">
        <img src="${p.image || ''}" alt="${esc(p.title)}">
      </div>
      <p>${esc(p.title)}</p>
    </div>
  `).join('');
}

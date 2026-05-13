import { API_PAGE_SIZE, CATEGORY_MAPPING, EMPTY_MESSAGES, PAGE_SIZE } from './config.js';
import { fetchCategories, fetchProductsPage } from './api.js';
import { dom } from './dom.js';
import { getSearchAssociations } from './search-associations.js';
import { state } from './state.js';
import { esc, escapeRegExp, fmt, norm } from './utils.js';
import { hideLoadMoreNote, setLoading, showLoadMoreNote } from './ui.js';

function getCategoryClass(categoryName = '') {
  const category = norm(categoryName);

  if (category.includes('agro') || category.includes('campo') || category.includes('jardin')) return 'agro';
  if (category.includes('bazar') || category.includes('hogar') || category.includes('cocina')) return 'bazar';
  if (category.includes('papel') || category.includes('libreria') || category.includes('oficina')) return 'papeleria';
  if (category.includes('celeste')) return 'celeste';
  if (category.includes('lila')) return 'lila';
  if (category.includes('rosa') || category.includes('perfum') || category.includes('maquillaje')) return 'rosado';

  return '';
}

function getCategoryEmoji(categoryName = '') {
  const category = norm(categoryName);

  if (category.includes('agro') || category.includes('campo') || category.includes('huerta')) return '🌾';
  if (category.includes('bazar') || category.includes('hogar') || category.includes('cocina')) return '🏠';
  if (category.includes('papel') || category.includes('libreria') || category.includes('oficina')) return '📎';
  if (category.includes('perfume') || category.includes('maquillaje') || category.includes('belleza')) return '✨';
  if (category.includes('cotillon') || category.includes('fiesta')) return '🎉';
  if (category.includes('termo') || category.includes('mate')) return '☕';

  return '📦';
}

function buildCard(product, index = 0) {
  const element = document.createElement('article');
  const hasSale = product.comparePrice > product.price && product.price > 0;
  const discount = hasSale ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  const categoryClass = getCategoryClass(product.category);
  const emoji = getCategoryEmoji(product.category);
  const imageMarkup = product.image
    ? `<img class="product-img" src="${esc(product.image)}" alt="${esc(product.imageAlt)}" loading="lazy" decoding="async">`
    : `<div class="product-img-placeholder">${emoji}</div>`;
  const priceMarkup = hasSale
    ? `<div><span class="product-compare">${fmt(product.comparePrice)}</span> <span class="product-price">${fmt(product.price)}</span></div>`
    : `<span class="product-price">${product.price > 0 ? fmt(product.price) : 'Consultar'}</span>`;
  const addDisabled = !product.available || !product.defaultVariantId ? 'disabled title="Sin stock o sin variante para agregar"' : '';

  element.className = 'product-card fade-up';
  element.dataset.productId = product.id;
  element.style.animationDelay = `${(index % 8) * 0.055}s`;
  element.innerHTML = `
    <div class="product-img-wrap">
      ${imageMarkup}
      <span class="product-tag ${categoryClass}">${esc(CATEGORY_MAPPING[product.categoryIdsList[0]] || product.category)}</span>
      ${hasSale ? `<span class="badge-sale">${discount}% OFF</span>` : ''}
      <button type="button" class="wishlist-btn" aria-label="Favorito">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </button>
    </div>
    <div class="product-body">
      <p class="product-name">${esc(product.title)}</p>
      <p class="product-desc">${esc(product.description || '')}</p>
      <div class="product-foot">
        ${priceMarkup}
        <div class="product-actions">
          ${product.permalink ? `<a class="buy-btn" href="${esc(product.permalink)}" target="_blank" rel="noopener noreferrer" aria-label="Ver ${esc(product.title)}">Ver</a>` : ''}
          <button type="button" class="add-btn" data-product-id="${esc(product.id)}" data-variant-id="${esc(product.defaultVariantId || '')}" aria-label="Agregar ${esc(product.title)}" ${addDisabled}>+ Carrito</button>
        </div>
      </div>
    </div>
  `;

  return element;
}

function renderProducts(products, append = false, emptyMessage = EMPTY_MESSAGES.noResults, showReset = false) {
  if (!append) {
    dom.productsGrid.querySelectorAll('.product-card, .skeleton-card').forEach((node) => node.remove());
  }

  if (!products.length && !append) {
    dom.emptyState.innerHTML = `${esc(emptyMessage)} ${showReset ? '<button type="button" class="link-btn" data-reset-catalog>Ver todos</button>' : ''}`;
    dom.emptyState.hidden = false;
    return;
  }

  dom.emptyState.hidden = true;
  products.forEach((product, index) => {
    dom.productsGrid.appendChild(buildCard(product, index));
  });
}

export function logicFilter(products, filter, search = '', categoryId = null) {
  const list = Array.isArray(products) ? products : [];
  const query = norm(search.trim());
  const words = query ? query.split(/\s+/).filter((word) => word.length > 1) : [];
  const shouldFilter = filter !== 'all' || categoryId;
  const shouldSearch = words.length > 0;

  if (!shouldFilter && !shouldSearch) return list;

  let relatedTerms = [];
  if (shouldSearch) {
    const associations = getSearchAssociations();
    const termSet = new Set();

    words.forEach((word) => {
      Object.entries(associations).forEach(([key, values]) => {
        if (key === word || key.startsWith(word) || word.startsWith(key)) {
          values.forEach((value) => termSet.add(value));
        }
      });
    });

    relatedTerms = Array.from(termSet);
  }

  const results = [];

  for (const product of list) {
    if (shouldFilter) {
      let matchesCategory = false;

      if (categoryId) {
        const targetIds = Array.isArray(categoryId) ? categoryId.map(String) : [String(categoryId)];
        matchesCategory = product.categoryIdsList.some((id) => targetIds.includes(id));
      } else {
        matchesCategory = norm(product.category).includes(norm(filter))
          || product.categoriesList.some((category) => norm(category).includes(norm(filter)));
      }

      if (!matchesCategory) continue;
    }

    if (!shouldSearch) {
      results.push(product);
      continue;
    }

    const title = norm(product.title || '');
    const description = norm(product.description || '');
    const tags = norm((product.tags || []).join(' '));
    let score = 0;

    for (const word of words) {
      const matcher = new RegExp(`\\b${escapeRegExp(word)}\\b`);

      if (matcher.test(title)) score += 20;
      else if (title.includes(word)) score += 10;

      if (title.startsWith(word)) score += 5;
      if (matcher.test(description)) score += 6;
      else if (description.includes(word)) score += 3;
      if (tags.includes(word)) score += 8;
    }

    for (const relatedTerm of relatedTerms) {
      if (title.includes(relatedTerm)) score += 3;
      if (description.includes(relatedTerm)) score += 1;
      if (tags.includes(relatedTerm)) score += 2;
    }

    if (score > 0) {
      results.push({ ...product, _score: score });
    }
  }

  if (shouldSearch) {
    results.sort((a, b) => b._score - a._score);
  }

  return results;
}

export function refreshView() {
  const query = dom.searchInput?.value.trim() || '';
  const hasQuery = Boolean(query) || state.currentFilter !== 'all';
  const initialView = state.currentFilter === 'all' && !query;
  const productsToRender = state.filteredProducts.slice(0, state.visibleCount);

  if (initialView && !state.allProducts.length && !state.isLoading) {
    renderProducts([], false, EMPTY_MESSAGES.comingSoon);
  } else {
    renderProducts(productsToRender, false, EMPTY_MESSAGES.noResults, hasQuery);
  }

  dom.loadMoreRow.hidden = state.visibleCount >= state.filteredProducts.length && !state.hasNextPage;
}

function clearSearchResults() {
  dom.searchResults.classList.remove('open');
  dom.searchResults.innerHTML = '';
}

function renderSearchResults(products) {
  if (!products.length) {
    clearSearchResults();
    return;
  }

  dom.searchResults.innerHTML = products.map((product) => `
    <button type="button" class="search-res-item" data-product-id="${esc(product.id)}">
      <img src="${esc(product.image || '')}" class="search-res-img" alt="">
      <div class="search-res-info">
        <p>${esc(product.title)}</p>
        <span>${fmt(product.price)}</span>
      </div>
    </button>
  `).join('');

  dom.searchResults.classList.add('open');
}

function getCategoryRequestId(categoryId) {
  if (!categoryId) return null;

  if (Array.isArray(categoryId)) {
    return categoryId.map(String).find((id) => id !== '0') || null;
  }

  return String(categoryId) === '0' ? null : String(categoryId);
}

async function ensureCatalogData(filter = state.currentFilter, page = 1, append = false) {
  if (state.isLoading) return;

  state.isLoading = true;
  setLoading(true);

  try {
    if (!append) hideLoadMoreNote();

    const query = dom.searchInput?.value.trim() || '';
    const params = {
      page,
      per_page: API_PAGE_SIZE,
    };
    if (query) params.q = query;

    const categoryRequestId = getCategoryRequestId(state.currentCategoryId);
    if (categoryRequestId) {
      params.category = categoryRequestId;
    }

    const { products, total } = await fetchProductsPage(params);
    const totalCount = Number.parseInt(total || '', 10);
    const hasKnownTotal = Number.isFinite(totalCount) && totalCount > 0;

    state.connectionState = 'connected';
    state.currentPage = page;
    state.hasNextPage = hasKnownTotal ? (page * API_PAGE_SIZE) < totalCount : products.length === API_PAGE_SIZE;
    state.allProducts = append ? [...state.allProducts, ...products] : products;
    state.filteredProducts = logicFilter(state.allProducts, filter, query, state.currentCategoryId);

    if (append && state.filteredProducts.length > 0 && state.visibleCount >= state.filteredProducts.length && !state.hasNextPage) {
      showLoadMoreNote();
    } else {
      hideLoadMoreNote();
    }

    refreshView();
  } catch (error) {
    console.error('[makena] Error cargando productos:', error);
    state.connectionState = 'error';
    state.hasNextPage = false;
    state.currentPage = 1;
    dom.loadMoreRow.hidden = true;

    if (!append) {
      renderProducts([], false, EMPTY_MESSAGES.error);
    }
  } finally {
    state.isLoading = false;
    setLoading(false);
  }
}

export async function loadProducts(filter = state.currentFilter, page = 1, append = false) {
  return ensureCatalogData(filter, page, append);
}

export async function loadCategories() {
  if (!dom.categoriesGrid) return;

  try {
    const categories = await fetchCategories();

    if (state.allProducts.some((product) => product.categoryIdsList.includes('0'))) {
      categories.push({ id: '0', name: 'General', count: 0 });
    }

    categories.forEach((category) => {
      category.count = 0;
    });

    state.allProducts.forEach((product) => {
      categories.forEach((category) => {
        if (product.categoryIdsList.includes(category.id)) {
          category.count += 1;
        }
      });
    });

    state.categories = categories;

    dom.categoriesGrid.innerHTML = categories.map((category, index) => `
      <button
        type="button"
        class="category-pill fade-up"
        style="animation-delay: ${index * 0.08}s;"
        data-id="${esc(category.id)}"
        data-name="${esc(category.name)}"
      >
        <span class="category-pill-icon">${getCategoryEmoji(category.name)}</span>
        <span class="category-pill-title">${esc(category.name)}</span>
      </button>
    `).join('');
  } catch (error) {
    console.error('[makena] Error cargando categorías:', error);
    dom.categoriesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--ink-3);">Error al cargar categorías</p>';
  }
}

export function applyFilter(filter, categoryId = null, options = {}) {
  const normalizedCategoryId = filter === 'all' ? null : categoryId;
  const sameFilter = state.currentFilter === filter
    && JSON.stringify(state.currentCategoryId) === JSON.stringify(normalizedCategoryId);

  if (state.isLoading || sameFilter) return;

  state.currentFilter = filter;
  state.currentCategoryId = normalizedCategoryId;
  state.currentPage = 1;
  state.visibleCount = PAGE_SIZE;
  state.allProducts = [];

  ensureCatalogData(filter, 1, false);

  if (options.scroll !== false) {
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function runSearch(scroll = true) {
  state.currentPage = 1;
  state.visibleCount = PAGE_SIZE;
  state.allProducts = [];
  ensureCatalogData(state.currentFilter, 1, false);

  if (scroll) {
    const productsSection = document.getElementById('productos');
    if (productsSection) {
      window.scrollTo({ top: productsSection.offsetTop - 100, behavior: 'smooth' });
    }
  }
}

let searchTimeout = null;

function handleSearchInput() {
  clearTimeout(searchTimeout);

  const query = dom.searchInput.value.trim();

  if (!query) {
    clearSearchResults();
    if (!dom.searchInput.value) {
      runSearch(false);
    }
    return;
  }

  searchTimeout = window.setTimeout(() => {
    const results = logicFilter(
      state.allProducts,
      state.currentFilter !== 'all' ? state.currentFilter : 'all',
      query,
      state.currentCategoryId,
    ).slice(0, 6);

    renderSearchResults(results);
  }, 250);
}

export function bindCatalogEvents({ onProductSelect, onAddToCart }) {
  dom.categoriesGrid?.addEventListener('click', (event) => {
    const pill = event.target.closest('.category-pill[data-id][data-name]');
    if (!pill) return;

    applyFilter(pill.dataset.name, [pill.dataset.id]);
  });

  dom.emptyState?.addEventListener('click', (event) => {
    const resetButton = event.target.closest('[data-reset-catalog]');
    if (!resetButton) return;

    if (dom.searchInput) dom.searchInput.value = '';
    clearSearchResults();
    applyFilter('all', null);
  });

  dom.productsGrid?.addEventListener('click', (event) => {
    const addButton = event.target.closest('.add-btn[data-product-id]');
    if (addButton) {
      if (addButton.disabled) return;
      onAddToCart(addButton.dataset.productId, addButton.dataset.variantId || null);
      return;
    }

    const wishlistButton = event.target.closest('.wishlist-btn');
    if (wishlistButton) {
      wishlistButton.classList.toggle('active');
      event.stopPropagation();
      return;
    }

    if (event.target.closest('.buy-btn')) return;

    const card = event.target.closest('.product-card[data-product-id]');
    if (card) {
      onProductSelect(card.dataset.productId);
    }
  });

  dom.loadMoreBtn?.addEventListener('click', () => {
    if (state.isLoading) return;

    hideLoadMoreNote();
    state.visibleCount += PAGE_SIZE;

    if (state.visibleCount <= state.filteredProducts.length) {
      refreshView();
      if (state.filteredProducts.length > 0 && state.visibleCount >= state.filteredProducts.length && !state.hasNextPage) {
        showLoadMoreNote();
      }
      return;
    }

    if (state.hasNextPage) {
      ensureCatalogData(state.currentFilter, state.currentPage + 1, true);
      return;
    }

    state.visibleCount = state.filteredProducts.length;
    refreshView();
    if (state.filteredProducts.length > 0) {
      showLoadMoreNote();
    }
  });

  dom.searchToggle?.addEventListener('click', () => {
    const open = dom.searchExpand.classList.toggle('open');
    if (open) {
      window.setTimeout(() => dom.searchInput.focus(), 50);
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-wrapper')) {
      dom.searchExpand.classList.remove('open');
      clearSearchResults();
    }
  });

  dom.searchBtn?.addEventListener('click', () => runSearch(true));
  dom.searchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      runSearch(true);
    }
  });
  dom.searchInput?.addEventListener('input', handleSearchInput);

  dom.searchResults?.addEventListener('click', (event) => {
    const result = event.target.closest('.search-res-item[data-product-id]');
    if (!result) return;

    onProductSelect(result.dataset.productId);
    clearSearchResults();
  });
}

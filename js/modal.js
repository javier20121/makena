import { TN_BASE_URL, WHATSAPP_NUMBER } from './config.js';
import { addToCart } from './cart.js';
import { dom } from './dom.js';
import { getVariantLabel, resolveVariant } from './api.js';
import { state } from './state.js';
import { esc, fisherYates, fmt, sanitizeHtml } from './utils.js';

function getActiveProduct() {
  return state.allProducts.find((product) => product.id === state.activeModalProductId) || null;
}

function getRelatedProducts(product) {
  return fisherYates(
    state.allProducts.filter((entry) => entry.category === product.category && entry.id !== product.id),
  ).slice(0, 3);
}

function setMainImage(product, index) {
  const images = product.images;
  if (!images.length) {
    dom.pmMainImg.src = product.image || '';
    dom.pmMainImg.alt = product.imageAlt || 'Producto';
    dom.pmMainImg.dataset.currentImage = '0';
    return;
  }

  const safeIndex = Math.max(0, Math.min(index, images.length - 1));
  const image = images[safeIndex];

  dom.pmMainImg.src = image.src;
  dom.pmMainImg.alt = image.alt || product.imageAlt || product.title;
  dom.pmMainImg.dataset.currentImage = String(safeIndex);

  dom.pmThumbs.querySelectorAll('.pm-thumb').forEach((thumb) => {
    thumb.classList.toggle('active', thumb.dataset.index === String(safeIndex));
  });

  const counter = dom.pmThumbs.querySelector('.pm-image-counter');
  if (counter) {
    counter.textContent = `${safeIndex + 1} / ${images.length}`;
  }
}

function renderGallery(product) {
  const images = product.images;

  if (!images.length) {
    dom.pmThumbs.innerHTML = '';
    dom.pmMainImg.src = product.image || '';
    dom.pmMainImg.alt = product.imageAlt || 'Producto';
    dom.pmMainImg.dataset.currentImage = '0';
    return;
  }

  dom.pmThumbs.innerHTML = images.length > 1
    ? `
      <button type="button" class="pm-nav-btn pm-nav-prev" aria-label="Imagen anterior">❮</button>
      ${images.map((image, index) => `
        <button type="button" class="pm-thumb ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Ver imagen ${index + 1}">
          <img src="${esc(image.src)}" alt="Miniatura ${index + 1}" loading="lazy">
        </button>
      `).join('')}
      <button type="button" class="pm-nav-btn pm-nav-next" aria-label="Siguiente imagen">❯</button>
      <div class="pm-image-counter">1 / ${images.length}</div>
    `
    : '';

  setMainImage(product, 0);
}

function renderRelatedProducts(product) {
  const relatedProducts = getRelatedProducts(product);

  if (!relatedProducts.length) {
    dom.pmRelated.hidden = true;
    dom.pmRelatedGrid.innerHTML = '';
    return;
  }

  dom.pmRelated.hidden = false;
  dom.pmRelatedGrid.innerHTML = relatedProducts.map((relatedProduct) => `
    <button type="button" class="pm-rel-card" data-product-id="${esc(relatedProduct.id)}">
      <div class="pm-rel-img">
        <img src="${esc(relatedProduct.image || '')}" alt="${esc(relatedProduct.title)}" loading="lazy">
      </div>
      <p>${esc(relatedProduct.title)}</p>
    </button>
  `).join('');
}

function renderVariantOptions(product, selectedVariantId) {
  const variants = product.variants.filter((variant) => variant.id);

  if (variants.length <= 1) {
    dom.pmVariants.hidden = true;
    dom.pmVariants.innerHTML = '';
    return;
  }

  dom.pmVariants.hidden = false;
  dom.pmVariants.innerHTML = `
    <div class="pm-variant-group">
      <span class="pm-variant-label">Opciones disponibles:</span>
      <div class="pm-variant-options">
        ${variants.map((variant) => `
          <button
            type="button"
            class="variant-btn ${variant.id === selectedVariantId ? 'active' : ''}"
            data-variant-id="${esc(variant.id)}"
            ${variant.available ? '' : 'disabled'}
          >
            <span>${esc(getVariantLabel(variant))}</span>
            <small>${variant.available ? 'Disponible' : 'Sin stock'}</small>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function updateVariantContent(product, variant) {
  dom.pmPrice.textContent = fmt(variant?.price ?? product.price);
  dom.pmCompare.textContent = variant && variant.comparePrice > variant.price ? fmt(variant.comparePrice) : '';

  const addDisabled = !(variant?.available && variant.id);
  dom.pmAddToCart.disabled = addDisabled;
  dom.pmAddToCart.title = addDisabled ? 'Sin stock o sin variante para agregar' : '';

  const variantSuffix = variant && product.variants.filter((entry) => entry.id).length > 1
    ? ` (${getVariantLabel(variant)})`
    : '';
  const buyUrl = product.permalink || TN_BASE_URL;

  dom.pmBuyNow.hidden = !buyUrl;
  dom.pmBuyNow.href = buyUrl;
  dom.pmWhatsApp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`¡Hola! Me interesa este producto: ${product.title}${variantSuffix}\n${product.permalink || ''}`)}`;
}

function syncVariantSelection(variantId) {
  const product = getActiveProduct();
  if (!product) return;

  const variant = resolveVariant(product, variantId);
  if (!variant) return;

  state.activeVariantId = variant.id;
  renderVariantOptions(product, variant.id);
  updateVariantContent(product, variant);
}

export function openProductModal(productId) {
  const product = state.allProducts.find((entry) => String(entry.id) === String(productId));
  if (!product) return;

  const variant = resolveVariant(product, product.defaultVariantId);

  state.activeModalProductId = product.id;
  state.activeVariantId = variant?.id || '';

  dom.pmTitle.textContent = product.title;
  dom.pmDescription.innerHTML = sanitizeHtml(product.fullDescription) || '<p>Sin descripción disponible.</p>';

  renderGallery(product);
  renderVariantOptions(product, state.activeVariantId);
  renderRelatedProducts(product);
  updateVariantContent(product, variant);

  dom.productModal.classList.add('open');
  dom.overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  state.lenis?.stop();
}

export function closeProductModal() {
  dom.productModal.classList.remove('open');
  state.activeModalProductId = null;
  state.activeVariantId = null;

  if (!dom.cartDrawer.classList.contains('open')) {
    dom.overlay.classList.remove('active');
    document.body.style.overflow = '';
    state.lenis?.start();
  }
}

export function bindModalEvents() {
  dom.pmClose?.addEventListener('click', closeProductModal);

  dom.pmAddToCart?.addEventListener('click', () => {
    const product = getActiveProduct();
    if (!product) return;

    addToCart(product.id, state.activeVariantId || product.defaultVariantId);
    closeProductModal();
  });

  dom.productModal?.addEventListener('wheel', (event) => {
    event.stopPropagation();
  }, { passive: true });

  dom.productModal?.addEventListener('click', (event) => {
    const activeProduct = getActiveProduct();
    if (!activeProduct) return;

    const variantButton = event.target.closest('.variant-btn[data-variant-id]');
    if (variantButton) {
      syncVariantSelection(variantButton.dataset.variantId);
      return;
    }

    const thumb = event.target.closest('.pm-thumb[data-index]');
    if (thumb) {
      setMainImage(activeProduct, Number.parseInt(thumb.dataset.index || '0', 10));
      return;
    }

    if (event.target.closest('.pm-nav-prev')) {
      const currentIndex = Number.parseInt(dom.pmMainImg.dataset.currentImage || '0', 10);
      const nextIndex = currentIndex === 0 ? activeProduct.images.length - 1 : currentIndex - 1;
      setMainImage(activeProduct, nextIndex);
      return;
    }

    if (event.target.closest('.pm-nav-next')) {
      const currentIndex = Number.parseInt(dom.pmMainImg.dataset.currentImage || '0', 10);
      const nextIndex = (currentIndex + 1) % activeProduct.images.length;
      setMainImage(activeProduct, nextIndex);
      return;
    }

    const relatedCard = event.target.closest('.pm-rel-card[data-product-id]');
    if (relatedCard) {
      openProductModal(relatedCard.dataset.productId);
    }
  });
}

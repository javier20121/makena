import { TN_BASE_URL, WHATSAPP_NUMBER, getCategoryConfig } from './config.js';
import { dom } from './dom.js';
import { resolveVariant } from './api.js';
import { state } from './state.js';
import { esc, fmt } from './utils.js';
import { flyToCart, showToast } from './ui.js';

const CART_STORAGE_KEY = 'mk_cart';

function getCartLineId(productId, variantId = '') {
  return `${productId}::${variantId || 'default'}`;
}

function createCartItem(product, variant, quantity = 1) {
  return {
    lineId: getCartLineId(product.id, variant?.id),
    id: product.id,
    variantId: variant?.id || '',
    variantLabel: variant?.label || 'Única',
    title: product.title,
    image: product.image,
    category: product.category,
    price: variant?.price ?? product.price,
    comparePrice: variant?.comparePrice ?? product.comparePrice,
    permalink: product.permalink,
    qty: quantity,
  };
}

function isSingleVariantProduct(product) {
  return (product?.variants?.filter((variant) => variant.id).length || 0) <= 1;
}

export function saveCart() {
  try {
    const payload = state.cart.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      qty: item.qty,
    }));

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('[makena] No se pudo guardar el carrito.', error);
  }
}

export function loadCart() {
  try {
    const savedItems = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    state.cart = Array.isArray(savedItems)
      ? savedItems.map((item) => ({
        lineId: getCartLineId(item.id, item.variantId),
        id: item.id,
        variantId: item.variantId || '',
        variantLabel: '',
        title: '',
        image: null,
        category: 'General',
        price: 0,
        comparePrice: 0,
        permalink: null,
        qty: Number.parseInt(item.qty, 10) || 1,
      }))
      : [];
  } catch (error) {
    state.cart = [];
    localStorage.removeItem(CART_STORAGE_KEY);
  }
}

export function reconcileCart() {
  state.cart = state.cart.reduce((items, savedItem) => {
    const product = state.allProducts.find((entry) => entry.id === savedItem.id);
    if (!product) return items;

    const variant = resolveVariant(product, savedItem.variantId);
    if (!variant) return items;

    items.push(createCartItem(product, variant, savedItem.qty));
    return items;
  }, []);

  updateCartUI();
}

export function updateCartUI() {
  const totalProducts = state.cart.reduce((accumulator, item) => accumulator + item.qty, 0);
  const subtotal = state.cart.reduce((accumulator, item) => accumulator + item.price * item.qty, 0);

  if (dom.cartBadge) {
    dom.cartBadge.textContent = String(totalProducts);
    dom.cartBadge.hidden = totalProducts === 0;
  }

  if (dom.cartSubtotal) {
    dom.cartSubtotal.textContent = fmt(subtotal);
  }

  if (dom.cartCountLabel) {
    dom.cartCountLabel.textContent = `${totalProducts} ${totalProducts === 1 ? 'producto' : 'productos'}`;
  }

  if (!state.cart.length) {
    dom.cartEmpty.hidden = false;
    dom.cartFooter.hidden = true;
    dom.cartBody.innerHTML = '';
    dom.cartBody.appendChild(dom.cartEmpty);
    return;
  }

  dom.cartEmpty.hidden = true;
  dom.cartFooter.hidden = false;

  dom.cartBody.innerHTML = state.cart.map((item) => {
    const category = getCategoryConfig(item.category);
    const imageMarkup = item.image
      ? `<img class="ci-img" src="${esc(item.image)}" alt="${esc(item.title || 'Producto')}" loading="lazy">`
      : `<div class="ci-placeholder">${category.emoji}</div>`;
    const displayTitle = item.title || 'Producto guardado';
    const displayVariant = item.variantLabel || 'Sincronizando…';

    return `
      <div class="cart-item-row">
        ${imageMarkup}
        <div class="ci-info">
          <p class="ci-name">${esc(displayTitle)}</p>
          <p class="ci-variant">${esc(displayVariant)}</p>
          <p class="ci-price">${fmt(item.price * item.qty)}</p>
        </div>
        <div class="ci-controls">
          <button type="button" class="qty-btn" data-action="dec" data-id="${esc(item.lineId)}">−</button>
          <span class="qty-val">${item.qty}</span>
          <button type="button" class="qty-btn" data-action="inc" data-id="${esc(item.lineId)}">+</button>
        </div>
      </div>
    `;
  }).join('');
}

export function addToCart(productId, variantId = null) {
  const product = state.allProducts.find((entry) => entry.id === productId);
  if (!product) return;

  const variant = resolveVariant(product, variantId || product.defaultVariantId);
  if (!variant?.id || !variant.available) {
    showToast(`⚠️ ${product.title} no tiene una variante disponible para agregar.`);
    return;
  }

  const lineId = getCartLineId(product.id, variant.id);
  const existingItem = state.cart.find((item) => item.lineId === lineId);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    state.cart.push(createCartItem(product, variant));
  }

  saveCart();
  updateCartUI();

  const variantSuffix = isSingleVariantProduct(product) ? '' : ` (${variant.label})`;
  showToast(`✓ ${product.title}${variantSuffix}`);
  flyToCart(product.id);

  if (dom.cartBtn) {
    dom.cartBtn.classList.add('pop');
    window.setTimeout(() => dom.cartBtn.classList.remove('pop'), 320);
  }
}

export function changeQty(lineId, delta) {
  const item = state.cart.find((entry) => entry.lineId === lineId);
  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    state.cart = state.cart.filter((entry) => entry.lineId !== lineId);
  }

  saveCart();
  updateCartUI();
}

export function openCart() {
  dom.cartDrawer.classList.add('open');
  dom.overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  state.lenis?.stop();
}

export function closeCart() {
  dom.cartDrawer.classList.remove('open');

  if (!dom.productModal.classList.contains('open')) {
    dom.overlay.classList.remove('active');
    document.body.style.overflow = '';
    state.lenis?.start();
  }
}

export function sendWhatsApp() {
  if (!state.cart.length) return;

  let message = '¡Hola Makena! Quiero hacer un pedido:\n\n';

  state.cart.forEach((item) => {
    const variantSuffix = item.variantLabel && item.variantLabel !== 'Única' ? ` (${item.variantLabel})` : '';
    message += `• ${item.qty}x ${item.title}${variantSuffix} — ${fmt(item.price * item.qty)}\n`;
  });

  const total = state.cart.reduce((accumulator, item) => accumulator + item.price * item.qty, 0);
  message += `\n*Total productos:* ${fmt(total)}`;
  message += '\n\n¿Me podés confirmar disponibilidad y coordinar el envío?';

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}

export function sendToTiendaNube() {
  if (!state.cart.length) return;

  const validItems = state.cart.filter((item) => item.permalink);

  if (validItems.length === 1) {
    window.open(validItems[0].permalink, '_blank', 'noopener,noreferrer');
    return;
  }

  showToast('🛍️ Abriendo la tienda para completar la compra…', 3000);
  window.setTimeout(() => {
    window.open(TN_BASE_URL, '_blank', 'noopener,noreferrer');
  }, 500);
}

export function bindCartEvents() {
  dom.cartBtn?.addEventListener('click', openCart);
  dom.cartCloseBtn?.addEventListener('click', closeCart);
  dom.checkoutBtn?.addEventListener('click', sendWhatsApp);
  dom.checkoutTNBtn?.addEventListener('click', sendToTiendaNube);

  dom.cartBody?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const { action, id } = button.dataset;

    if (action === 'inc') changeQty(id, 1);
    if (action === 'dec') changeQty(id, -1);
  });
}

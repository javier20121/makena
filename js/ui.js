import { LOAD_MORE_END_MESSAGE } from './config.js';
import { dom } from './dom.js';

let toastTimer = null;

export function showToast(message, duration = 2800) {
  if (!dom.toast) return;

  dom.toast.textContent = message;
  dom.toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    dom.toast.classList.remove('show');
  }, duration);
}

export function hideLoadMoreNote() {
  if (!dom.loadMoreNote) return;

  dom.loadMoreNote.hidden = true;
  dom.loadMoreNote.textContent = '';
}

export function showLoadMoreNote(message = LOAD_MORE_END_MESSAGE) {
  if (!dom.loadMoreNote) {
    showToast(message);
    return;
  }

  dom.loadMoreNote.textContent = message;
  dom.loadMoreNote.hidden = false;
}

export function setLoading(isLoading) {
  if (!dom.loadingState) return;

  dom.loadingState.hidden = true;
  dom.loadingState.style.display = 'none';

  if (isLoading && dom.emptyState) {
    dom.emptyState.hidden = true;
  }
}

export function showSkeletons(count) {
  if (!dom.productsGrid) return;

  dom.productsGrid.querySelectorAll('.product-card, .skeleton-card').forEach((node) => node.remove());

  for (let index = 0; index < count; index += 1) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    skeleton.innerHTML = '<div class="skeleton-img"></div><div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-line price"></div></div>';
    dom.productsGrid.appendChild(skeleton);
  }
}

export function flyToCart(productId) {
  const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
  const image = card?.querySelector('.product-img');

  if (!image || !dom.cartBtn) return;

  const clone = image.cloneNode();
  const imageRect = image.getBoundingClientRect();
  const cartRect = dom.cartBtn.getBoundingClientRect();

  clone.className = 'flying-item';
  clone.style.position = 'fixed';
  clone.style.left = `${imageRect.left}px`;
  clone.style.top = `${imageRect.top}px`;
  clone.style.width = `${imageRect.width}px`;
  clone.style.height = `${imageRect.height}px`;
  clone.style.zIndex = '9999';
  clone.style.transition = 'all 0.85s cubic-bezier(0.64, 0, 0.78, 0)';

  document.body.appendChild(clone);

  const deltaX = (cartRect.left + cartRect.width / 2) - (imageRect.left + imageRect.width / 2);
  const deltaY = (cartRect.top + cartRect.height / 2) - (imageRect.top + imageRect.height / 2);

  requestAnimationFrame(() => {
    clone.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.1) rotate(420deg)`;
    clone.style.opacity = '0';
  });

  clone.addEventListener('transitionend', () => clone.remove(), { once: true });
  window.setTimeout(() => clone.remove(), 1000);
}

import { bindCartEvents, closeCart, loadCart, reconcileCart, updateCartUI, addToCart } from './cart.js';
import { bindCatalogEvents, loadCategories, loadProducts } from './catalog.js';
import { dom } from './dom.js';
import { initializeEffects } from './effects.js';
import { bindModalEvents, closeProductModal, openProductModal } from './modal.js';
import { state } from './state.js';
import { showSkeletons } from './ui.js';

async function init() {
  loadCart();
  updateCartUI();
  bindCartEvents();
  bindModalEvents();
  bindCatalogEvents({
    onProductSelect: openProductModal,
    onAddToCart: addToCart,
  });

  dom.overlay?.addEventListener('click', () => {
    closeCart();
    closeProductModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeCart();
      closeProductModal();
      dom.searchExpand?.classList.remove('open');
      dom.searchResults?.classList.remove('open');
    }
  });

  initializeEffects();
  showSkeletons(6);

  try {
    state.connectionState = 'connecting';
    await loadProducts('all', 1, false);
    await loadCategories();

    if (state.connectionState === 'connected') {
      reconcileCart();
    }
  } catch (error) {
    console.error('[makena] Falla crítica en la inicialización:', error);
  }
}

init();

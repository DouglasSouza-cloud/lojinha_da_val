const PLACEHOLDER_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="8.5" cy="10" r="1.6"/><path d="M3 16l5-4 4 3 4-5 5 6"/></svg>`;

const CATEGORIES = ['calcados', 'bolsas', 'intimas'];

function renderCard(product) {
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <div class="photo-slot">
      ${product.image_path
        ? `<img src="${product.image_path}" alt="${product.name}">`
        : `<div class="placeholder">${PLACEHOLDER_ICON}<p>Sem foto ainda</p></div>`}
    </div>
    <div class="card-info">
      <div class="name">${product.name}</div>
      <div class="price">${product.price}</div>
    </div>
  `;
  return div;
}

async function loadCategory(cat) {
  const grid = document.querySelector(`[data-grid="${cat}"]`);
  grid.innerHTML = '';
  try {
    const res = await fetch(`/api/products?category=${cat}`);
    const products = await res.json();
    if (!products.length) {
      grid.innerHTML = `<div class="empty-state">Nenhum produto cadastrado ainda nesta categoria.</div>`;
      return;
    }
    products.forEach(p => grid.appendChild(renderCard(p)));
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">Não foi possível carregar os produtos agora.</div>`;
    console.error(err);
  }
}

function setupTabs() {
  const tags = document.querySelectorAll('.tag');
  const panels = document.querySelectorAll('.panel');
  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      const cat = tag.dataset.cat;
      tags.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tag.classList.add('active');
      document.querySelector(`[data-panel="${cat}"]`).classList.add('active');
    });
  });
}

CATEGORIES.forEach(loadCategory);
setupTabs();

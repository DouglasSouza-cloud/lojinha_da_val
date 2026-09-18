let adminPassword = sessionStorage.getItem('adminPassword') || '';

const loginScreen = document.getElementById('login-screen');
const adminPanel = document.getElementById('admin-panel');
const loginMsg = document.getElementById('login-msg');
const formMsg = document.getElementById('form-msg');

function showMsg(el, text, type) {
  el.innerHTML = `<div class="msg ${type}">${text}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 4000);
}

// ---------- máscara de preço ----------
// Deixa só os números que a pessoa digitou e formata como moeda brasileira,
// tratando os 2 últimos dígitos como centavos. Ex: digitar "19000" vira "R$ 190,00".
// Também mantém o cursor no lugar certo, para dar pra editar no meio do número
// sem ele "pular" pro final a cada tecla.
function countDigits(str) {
  return (str.match(/\d/g) || []).length;
}

function formatPriceInput(inputEl) {
  const oldValue = inputEl.value;
  const caretPos = inputEl.selectionStart ?? oldValue.length;
  const digitsBeforeCaret = countDigits(oldValue.slice(0, caretPos));

  let digits = oldValue.replace(/\D/g, '');
  if (!digits) {
    inputEl.value = '';
    return;
  }
  digits = digits.replace(/^0+(?=\d)/, ''); // tira zeros à esquerda desnecessários
  while (digits.length < 3) digits = '0' + digits; // garante ao menos "0,00"

  const cents = digits.slice(-2);
  let reais = digits.slice(0, -2);
  reais = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // separador de milhar

  const newValue = `R$ ${reais},${cents}`;
  inputEl.value = newValue;

  // recoloca o cursor depois do mesmo tanto de dígitos que ele estava antes
  let pos = 0;
  let seen = 0;
  while (pos < newValue.length && seen < digitsBeforeCaret) {
    if (/\d/.test(newValue[pos])) seen++;
    pos++;
  }
  inputEl.setSelectionRange(pos, pos);
}

function attachPriceMask(inputEl) {
  inputEl.setAttribute('inputmode', 'numeric');
  inputEl.addEventListener('input', () => formatPriceInput(inputEl));
}

async function tryEnterPanel() {
  // valida a senha fazendo uma chamada de teste (criar um produto "fake" não é ideal,
  // então usamos uma checagem simples: tentamos apagar um id inexistente e olhamos o status)
  const res = await fetch('/api/products/0', {
    method: 'DELETE',
    headers: { 'x-admin-password': adminPassword },
  });
  if (res.status === 401) {
    showMsg(loginMsg, 'Senha incorreta.', 'error');
    return false;
  }
  sessionStorage.setItem('adminPassword', adminPassword);
  loginScreen.style.display = 'none';
  adminPanel.style.display = 'block';
  loadAdminList();
  return true;
}

document.getElementById('btn-login').addEventListener('click', () => {
  adminPassword = document.getElementById('admin-password').value;
  tryEnterPanel();
});

// se já tiver senha salva nesta aba/sessão, tenta entrar direto
if (adminPassword) tryEnterPanel();

attachPriceMask(document.getElementById('new-price'));

// ---------- adicionar produto ----------
document.getElementById('btn-add').addEventListener('click', async () => {
  const category = document.getElementById('new-category').value;
  const name = document.getElementById('new-name').value.trim();
  const price = document.getElementById('new-price').value.trim();
  const photoInput = document.getElementById('new-photo');

  if (!name || !price) {
    showMsg(formMsg, 'Preencha nome e preço.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('category', category);
  formData.append('name', name);
  formData.append('price', price);
  if (photoInput.files[0]) formData.append('photo', photoInput.files[0]);

  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'x-admin-password': adminPassword },
    body: formData,
  });

  if (res.ok) {
    showMsg(formMsg, 'Produto adicionado!', 'success');
    document.getElementById('new-name').value = '';
    document.getElementById('new-price').value = '';
    photoInput.value = '';
    loadAdminList();
  } else {
    const data = await res.json();
    showMsg(formMsg, data.erro || 'Erro ao adicionar.', 'error');
  }
});

// ---------- listar produtos no painel ----------
async function loadAdminList() {
  const list = document.getElementById('admin-list');
  list.innerHTML = 'Carregando...';
  const res = await fetch('/api/products');
  const products = await res.json();
  list.innerHTML = '';

  if (!products.length) {
    list.innerHTML = '<div class="empty-state">Nenhum produto cadastrado ainda.</div>';
    return;
  }

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="photo-slot">
        ${p.image_path ? `<img src="${p.image_path}" alt="${p.name}">` : `<div class="placeholder"><p>Sem foto</p></div>`}
      </div>
      <div class="card-info">
        <label style="font-size:0.7rem; opacity:0.6; display:block; margin-bottom:4px;">Nome</label>
        <input type="text" class="edit-name" value="${p.name}" data-id="${p.id}" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:4px; font-family:inherit; margin-bottom:10px;">
        <label style="font-size:0.7rem; opacity:0.6; display:block; margin-bottom:4px;">Preço</label>
        <input type="text" class="edit-price" value="${p.price}" data-id="${p.id}" style="width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:4px; font-family:inherit;">
        <div style="font-size:0.7rem; opacity:0.5; margin-top:8px;">${p.category}</div>
      </div>
      <div class="card-actions">
        <button class="btn" data-save="${p.id}">Salvar</button>
        <label class="btn" style="text-align:center; cursor:pointer;">
          Trocar foto
          <input type="file" accept="image/*" style="display:none;" data-swap="${p.id}">
        </label>
        <button class="btn btn-danger" data-delete="${p.id}">Apagar</button>
      </div>
    `;
    list.appendChild(card);
    attachPriceMask(card.querySelector('.edit-price'));
  });

  // salvar nome/preço editados
  list.querySelectorAll('[data-save]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.save;
      const card = btn.closest('.card');
      const name = card.querySelector('.edit-name').value.trim();
      const price = card.querySelector('.edit-price').value.trim();

      if (!name || !price) {
        showMsg(formMsg, 'Nome e preço não podem ficar vazios.', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('price', price);

      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'x-admin-password': adminPassword },
        body: formData,
      });

      if (res.ok) {
        showMsg(formMsg, 'Alterações salvas!', 'success');
        loadAdminList();
      } else {
        showMsg(formMsg, 'Erro ao salvar alterações.', 'error');
      }
    });
  });

  // trocar foto
  list.querySelectorAll('[data-swap]').forEach(input => {
    input.addEventListener('change', async (e) => {
      const id = input.dataset.swap;
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'x-admin-password': adminPassword },
        body: formData,
      });
      if (res.ok) loadAdminList();
      else showMsg(formMsg, 'Erro ao trocar foto.', 'error');
    });
  });

  // apagar produto
  list.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Apagar este produto?')) return;
      const id = btn.dataset.delete;
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': adminPassword },
      });
      if (res.ok) loadAdminList();
      else showMsg(formMsg, 'Erro ao apagar.', 'error');
    });
  });
}

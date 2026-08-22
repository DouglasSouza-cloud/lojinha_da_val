const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');

const router = express.Router();

// ---------- configuração do upload de imagens ----------
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB por foto
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Envie apenas arquivos de imagem.'));
    }
    cb(null, true);
  },
});

// ---------- proteção simples do painel admin ----------
// As rotas que criam/editam/apagam produtos pedem uma senha simples,
// enviada no cabeçalho "x-admin-password". Isso NÃO é uma segurança
// forte (é um projeto inicial) — para produção de verdade, o ideal é
// trocar por login com sessão/token.
function requireAdmin(req, res, next) {
  const senha = req.header('x-admin-password');
  if (senha !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ erro: 'Senha de administrador incorreta.' });
  }
  next();
}

// ---------- GET /api/products ----------
// Lista produtos. Aceita ?category=calcados|bolsas|intimas (opcional)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM products';
    const params = [];
    if (category) {
      sql += ' WHERE category = ?';
      params.push(category);
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar produtos.' });
  }
});

// ---------- POST /api/products ----------
// Cria um novo produto (com ou sem foto)
router.post('/', requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { category, name, price } = req.body;
    if (!category || !name || !price) {
      return res.status(400).json({ erro: 'Categoria, nome e preço são obrigatórios.' });
    }
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const [result] = await pool.query(
      'INSERT INTO products (category, name, price, image_path) VALUES (?, ?, ?, ?)',
      [category, name, price, imagePath]
    );
    res.status(201).json({ id: result.insertId, category, name, price, image_path: imagePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar produto.' });
  }
});

// ---------- PUT /api/products/:id ----------
// Edita nome, preço e/ou foto de um produto existente
router.put('/:id', requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;

    const [existingRows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ erro: 'Produto não encontrado.' });

    let imagePath = existing.image_path;
    if (req.file) {
      // apaga a foto antiga do disco, se existir, para não acumular lixo
      if (existing.image_path) {
        const oldFile = path.join(uploadDir, path.basename(existing.image_path));
        fs.unlink(oldFile, () => {});
      }
      imagePath = `/uploads/${req.file.filename}`;
    }

    await pool.query(
      'UPDATE products SET name = ?, price = ?, image_path = ? WHERE id = ?',
      [name || existing.name, price || existing.price, imagePath, id]
    );
    res.json({ id: Number(id), name: name || existing.name, price: price || existing.price, image_path: imagePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao editar produto.' });
  }
});

// ---------- DELETE /api/products/:id ----------
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    const produto = rows[0];
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

    if (produto.image_path) {
      const filePath = path.join(uploadDir, path.basename(produto.image_path));
      fs.unlink(filePath, () => {});
    }
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao apagar produto.' });
  }
});

module.exports = router;

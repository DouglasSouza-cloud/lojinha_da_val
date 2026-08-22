require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const productsRouter = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// serve as fotos enviadas (ex: /uploads/12345.jpg)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API
app.use('/api/products', productsRouter);

// serve o site (vitrine + painel admin)
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  console.log(`Loja Bela rodando em http://localhost:${PORT}`);
  console.log(`Painel admin em http://localhost:${PORT}/admin.html`);
});

// Conexão com o MySQL. Usa um "pool" (conjunto de conexões reaproveitadas)
// em vez de abrir uma conexão nova a cada consulta.
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

// Provedores como o Aiven exigem conexão criptografada (SSL). Se você
// informar o caminho do certificado da autoridade certificadora (CA) no
// .env, ele é usado para validar a conexão com segurança. Se não informar
// mas ainda assim precisar de SSL, DB_SSL=true liga uma criptografia básica
// (sem validar o certificado) — funciona, mas o ideal é sempre usar o CA.
let sslConfig = undefined;
if (process.env.DB_CA_CERT_PATH) {
  sslConfig = { ca: fs.readFileSync(process.env.DB_CA_CERT_PATH) };
} else if (process.env.DB_SSL === 'true') {
  sslConfig = { rejectUnauthorized: false };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loja_bela',
  waitForConnections: true,
  connectionLimit: 10,
  ssl: sslConfig,
});

module.exports = pool;

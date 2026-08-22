-- Rode este arquivo uma vez no seu MySQL para criar o banco e a tabela.
-- Exemplo (linha de comando): mysql -u root -p < schema.sql
--
-- USANDO UM PROVEDOR GERENCIADO (Aiven, PlanetScale, RDS etc.)?
-- Esses serviços já vêm com um banco padrão pronto (no Aiven é "defaultdb")
-- e muitas vezes não deixam criar bancos extras no plano gratuito. Nesse
-- caso, PULE as duas linhas abaixo (CREATE DATABASE / USE) e rode direto
-- o CREATE TABLE e os INSERT dentro do banco que o provedor já te deu.

CREATE DATABASE IF NOT EXISTS loja_bela CHARACTER SET utf8mb4;
USE loja_bela;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category ENUM('calcados', 'bolsas', 'intimas') NOT NULL,
  name VARCHAR(120) NOT NULL,
  price VARCHAR(30) NOT NULL,
  image_path VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alguns produtos de exemplo (pode apagar ou editar pelo painel admin depois)
INSERT INTO products (category, name, price) VALUES
  ('calcados', 'Scarpin Clássico', 'R$ 189,90'),
  ('calcados', 'Sandália Salto Fino', 'R$ 149,90'),
  ('bolsas', 'Bolsa Tote Estruturada', 'R$ 229,00'),
  ('bolsas', 'Crossbody Mini', 'R$ 159,90'),
  ('intimas', 'Conjunto Renda', 'R$ 129,90'),
  ('intimas', 'Sutiã Sem Costura', 'R$ 69,90');

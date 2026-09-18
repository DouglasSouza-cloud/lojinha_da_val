-- Rode isto no SEU banco atual (o novo serviço Aiven que você já está usando),
-- pela extensão MySQL do VS Code ou outro cliente. Só precisa rodar uma vez.
-- Ele adiciona a coluna nova necessária para o Cloudinary funcionar, sem apagar
-- nenhum produto que você já cadastrou.

ALTER TABLE products ADD COLUMN image_public_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE products MODIFY COLUMN image_path VARCHAR(500) DEFAULT NULL;

# Ateliê Bela — loja com painel admin

Sistema simples com:
- **Vitrine** (`public/index.html`) — o que os clientes veem, com abas de Calçados / Bolsas / Íntimas.
- **Painel admin** (`public/admin.html`) — onde você adiciona produtos, sobe fotos, edita e apaga.
- **Backend em Node.js/Express** — recebe as requisições e fala com o banco.
- **Banco de dados MySQL** — guarda os produtos e o caminho das fotos de verdade, para sempre.

## 1. Pré-requisitos

- [Node.js](https://nodejs.org) instalado (versão 18 ou mais recente).
- MySQL instalado e rodando na sua máquina (ou acesso a um MySQL na nuvem).
- VS Code (ou outro editor).

## 2. Configurar o banco de dados

### Opção A — MySQL local
Abra um terminal na pasta do projeto e rode o arquivo `schema.sql` para criar o banco e a tabela:

```bash
mysql -u root -p < schema.sql
```

Isso cria o banco `loja_bela`, a tabela `products` e já insere alguns produtos de exemplo.

### Opção B — usando o Aiven (seu caso)
O Aiven já cria um serviço MySQL com um banco padrão chamado `defaultdb` — você normalmente **não precisa** rodar a linha `CREATE DATABASE` do `schema.sql`. Em vez disso:

1. No painel do Aiven, abra seu serviço MySQL e vá na aba **Overview**. Anote: **Host**, **Port**, **User** (geralmente `avnadmin`), **Password** e **Database name** (geralmente `defaultdb`).
2. Ainda na aba Overview, baixe o **certificado CA** (botão "CA Certificate" ou similar) e salve o arquivo como `ca.pem` dentro da pasta do projeto. O Aiven exige conexão criptografada (SSL), e esse certificado é o que garante uma conexão segura.
3. Conecte no seu banco (com o cliente `mysql`, o **Aiven Console**, ou uma ferramenta como TablePlus/DBeaver) e rode apenas a parte de criação da tabela do `schema.sql` — ou seja, pule a linha `CREATE DATABASE` e `USE loja_bela`, e rode direto o `CREATE TABLE` e os `INSERT` dentro do banco `defaultdb`.

## 3. Configurar as variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Abra o `.env` e preencha com os dados do passo anterior:
- **MySQL local:** `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- **Aiven:** `DB_HOST`, `DB_PORT` (não é o 3306 padrão — o Aiven usa uma porta própria), `DB_USER`, `DB_PASSWORD`, `DB_NAME=defaultdb`, e `DB_CA_CERT_PATH=./ca.pem` apontando para o certificado que você baixou.

De qualquer forma, escolha também uma `ADMIN_PASSWORD` (é a senha que você vai usar para entrar no painel admin).

## 4. Instalar as dependências e rodar

Na pasta do projeto, no terminal do VS Code:

```bash
npm install
npm start
```

Se tudo der certo, o terminal vai mostrar:

```
Loja Bela rodando em http://localhost:3000
Painel admin em http://localhost:3000/admin.html
```

Abra esses endereços no navegador. Use `npm run dev` no lugar de `npm start` durante o desenvolvimento — ele reinicia o servidor sozinho a cada alteração no código.

## 5. Usando o painel admin

1. Acesse `http://localhost:3000/admin.html`.
2. Digite a senha que você definiu em `ADMIN_PASSWORD` no `.env`.
3. Preencha categoria, nome, preço e escolha uma foto — clique em **Adicionar produto**.
4. A foto fica salva de verdade na pasta `server/uploads/`, e o produto no banco MySQL. Ao atualizar a página, tudo continua lá.
5. Na lista de produtos cadastrados, você pode **trocar a foto** ou **apagar** qualquer item.

## 6. Colocando no ar (deploy)

Isso já é um servidor de verdade, então precisa de uma hospedagem que rode Node.js (não serve hospedagem só de arquivos estáticos, tipo Netlify puro). Opções simples:

- **Railway** ou **Render** — sobem o código e já oferecem um banco MySQL como complemento.
- **Um VPS** (DigitalOcean, Hostinger, AWS EC2) — mais controle, você mesma instala Node e MySQL.

Em qualquer uma delas, você vai configurar as mesmas variáveis do `.env` direto no painel do provedor (nunca subindo o `.env` real para o GitHub).

## Observações importantes

- A proteção do painel admin aqui é simples (uma senha única). Funciona bem para uso pessoal, mas se a loja crescer e mais pessoas forem mexer no painel, vale evoluir para um login de verdade (usuário + senha por pessoa).
- Faça backups do banco de dados e da pasta `server/uploads/` periodicamente — é lá que ficam suas fotos e produtos.

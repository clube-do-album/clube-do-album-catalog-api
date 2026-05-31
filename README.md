# Clube do Album Catalog API

API responsavel pelo catalogo musical da plataforma Clube do Album.

## Responsabilidade

- Catalogo de albuns.
- Artistas e faixas.
- Busca de albuns na Spotify API.
- Importacao de albuns da Spotify API para o banco local.
- Persistencia inicial de artistas e faixas.

RabbitMQ e publicacao de eventos ainda nao foram implementados nesta etapa.

## Tecnologias usadas

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- Spotify Web API

## Variaveis de ambiente

Crie um arquivo local a partir do exemplo:

```bash
cp .env.example .env
```

Variaveis esperadas:

```env
PORT=3001

DATABASE_URL=postgresql://clube:clube@localhost:5432/clube_do_album
RABBITMQ_URL=amqp://clube:clube@localhost:5672

SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

## Credenciais Spotify

Crie uma aplicacao no Spotify Developer Dashboard e preencha no `.env`:

```env
SPOTIFY_CLIENT_ID=seu-client-id
SPOTIFY_CLIENT_SECRET=seu-client-secret
```

A API usa o fluxo Client Credentials e mantem o access token em memoria ate perto do vencimento.

## Instalar dependencias

```bash
npm install
```

## Migrations

Com o PostgreSQL da infraestrutura local rodando, execute:

```bash
npx prisma migrate dev
```

Para gerar o Prisma Client manualmente:

```bash
npx prisma generate
```

## Como rodar localmente

```bash
npm run dev
```

Build TypeScript:

```bash
npm run build
```

## Endpoints disponiveis

```http
GET /health
```

```http
GET /albums
```

```http
GET /albums/search?query=abbey road
```

Busca albuns na Spotify API. Nao salva dados no banco.

```http
GET /albums/:id
```

Retorna os detalhes completos de um album salvo no banco local, incluindo artistas e faixas.

```http
POST /albums/import
```

Importa um album da Spotify API para o banco local.

Body:

```json
{
  "spotifyId": "abc123"
}
```

Body com solicitante opcional:

```json
{
  "spotifyId": "abc123",
  "requestedBy": "user-id-opcional"
}
```

Se o album ja existir no banco, a API retorna o registro existente sem duplicar a importacao.

## Docker

Crie um arquivo local de ambiente a partir do exemplo:

```bash
cp .env.example .env
```

Build da imagem:

```bash
docker build -t clube-do-album-catalog-api .
```

Execucao local:

```bash
docker run --env-file .env -p 3001:3001 clube-do-album-catalog-api
```

## Status atual

Base de catalogo criada com Prisma, PostgreSQL, health check, listagem local de albuns, busca na Spotify API, importacao inicial de albuns, artistas e faixas. Mensageria com RabbitMQ ainda sera implementada em etapa futura.

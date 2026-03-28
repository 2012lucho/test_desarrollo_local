# Backend base

Stack: NodeJS + Express + Knex + MariaDB

## Uso rápido

1. Instalar dependencias:
   ```bash
   cd backend
   npm install
   ```
2. Copiar `.env.dev` a `.env` o usar `.env.dev` directamente.
3. Ejecutar API:
   ```bash
   npm run dev
   ```

## Rutas iniciales

- GET `/` -> status base
- GET `/api/health` -> status salud

## Configuración

Variables en `.env.dev`:
- PUERTO
- DB_NAME
- DB_USER
- DB_PASS
- DB_PORT

Se debe crear nuevo proyecto base siguiendo las especificaciones indicadas en archivos: 
- [text](backend_descripcion_gral.md) 
- [text](frontend_descripcion_gral.md)

## Estado

- Backend base generado en `backend/`:
  - NodeJS + Express + Knex + MariaDB
  - `.env.example`
  - `src/index.js`, `src/app.js`, `src/routes/index.js`, `src/knexfile.js`, `src/db.js`
  - Socket.IO: emite `welcome` al conectar, `keepalive` cada 5 s, recibe `pong` del cliente
- Frontend base generado en `frontend/`:
  - HTML5 + VueJS + Bootstrap 5.3
  - `.env.example`, `index.html`, `main.js`
  - Socket.IO-client: escucha `welcome` y `keepalive`, responde `pong`, permite envío manual de `ping`

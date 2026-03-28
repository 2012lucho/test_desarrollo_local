# Frontend base

Stack: HTML5 + VueJS + Bootstrap 5.3 + Vite (sin TypeScript)

## Uso

1. Instalar dependencias:
   ```bash
   cd frontend
   npm install
   ```
2. Ejecutar en modo desarrollo:
   ```bash
   npm run dev
   ```
3. Abrir la URL que indica Vite (`http://localhost:5173`)
4. El botón "Comprobar API" hace GET `/api/health` contra `URL_API` (por defecto `http://localhost:3000`).

## Configuración

Variable en `.env.dev`:
- URL_API

## Scripts disponibles

- `npm run dev`: servidor Vite local
- `npm run build`: construcción de producción
- `npm run preview`: vista previa de producción

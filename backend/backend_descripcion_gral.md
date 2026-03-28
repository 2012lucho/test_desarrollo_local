# Lenguaje a utilizar
- NodeJS

# Framework
- Express
- Socket.IO para comunicación WebSocket con frontend

# Acceso a base de datos
- Uso de Knex para conexion a base de datos mariadb local

# configuraciones
- En archivos .env se debe crear archivo .env.dev para mantener a modo de ejemplo

Las configuraciones del .env deben ser por el momento:
- PUERTO: numero de puerto de la API
- DB_NAME: nombre de la base de datos
- DB_USER: usuario de la base de datos
- DB_PASS: contraseña de la base de datos
- DB_PORT: puerto de la base de datos
- CORS_ORIGINS: orígenes permitidos para CORS, ej. http://localhost:5173,http://localhost:5174

# WebSocket
- Se usa Socket.IO sobre el servidor Express en `src/index.js`.
- Emite cada 5 segundos un evento `keepalive` (código de ejemplo implementado). 
- Recibe `pong` del frontend para verificar ida y vuelta.

# Directrices de diseño que siempre se debe tener en cuenta
- Seguir las intrucciones proporcionadas, no hacer ni mas ni de menos
- Se prohibe usar fallback salvo que se indique lo contrario
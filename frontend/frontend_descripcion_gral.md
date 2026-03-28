# Lenguaje a utilizar
- HMLT5

# Framework
- VueJS (última versión)
- Vite
- Bootstrap 5.3
- Socket.IO-client para comunicación WebSocket con backend

# configuraciones
- En archivos .env se debe crear archivo .env.dev para mantener a modo de ejemplo

Las configuraciones del .env deben ser por el momento:
- VITE_API_URL: configurada inicialmente para API LOCAL

# WebSocket
- Comunicación con backend usando `socket.io-client`.
- La app escucha eventos `welcome` y `keepalive` del servidor.
- Responde con `pong` en cada `keepalive` entrante y permite envío manual `ping`.

# Directrices de diseño que siempre se debe tener en cuenta
- Seguir las intrucciones proporcionadas, no hacer ni mas ni de menos
- Se prohibe usar fallback salvo que se indique lo contrario
- TypeScript esta super megaprohibido
- No se deben instalar librerias nuevas salvo las que se definan expresamente
- En la medida de lo posible siempre se deben usar funciones vanilla
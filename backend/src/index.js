const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config({ path: '.env' });
// Si .env no existe, usar .env.dev como ejemplo
dotenv.config({ path: '.env.dev' });

const app = require('./app');
const port = process.env.PUERTO || 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`);

  socket.emit('welcome', {
    status: 'connected',
    socketId: socket.id,
    time: new Date().toISOString(),
  });

  const keepAliveInterval = setInterval(() => {
    socket.emit('keepalive', {
      type: 'keepalive',
      time: new Date().toISOString(),
      message: 'keepalive desde backend',
    });
  }, 5000);

  socket.on('pong', (payload) => {
    console.log('pong recibido desde cliente:', payload);
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket desconectado: ${socket.id} motivo: ${reason}`);
    clearInterval(keepAliveInterval);
  });
});

server.listen(port, () => {
  console.log(`API backend ejecutándose en http://localhost:${port}`);
  console.log(`Socket.IO escuchando en http://localhost:${port}`);
});

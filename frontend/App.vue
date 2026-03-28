<template>
  <div class="container py-5">
    <h1 class="mb-4">Frontend base con WebSocket</h1>

    <div v-if="apiStatus === 'ok'" class="alert alert-success" role="alert">Conexión API REST OK</div>
    <div v-else-if="apiStatus === 'error'" class="alert alert-danger" role="alert">API REST no disponible</div>
    <div v-else class="alert alert-secondary" role="alert">Presiona el botón para chequear la API</div>

    <button class="btn btn-primary me-2" @click="checkApi">Comprobar API</button>
    <button class="btn btn-secondary" @click="emitPing">Enviar PING</button>

    <p class="mt-3">URL API: <code>{{ apiUrl }}</code></p>
    <p>WebSocket estado: <strong>{{ socketStatus }}</strong></p>
    <p>Último keepalive recibido: <strong>{{ lastKeepAlive }}</strong></p>

    <div v-if="lastMessages.length" class="mt-4">
      <h5>Mensajes del socket</h5>
      <ul class="list-group">
        <li v-for="(msg, index) in lastMessages" :key="index" class="list-group-item">
          {{ msg }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { io } from 'socket.io-client';

const apiUrl = import.meta.env.VITE_API_URL;

export default {
  setup() {
    const apiStatus = ref('unknown');
    const socketStatus = ref('desconectado');
    const lastKeepAlive = ref('sin datos');
    const lastMessages = ref([]);

    const socket = io(apiUrl, {
      transports: ['websocket'],
      autoConnect: true,
      timeout: 10000,
    });
    console.log('Intentando conectar a WebSocket en:', apiUrl);

    const addMessage = (text) => {
      lastMessages.value.unshift(`${new Date().toLocaleTimeString()} - ${text}`);
      if (lastMessages.value.length > 10) {
        lastMessages.value.pop();
      }
    };

    const setSocketStatus = (statusText) => {
      socketStatus.value = statusText;
      addMessage(statusText);
    };

    socket.on('connect', () => {
      setSocketStatus(`conectado (${socket.id})`);
    });

    socket.on('connect_error', (error) => {
      setSocketStatus(`error de conexión: ${error.message || error}`);
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      setSocketStatus(`reconectando (intento ${attempt})`);
    });

    socket.on('disconnect', (reason) => {
      socketStatus.value = `desconectado (${reason})`;
      addMessage(`Socket desconectado: ${reason}`);
    });

    socket.on('welcome', (payload) => {
      addMessage(`welcome - ${JSON.stringify(payload)}`);
    });

    socket.on('keepalive', (payload) => {
      lastKeepAlive.value = `${payload.time} - ${payload.message}`;
      addMessage(`keepalive - ${JSON.stringify(payload)}`);
      socket.emit('pong', { time: new Date().toISOString(), note: 'pong desde frontend' });
    });

    const checkApi = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/health`);
        apiStatus.value = response.ok ? 'ok' : 'error';
      } catch {
        apiStatus.value = 'error';
      }
    };

    const emitPing = () => {
      if (socket && socket.connected) {
        socket.emit('ping', { time: new Date().toISOString(), note: 'ping manual' });
        addMessage('ping emitido');
      } else {
        addMessage('No hay conexión socket activa');
      }
    };

    onMounted(() => {
      // Forzar conexión inicial
      if (socket.connected) {
        socketStatus.value = `conectado (${socket.id})`;
      }
    });

    onBeforeUnmount(() => {
      socket.disconnect();
    });

    return {
      apiUrl,
      apiStatus,
      socketStatus,
      lastKeepAlive,
      lastMessages,
      checkApi,
      emitPing,
    };
  },
};
</script>

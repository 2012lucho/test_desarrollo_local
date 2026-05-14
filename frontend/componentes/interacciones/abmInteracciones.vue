<template>
  <div class="p-3">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <div>
        <h1 class="h4 mb-0">Interacciones</h1>
        <p class="text-muted mb-0">Historial de sesiones de chat con agentes.</p>
      </div>
      <button class="btn btn-outline-primary" @click="loadSessions">Actualizar</button>
    </div>

    <div v-if="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>

    <div v-if="sessions.length === 0" class="alert alert-secondary">
      No se encontraron sesiones de agente.
    </div>

    <div v-else class="table-responsive">
      <table class="table table-striped table-hover align-middle">
        <thead>
          <tr>
            <th>ID</th>
            <th>Agente</th>
            <th>Proyecto</th>
            <th>Origen</th>
            <th>Inicio</th>
            <th>Último mensaje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="session in sessions" :key="session.id">
            <td>{{ session.id }}</td>
            <td>{{ session.id_agente }}</td>
            <td>{{ session.id_proyecto ?? 'N/A' }}</td>
            <td>{{ session.originado_por }}</td>
            <td>{{ formatDate(session.fecha_hora_ini) }}</td>
            <td>{{ formatDate(session.fecha_hora_fin) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL);
const sessions = ref([]);
const errorMessage = ref('');

function formatDate(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
}

function loadSessions() {
  errorMessage.value = '';
  socket.emit('sessionAgente:list', null, (resp) => {
    if (resp.ok) {
      sessions.value = resp.data ?? [];
    } else {
      sessions.value = [];
      errorMessage.value = resp.error || 'Error cargando sesiones de agente';
    }
  });
}

onMounted(() => {
  loadSessions();
});

onUnmounted(() => {
  socket.disconnect();
});
</script>

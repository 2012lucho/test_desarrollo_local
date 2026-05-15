<template>
  <div>
    <div class="d-flex align-items-start justify-content-between mb-3 gap-3">
      <div>
        <h4 class="mb-1">Mensajes de sesión {{ session.id }}</h4>
        <div class="text-muted small">
          Agente: {{ session.id_agente }} · Proyecto: {{ session.id_proyecto ?? 'N/A' }} · Origen: {{ session.originado_por }}
        </div>
      </div>
      <button class="btn btn-sm btn-outline-secondary" type="button" @click="closeModal">
        Cerrar
      </button>
    </div>

    <div v-if="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>

    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border" role="status"></div>
      <div class="mt-2 text-muted">Cargando mensajes...</div>
    </div>

    <div v-else>
      <div v-if="messages.length === 0" class="alert alert-secondary">
        No hay mensajes registrados para esta sesión.
      </div>
      <ul v-else class="list-group">
        <li v-for="message in messages" :key="message.id" class="list-group-item">
          <div class="d-flex justify-content-between align-items-start">
            <span :class="['badge', 'text-bg-' + (message.origen === 'HUMANO' ? 'primary' : 'secondary')]">
              {{ message.origen }}
            </span>
            <small class="text-muted">{{ formatDate(message.fecha_hora) }}</small>
          </div>
          <div class="mt-2" style="white-space: pre-wrap;">{{ message.mensaje }}</div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useModal } from '../../composables/useModal.js';

const props = defineProps({
  session: { type: Object, required: true },
  socket: { type: Object, required: true },
});

const { cerrarModal: cerrarModalFn } = useModal();
const messages = ref([]);
const loading = ref(true);
const errorMessage = ref('');

function formatDate(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
}

function loadMessages() {
  errorMessage.value = '';
  loading.value = true;

  props.socket.emit('sessionAgente:messages', { id_session: props.session.id }, (resp) => {
    loading.value = false;
    if (resp.ok) {
      messages.value = resp.data ?? [];
    } else {
      messages.value = [];
      errorMessage.value = resp.error || 'Error cargando mensajes de sesión';
    }
  });
}

function closeModal() {
  cerrarModalFn();
}

onMounted(() => {
  loadMessages();
});
</script>

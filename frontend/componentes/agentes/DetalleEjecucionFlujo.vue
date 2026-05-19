<template>
  <div>
    <div class="d-flex align-items-start justify-content-between mb-3 gap-3">
      <div>
        <h4 class="mb-1">Detalle de ejecución {{ ejecucion.id }}</h4>
        <div class="text-muted small">Flujo: {{ ejecucion.id_flujo }}</div>
      </div>
      <button class="btn btn-sm btn-outline-secondary" type="button" @click="closeModal">Cerrar</button>
    </div>

    <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border" role="status"></div>
      <div class="mt-2 text-muted">Cargando pasos de ejecución...</div>
    </div>

    <div v-else>
      <div v-if="records.length === 0" class="alert alert-secondary">
        No hay registros de ejecución para esta sesión.
      </div>

      <ul v-else class="list-group">
        <li v-for="record in records" :key="record.id" class="list-group-item">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <div><strong>Registro {{ record.id }}</strong></div>
              <div class="small text-muted">Inicio: {{ formatDate(record.fecha_hora_ini) }}</div>
              <div class="small text-muted">Fin: {{ formatDate(record.fecha_hora_fin) }}</div>
            </div>
          </div>
          <div class="mt-2">
            <div class="fw-semibold">Datos de entrada</div>
            <pre class="record-box">{{ formatJSON(record.data_entrada) }}</pre>
          </div>
          <div class="mt-2">
            <div class="fw-semibold">Datos de salida</div>
            <pre class="record-box">{{ formatJSON(record.data_salida) }}</pre>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useModal } from '../../composables/useModal.js';

const props = defineProps({
  socket: { type: Object, required: true },
  ejecucion: { type: Object, required: true },
});

const { cerrarModal: cerrarModalFn } = useModal();
const records = ref([]);
const loading = ref(true);
const errorMessage = ref('');

function formatDate(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
}

function formatJSON(value) {
  if (value === null || value === undefined) return 'null';
  try {
    return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value, null, 2);
  } catch {
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }
}

function closeModal() {
  cerrarModalFn();
}

function loadRecords() {
  errorMessage.value = '';
  loading.value = true;
  props.socket.emit('agentes_flujo_ejecucion:records', { id_ejecucion: props.ejecucion.id }, (resp) => {
    loading.value = false;
    if (resp.ok) {
      records.value = resp.data ?? [];
    } else {
      records.value = [];
      errorMessage.value = resp.error || 'Error cargando registros de ejecución';
    }
  });
}

onMounted(() => {
  loadRecords();
});
</script>

<style scoped>
.record-box {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 0.75rem;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

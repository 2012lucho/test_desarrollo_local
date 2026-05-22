<template>
  <div>
    <div class="d-flex align-items-start justify-content-between mb-3 gap-3">
      <div>
        <h4 class="mb-1">Última ejecución del nodo {{ nodeLabel }}</h4>
        <div class="text-muted small">Registro: {{ record.id }}</div>
        <div class="text-muted small">Ejecución: {{ record.id_ejecucion }}</div>
      </div>
      <button class="btn btn-sm btn-outline-secondary" type="button" @click="closeModal">Cerrar</button>
    </div>

    <div class="mb-3">
      <div class="fw-semibold">Entrada</div>
      <pre class="record-box">{{ formatJSON(record.data_entrada) }}</pre>
    </div>

    <div class="mb-3">
      <div class="fw-semibold">Salida</div>
      <pre class="record-box">{{ formatJSON(record.data_salida) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { useModal } from '../../composables/useModal.js';

const props = defineProps({
  record: { type: Object, required: true },
  nodeLabel: { type: String, required: true },
});

const { cerrarModal: cerrarModalFn } = useModal();

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

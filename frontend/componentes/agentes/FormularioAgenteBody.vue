<template>
  <div class="agente-form-body">
    <div v-if="errorText" class="alert alert-danger py-1 mb-3">{{ errorText }}</div>
    <div class="form-grid">
      <div v-if="isEditing" class="form-group mb-3">
        <label>ID</label>
        <input :value="id" class="form-control" disabled />
      </div>
      <div class="form-group mb-3">
        <label>Nombre</label>
        <input v-model="nombre" class="form-control" placeholder="Nombre del nodo" />
      </div>
      <div class="form-group mb-3">
        <label>Tipo de bloque</label>
        <select v-model.number="idTipoBloque" class="form-select">
          <option value="" disabled>{{ blocks.length ? 'Selecciona un tipo de bloque' : 'No hay tipos disponibles' }}</option>
          <option v-for="block in blocks" :key="block.id" :value="block.id">
            {{ block.nombre }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  form: { type: Object, required: true },
  mensajeError: { type: [String, Object], default: '' },
  blocks: { type: Array, default: () => [] },
  isEditing: { type: Boolean, default: false },
});

const formValue = computed(() => props.form?.value ?? props.form);

const id = computed(() => formValue.value?.id ?? '');

const nombre = computed({
  get: () => formValue.value?.nombre ?? '',
  set: (value) => {
    if (formValue.value) {
      formValue.value.nombre = value;
    }
  },
});

const idTipoBloque = computed({
  get: () => formValue.value?.id_tipo_bloque ?? '',
  set: (value) => {
    if (formValue.value) {
      formValue.value.id_tipo_bloque = value;
    }
  },
});

const errorText = computed(() => {
  if (props.mensajeError?.value != null) {
    return props.mensajeError.value;
  }
  return props.mensajeError || '';
});
</script>

<style scoped>
.agente-form-body {
  min-width: 760px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

textarea.form-control {
  font-family: monospace;
}
</style>

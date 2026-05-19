<template>
  <div class="bloque-form-body">
    <div v-if="errorText" class="alert alert-danger py-1 mb-3">{{ errorText }}</div>
    <div class="form-grid">
      <div class="form-group mb-3">
        <label>Nombre</label>
        <input v-model="nombre" class="form-control" placeholder="Nombre del bloque" />
      </div>
      <div class="form-group mb-3">
        <label>Descripción</label>
        <textarea v-model="descripcion" class="form-control" rows="3" placeholder="Descripción del bloque"></textarea>
      </div>
      <div class="form-group mb-3">
        <label>Config Entrada</label>
        <textarea v-model="configEntrada" class="form-control" rows="4" placeholder='Ejemplo: {"key": "value"}'></textarea>
      </div>
      <div class="form-group mb-3">
        <label>Config General</label>
        <textarea v-model="configGeneral" class="form-control" rows="4" placeholder='Ejemplo: {"key": "value"}'></textarea>
      </div>
      <div class="form-group mb-3">
        <label>Config Salida</label>
        <textarea v-model="configSalida" class="form-control" rows="4" placeholder='Ejemplo: {"key": "value"}'></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  form: { type: Object, required: true },
  mensajeError: { type: [String, Object], default: '' },
});

const formValue = computed(() => props.form?.value ?? props.form);

const nombre = computed({
  get: () => formValue.value?.nombre ?? '',
  set: (value) => {
    if (formValue.value) formValue.value.nombre = value;
  },
});

const descripcion = computed({
  get: () => formValue.value?.descripcion ?? '',
  set: (value) => {
    if (formValue.value) formValue.value.descripcion = value;
  },
});

const configEntrada = computed({
  get: () => formValue.value?.config_entrada ?? '{}',
  set: (value) => {
    if (formValue.value) formValue.value.config_entrada = value;
  },
});

const configGeneral = computed({
  get: () => formValue.value?.config_general ?? '{}',
  set: (value) => {
    if (formValue.value) formValue.value.config_general = value;
  },
});

const configSalida = computed({
  get: () => formValue.value?.config_salida ?? '{}',
  set: (value) => {
    if (formValue.value) formValue.value.config_salida = value;
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
.bloque-form-body {
  min-width: 760px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

textarea.form-control {
  font-family: monospace;
}
</style>

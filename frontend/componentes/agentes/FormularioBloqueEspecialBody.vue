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
      <div class="form-group mb-3 form-group--full">
        <JsonEditorField
          v-model="configEntrada"
          label="Config Entrada"
          :rows="10"
          placeholder='Ejemplo: {"key": "value"}'
        />
      </div>
      <div class="form-group mb-3 form-group--full">
        <JsonEditorField
          v-model="configGeneral"
          label="Config General"
          :rows="10"
          placeholder='Ejemplo: {"key": "value"}'
        />
      </div>
      <div class="form-group mb-3 form-group--full">
        <JsonEditorField
          v-model="configSalida"
          label="Config Salida"
          :rows="10"
          placeholder='Ejemplo: {"key": "value"}'
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import JsonEditorField from './JsonEditorField.vue';

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
  width: 100%;
  min-width: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.form-group--full {
  grid-column: span 2;
}

textarea.form-control {
  font-family: monospace;
}
</style>

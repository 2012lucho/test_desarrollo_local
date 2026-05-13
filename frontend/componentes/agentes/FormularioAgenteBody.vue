<template>
  <div class="agente-form-body">
    <div v-if="errorText" class="alert alert-danger py-1 mb-3">{{ errorText }}</div>
    <div class="form-grid">
      <div class="form-group mb-3">
        <label>ID</label>
        <input v-model="id" class="form-control" placeholder="agente-123" />
      </div>
      <div class="form-group mb-3">
        <label>Modelo Ollama</label>
        <select v-model="modelo" class="form-select">
          <option value="" disabled>{{ models.length ? 'Selecciona un modelo' : 'No hay modelos disponibles' }}</option>
          <option v-for="model in models" :key="model.name ?? model" :value="model.name ?? model">
            {{ model.name ?? model }}
          </option>
        </select>
      </div>
      <div class="form-group mb-3">
        <label>Nombre</label>
        <input v-model="nombre" class="form-control" placeholder="Nombre del agente" />
      </div>
      <div class="form-group mb-3">
        <label>Descripción</label>
        <textarea v-model="descripcion" class="form-control" rows="3" placeholder="Descripción breve"></textarea>
      </div>
      <div class="form-group mb-3 form-full-width">
        <label>Prompt de sistema</label>
        <textarea v-model="promtSistema" class="form-control" rows="6" placeholder="Prompt del agente"></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  form: { type: Object, required: true },
  mensajeError: { type: [String, Object], default: '' },
  models: { type: Array, default: () => [] },
});

const formValue = computed(() => props.form?.value ?? props.form);

const id = computed({
  get: () => formValue.value?.id ?? '',
  set: (value) => {
    if (formValue.value) {
      formValue.value.id = value;
    }
  },
});

const nombre = computed({
  get: () => formValue.value?.nombre ?? '',
  set: (value) => {
    if (formValue.value) {
      formValue.value.nombre = value;
    }
  },
});

const descripcion = computed({
  get: () => formValue.value?.descripcion ?? '',
  set: (value) => {
    if (formValue.value) {
      formValue.value.descripcion = value;
    }
  },
});

const promtSistema = computed({
  get: () => formValue.value?.promt_sistema ?? '',
  set: (value) => {
    if (formValue.value) {
      formValue.value.promt_sistema = value;
    }
  },
});

const modelo = computed({
  get: () => formValue.value?.modelo ?? '',
  set: (value) => {
    if (formValue.value) {
      formValue.value.modelo = value;
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

.form-full-width {
  grid-column: 1 / -1;
}

textarea.form-control {
  font-family: monospace;
}
</style>

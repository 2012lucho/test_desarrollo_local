<template>
  <div>
    <div v-if="errorText" class="alert alert-danger py-1 mb-3">{{ errorText }}</div>
    <div class="form-group mb-3">
      <label>ID</label>
      <input v-model="id" class="form-control" placeholder="agente-123" />
    </div>
    <div class="form-group mb-3">
      <label>Nombre</label>
      <input v-model="nombre" class="form-control" placeholder="Nombre del agente" />
    </div>
    <div class="form-group mb-3">
      <label>Descripción</label>
      <textarea v-model="descripcion" class="form-control" rows="3" placeholder="Descripción breve"></textarea>
    </div>
    <div class="form-group mb-3">
      <label>Prompt de sistema</label>
      <textarea v-model="promtSistema" class="form-control" rows="6" placeholder="Prompt del agente"></textarea>
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

const errorText = computed(() => {
  if (props.mensajeError?.value != null) {
    return props.mensajeError.value;
  }
  return props.mensajeError || '';
});
</script>

<style scoped>
textarea.form-control {
  font-family: monospace;
}
</style>

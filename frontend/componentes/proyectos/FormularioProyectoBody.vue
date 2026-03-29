<template>
  <div style="min-width: 320px;">
    <div class="mb-3">
      <label class="form-label">Nombre</label>
      <input v-model="nombre" type="text" class="form-control" maxlength="50" />
    </div>
    <div class="mb-3">
      <label class="form-label">Descripción</label>
      <input v-model="descripcion" type="text" class="form-control" maxlength="255" />
    </div>
    <div v-if="props.mensajeError?.value" class="alert alert-danger py-1 mb-0">
      {{ props.mensajeError.value }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps(['form', 'mensajeError']);

const nombre = computed({
  get: () => props.form?.value?.nombre ?? '',
  set: (val) => { if (props.form?.value) props.form.value.nombre = val; },
});

const descripcion = computed({
  get: () => props.form?.value?.descripcion ?? '',
  set: (val) => { if (props.form?.value) props.form.value.descripcion = val; },
});
</script>

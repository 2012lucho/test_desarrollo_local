<template>
  <div style="min-width: 320px;">
    <div class="mb-3">
      <label class="form-label">Nombre</label>
      <input v-model="nombre" type="text" class="form-control" maxlength="100" />
    </div>

    <div v-if="props.mensajeError?.value" class="alert alert-danger py-1 mb-0">
      {{ props.mensajeError.value }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps(['subproyecto', 'mensajeError']);

const nombre = computed({
  get: () => props.subproyecto?.value?.nombre ?? '',
  set: (val) => { if (props.subproyecto?.value) props.subproyecto.value.nombre = val; },
});
</script>

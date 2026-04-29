<template>
  <div style="min-width: 320px;">
    <div class="row g-3">
      <div class="col-12">
        <label class="form-label">Nombre de la tabla</label>
        <input v-model="nombre" type="text" class="form-control" maxlength="100" />
      </div>
    </div>

    <div v-if="props.mensajeError?.value" class="alert alert-danger py-1 mb-0 mt-3">
      {{ props.mensajeError.value }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps(['tabla', 'mensajeError']);

const nombre = computed({
  get: () => props.tabla?.value?.nombre ?? '',
  set: (val) => {
    if (props.tabla?.value) {
      props.tabla.value.nombre = val;
    }
  },
});
</script>

<template>
  <div style="min-width: 320px;">
    <div class="mb-3">
      <label class="form-label">Nombre</label>
      <input v-model="nombre" type="text" class="form-control" placeholder="Nombre de la tecnología" />
    </div>

    <div v-if="props.mensajeError?.value" class="alert alert-danger py-1">
      {{ props.mensajeError.value }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps(['form', 'mensajeError']);

const nombre = computed({
  get: () => props.form?.value?.nombre ?? '',
  set: (value) => {
    if (props.form?.value) {
      props.form.value.nombre = value;
    }
  },
});
</script>

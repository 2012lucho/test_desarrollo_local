<template>
  <div style="min-width: 320px;">
    <div class="mb-3">
      <label class="form-label">Nombre</label>
      <input v-model="nombre" type="text" class="form-control" maxlength="100" />
    </div>
    <div class="mb-3">
      <label class="form-label">Descripción</label>
      <input v-model="descripcion" type="text" class="form-control" maxlength="255" />
    </div>
    <div class="mb-3">
      <label class="form-label">Config JSON</label>
      <textarea v-model="configText" class="form-control" rows="6" placeholder='{"clave": "valor"}'></textarea>
    </div>

    <div v-if="props.mensajeError?.value" class="alert alert-danger py-1 mb-0">
      {{ props.mensajeError.value }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps(['componente', 'mensajeError']);

const nombre = computed({
  get: () => props.componente?.value?.nombre ?? '',
  set: (val) => { if (props.componente?.value) props.componente.value.nombre = val; },
});

const descripcion = computed({
  get: () => props.componente?.value?.descripcion ?? '',
  set: (val) => { if (props.componente?.value) props.componente.value.descripcion = val; },
});

const configText = computed({
  get: () => props.componente?.value?.configText ?? '{}',
  set: (val) => { if (props.componente?.value) props.componente.value.configText = val; },
});
</script>

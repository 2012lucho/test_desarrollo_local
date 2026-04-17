<template>
  <span class="fw-semibold">
    <template v-if="props.editandoId?.value">
      Editar Proyecto: {{ props.form?.value?.nombre || 'Sin nombre' }}
    </template>
    <template v-else>
      Nuevo Proyecto
    </template>
  </span>
</template>

<script setup>
const props = defineProps(['editandoId', 'form']);
</script>

<template>
  <span class="fw-semibold">
    <template v-if="props.editandoId?.value">
      Editar Tecnología
    </template>
    <template v-else>
      Crear Tecnología
    </template>
  </span>
</template>

<script setup>
const props = defineProps(['editandoId']);
</script>

<template>
  <span class="fw-semibold">
    {{ props.tabla?.value?.nombre ? 'Editar tabla' : 'Nueva tabla' }}
  </span>
</template>

<script setup>
const props = defineProps(['tabla']);
</script>

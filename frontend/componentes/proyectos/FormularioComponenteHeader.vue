<template>
  <span class="fw-semibold">
    <template v-if="props.componente?.value?.nombre">
      Componente: {{ props.componente.value.nombre }}
    </template>
    <template v-else>
      Nuevo Componente
    </template>
  </span>
</template>

<script setup>
const props = defineProps(['componente']);
</script>

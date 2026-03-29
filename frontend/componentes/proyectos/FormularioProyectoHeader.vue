<template>
  <span class="fw-semibold">{{ props.editandoId?.value ? 'Editar Proyecto' : 'Nuevo Proyecto' }}</span>
</template>

<script setup>
const props = defineProps(['editandoId']);
</script>

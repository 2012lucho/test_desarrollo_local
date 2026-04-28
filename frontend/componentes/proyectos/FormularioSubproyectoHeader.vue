<template>
  <span class="fw-semibold">
    <template v-if="props.subproyecto?.value?.nombre">
      Subproyecto: {{ props.subproyecto.value.nombre }}
    </template>
    <template v-else>
      Nuevo Subproyecto
    </template>
  </span>
</template>

<script setup>
const props = defineProps(['subproyecto']);
</script>

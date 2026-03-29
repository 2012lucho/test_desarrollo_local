<template>
  <div class="container-fluid py-3">
    <div class="row g-0">
      <div class="col-12 col-md-3 border-end min-vh-100">
        <BarraLateralIzquierda />
      </div>
      <div class="col-12 col-md-9">
        <ZonaOperaciones />
      </div>
    </div>
  </div>
  <GestorModals />
</template>

<script setup>
import BarraLateralIzquierda from './componentes/layout/BarraLateralIzquierda.vue';
import ZonaOperaciones from './componentes/layout/ZonaOperaciones.vue';
import GestorModals from './componentes/layout/GestorModals.vue';
</script>


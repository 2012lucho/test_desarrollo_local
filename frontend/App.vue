<template>
  <div class="container-fluid py-3">
    <div class="row g-0">
      <div class="col-12 sidebar-half border-end min-vh-100">
        <BarraLateralIzquierda />
      </div>
      <div class="col-12 main-expanded">
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

<style scoped>
@media (min-width: 1200px) {
  .sidebar-half {
    flex: 0 0 12.5%;
    max-width: 12.5%;
  }
  .main-expanded {
    flex: 0 0 87.5%;
    max-width: 87.5%;
  }
}
</style>


<template>
  <div class="container-fluid pt-0 pb-3">
    <div class="row mb-3">
      <div class="col-12">
        <BarraSuperior />
      </div>
    </div>

    <div class="row g-0">
      <div
        class="col-12 sidebar-column border-end min-vh-100"
        :class="sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'"
      >
        <BarraLateralIzquierda :collapsed="sidebarCollapsed" @toggle="sidebarCollapsed = !sidebarCollapsed" />
      </div>
      <div class="col-12 main-column" :class="sidebarCollapsed ? 'main-expanded-collapsed' : 'main-expanded'">
        <ZonaOperaciones />
      </div>
    </div>
  </div>
  <GestorModals />
</template>

<script setup>
import { ref } from 'vue';
import BarraLateralIzquierda from './componentes/layout/BarraLateralIzquierda.vue';
import BarraSuperior from './componentes/layout/BarraSuperior.vue';
import ZonaOperaciones from './componentes/layout/ZonaOperaciones.vue';
import GestorModals from './componentes/layout/GestorModals.vue';

const sidebarCollapsed = ref(false);
</script>

<style scoped>
@media (min-width: 1200px) {
  .sidebar-column.sidebar-expanded {
    flex: 0 0 12.5%;
    max-width: 12.5%;
  }
  .sidebar-column.sidebar-collapsed {
    flex: 0 0 auto;
    width: auto;
    max-width: 4.5rem;
  }
  .main-column.main-expanded {
    flex: 0 0 87.5%;
    max-width: 87.5%;
  }
  .main-column.main-expanded-collapsed {
    flex: 1 1 auto;
    max-width: calc(100% - 4.5rem);
  }
}
</style>

<style>
html, body, #app {
  min-height: 100%;
  height: 100%;
}
body {
  margin: 0;
  min-height: 100%;
}
.container-fluid {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.row.g-0 {
  flex: 1;
  min-height: 0;
}
.main-column {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.main-column > * {
  flex: 1;
  min-height: 0;
}
</style>


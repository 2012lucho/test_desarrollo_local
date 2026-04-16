<template>
  <Teleport to="body">
    <template v-for="(modal, index) in modals" :key="modal.id">
      <div
        class="gestor-modal-backdrop"
        :style="{ zIndex: baseZ + index * 2 }"
        @click="cerrarModal(modal.id)"
      ></div>
      <div
        class="gestor-modal-wrapper"
        :style="{ zIndex: baseZ + index * 2 + 1 }"
      >
        <div :class="['gestor-modal-dialog', { 'gestor-modal-dialog--fullscreen': modal.fullscreen }]">
          <div class="gestor-modal-header-bar">
            <component v-if="modal.header" :is="modal.header" v-bind="modal.headerProps" />
            <button
              type="button"
              class="btn-close ms-auto flex-shrink-0"
              aria-label="Cerrar"
              @click="cerrarModal(modal.id)"
            ></button>
          </div>
          <div class="gestor-modal-body">
            <component v-if="modal.body" :is="modal.body" v-bind="modal.bodyProps" />
          </div>
          <div v-if="modal.footer" class="gestor-modal-footer-bar">
            <component :is="modal.footer" v-bind="modal.footerProps" />
          </div>
        </div>
      </div>
    </template>
  </Teleport>
</template>

<script setup>
import { useModal } from '../../composables/useModal.js';

const baseZ = 1050;
const { modals, cerrarModal } = useModal();
</script>

<style scoped>
.gestor-modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.gestor-modal-wrapper {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.gestor-modal-dialog {
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 2rem);
  max-width: calc(100dvw - 2rem);
  background-color: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  pointer-events: all;
  overflow: hidden;
}

.gestor-modal-dialog--fullscreen {
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
  border-radius: 0;
}

.gestor-modal-header-bar {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
  gap: 0.5rem;
}

.gestor-modal-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem;
}

.gestor-modal-footer-bar {
  flex-shrink: 0;
  padding: 0.75rem 1rem;
  border-top: 1px solid #dee2e6;
}
</style>

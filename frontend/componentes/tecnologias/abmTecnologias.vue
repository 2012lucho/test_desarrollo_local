<template>
  <div class="card mt-3">
    <div class="card-header d-flex justify-content-between align-items-center">
      <span>Tecnologías</span>
      <button class="btn btn-sm btn-primary" @click="abrirFormulario(null)">Agregar</button>
    </div>
    <div class="card-body">
      <div v-if="mensajeError" class="alert alert-danger py-1 mb-2">{{ mensajeError }}</div>

      <table class="table table-sm table-hover mb-0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!tecnologias.length">
            <td colspan="3" class="text-muted">Sin tecnologías registradas.</td>
          </tr>
          <tr v-for="tecnologia in tecnologias" :key="tecnologia.id">
            <td>{{ tecnologia.id }}</td>
            <td>{{ tecnologia.nombre }}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-primary me-1" @click="abrirFormulario(tecnologia)">Editar</button>
              <button class="btn btn-sm btn-outline-danger" @click="eliminar(tecnologia.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { useModal } from '../../composables/useModal.js';
import FormularioTecnologiaHeader from './FormularioTecnologiaHeader.vue';
import FormularioTecnologiaBody from './FormularioTecnologiaBody.vue';
import FormularioTecnologiaFooter from './FormularioTecnologiaFooter.vue';

const socket = io(import.meta.env.VITE_API_URL);
const { mostrarModal } = useModal();

const tecnologias = ref([]);
const mensajeError = ref('');

function cargarLista() {
  socket.emit('tecnologias:list', null, (resp) => {
    if (resp.ok) {
      tecnologias.value = resp.data;
    } else {
      mensajeError.value = resp.error || 'Error al cargar tecnologías';
    }
  });
}

function abrirFormulario(tecnologia) {
  const form = ref({ nombre: tecnologia?.nombre ?? '' });
  const editandoId = ref(tecnologia?.id ?? null);
  const mensajeErrorForm = ref('');
  const cargandoForm = ref(false);
  let cerrar = null;

  const abrirModal = () => {
    cerrar = mostrarModal({
      header: FormularioTecnologiaHeader,
      body: FormularioTecnologiaBody,
      footer: FormularioTecnologiaFooter,
      headerProps: { editandoId },
      bodyProps: { form, mensajeError: mensajeErrorForm },
      footerProps: {
        cargando: cargandoForm,
        onGuardar: guardar,
        onCerrar: () => cerrar && cerrar(),
      },
      fullscreen: false,
    });
  };

  function guardar() {
    mensajeErrorForm.value = '';
    const nombre = String(form.value.nombre || '').trim();
    if (!nombre) {
      mensajeErrorForm.value = 'El nombre es requerido';
      return;
    }

    cargandoForm.value = true;
    const payload = { nombre };

    const acción = editandoId.value ? 'tecnologias:update' : 'tecnologias:create';
    if (editandoId.value) payload.id = editandoId.value;

    socket.emit(acción, payload, (resp) => {
      cargandoForm.value = false;
      if (resp.ok) {
        if (typeof cerrar === 'function') cerrar();
      } else {
        mensajeErrorForm.value = resp.error || 'Error al guardar tecnología';
      }
    });
  }

  abrirModal();
}

function eliminar(id) {
  if (!confirm('¿Desea eliminar esta tecnología?')) return;
  socket.emit('tecnologias:delete', { id }, (resp) => {
    if (!resp.ok) {
      mensajeError.value = resp.error || 'Error al eliminar tecnología';
    }
  });
}

socket.on('tecnologias:changed', () => {
  cargarLista();
});

onMounted(() => {
  cargarLista();
});

onUnmounted(() => {
  socket.off('tecnologias:changed');
  socket.disconnect();
});
</script>

<style scoped>
.card {
  border: 1px solid #ced4da;
}
</style>

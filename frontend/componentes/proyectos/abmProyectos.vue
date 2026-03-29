<template>
  <div class="card mt-3">
    <div class="card-header d-flex justify-content-between align-items-center">
      <span>Proyectos</span>
      <button class="btn btn-sm btn-primary" @click="abrirFormulario(null)">Agregar</button>
    </div>
    <div class="card-body">

      <div v-if="mensajeError" class="alert alert-danger py-1 mb-2">{{ mensajeError }}</div>

      <table class="table table-sm table-hover mb-0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Creado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!proyectos.length">
            <td colspan="5" class="text-muted">Sin proyectos registrados.</td>
          </tr>
          <tr v-for="p in proyectos" :key="p.id">
            <td>{{ p.id }}</td>
            <td>{{ p.nombre }}</td>
            <td>{{ p.descripcion }}</td>
            <td>{{ formatFecha(p.creado_el) }}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-primary me-1" @click="abrirFormulario(p)">Editar</button>
              <button class="btn btn-sm btn-outline-danger" @click="eliminar(p.id)">Eliminar</button>
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
import FormularioProyectoHeader from './FormularioProyectoHeader.vue';
import FormularioProyectoBody from './FormularioProyectoBody.vue';
import FormularioProyectoFooter from './FormularioProyectoFooter.vue';

const socket = io(import.meta.env.VITE_API_URL);
const { mostrarModal } = useModal();

const proyectos = ref([]);
const mensajeError = ref('');

function cargarLista() {
  socket.emit('proyectos:list', null, (resp) => {
    if (resp.ok) {
      proyectos.value = resp.data;
    } else {
      mensajeError.value = resp.error || 'Error al cargar proyectos';
    }
  });
}

function abrirFormulario(proyecto) {
  const form = ref({ nombre: proyecto?.nombre ?? '', descripcion: proyecto?.descripcion ?? '' });
  const editandoId = ref(proyecto?.id ?? null);
  const cargandoForm = ref(false);
  const mensajeErrorForm = ref('');

  const cerrar = mostrarModal({
    header: FormularioProyectoHeader,
    body: FormularioProyectoBody,
    footer: FormularioProyectoFooter,
    headerProps: { editandoId },
    bodyProps: { form, mensajeError: mensajeErrorForm },
    footerProps: {
      cargando: cargandoForm,
      onGuardar: guardar,
      onCerrar: () => cerrar(),
    },
  });

  function guardar() {
    mensajeErrorForm.value = '';
    const { nombre, descripcion } = form.value;
    if (!nombre || !descripcion) {
      mensajeErrorForm.value = 'Nombre y descripción son requeridos';
      return;
    }
    cargandoForm.value = true;
    if (editandoId.value) {
      socket.emit('proyectos:update', { id: editandoId.value, nombre, descripcion }, (resp) => {
        cargandoForm.value = false;
        if (resp.ok) {
          cerrar();
        } else {
          mensajeErrorForm.value = resp.error || 'Error al actualizar proyecto';
        }
      });
    } else {
      socket.emit('proyectos:create', { nombre, descripcion }, (resp) => {
        cargandoForm.value = false;
        if (resp.ok) {
          cerrar();
        } else {
          mensajeErrorForm.value = resp.error || 'Error al crear proyecto';
        }
      });
    }
  }
}

function eliminar(id) {
  if (!confirm('¿Desea eliminar este proyecto?')) return;
  socket.emit('proyectos:delete', { id }, (resp) => {
    if (!resp.ok) {
      mensajeError.value = resp.error || 'Error al eliminar proyecto';
    }
  });
}

function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString();
}

socket.on('proyectos:changed', () => {
  cargarLista();
});

onMounted(() => {
  cargarLista();
});

onUnmounted(() => {
  socket.off('proyectos:changed');
  socket.disconnect();
});
</script>

<style scoped>
.card {
  border: 1px solid #ced4da;
}
</style>

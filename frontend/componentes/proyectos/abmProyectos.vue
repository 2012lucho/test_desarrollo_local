<template>
  <div class="card mt-3">
    <div class="card-header d-flex justify-content-between align-items-center">
      <span>Proyectos</span>
      <button class="btn btn-sm btn-primary" @click="abrirFormulario(null)">Agregar</button>
    </div>
    <div class="card-body">

      <form v-if="mostrarFormulario" @submit.prevent="guardar" class="mb-3 border rounded p-3 bg-light">
        <h6 class="mb-3">{{ editandoId ? 'Editar Proyecto' : 'Nuevo Proyecto' }}</h6>
        <div class="mb-2">
          <label class="form-label">Nombre</label>
          <input v-model="form.nombre" type="text" class="form-control" maxlength="50" required />
        </div>
        <div class="mb-2">
          <label class="form-label">Descripción</label>
          <input v-model="form.descripcion" type="text" class="form-control" maxlength="255" required />
        </div>
        <div v-if="mensajeError" class="alert alert-danger py-1 mb-2">{{ mensajeError }}</div>
        <div class="d-flex gap-2">
          <button type="submit" class="btn btn-sm btn-success" :disabled="cargando">
            {{ cargando ? 'Guardando...' : 'Guardar' }}
          </button>
          <button type="button" class="btn btn-sm btn-secondary" @click="cerrarFormulario">Cancelar</button>
        </div>
      </form>

      <div v-if="mensajeError && !mostrarFormulario" class="alert alert-danger py-1">{{ mensajeError }}</div>

      <div v-if="cargando && !proyectos.length" class="text-muted">Cargando...</div>
      <table v-else class="table table-sm table-hover mb-0">
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

const socket = io(import.meta.env.VITE_API_URL);

const proyectos = ref([]);
const mostrarFormulario = ref(false);
const editandoId = ref(null);
const form = ref({ nombre: '', descripcion: '' });
const cargando = ref(false);
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
  mensajeError.value = '';
  if (proyecto) {
    editandoId.value = proyecto.id;
    form.value = { nombre: proyecto.nombre, descripcion: proyecto.descripcion };
  } else {
    editandoId.value = null;
    form.value = { nombre: '', descripcion: '' };
  }
  mostrarFormulario.value = true;
}

function cerrarFormulario() {
  mostrarFormulario.value = false;
  editandoId.value = null;
  form.value = { nombre: '', descripcion: '' };
  mensajeError.value = '';
}

function guardar() {
  mensajeError.value = '';
  cargando.value = true;
  if (editandoId.value) {
    socket.emit('proyectos:update', { id: editandoId.value, ...form.value }, (resp) => {
      cargando.value = false;
      if (resp.ok) {
        cerrarFormulario();
      } else {
        mensajeError.value = resp.error || 'Error al actualizar proyecto';
      }
    });
  } else {
    socket.emit('proyectos:create', { ...form.value }, (resp) => {
      cargando.value = false;
      if (resp.ok) {
        cerrarFormulario();
      } else {
        mensajeError.value = resp.error || 'Error al crear proyecto';
      }
    });
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

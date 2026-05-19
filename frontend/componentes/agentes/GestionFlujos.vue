<template>
  <div class="gestion-flujos">
    <div class="gestion-flujos-toolbar mb-3">
      <button class="btn btn-primary" type="button" @click="abrirFormulario(null)">Agregar flujo</button>
    </div>

    <div v-if="mensajeError" class="alert alert-danger py-1 mb-3">{{ mensajeError }}</div>

    <div v-if="formVisible" class="card mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0">{{ form.value.id ? 'Editar flujo' : 'Crear flujo' }}</h6>
          <button class="btn btn-sm btn-outline-secondary" type="button" @click="cancelarFormulario">Cerrar formulario</button>
        </div>

        <div class="mb-3">
          <label class="form-label">Nombre</label>
          <input class="form-control" v-model="form.value.nombre" placeholder="Nombre del flujo" />
        </div>

        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-secondary" type="button" @click="cancelarFormulario">Cancelar</button>
          <button class="btn btn-primary" type="button" @click="guardar" :disabled="cargandoForm">{{ cargandoForm ? 'Guardando...' : 'Guardar' }}</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body p-0">
        <table class="table table-sm table-hover mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!flujos.length">
              <td colspan="3" class="text-muted">Sin flujos registrados.</td>
            </tr>
            <tr v-for="flujo in flujos" :key="flujo.id">
              <td>{{ flujo.id }}</td>
              <td>{{ flujo.nombre }}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" type="button" @click="abrirFormulario(flujo)">Editar</button>
                <button class="btn btn-sm btn-outline-danger" type="button" @click="eliminarFlujo(flujo.id)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  socket: { type: Object, required: true },
});

const flujos = ref([]);
const mensajeError = ref('');
const formVisible = ref(false);
const cargandoForm = ref(false);
const form = ref({
  id: null,
  nombre: '',
});

function cargarFlujos() {
  mensajeError.value = '';
  props.socket.emit('agentes_flujos:list', null, (resp) => {
    if (resp.ok) {
      flujos.value = resp.data || [];
    } else {
      mensajeError.value = resp.error || 'Error cargando flujos';
    }
  });
}

function abrirFormulario(flujo) {
  if (flujo) {
    form.value = {
      id: flujo.id,
      nombre: flujo.nombre,
    };
  } else {
    form.value = {
      id: null,
      nombre: '',
    };
  }
  mensajeError.value = '';
  formVisible.value = true;
}

function cancelarFormulario() {
  formVisible.value = false;
  mensajeError.value = '';
}

function guardar() {
  mensajeError.value = '';
  const nombre = String(form.value.nombre || '').trim();
  if (!nombre) {
    mensajeError.value = 'El nombre es requerido';
    return;
  }

  const payload = {
    id: form.value.id,
    nombre,
  };
  const accion = form.value.id ? 'agentes_flujos:update' : 'agentes_flujos:create';

  cargandoForm.value = true;
  props.socket.emit(accion, payload, (resp) => {
    cargandoForm.value = false;
    if (resp.ok) {
      cargarFlujos();
      formVisible.value = false;
    } else {
      mensajeError.value = resp.error || 'Error guardando el flujo';
    }
  });
}

function eliminarFlujo(id) {
  if (!confirm('¿Desea eliminar este flujo?')) return;
  mensajeError.value = '';
  props.socket.emit('agentes_flujos:delete', { id }, (resp) => {
    if (resp.ok) {
      cargarFlujos();
    } else {
      mensajeError.value = resp.error || 'Error eliminando el flujo';
    }
  });
}

onMounted(() => {
  cargarFlujos();
  props.socket.on('agentes_flujos:changed', cargarFlujos);
});

onUnmounted(() => {
  props.socket.off('agentes_flujos:changed', cargarFlujos);
});
</script>

<style scoped>
.gestion-flujos {
  min-width: 760px;
}

.table td {
  vertical-align: middle;
}
</style>

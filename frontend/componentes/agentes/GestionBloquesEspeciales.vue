<template>
  <div class="gestion-bloques">
    <div class="gestion-bloques-toolbar mb-3">
      <button class="btn btn-primary" type="button" @click="abrirFormulario(null)">Agregar bloque</button>
    </div>

    <div v-if="mensajeError" class="alert alert-danger py-1 mb-3">{{ mensajeError }}</div>

    <div v-if="formVisible" class="card mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0">{{ form.value.id ? 'Editar bloque' : 'Crear bloque' }}</h6>
          <button class="btn btn-sm btn-outline-secondary" type="button" @click="cancelarFormulario">Cerrar formulario</button>
        </div>

        <div class="mb-3">
          <label class="form-label">Nombre</label>
          <input class="form-control" v-model="form.value.nombre" placeholder="Nombre del bloque" />
        </div>
        <div class="mb-3">
          <label class="form-label">Descripción</label>
          <textarea class="form-control" v-model="form.value.descripcion" rows="3" placeholder="Descripción del bloque"></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label">Modelo Config</label>
          <textarea class="form-control" v-model="form.value.modelo_config" rows="6" placeholder='Ejemplo: {"key": "value"}'></textarea>
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
              <th>Descripción</th>
              <th>Modelo Config</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!bloques.length">
              <td colspan="5" class="text-muted">Sin bloques especiales registrados.</td>
            </tr>
            <tr v-for="bloque in bloques" :key="bloque.id">
              <td>{{ bloque.id }}</td>
              <td>{{ bloque.nombre }}</td>
              <td>{{ bloque.descripcion || '-' }}</td>
              <td><pre class="config-preview">{{ renderConfig(bloque.modelo_config) }}</pre></td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" type="button" @click="abrirFormulario(bloque)">Editar</button>
                <button class="btn btn-sm btn-outline-danger" type="button" @click="eliminarBloque(bloque.id)">Eliminar</button>
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

const bloques = ref([]);
const mensajeError = ref('');
const formVisible = ref(false);
const cargandoForm = ref(false);
const form = ref({
  id: null,
  nombre: '',
  descripcion: '',
  modelo_config: '{}',
});

function prepareConfigValue(value) {
  if (value === null || value === undefined) {
    return '{}';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function renderConfig(value) {
  if (value === null || value === undefined) {
    return '{}';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function cargarBloques() {
  mensajeError.value = '';
  props.socket.emit('agentes_tipo_bloques_especiales:list', null, (resp) => {
    if (resp.ok) {
      bloques.value = resp.data || [];
    } else {
      mensajeError.value = resp.error || 'Error cargando bloques especiales';
    }
  });
}

function abrirFormulario(bloque) {
  if (bloque) {
    form.value = {
      id: bloque.id,
      nombre: bloque.nombre,
      descripcion: bloque.descripcion || '',
      modelo_config: prepareConfigValue(bloque.modelo_config),
    };
  } else {
    form.value = {
      id: null,
      nombre: '',
      descripcion: '',
      modelo_config: '{}',
    };
  }
  mensajeError.value = '';
  formVisible.value = true;
}

function cancelarFormulario() {
  formVisible.value = false;
  mensajeError.value = '';
}

function validarConfig(configText) {
  const trimmed = String(configText || '').trim();
  if (!trimmed) {
    return {};
  }
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    throw new Error('El campo Modelo Config debe ser un JSON válido.');
  }
}

function guardar() {
  mensajeError.value = '';
  const nombre = String(form.value.nombre || '').trim();
  const descripcion = String(form.value.descripcion || '').trim();

  if (!nombre) {
    mensajeError.value = 'El nombre es requerido';
    return;
  }

  let modelo_config = null;
  try {
    modelo_config = validarConfig(form.value.modelo_config);
  } catch (error) {
    mensajeError.value = error.message;
    return;
  }

  const payload = {
    id: form.value.id,
    nombre,
    descripcion: descripcion || null,
    modelo_config,
  };
  const accion = form.value.id ? 'agentes_tipo_bloques_especiales:update' : 'agentes_tipo_bloques_especiales:create';

  cargandoForm.value = true;
  props.socket.emit(accion, payload, (resp) => {
    cargandoForm.value = false;
    if (resp.ok) {
      cargarBloques();
      formVisible.value = false;
    } else {
      mensajeError.value = resp.error || 'Error guardando el bloque';
    }
  });
}

function eliminarBloque(id) {
  if (!confirm('¿Desea eliminar este bloque especial?')) return;
  mensajeError.value = '';
  props.socket.emit('agentes_tipo_bloques_especiales:delete', { id }, (resp) => {
    if (resp.ok) {
      cargarBloques();
    } else {
      mensajeError.value = resp.error || 'Error eliminando el bloque';
    }
  });
}

onMounted(() => {
  cargarBloques();
  props.socket.on('agentes_tipo_bloques_especiales:changed', cargarBloques);
});

onUnmounted(() => {
  props.socket.off('agentes_tipo_bloques_especiales:changed', cargarBloques);
});
</script>

<style scoped>
.gestion-bloques {
  min-width: 760px;
}

.config-preview {
  margin: 0;
  max-height: 5rem;
  overflow: hidden;
  white-space: pre-wrap;
  word-break: break-word;
}

.table td {
  vertical-align: middle;
}
</style>

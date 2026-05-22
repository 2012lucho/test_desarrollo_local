<template>
  <div class="gestion-bloques">
    <div class="gestion-bloques-toolbar mb-3">
      <button class="btn btn-primary" type="button" @click="abrirFormulario(null)">Agregar bloque</button>
    </div>

    <div v-if="mensajeError" class="alert alert-danger py-1 mb-3">{{ mensajeError }}</div>

    <div class="card">
      <div class="card-body p-0">
        <table class="table table-sm table-hover mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Config Entrada</th>
              <th>Config General</th>
              <th>Config Salida</th>
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
              <td><pre class="config-preview">{{ renderConfig(bloque.config_entrada) }}</pre></td>
              <td><pre class="config-preview">{{ renderConfig(bloque.config_general) }}</pre></td>
              <td><pre class="config-preview">{{ renderConfig(bloque.config_salida) }}</pre></td>
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
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useModal } from '../../composables/useModal.js';
import FormularioBloqueEspecialHeader from './FormularioBloqueEspecialHeader.vue';
import FormularioBloqueEspecialBody from './FormularioBloqueEspecialBody.vue';
import FormularioAgenteFooter from './FormularioAgenteFooter.vue';

const props = defineProps({
  socket: { type: Object, required: true },
});

const bloques = ref([]);
const mensajeError = ref('');
const mensajeErrorForm = ref('');
const cargandoForm = ref(false);
const form = reactive({
  id: null,
  nombre: '',
  descripcion: '',
  config_entrada: '{}',
  config_general: '{}',
  config_salida: '{}',
});
const { mostrarModal } = useModal();
let cerrarFormularioBloqueEspecial = null;

function prepareConfigValue(value) {
  if (value === null || value === undefined) {
    return '{}';
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      return trimmed;
    }
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
    form.id = bloque.id;
    form.nombre = bloque.nombre;
    form.descripcion = bloque.descripcion || '';
    form.config_entrada = prepareConfigValue(bloque.config_entrada);
    form.config_general = prepareConfigValue(bloque.config_general);
    form.config_salida = prepareConfigValue(bloque.config_salida);
  } else {
    form.id = null;
    form.nombre = '';
    form.descripcion = '';
    form.config_entrada = '{}';
    form.config_general = '{}';
    form.config_salida = '{}';
  }
  mensajeErrorForm.value = '';

  cerrarFormularioBloqueEspecial = mostrarModal({
    header: FormularioBloqueEspecialHeader,
    body: FormularioBloqueEspecialBody,
    footer: FormularioAgenteFooter,
    headerProps: { isEditing: !!bloque },
    bodyProps: { form, mensajeError: mensajeErrorForm },
    footerProps: { cargando: cargandoForm, onGuardar: guardar, onCerrar: () => cerrarFormularioBloqueEspecial && cerrarFormularioBloqueEspecial() },
    fullscreen: false,
    dialogClass: 'gestor-modal-dialog--wide',
  });
}

function cancelarFormulario() {
  mensajeErrorForm.value = '';
  if (typeof cerrarFormularioBloqueEspecial === 'function') {
    cerrarFormularioBloqueEspecial();
  }
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
  mensajeErrorForm.value = '';
  const nombre = String(form.nombre || '').trim();
  const descripcion = String(form.descripcion || '').trim();

  if (!nombre) {
    mensajeErrorForm.value = 'El nombre es requerido';
    return;
  }

  let config_entrada = null;
  let config_general = null;
  let config_salida = null;
  try {
    config_entrada = validarConfig(form.config_entrada);
    config_general = validarConfig(form.config_general);
    config_salida = validarConfig(form.config_salida);
  } catch (error) {
    mensajeErrorForm.value = error.message;
    return;
  }

  const payload = {
    id: form.id,
    nombre,
    descripcion: descripcion || null,
    config_entrada,
    config_general,
    config_salida,
  };
  const accion = form.id ? 'agentes_tipo_bloques_especiales:update' : 'agentes_tipo_bloques_especiales:create';

  cargandoForm.value = true;
  props.socket.emit(accion, payload, (resp) => {
    cargandoForm.value = false;
    if (resp.ok) {
      cargarBloques();
      if (typeof cerrarFormularioBloqueEspecial === 'function') {
        cerrarFormularioBloqueEspecial();
      }
    } else {
      mensajeErrorForm.value = resp.error || 'Error guardando el bloque';
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

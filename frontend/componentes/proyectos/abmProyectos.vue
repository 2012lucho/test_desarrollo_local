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
  const form = ref({ nombre: proyecto?.nombre ?? '', descripcion: proyecto?.descripcion ?? '', subproyectos: [], componentes: [] });
  const editandoId = ref(proyecto?.id ?? null);
  const cargandoForm = ref(false);
  const mensajeErrorForm = ref('');

  let cerrar = null;

  const abrirModal = () => {
    cerrar = mostrarModal({
      header: FormularioProyectoHeader,
      body: FormularioProyectoBody,
      footer: FormularioProyectoFooter,
      headerProps: { editandoId, form },
      bodyProps: { form, mensajeError: mensajeErrorForm },
      footerProps: {
        cargando: cargandoForm,
        onGuardar: guardar,
        onCerrar: () => cerrar && cerrar(),
      },
      fullscreen: true,
    });
  };

  function inicializarSubproyectos() {
    if (!Array.isArray(form.value.subproyectos)) {
      form.value.subproyectos = [];
    }
  }

  function guardar() {
    mensajeErrorForm.value = '';
    const { nombre, descripcion, subproyectos, componentes } = form.value;
    if (!nombre || !descripcion) {
      mensajeErrorForm.value = 'Nombre y descripción son requeridos';
      return;
    }

    let componentesPayload = [];
    try {
      componentesPayload = Array.isArray(componentes)
        ? componentes
            .map((item) => {
              const nombreComp = String(item?.nombre ?? '').trim();
              if (!nombreComp) return null;
              const descripcionComp = String(item?.descripcion ?? '').trim();
              const configText = String(item?.configText ?? '').trim();
              const config = configText ? JSON.parse(configText) : {};
              return { nombre: nombreComp, descripcion: descripcionComp, config };
            })
            .filter(Boolean)
        : [];
    } catch (error) {
      mensajeErrorForm.value = 'El campo config de algún componente debe ser JSON válido';
      return;
    }

    cargandoForm.value = true;
    const payload = {
      nombre,
      descripcion,
      subproyectos: Array.isArray(subproyectos)
        ? subproyectos.map((item) => String(item?.nombre ?? '').trim()).filter(Boolean)
        : [],
      componentes: componentesPayload,
    };
    const cerrarForm = () => {
      if (typeof cerrar === 'function') {
        cerrar();
      }
    };

    if (editandoId.value) {
      socket.emit('proyectos:update', { id: editandoId.value, ...payload }, (resp) => {
        cargandoForm.value = false;
        if (resp.ok) {
          cerrarForm();
        } else {
          mensajeErrorForm.value = resp.error || 'Error al actualizar proyecto';
        }
      });
    } else {
      socket.emit('proyectos:create', payload, (resp) => {
        cargandoForm.value = false;
        if (resp.ok) {
          cerrarForm();
        } else {
          mensajeErrorForm.value = resp.error || 'Error al crear proyecto';
        }
      });
    }
  }

  if (proyecto?.id) {
    socket.emit('proyectos:get', { id: proyecto.id }, (resp) => {
      if (resp.ok) {
        form.value = {
          nombre: resp.data.nombre,
          descripcion: resp.data.descripcion,
          subproyectos: Array.isArray(resp.data.subproyectos)
            ? resp.data.subproyectos.map((item) => ({ nombre: item.nombre }))
            : [],
          componentes: Array.isArray(resp.data.componentes)
            ? resp.data.componentes.map((item) => ({
                nombre: item.nombre,
                descripcion: item.descripcion,
                configText: item?.config ? JSON.stringify(item.config, null, 2) : '{}',
              }))
            : [],
        };
        editandoId.value = resp.data.id;
        inicializarSubproyectos();
        abrirModal();
      } else {
        mensajeError.value = resp.error || 'Error al cargar datos del proyecto';
      }
    });
  } else {
    inicializarSubproyectos();
    abrirModal();
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

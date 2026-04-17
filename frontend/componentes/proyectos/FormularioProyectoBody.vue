<template>
  <div style="min-width: 320px;">
    <div class="row g-3 mb-3">
      <div class="col-12 col-lg-6">
        <label class="form-label">Nombre</label>
        <input v-model="nombre" type="text" class="form-control" maxlength="50" />
      </div>
      <div class="col-12 col-lg-6">
        <label class="form-label">Descripción</label>
        <input v-model="descripcion" type="text" class="form-control" maxlength="255" />
      </div>
    </div>

    <div class="row g-3">
      <div class="col-12 col-lg-6">
        <div class="mb-3">
          <label class="form-label">Subproyectos</label>
          <ul class="list-group mb-2">
            <li v-for="(sub, index) in subproyectos" :key="index" class="list-group-item d-flex gap-2 align-items-start">
              <input v-model="sub.nombre" type="text" class="form-control" placeholder="Nombre del subproyecto" maxlength="100" />
              <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarSubproyecto(index)">Quitar</button>
            </li>
            <li v-if="!subproyectos.length" class="list-group-item text-muted">Sin subproyectos aún.</li>
          </ul>
          <button type="button" class="btn btn-sm btn-outline-primary" @click="agregarSubproyecto">Agregar subproyecto</button>
        </div>
      </div>

      <div class="col-12 col-lg-6">
        <div class="mb-3">
          <label class="form-label">Componentes</label>
          <ul class="list-group mb-2">
            <li v-for="(componente, index) in componentes" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
              <span class="flex-grow-1">{{ componente.nombre || 'Componente sin nombre' }}</span>
              <div class="btn-group">
                <button type="button" class="btn btn-sm btn-outline-primary" @click="abrirDetalleComponente(componente, index)">Ver detalles</button>
                <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarComponente(index)">Eliminar</button>
              </div>
            </li>
            <li v-if="!componentes.length" class="list-group-item text-muted">Sin componentes aún.</li>
          </ul>
          <button type="button" class="btn btn-sm btn-outline-primary" @click="abrirDetalleComponente()">Agregar componente</button>
        </div>
      </div>
    </div>

    <div v-if="props.mensajeError?.value" class="alert alert-danger py-1 mb-0">
      {{ props.mensajeError.value }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useModal } from '../../composables/useModal.js';
import FormularioComponenteHeader from './FormularioComponenteHeader.vue';
import FormularioComponenteBody from './FormularioComponenteBody.vue';
import FormularioComponenteFooter from './FormularioComponenteFooter.vue';

const props = defineProps(['form', 'mensajeError']);
const { mostrarModal } = useModal();

const nombre = computed({
  get: () => props.form?.value?.nombre ?? '',
  set: (val) => { if (props.form?.value) props.form.value.nombre = val; },
});

const descripcion = computed({
  get: () => props.form?.value?.descripcion ?? '',
  set: (val) => { if (props.form?.value) props.form.value.descripcion = val; },
});

const subproyectos = computed({
  get: () => {
    if (!props.form?.value) return [];
    if (!Array.isArray(props.form.value.subproyectos)) {
      props.form.value.subproyectos = [];
    }
    return props.form.value.subproyectos;
  },
  set: (val) => {
    if (props.form?.value) {
      props.form.value.subproyectos = val;
    }
  },
});

const componentes = computed({
  get: () => {
    if (!props.form?.value) return [];
    if (!Array.isArray(props.form.value.componentes)) {
      props.form.value.componentes = [];
    }
    return props.form.value.componentes;
  },
  set: (val) => {
    if (props.form?.value) {
      props.form.value.componentes = val;
    }
  },
});

function agregarSubproyecto() {
  subproyectos.value.push({ nombre: '' });
}

function quitarSubproyecto(index) {
  subproyectos.value.splice(index, 1);
}

function abrirDetalleComponente(componente = null, index = null) {
  const componenteTemp = ref(
    componente
      ? {
          nombre: componente.nombre ?? '',
          descripcion: componente.descripcion ?? '',
          configText: componente.configText ?? JSON.stringify(componente.config ?? {}, null, 2),
        }
      : { nombre: '', descripcion: '', configText: '{}' }
  );
  const mensajeErrorComponente = ref('');
  let cerrarDetalle = null;

  function guardarComponente() {
    mensajeErrorComponente.value = '';
    const nombreTrim = String(componenteTemp.value.nombre ?? '').trim();
    const descripcionTrim = String(componenteTemp.value.descripcion ?? '').trim();
    const configTextValue = String(componenteTemp.value.configText ?? '').trim() || '{}';

    if (!nombreTrim) {
      mensajeErrorComponente.value = 'Nombre del componente es requerido';
      return;
    }

    try {
      JSON.parse(configTextValue);
    } catch (error) {
      mensajeErrorComponente.value = 'Config JSON inválido';
      return;
    }

    const componenteGuardado = {
      nombre: nombreTrim,
      descripcion: descripcionTrim,
      configText: configTextValue,
    };

    if (index !== null && index !== undefined && index >= 0) {
      componentes.value[index] = componenteGuardado;
    } else {
      componentes.value.push(componenteGuardado);
    }

    if (typeof cerrarDetalle === 'function') {
      cerrarDetalle();
    }
  }

  cerrarDetalle = mostrarModal({
    header: FormularioComponenteHeader,
    body: FormularioComponenteBody,
    footer: FormularioComponenteFooter,
    headerProps: { componente: componenteTemp },
    bodyProps: { componente: componenteTemp, mensajeError: mensajeErrorComponente },
    footerProps: { onGuardar: guardarComponente, onCerrar: () => cerrarDetalle && cerrarDetalle() },
  });
}

function quitarComponente(index) {
  componentes.value.splice(index, 1);
}
</script>

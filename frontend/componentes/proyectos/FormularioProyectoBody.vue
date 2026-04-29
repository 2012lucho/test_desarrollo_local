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
            <li v-for="(sub, index) in subproyectos" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
              <span class="flex-grow-1">{{ sub.nombre || 'Subproyecto sin nombre' }}</span>
              <div class="btn-group">
                <button type="button" class="btn btn-sm btn-outline-primary" @click="abrirDetalleSubproyecto(sub, index)">Ver detalles</button>
                <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarSubproyecto(index)">Eliminar</button>
              </div>
            </li>
            <li v-if="!subproyectos.length" class="list-group-item text-muted">Sin subproyectos aún.</li>
          </ul>
          <button type="button" class="btn btn-sm btn-outline-primary" @click="abrirDetalleSubproyecto()">Agregar subproyecto</button>
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

      <div class="col-12 col-lg-6">
        <div class="mb-3">
          <label class="form-label">Tablas de base de datos</label>
          <ul class="list-group mb-2">
            <li v-for="(tabla, index) in tablas" :key="tabla.id ?? index" class="list-group-item d-flex justify-content-between align-items-center">
              <span class="flex-grow-1">{{ tabla.nombre || 'Tabla sin nombre' }}</span>
              <div class="btn-group">
                <button type="button" class="btn btn-sm btn-outline-primary" @click="editarTabla(index)">Editar</button>
                <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarTabla(index)">Eliminar</button>
              </div>
            </li>
            <li v-if="!tablas.length" class="list-group-item text-muted">Sin tablas aún.</li>
          </ul>
          <button type="button" class="btn btn-sm btn-outline-primary" @click="abrirDetalleTabla()">Agregar tabla</button>
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
import FormularioSubproyectoHeader from './FormularioSubproyectoHeader.vue';
import FormularioSubproyectoBody from './FormularioSubproyectoBody.vue';
import FormularioSubproyectoFooter from './FormularioSubproyectoFooter.vue';
import FormularioTablaHeader from './FormularioTablaHeader.vue';
import FormularioTablaBody from './FormularioTablaBody.vue';
import FormularioTablaFooter from './FormularioTablaFooter.vue';

const props = defineProps(['form', 'mensajeError']);
const { mostrarModal } = useModal();

const generarIdTemporal = () => -(Date.now() + Math.floor(Math.random() * 1000));

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

const tablas = computed({
  get: () => {
    if (!props.form?.value) return [];
    if (!Array.isArray(props.form.value.tablas)) {
      props.form.value.tablas = [];
    }
    return props.form.value.tablas;
  },
  set: (val) => {
    if (props.form?.value) {
      props.form.value.tablas = val;
    }
  },
});

function abrirDetalleTabla(tabla = null, index = null) {
  const tablaTemp = ref(
    tabla
      ? { id: tabla.id ?? generarIdTemporal(), nombre: tabla.nombre ?? '' }
      : { id: generarIdTemporal(), nombre: '' }
  );
  const mensajeErrorTabla = ref('');
  let cerrarDetalle = null;

  function guardarTabla() {
    mensajeErrorTabla.value = '';
    const nombreTrim = String(tablaTemp.value.nombre ?? '').trim();
    if (!nombreTrim) {
      mensajeErrorTabla.value = 'Nombre de la tabla es requerido';
      return;
    }

    const tablaGuardada = {
      id: tablaTemp.value.id,
      nombre: nombreTrim,
    };

    if (index !== null && index !== undefined && index >= 0) {
      tablas.value[index] = tablaGuardada;
    } else {
      tablas.value.push(tablaGuardada);
    }

    if (typeof cerrarDetalle === 'function') {
      cerrarDetalle();
    }
  }

  cerrarDetalle = mostrarModal({
    header: FormularioTablaHeader,
    body: FormularioTablaBody,
    footer: FormularioTablaFooter,
    headerProps: { tabla: tablaTemp },
    bodyProps: { tabla: tablaTemp, mensajeError: mensajeErrorTabla },
    footerProps: { onGuardar: guardarTabla, onCerrar: () => cerrarDetalle && cerrarDetalle() },
  });
}

function editarTabla(index) {
  abrirDetalleTabla(tablas.value[index], index);
}

function quitarTabla(index) {
  tablas.value.splice(index, 1);
}

function abrirDetalleSubproyecto(subproyecto = null, index = null) {
  const subproyectoTemp = ref(
    subproyecto
      ? {
          id: subproyecto.id ?? generarIdTemporal(),
          nombre: subproyecto.nombre ?? '',
          tecnologias: Array.isArray(subproyecto.tecnologias)
            ? [...subproyecto.tecnologias]
            : [],
          componentes: Array.isArray(subproyecto.componentes)
            ? [...subproyecto.componentes]
            : componentes.value
                .filter((item) => Array.isArray(item.subproyectos) && item.subproyectos.includes(subproyecto.id))
                .map((item) => item.id)
                .filter((id) => id !== undefined),
        }
      : { id: generarIdTemporal(), nombre: '', tecnologias: [], componentes: [] }
  );
  const mensajeErrorSubproyecto = ref('');
  let cerrarDetalle = null;

  function guardarSubproyecto() {
    mensajeErrorSubproyecto.value = '';
    const nombreTrim = String(subproyectoTemp.value.nombre ?? '').trim();

    if (!nombreTrim) {
      mensajeErrorSubproyecto.value = 'Nombre del subproyecto es requerido';
      return;
    }

    const subproyectoGuardado = {
      id: subproyectoTemp.value.id,
      nombre: nombreTrim,
      tecnologias: Array.isArray(subproyectoTemp.value.tecnologias)
        ? Array.from(new Set(subproyectoTemp.value.tecnologias.map((id) => Number(id)).filter((id) => id > 0)))
        : [],
      componentes: Array.isArray(subproyectoTemp.value.componentes)
        ? Array.from(new Set(subproyectoTemp.value.componentes.map((id) => Number(id)).filter((id) => id !== 0 && !Number.isNaN(id))))
        : [],
    };

    if (index !== null && index !== undefined && index >= 0) {
      subproyectos.value[index] = subproyectoGuardado;
    } else {
      subproyectos.value.push(subproyectoGuardado);
    }

    actualizarComponentesRelacionados(subproyectoGuardado.id, subproyectoGuardado.componentes);

    if (typeof cerrarDetalle === 'function') {
      cerrarDetalle();
    }
  }

  cerrarDetalle = mostrarModal({
    header: FormularioSubproyectoHeader,
    body: FormularioSubproyectoBody,
    footer: FormularioSubproyectoFooter,
    headerProps: { subproyecto: subproyectoTemp },
    bodyProps: {
      subproyecto: subproyectoTemp,
      mensajeError: mensajeErrorSubproyecto,
      componentes,
    },
    footerProps: { onGuardar: guardarSubproyecto, onCerrar: () => cerrarDetalle && cerrarDetalle() },
  });
}

function actualizarComponentesRelacionados(subproyectoId, seleccionados) {
  if (!subproyectoId) return;
  componentes.value.forEach((componente) => {
    if (!Array.isArray(componente.subproyectos)) {
      componente.subproyectos = [];
    }
    const existe = componente.subproyectos.includes(subproyectoId);
    const debeExistir = Array.isArray(seleccionados) && seleccionados.includes(subproyectoId);
    if (debeExistir && !existe) {
      componente.subproyectos.push(subproyectoId);
    }
    if (!debeExistir && existe) {
      componente.subproyectos = componente.subproyectos.filter((id) => id !== subproyectoId);
    }
  });
}

function quitarSubproyecto(index) {
  const subproyectoId = subproyectos.value[index]?.id;
  subproyectos.value.splice(index, 1);
  if (subproyectoId !== undefined) {
    componentes.value.forEach((componente) => {
      if (Array.isArray(componente.subproyectos)) {
        componente.subproyectos = componente.subproyectos.filter((id) => id !== subproyectoId);
      }
    });
  }
}

function abrirDetalleComponente(componente = null, index = null) {
  const componenteTemp = ref(
    componente
      ? {
          id: componente.id ?? generarIdTemporal(),
          nombre: componente.nombre ?? '',
          descripcion: componente.descripcion ?? '',
          configText: componente.configText ?? JSON.stringify(componente.config ?? {}, null, 2),
          subproyectos: Array.isArray(componente.subproyectos) ? [...componente.subproyectos] : [],
        }
      : { id: generarIdTemporal(), nombre: '', descripcion: '', configText: '{}', subproyectos: [] }
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
      id: componenteTemp.value.id,
      nombre: nombreTrim,
      descripcion: descripcionTrim,
      configText: configTextValue,
      subproyectos: Array.isArray(componenteTemp.value.subproyectos)
        ? Array.from(new Set(componenteTemp.value.subproyectos.map((id) => Number(id)).filter((id) => id !== 0 && !Number.isNaN(id))))
        : [],
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
    bodyProps: { componente: componenteTemp, mensajeError: mensajeErrorComponente, subproyectos },
    footerProps: { onGuardar: guardarComponente, onCerrar: () => cerrarDetalle && cerrarDetalle() },
  });
}

function quitarComponente(index) {
  componentes.value.splice(index, 1);
}
</script>

<template>
  <div style="min-width: 320px;">
    <div class="mb-3">
      <label class="form-label">Nombre</label>
      <input v-model="nombre" type="text" class="form-control" maxlength="50" />
    </div>
    <div class="mb-3">
      <label class="form-label">Descripción</label>
      <input v-model="descripcion" type="text" class="form-control" maxlength="255" />
    </div>

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

    <div class="mb-3">
      <label class="form-label">Componentes</label>
      <ul class="list-group mb-2">
        <li v-for="(componente, index) in componentes" :key="index" class="list-group-item">
          <div class="d-flex gap-2 mb-2">
            <input v-model="componente.nombre" type="text" class="form-control" placeholder="Nombre del componente" maxlength="100" />
            <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarComponente(index)">Quitar</button>
          </div>
          <div class="mb-2">
            <input v-model="componente.descripcion" type="text" class="form-control" placeholder="Descripción del componente" maxlength="255" />
          </div>
          <div>
            <label class="form-label mb-1">Config JSON</label>
            <textarea v-model="componente.configText" class="form-control" rows="4" placeholder='{"clave": "valor"}'></textarea>
          </div>
        </li>
        <li v-if="!componentes.length" class="list-group-item text-muted">Sin componentes aún.</li>
      </ul>
      <button type="button" class="btn btn-sm btn-outline-primary" @click="agregarComponente">Agregar componente</button>
    </div>

    <div v-if="props.mensajeError?.value" class="alert alert-danger py-1 mb-0">
      {{ props.mensajeError.value }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps(['form', 'mensajeError']);

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

function agregarComponente() {
  componentes.value.push({ nombre: '', descripcion: '', configText: '{}' });
}

function quitarComponente(index) {
  componentes.value.splice(index, 1);
}
</script>

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

function agregarSubproyecto() {
  subproyectos.value.push({ nombre: '' });
}

function quitarSubproyecto(index) {
  subproyectos.value.splice(index, 1);
}
</script>

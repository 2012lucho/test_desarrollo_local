<template>
  <div style="min-width: 320px;">
    <div class="mb-3">
      <label class="form-label">Nombre</label>
      <input v-model="nombre" type="text" class="form-control" placeholder="Nombre de la tecnología" />
    </div>

    <div class="mb-3">
      <label class="form-label">Tipo</label>
      <select v-model="tipo" class="form-select">
        <option value="lenguaje">Lenguaje</option>
        <option value="framework">Framework</option>
        <option value="servicio">Servicio</option>
        <option value="libreria">Librería</option>
      </select>
    </div>

    <div class="mb-3">
      <label class="form-label">Tipo de aplicación</label>
      <select v-model="tipoAplicacion" class="form-select">
        <option value="frontend">Frontend</option>
        <option value="backend">Backend</option>
        <option value="base_datos">Base de datos</option>
        <option value="backend_y_frontend">Backend y Frontend</option>
      </select>
    </div>

    <div class="mb-3">
      <label class="form-label">Notas de uso</label>
      <textarea v-model="notasUso" class="form-control" rows="3" maxlength="512" placeholder="Notas de uso de la tecnología"></textarea>
      <div class="form-text">Máximo 512 caracteres.</div>
    </div>

    <div class="mb-3">
      <label class="form-label">Color</label>
      <input v-model="color" type="color" class="form-control form-control-color" />
    </div>

    <div v-if="props.mensajeError?.value" class="alert alert-danger py-1">
      {{ props.mensajeError.value }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps(['form', 'mensajeError']);

const nombre = computed({
  get: () => props.form?.value?.nombre ?? '',
  set: (value) => {
    if (props.form?.value) {
      props.form.value.nombre = value;
    }
  },
});

const tipo = computed({
  get: () => props.form?.value?.tipo ?? 'lenguaje',
  set: (value) => {
    if (props.form?.value) {
      props.form.value.tipo = value;
    }
  },
});

const tipoAplicacion = computed({
  get: () => props.form?.value?.tipo_aplicacion ?? 'backend',
  set: (value) => {
    if (props.form?.value) {
      props.form.value.tipo_aplicacion = value;
    }
  },
});

const notasUso = computed({
  get: () => props.form?.value?.notas_uso ?? '',
  set: (value) => {
    if (props.form?.value) {
      props.form.value.notas_uso = value;
    }
  },
});

const color = computed({
  get: () => props.form?.value?.color ?? '',
  set: (value) => {
    if (props.form?.value) {
      props.form.value.color = value;
    }
  },
});
</script>

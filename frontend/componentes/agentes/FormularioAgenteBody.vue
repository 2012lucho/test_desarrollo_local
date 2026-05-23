<template>
  <div class="agente-form-body">
    <div v-if="errorText" class="alert alert-danger py-1 mb-3">{{ errorText }}</div>
    <div class="form-grid three-columns">
      <div class="column column-entrada">
        <h6 class="section-title">Entrada</h6>
        <div class="form-group mb-3">
          <label>Conexiones entrantes</label>
          <div v-if="!incomingConnections.length" class="form-text text-muted">No hay conexiones entrantes desde otros nodos.</div>
          <ul v-else class="list-group list-group-flush">
            <li v-for="(connection, index) in incomingConnections" :key="index" class="list-group-item py-2 d-flex justify-content-between align-items-start">
              <div>
                <div class="fw-semibold">Desde: {{ connection.fromNodeName }}</div>
                <div class="small text-muted">Salida: {{ connection.salidaLabel }}</div>
              </div>
              <button type="button" class="btn btn-icon btn-icon-danger" @click="onDeleteConnection(connection.id)" aria-label="Eliminar conexión entrante">
                🗑️
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="column column-nodo">
        <h6 class="section-title">Nodo</h6>
        <div v-if="isEditing" class="form-group mb-3">
          <label>ID</label>
          <input :value="id" class="form-control" disabled />
        </div>
        <div class="form-group mb-3">
          <label>Nombre</label>
          <input v-model="nombre" class="form-control" placeholder="Nombre del nodo" />
        </div>
        <div class="form-group mb-3">
          <label>Tipo de bloque</label>
          <select v-model.number="idTipoBloque" class="form-select">
            <option value="" disabled>{{ blocks.length ? 'Selecciona un tipo de bloque' : 'No hay tipos disponibles' }}</option>
            <option v-for="block in blocks" :key="block.id" :value="block.id">
              {{ block.nombre }}
            </option>
          </select>
        </div>

        <div v-if="configOptions.length" class="form-section">
          <h6 class="section-title">Configuración adicional</h6>
          <div
            v-for="option in configOptions"
            :key="option.field"
            class="form-group mb-3"
          >
            <label>
              {{ option.label || option.field }}
              <span v-if="option.required" class="text-danger">*</span>
            </label>
            <SelectLlmModel
              v-if="option.type === 't_select_llm'"
              :modelValue="getConfigValue(option.field)"
              :socket="socket"
              :label="option.label || 'Selecciona un modelo LLM'"
              :placeholder="option.placeholder || 'Selecciona un modelo'"
              :required="option.required === true"
              @update:modelValue="(value) => setConfigValue(option.field, value)"
            />
            <MarkdownEditor
              v-else-if="option.type === 'md_textarea'"
              :modelValue="getConfigValue(option.field)"
              :label="option.label || 'Texto Markdown'"
              :placeholder="option.placeholder || 'Escribe contenido en markdown'"
              :rows="option.rows || 10"
              @update:modelValue="(value) => setConfigValue(option.field, value)"
            />
            <div v-else-if="option.type === 'text_input'" class="mb-3">
              <label :for="`config-option-${option.field}`">
                {{ option.label || option.field }}
                <span v-if="option.required" class="text-danger">*</span>
              </label>
              <input
                :id="`config-option-${option.field}`"
                type="text"
                class="form-control"
                :value="getConfigValue(option.field)"
                :placeholder="option.placeholder || 'Ingrese valor'"
                @input="(event) => setConfigValue(option.field, event.target.value)"
              />
            </div>
            <div v-else-if="option.type === 'checkbox'" class="form-check">
              <input
                :id="`config-option-${option.field}`"
                type="checkbox"
                class="form-check-input"
                :checked="Boolean(getConfigValue(option.field))"
                @change="(event) => setConfigValue(option.field, event.target.checked)"
              />
              <label class="form-check-label" :for="`config-option-${option.field}`">
                {{ option.label || option.field }}
                <span v-if="option.required" class="text-danger">*</span>
              </label>
            </div>
            <div v-else-if="option.type === 't_list_switch'" class="list-switch-editor">
              <div v-if="!getListSwitchValue(option.field).length" class="form-text text-muted mb-2">No hay condiciones definidas.</div>
              <div
                v-for="(item, index) in getListSwitchValue(option.field)"
                :key="index"
                class="list-switch-item mb-3"
              >
                <div class="row g-2 align-items-end">
                  <div class="col">
                    <label>Nombre de salida</label>
                    <input
                      class="form-control"
                      type="text"
                      :value="item.nombre_salida || ''"
                      @input="(event) => updateListSwitchItem(option.field, index, 'nombre_salida', event.target.value)"
                      placeholder="Nombre de salida"
                    />
                  </div>
                  <div class="col">
                    <label>Condición</label>
                    <input
                      class="form-control"
                      type="text"
                      :value="item.condicion || ''"
                      @input="(event) => updateListSwitchItem(option.field, index, 'condicion', event.target.value)"
                      placeholder="Expresión de condición"
                    />
                  </div>
                  <div class="col-auto">
                    <button class="btn btn-outline-danger btn-sm w-100" type="button" @click="removeListSwitchRow(option.field, index)">Eliminar</button>
                  </div>
                </div>
              </div>
              <button class="btn btn-outline-primary btn-sm" type="button" @click="addListSwitchRow(option.field)">Agregar condición</button>
            </div>
            <div v-else class="form-text text-muted">Tipo de campo desconocido: {{ option.type }}</div>
          </div>
        </div>
      </div>

      <div class="column column-salida">
        <h6 class="section-title">Salida</h6>
        <div class="form-group mb-3">
          <label>Conexiones salientes</label>
          <div v-if="!outgoingConnections.length" class="form-text text-muted">No hay conexiones salientes hacia otros nodos.</div>
          <ul v-else class="list-group list-group-flush">
            <li v-for="(connection, index) in outgoingConnections" :key="index" class="list-group-item py-2 d-flex justify-content-between align-items-start">
              <div>
                <div class="fw-semibold">Hacia: {{ connection.toNodeName }}</div>
                <div class="small text-muted">Salida: {{ connection.salidaLabel }}</div>
              </div>
              <button type="button" class="btn btn-icon btn-icon-danger" @click="onDeleteConnection(connection.id)" aria-label="Eliminar conexión saliente">
                🗑️
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, unref } from 'vue';
import SelectLlmModel from '../llm/SelectLlmModel.vue';
import MarkdownEditor from '../MarkdownEditor.vue';

const props = defineProps({
  form: { type: Object, required: true },
  mensajeError: { type: [String, Object], default: '' },
  blocks: { type: Array, default: () => [] },
  incomingConnections: { type: [Array, Object], default: () => [] },
  outgoingConnections: { type: [Array, Object], default: () => [] },
  onDeleteConnection: { type: Function, default: () => {} },
  socket: { type: Object, required: true },
  isEditing: { type: Boolean, default: false },
});

const formValue = computed(() => props.form?.value ?? props.form);

const id = computed(() => formValue.value?.id ?? '');

const nombre = computed({
  get: () => formValue.value?.nombre ?? '',
  set: (value) => {
    if (formValue.value) {
      formValue.value.nombre = value;
    }
  },
});

const idTipoBloque = computed({
  get: () => formValue.value?.id_tipo_bloque ?? '',
  set: (value) => {
    if (formValue.value) {
      formValue.value.id_tipo_bloque = value;
    }
  },
});

const selectedBloque = computed(() => {
  const id = Number(idTipoBloque.value || 0);
  return props.blocks.find((block) => Number(block.id) === id) || null;
});

const configGeneral = computed(() => {
  if (!selectedBloque.value) return null;
  const cfg = selectedBloque.value.config_general;
  if (typeof cfg === 'string') {
    try {
      return JSON.parse(cfg);
    } catch {
      return null;
    }
  }
  return cfg;
});

const configOptions = computed(() => {
  if (!configGeneral.value || typeof configGeneral.value !== 'object') return [];
  return Array.isArray(configGeneral.value.options) ? configGeneral.value.options : [];
});

const errorText = computed(() => {
  if (props.mensajeError?.value != null) {
    return props.mensajeError.value;
  }
  return props.mensajeError || '';
});

const incomingConnections = computed(() => unref(props.incomingConnections) || []);
const outgoingConnections = computed(() => unref(props.outgoingConnections) || []);

function getConfigValue(field) {
  if (!formValue.value) return '';
  return formValue.value.config?.[field] ?? '';
}

function setConfigValue(field, value) {
  if (!formValue.value) return;
  if (!formValue.value.config || typeof formValue.value.config !== 'object' || Array.isArray(formValue.value.config)) {
    formValue.value.config = {};
  }
  formValue.value.config = {
    ...formValue.value.config,
    [field]: value,
  };
}

function getListSwitchValue(field) {
  if (!formValue.value) return [];
  const value = formValue.value.config?.[field];
  return Array.isArray(value) ? value : [];
}

function updateListSwitchItem(field, index, key, value) {
  const current = getListSwitchValue(field);
  const next = [...current];
  next[index] = {
    ...next[index],
    [key]: value,
  };
  setConfigValue(field, next);
}

function addListSwitchRow(field) {
  const current = getListSwitchValue(field);
  setConfigValue(field, [...current, { nombre_salida: '', condicion: '' }]);
}

function removeListSwitchRow(field, index) {
  const current = getListSwitchValue(field);
  const next = [...current];
  next.splice(index, 1);
  setConfigValue(field, next);
}

const onDeleteConnection = (connectionId) => props.onDeleteConnection(connectionId);
</script>

<style scoped>
.agente-form-body {
  width: 100%;
  min-width: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  gap: 1rem;
  width: 100%;
}

.section-title {
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #2c3e50;
}

.column {
  background: #f8fbff;
  border: 1px solid #dde6f2;
  border-radius: 0.85rem;
  padding: 1rem;
}

.column-salida,
.column-entrada {
  min-width: 220px;
}

.btn-icon {
  border: none;
  background: transparent;
  color: #dc3545;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem;
}

.btn-icon:hover {
  background: rgba(220, 53, 69, 0.1);
  border-radius: 0.5rem;
}

.column-nodo {
  min-width: 260px;
}

textarea.form-control {
  font-family: monospace;
}

.list-switch-editor {
  border: 1px solid #d7e2ed;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: #ffffff;
}

.list-switch-item {
  border-bottom: 1px solid #e9eef4;
  padding-bottom: 0.75rem;
}

.list-switch-item:last-child {
  border-bottom: none;
}
</style>

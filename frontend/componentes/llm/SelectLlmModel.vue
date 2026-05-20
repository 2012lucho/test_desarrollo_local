<template>
  <div class="llm-model-selector">
    <label class="form-label mb-1">{{ label }}</label>
    <select
      class="form-select"
      :value="modelValue"
      @change="onChange"
      :disabled="loading || !!errorMessage"
      :aria-required="required"
    >
      <option value="" disabled>
        {{ loading ? 'Cargando modelos...' : placeholder }}
      </option>
      <option
        v-for="model in modelos"
        :key="model.name"
        :value="model.name"
      >
        {{ model.name }}
      </option>
      <option
        v-if="modelValue && !modelNames.includes(modelValue)"
        :value="modelValue"
      >
        {{ modelValue }}
      </option>
    </select>

    <div v-if="errorMessage" class="form-text text-danger mt-1">{{ errorMessage }}</div>
    <div v-else-if="!loading && modelos.length === 0" class="form-text text-muted mt-1">
      No hay modelos Ollama instalados.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const props = defineProps({
  socket: { type: Object, required: true },
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Modelo LLM' },
  placeholder: { type: String, default: 'Selecciona un modelo' },
  required: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const modelos = ref([]);
const loading = ref(true);
const errorMessage = ref('');

const modelNames = computed(() => modelos.value.map((item) => item.name));

function loadModelos() {
  loading.value = true;
  errorMessage.value = '';
  props.socket.emit('ollama:list', null, (resp) => {
    loading.value = false;
    if (resp.ok) {
      modelos.value = resp.data || [];
    } else {
      modelos.value = [];
      errorMessage.value = resp.error || 'No se pudo obtener modelos Ollama.';
    }
  });
}

function onChange(event) {
  emit('update:modelValue', event.target.value);
}

onMounted(() => {
  loadModelos();
});
</script>

<style scoped>
.llm-model-selector {
  display: flex;
  flex-direction: column;
}
</style>

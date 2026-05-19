<template>
  <div class="json-editor-field">
    <div class="json-editor-header d-flex align-items-center justify-content-between mb-2">
      <div>
        <label class="form-label mb-0">{{ label }}</label>
        <div class="form-text text-muted">Editor JSON con resaltado, numeración de líneas y validación.</div>
      </div>
      <button type="button" class="btn btn-sm btn-outline-secondary" @click="toggleExpanded">
        {{ expanded ? 'Ocultar' : 'Mostrar' }} editor
      </button>
    </div>

    <div class="json-editor-wrapper" :class="{ 'collapsed': !expanded }">
      <div class="json-editor-inner">
        <div class="json-line-numbers">
          <pre>{{ lineNumbers }}</pre>
        </div>
        <div class="json-code-panel">
          <pre class="json-highlight" v-html="highlightedHtml"></pre>
          <textarea
            ref="textareaRef"
            :value="modelValue"
            @input="onInput"
            @scroll="syncScroll"
            :placeholder="placeholder"
            :rows="rows"
            class="json-textarea"
          ></textarea>
        </div>
      </div>
    </div>

    <div v-if="syntaxError" class="form-text text-danger mt-1">{{ syntaxError }}</div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '{}' },
  label: { type: String, default: 'JSON' },
  rows: { type: Number, default: 8 },
  placeholder: { type: String, default: '{"key": "value"}' },
});

const emit = defineEmits(['update:modelValue']);
const textareaRef = ref(null);
const expanded = ref(true);

const syntaxError = computed(() => {
  const trimmed = String(props.modelValue || '').trim();
  if (!trimmed) return '';
  try {
    JSON.parse(trimmed);
    return '';
  } catch (error) {
    return error.message;
  }
});

const lineNumbers = computed(() => {
  const lines = String(props.modelValue || '').split('\n').length;
  return Array.from({ length: Math.max(lines, 1) }, (_, index) => index + 1).join('\n');
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonSyntaxHighlight(value) {
  const escaped = escapeHtml(value);
  return escaped.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)|(\b(true|false|null)\b)|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g, (match) => {
    if (/^"/.test(match)) {
      return /:$/.test(match)
        ? `<span class="json-key">${match}</span>`
        : `<span class="json-string">${match}</span>`;
    }
    if (/true|false/.test(match)) {
      return `<span class="json-boolean">${match}</span>`;
    }
    if (/null/.test(match)) {
      return `<span class="json-null">${match}</span>`;
    }
    return `<span class="json-number">${match}</span>`;
  });
}

const highlightedHtml = computed(() => jsonSyntaxHighlight(props.modelValue || ''));

function onInput(event) {
  emit('update:modelValue', event.target.value);
}

function toggleExpanded() {
  expanded.value = !expanded.value;
}

function syncScroll(event) {
  const textarea = event.target;
  const overlay = textarea.previousElementSibling;
  if (overlay) {
    overlay.scrollTop = textarea.scrollTop;
    overlay.scrollLeft = textarea.scrollLeft;
  }
}
</script>

<style scoped>
.json-editor-field {
  font-family: 'Courier New', Courier, monospace;
}

.json-editor-header .form-label {
  font-weight: 600;
}

.json-editor-wrapper {
  border: 1px solid #dcdfe3;
  border-radius: 0.5rem;
  background: #f8fbff;
  overflow: hidden;
}

.json-editor-wrapper.collapsed {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
}

.json-editor-inner {
  display: flex;
  position: relative;
  min-height: 220px;
}

.json-line-numbers {
  background: #eef5ff;
  color: #697a8a;
  text-align: right;
  padding: 0.75rem 0.5rem;
  user-select: none;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.45;
  border-right: 1px solid #dcdfe3;
}

.json-code-panel {
  flex: 1;
  position: relative;
  min-width: 0;
}

.json-highlight,
.json-textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 220px;
  margin: 0;
  padding: 0.75rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: auto;
  font-family: inherit;
  font-size: 0.92rem;
  line-height: 1.45;
}

.json-highlight {
  position: absolute;
  inset: 0;
  pointer-events: none;
  color: transparent;
  background: transparent;
}

.json-textarea {
  position: relative;
  background: transparent;
  color: #14213d;
  border: none;
  resize: none;
  z-index: 1;
}

.json-textarea:focus {
  outline: none;
}

.json-highlight .json-key {
  color: #7f5af0;
}

.json-highlight .json-string {
  color: #2a9d8f;
}

.json-highlight .json-number {
  color: #ca6702;
}

.json-highlight .json-boolean {
  color: #f4a261;
}

.json-highlight .json-null {
  color: #495057;
}

.json-editor-wrapper.collapsed .json-editor-inner {
  min-height: 0;
}
</style>

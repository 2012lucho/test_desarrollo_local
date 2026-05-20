<template>
  <div class="markdown-editor">
    <label class="form-label mb-1">{{ label }}</label>
    <div class="markdown-editor-grid">
      <div class="markdown-textarea-wrapper">
        <button class="btn btn-outline-secondary btn-sm preview-toggle-button" type="button" aria-label="Ver previsualización" @click="openPreviewModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8z"/>
            <path d="M8 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" fill="#fff"/>
            <path d="M8 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" fill="currentColor"/>
          </svg>
        </button>
        <textarea
          class="form-control markdown-textarea"
          :value="modelValue"
          @input="onInput"
          :placeholder="placeholder"
          :rows="rows"
        ></textarea>
      </div>
    </div>
    <div v-if="required && !modelValue?.trim()" class="form-text text-danger mt-1">Este campo es requerido.</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useModal } from '../composables/useModal.js';
import MarkdownPreviewModal from './MarkdownPreviewModal.vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Markdown' },
  placeholder: { type: String, default: 'Escribe markdown aquí...' },
  rows: { type: Number, default: 10 },
  required: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);
const { mostrarModal } = useModal();

const renderedHtml = computed(() => renderMarkdown(props.modelValue || ''));

function onInput(event) {
  emit('update:modelValue', event.target.value);
}

function openPreviewModal() {
  mostrarModal({
    header: null,
    body: MarkdownPreviewModal,
    bodyProps: { html: renderedHtml.value },
    fullscreen: false,
    dialogClass: 'gestor-modal-dialog--wide',
  });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMarkdown(text) {
  const escaped = escapeHtml(text || '');
  const lines = escaped.split(/\r?\n/);
  let html = '';
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{3}\s+(.*)/.test(trimmed)) {
      html += closeList() + `<h3>${trimmed.replace(/^#{3}\s+/, '')}</h3>`;
    } else if (/^#{2}\s+(.*)/.test(trimmed)) {
      html += closeList() + `<h2>${trimmed.replace(/^#{2}\s+/, '')}</h2>`;
    } else if (/^#\s+(.*)/.test(trimmed)) {
      html += closeList() + `<h1>${trimmed.replace(/^#\s+/, '')}</h1>`;
    } else if (/^[-*+]\s+(.*)/.test(trimmed)) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${formatInline(trimmed.replace(/^[-*+]\s+/, ''))}</li>`;
    } else if (trimmed === '') {
      html += closeList() + '<p></p>';
    } else {
      html += closeList() + `<p>${formatInline(trimmed)}</p>`;
    }
  }

  html += inList ? '</ul>' : '';
  return html;

  function closeList() {
    if (!inList) return '';
    inList = false;
    return '</ul>';
  }
}

function formatInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}
</script>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
}

.markdown-editor-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.markdown-textarea-wrapper {
  position: relative;
}

.preview-toggle-button {
  position: absolute;
  right: 0.75rem;
  top: 0.75rem;
  z-index: 2;
}

.markdown-textarea {
  min-height: 260px;
  font-family: ui-monospace, monospace;
  resize: vertical;
}

.markdown-preview {
  border: 1px solid #dcdfe3;
  border-radius: 0.5rem;
  padding: 0.75rem;
  background: #f8fbff;
  min-height: 260px;
  overflow: auto;
}

.preview-title {
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.preview-content h1,
.preview-content h2,
.preview-content h3 {
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
}

.preview-content p {
  margin: 0.5rem 0;
}

.preview-content ul {
  padding-left: 1.2rem;
  margin: 0.5rem 0;
}

.preview-content code {
  background: #e9ecef;
  padding: 0.15rem 0.3rem;
  border-radius: 0.3rem;
}

.preview-content a {
  color: #1d4ed8;
  text-decoration: underline;
}
</style>

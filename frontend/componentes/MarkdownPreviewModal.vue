<template>
  <div class="markdown-preview-modal">
    <div class="markdown-preview-header">
      <h5 class="mb-0">Previsualización Markdown</h5>
    </div>
    <div class="markdown-preview-body" v-html="html"></div>
  </div>
</template>

<script setup>
const props = defineProps({
  html: { type: String, default: '' },
});
</script>

<style scoped>
.markdown-preview-modal {
  max-height: calc(100dvh - 4rem);
  overflow: hidden;
}

.markdown-preview-header {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 0.75rem;
}

.markdown-preview-body {
  overflow-y: auto;
  max-height: calc(100dvh - 6rem);
}

.markdown-preview-body h1,
.markdown-preview-body h2,
.markdown-preview-body h3 {
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
}

.markdown-preview-body p {
  margin: 0.5rem 0;
}

.markdown-preview-body ul {
  padding-left: 1.2rem;
  margin: 0.5rem 0;
}

.markdown-preview-body code {
  background: #e9ecef;
  padding: 0.15rem 0.3rem;
  border-radius: 0.3rem;
}
</style>

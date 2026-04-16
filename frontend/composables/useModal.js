import { shallowReactive, isRef, markRaw } from 'vue';

let nextId = 1;
const modals = shallowReactive([]);

function resolverComponente(comp) {
  if (!comp) return null;
  const raw = isRef(comp) ? comp.value : comp;
  return markRaw(raw);
}

function mostrarModal({ header, body, footer, headerProps, bodyProps, footerProps, fullscreen = false } = {}) {
  const id = nextId++;
  modals.push({
    id,
    header: resolverComponente(header),
    body: resolverComponente(body),
    footer: resolverComponente(footer),
    headerProps: headerProps || {},
    bodyProps: bodyProps || {},
    footerProps: footerProps || {},
    fullscreen,
  });
  return () => cerrarModal(id);
}

function cerrarModal(id) {
  const idx = modals.findIndex(m => m.id === id);
  if (idx !== -1) modals.splice(idx, 1);
}

export function useModal() {
  return { modals, mostrarModal, cerrarModal };
}

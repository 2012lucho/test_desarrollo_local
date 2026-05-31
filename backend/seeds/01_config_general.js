exports.seed = async function (knex) {
  await knex('config_general').del();
  await knex('config_general').insert([
    { clave: 'v_agentes_barra1_px', valor: '0' },
    { clave: 'v_agentes_barra1_py', valor: '0' },
    { clave: 'v_agentes_flujo_selected', valor: '' },
    { clave: 'v_agentes_zoom', valor: '1' },
    { clave: 'v_agentes_scroll_x', valor: '0' },
    { clave: 'v_agentes_scroll_y', valor: '0' },
    { clave: 'v_basededatos_zoom', valor: '1' },
    { clave: 'v_basededatos_scroll_x', valor: '0' },
    { clave: 'v_basededatos_scroll_y', valor: '0' },
  ]);
};

exports.seed = async function (knex) {
  await knex('config_general').del();
  await knex('config_general').insert([
    { clave: 'v_agentes_barra1_px', valor: '0' },
    { clave: 'v_agentes_barra1_py', valor: '0' },
  ]);
};

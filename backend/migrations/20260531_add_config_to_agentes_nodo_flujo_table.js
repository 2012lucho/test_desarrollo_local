exports.up = function (knex) {
  return knex.schema.hasTable('agentes_nodo_flujo').then((exists) => {
    if (!exists) return;

    return knex.schema.table('agentes_nodo_flujo', (table) => {
      table.json('config').nullable().defaultTo('{}');
    });
  });
};

exports.down = function (knex) {
  return knex.schema.hasTable('agentes_nodo_flujo').then((exists) => {
    if (!exists) return;

    return knex.schema.table('agentes_nodo_flujo', (table) => {
      table.dropColumn('config');
    });
  });
};

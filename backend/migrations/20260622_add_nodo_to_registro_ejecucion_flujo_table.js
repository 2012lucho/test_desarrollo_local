exports.up = function (knex) {
  return knex.schema.hasTable('registro_ejecucion_flujo').then((exists) => {
    if (!exists) return;

    return knex.schema.alterTable('registro_ejecucion_flujo', (table) => {
      table.integer('nodo').nullable();
    });
  });
};

exports.down = function (knex) {
  return knex.schema.hasTable('registro_ejecucion_flujo').then((exists) => {
    if (!exists) return;

    return knex.schema.alterTable('registro_ejecucion_flujo', (table) => {
      table.dropColumn('nodo');
    });
  });
};

exports.up = function (knex) {
  return knex.schema
    .hasTable('agentes_nodo_flujo')
    .then((exists) => {
      if (!exists) return;
      return knex.schema.hasTable('agentes_flujos').then((existsFlujos) => {
        if (!existsFlujos) return;
        return knex('agentes_flujos')
          .insert({ id: 1, nombre: 'Default' })
          .onConflict('id')
          .ignore()
          .then(() => {
            return knex.schema.alterTable('agentes_nodo_flujo', (table) => {
              table.integer('id_flujo').unsigned().notNullable().defaultTo(1);
              table
                .foreign('id_flujo')
                .references('id')
                .inTable('agentes_flujos')
                .onDelete('RESTRICT');
            });
          });
      });
    });
};

exports.down = function (knex) {
  return knex.schema.hasTable('agentes_nodo_flujo').then((exists) => {
    if (!exists) return;
    return knex.schema.alterTable('agentes_nodo_flujo', (table) => {
      table.dropForeign('id_flujo');
      table.dropColumn('id_flujo');
    });
  });
};

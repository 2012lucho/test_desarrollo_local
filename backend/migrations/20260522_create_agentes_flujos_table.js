exports.up = function (knex) {
  return knex.schema.hasTable('agentes_flujos').then((exists) => {
    if (exists) return;

    return knex.schema.createTable('agentes_flujos', (table) => {
      table.increments('id').primary();
      table.string('nombre', 255).notNullable();
    });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('agentes_flujos');
};

exports.up = function (knex) {
  return knex.schema.hasTable('ejecucion_flujo').then((exists) => {
    if (exists) return;

    return knex.schema.createTable('ejecucion_flujo', (table) => {
      table.increments('id').primary();
      table.dateTime('fecha_hora_inicio').notNullable();
      table.dateTime('fecha_hora_fin').nullable();
      table.integer('id_flujo').notNullable();
    });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('ejecucion_flujo');
};

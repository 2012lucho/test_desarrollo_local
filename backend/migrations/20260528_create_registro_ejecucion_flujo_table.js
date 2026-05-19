exports.up = function (knex) {
  return knex.schema.hasTable('registro_ejecucion_flujo').then((exists) => {
    if (exists) return;

    return knex.schema.createTable('registro_ejecucion_flujo', (table) => {
      table.increments('id').primary();
      table.integer('id_flujo').notNullable();
      table.integer('id_ejecucion').notNullable();
      table.dateTime('fecha_hora_ini').notNullable();
      table.dateTime('fecha_hora_fin').nullable();
      table.text('data_entrada', 'longtext').nullable();
      table.text('data_salida', 'longtext').nullable();
    });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('registro_ejecucion_flujo');
};

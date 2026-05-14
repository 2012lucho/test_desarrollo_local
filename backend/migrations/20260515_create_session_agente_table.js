exports.up = function (knex) {
  return knex.schema.hasTable('session_agente').then((exists) => {
    if (exists) return;

    return knex.schema.createTable('session_agente', (table) => {
      table.increments('id').primary();
      table.dateTime('fecha_hora_ini').notNullable().defaultTo(knex.fn.now());
      table.dateTime('fecha_hora_fin').notNullable().defaultTo(knex.fn.now());
      table.string('id_agente', 255).notNullable();
      table.integer('id_proyecto').unsigned().nullable();
      table.string('originado_por', 20).notNullable();

      table.foreign('id_agente').references('id').inTable('agentes');
      table.foreign('id_proyecto').references('id').inTable('proyectos');
    });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('session_agente');
};

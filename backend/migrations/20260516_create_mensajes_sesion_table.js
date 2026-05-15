exports.up = function (knex) {
  return knex.schema.hasTable('mensajes_sesion').then((exists) => {
    if (exists) return;

    return knex.schema.createTable('mensajes_sesion', (table) => {
      table.increments('id').primary();
      table.integer('id_session').unsigned().notNullable();
      table.enu('origen', ['AUTOMATICO', 'HUMANO']).notNullable();
      table.text('mensaje', 'longtext').notNullable();
      table.dateTime('fecha_hora').notNullable().defaultTo(knex.fn.now());

      table.foreign('id_session').references('id').inTable('session_agente');
    });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('mensajes_sesion');
};

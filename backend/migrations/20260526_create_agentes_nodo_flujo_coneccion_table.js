exports.up = function (knex) {
  return knex.schema.hasTable('agentes_nodo_flujo_coneccion').then((exists) => {
    if (exists) return;

    return knex.schema.createTable('agentes_nodo_flujo_coneccion', (table) => {
      table.increments('id').primary();
      table.integer('id_nodo_origen').unsigned().notNullable();
      table.integer('id_nodo_destino').unsigned().notNullable();
      table.integer('id_flujo').unsigned().notNullable();

      table
        .foreign('id_nodo_origen')
        .references('id')
        .inTable('agentes_nodo_flujo')
        .onDelete('CASCADE');
      table
        .foreign('id_nodo_destino')
        .references('id')
        .inTable('agentes_nodo_flujo')
        .onDelete('CASCADE');
      table
        .foreign('id_flujo')
        .references('id')
        .inTable('agentes_flujos')
        .onDelete('RESTRICT');
      table.unique(['id_nodo_origen', 'id_nodo_destino', 'id_flujo']);
    });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('agentes_nodo_flujo_coneccion');
};

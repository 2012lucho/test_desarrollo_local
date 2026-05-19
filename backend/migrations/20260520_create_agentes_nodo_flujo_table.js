exports.up = function (knex) {
  return knex.schema
    .hasTable('agentes_nodo_flujo')
    .then((exists) => {
      if (exists) return;

      return knex.schema.createTable('agentes_nodo_flujo', (table) => {
        table.increments('id').primary();
        table.string('nombre', 255).notNullable();
        table.integer('pos_canvas_x').nullable();
        table.integer('pos_canvas_y').nullable();
        table.string('id_agente', 255).nullable();
        table.integer('id_tipo_bloque').unsigned().notNullable();
        table
          .foreign('id_tipo_bloque')
          .references('id')
          .inTable('agentes_tipo_bloques_especiales')
          .onDelete('RESTRICT');
      });
    })
    .then(() => {
      return knex.schema.hasTable('agentes').then((exists) => {
        if (!exists) return;
        return knex.schema.table('agentes', (table) => {
          table.dropColumn('pos_canvas_x');
          table.dropColumn('pos_canvas_y');
        });
      });
    });
};

exports.down = function (knex) {
  return knex.schema.hasTable('agentes').then((exists) => {
    if (exists) {
      return knex.schema.table('agentes', (table) => {
        table.integer('pos_canvas_x').nullable();
        table.integer('pos_canvas_y').nullable();
      });
    }
    return null;
  }).then(() => {
    return knex.schema.dropTableIfExists('agentes_nodo_flujo');
  });
};

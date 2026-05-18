exports.up = function (knex) {
  return knex.schema.hasTable('agentes').then((exists) => {
    if (!exists) return;

    return knex.schema.table('agentes', (table) => {
      table.integer('pos_canvas_x').nullable();
      table.integer('pos_canvas_y').nullable();
    });
  });
};

exports.down = function (knex) {
  return knex.schema.hasTable('agentes').then((exists) => {
    if (!exists) return;

    return knex.schema.table('agentes', (table) => {
      table.dropColumn('pos_canvas_x');
      table.dropColumn('pos_canvas_y');
    });
  });
};

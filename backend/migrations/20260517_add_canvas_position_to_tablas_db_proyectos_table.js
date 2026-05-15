/**
 * Migración: agregar posiciones de canvas a tablas de proyectos
 */
exports.up = function(knex) {
  return knex.schema.hasTable('tablas_db_proyectos').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }
    return knex.schema.table('tablas_db_proyectos', (table) => {
      table.integer('pos_canvas_x').nullable();
      table.integer('pos_canvas_y').nullable();
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('tablas_db_proyectos').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }
    return knex.schema.table('tablas_db_proyectos', (table) => {
      table.dropColumn('pos_canvas_x');
      table.dropColumn('pos_canvas_y');
    });
  });
};

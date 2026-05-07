/*
 * Migración: agregar columna `descripcion` a `subproyectos`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('subproyectos').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('subproyectos', 'descripcion').then((hasDescripcion) => {
      if (hasDescripcion) return Promise.resolve();
      return knex.schema.alterTable('subproyectos', (table) => {
        table.string('descripcion', 512).notNullable().defaultTo('');
      });
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('subproyectos').then((exists) => {
    if (!exists) return Promise.resolve();

    return knex.schema.hasColumn('subproyectos', 'descripcion').then((hasDescripcion) => {
      if (!hasDescripcion) return Promise.resolve();
      return knex.schema.alterTable('subproyectos', (table) => {
        table.dropColumn('descripcion');
      });
    });
  });
};

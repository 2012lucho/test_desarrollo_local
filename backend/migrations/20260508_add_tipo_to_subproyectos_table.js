/**
 * Migración: agregar columna `tipo` a `subproyectos`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('subproyectos').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('subproyectos', 'tipo').then((hasColumn) => {
      if (hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.alterTable('subproyectos', (table) => {
        table.string('tipo', 50).notNullable().defaultTo('backend');
      });
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('subproyectos').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('subproyectos', 'tipo').then((hasColumn) => {
      if (!hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.alterTable('subproyectos', (table) => {
        table.dropColumn('tipo');
      });
    });
  });
};

/**
 * Migración: agregar columna `repositorio` a `proyectos`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('proyectos').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('proyectos', 'repositorio').then((hasColumn) => {
      if (hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.alterTable('proyectos', (table) => {
        table.string('repositorio', 255).nullable();
      });
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('proyectos').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('proyectos', 'repositorio').then((hasColumn) => {
      if (!hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.alterTable('proyectos', (table) => {
        table.dropColumn('repositorio');
      });
    });
  });
};

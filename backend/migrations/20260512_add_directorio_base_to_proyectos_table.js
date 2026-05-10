/**
 * Migración: agregar columna `directorio_base` a `proyectos`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('proyectos').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('proyectos', 'directorio_base').then((hasColumn) => {
      if (hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.alterTable('proyectos', (table) => {
        table.string('directorio_base', 512).notNullable().defaultTo('');
      });
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('proyectos').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('proyectos', 'directorio_base').then((hasColumn) => {
      if (!hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.alterTable('proyectos', (table) => {
        table.dropColumn('directorio_base');
      });
    });
  });
};

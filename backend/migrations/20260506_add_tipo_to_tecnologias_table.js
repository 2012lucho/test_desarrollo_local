/**
 * Migración: agregar columna `tipo` a `tecnologias`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('tecnologias').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('tecnologias', 'tipo').then((hasColumn) => {
      if (hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.table('tecnologias', (table) => {
        table.string('tipo', 50).notNullable().defaultTo('lenguaje');
      });
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('tecnologias').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('tecnologias', 'tipo').then((hasColumn) => {
      if (!hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.table('tecnologias', (table) => {
        table.dropColumn('tipo');
      });
    });
  });
};

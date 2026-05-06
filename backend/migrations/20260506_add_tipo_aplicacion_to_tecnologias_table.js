/**
 * Migración: agregar columna `tipo_aplicacion` a `tecnologias`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('tecnologias').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('tecnologias', 'tipo_aplicacion').then((hasColumn) => {
      if (hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.table('tecnologias', (table) => {
        table.string('tipo_aplicacion', 50).notNullable().defaultTo('backend');
      });
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('tecnologias').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('tecnologias', 'tipo_aplicacion').then((hasColumn) => {
      if (!hasColumn) {
        return Promise.resolve();
      }

      return knex.schema.table('tecnologias', (table) => {
        table.dropColumn('tipo_aplicacion');
      });
    });
  });
};
